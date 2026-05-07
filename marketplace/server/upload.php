<?php
// Yantach Shop — image upload endpoint (hardened).
// Drop into your hosting's web root next to index.html.
// Auth: static token via X-Upload-Token header (or ?token= query param).
// Hardening:
//   * Token comparison is constant-time (hash_equals)
//   * Extension AND real MIME type (via finfo / getimagesize) are checked
//   * Defends against double extensions (.php.jpg) by stripping all dots
//   * Per-IP rate limit (default 30 uploads/minute) using a tiny flat-file log
//   * Output filename is randomised — never echoes user input verbatim
//   * Refuses to overwrite existing files
//   * Strips EXIF on JPEG by re-encoding when GD is available

declare(strict_types=1);

const UPLOAD_TOKEN  = 'a764bd68c87dde34f8fccd239ca9d677';
const UPLOAD_DIR    = __DIR__ . '/uploads';
const PUBLIC_BASE   = '/uploads';
const MAX_BYTES     = 8 * 1024 * 1024; // 8 MB
const ALLOWED_EXT   = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'];
const ALLOWED_MIME  = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'image/avif',  'image/svg+xml',
];
const RL_WINDOW_SEC = 60;
const RL_MAX_HITS   = 30;
const RL_FILE       = __DIR__ . '/.upload-rate.log';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Upload-Token');
header('Vary: Origin');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}

function fail(int $code, string $msg): void {
  http_response_code($code);
  echo json_encode(['ok' => false, 'error' => $msg]);
  exit;
}

function client_ip(): string {
  $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '';
  if ($ip === '') return 'unknown';
  // X-Forwarded-For can be a list — take the first one
  $ip = trim(explode(',', $ip)[0]);
  return preg_replace('/[^0-9a-fA-F:.]/', '', $ip) ?: 'unknown';
}

/** Tiny IP-bucket rate limiter. Flat file: one "<epoch>\t<ip>\n" line per hit. */
function rate_limit(string $ip): void {
  $now    = time();
  $cutoff = $now - RL_WINDOW_SEC;
  $fp = @fopen(RL_FILE, 'c+');
  if ($fp === false) return; // can't enforce — fail open rather than break uploads
  if (!flock($fp, LOCK_EX)) { fclose($fp); return; }
  $kept = [];
  $hits = 0;
  while (($line = fgets($fp)) !== false) {
    [$ts, $who] = array_pad(explode("\t", trim($line), 2), 2, '');
    $tsInt = (int)$ts;
    if ($tsInt < $cutoff) continue; // expired
    $kept[] = $tsInt . "\t" . $who;
    if ($who === $ip) $hits++;
  }
  if ($hits >= RL_MAX_HITS) {
    flock($fp, LOCK_UN);
    fclose($fp);
    fail(429, 'Rate limit exceeded — please try again in a minute.');
  }
  $kept[] = $now . "\t" . $ip;
  ftruncate($fp, 0);
  rewind($fp);
  fwrite($fp, implode("\n", $kept) . "\n");
  fflush($fp);
  flock($fp, LOCK_UN);
  fclose($fp);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  fail(405, 'POST only');
}

$token = $_SERVER['HTTP_X_UPLOAD_TOKEN'] ?? ($_GET['token'] ?? '');
if (!hash_equals(UPLOAD_TOKEN, (string)$token)) {
  fail(401, 'Bad token');
}

rate_limit(client_ip());

if (!isset($_FILES['file']) || !is_uploaded_file($_FILES['file']['tmp_name'])) {
  fail(400, 'No file uploaded');
}

$file = $_FILES['file'];
if ($file['error'] !== UPLOAD_ERR_OK) {
  fail(400, 'Upload failed (code ' . $file['error'] . ')');
}
if ($file['size'] > MAX_BYTES) {
  fail(413, 'File too large');
}

$origName = (string)$file['name'];
// Reject filenames with control chars / null bytes outright
if (preg_match('/[\x00-\x1F\/\\\\]/', $origName)) {
  fail(400, 'Invalid filename');
}

// Pull only the final extension and ignore everything before — guards
// against `.php.jpg` and similar tricks because we never use $origName as
// the final filename.
$ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
if (!in_array($ext, ALLOWED_EXT, true)) {
  fail(415, 'Unsupported extension: ' . $ext);
}

// Verify MIME by inspecting actual file bytes.
$tmp = $file['tmp_name'];
$detectedMime = '';
if (class_exists('finfo')) {
  $fi = new finfo(FILEINFO_MIME_TYPE);
  $detectedMime = (string)$fi->file($tmp);
} elseif (function_exists('mime_content_type')) {
  $detectedMime = (string)mime_content_type($tmp);
}
if ($detectedMime !== '' && !in_array($detectedMime, ALLOWED_MIME, true)) {
  fail(415, 'MIME type not allowed: ' . $detectedMime);
}

// For raster formats — also confirm via getimagesize that the file is a real
// image. SVG won't pass this (no getimagesize support) so we skip for SVG.
if ($ext !== 'svg') {
  $info = @getimagesize($tmp);
  if ($info === false) {
    fail(415, 'Not a valid image');
  }
  // Sanity check on extension vs detected image type.
  $expected = [
    'jpg' => IMAGETYPE_JPEG, 'jpeg' => IMAGETYPE_JPEG,
    'png' => IMAGETYPE_PNG,
    'gif' => IMAGETYPE_GIF,
    'webp' => defined('IMAGETYPE_WEBP') ? IMAGETYPE_WEBP : 18,
    'avif' => defined('IMAGETYPE_AVIF') ? IMAGETYPE_AVIF : 19,
  ];
  if (isset($expected[$ext]) && (int)$info[2] !== $expected[$ext]) {
    fail(415, 'Extension does not match image content');
  }
} else {
  // Reject SVG with embedded <script>/javascript: payloads.
  $svg = (string)file_get_contents($tmp, false, null, 0, 200_000);
  if (preg_match('~<script\b|on\w+\s*=|javascript:~i', $svg)) {
    fail(415, 'SVG contains scripts/event handlers — not allowed');
  }
}

if (!is_dir(UPLOAD_DIR)) {
  if (!mkdir(UPLOAD_DIR, 0775, true) && !is_dir(UPLOAD_DIR)) {
    fail(500, 'Cannot create uploads directory');
  }
}

// Slug from the original *base* name only — used purely as a hint for
// humans browsing the uploads folder. Final name is randomised so attackers
// can't predict URLs.
$baseName = pathinfo($origName, PATHINFO_FILENAME);
$slug = (string)preg_replace('/[^a-z0-9]+/i', '-', strtolower($baseName));
$slug = trim($slug, '-');
if ($slug === '') $slug = 'img';
$slug = substr($slug, 0, 40);

$rand = bin2hex(random_bytes(4));
$dest = sprintf('%s/%d-%s-%s.%s', UPLOAD_DIR, time(), $slug, $rand, $ext);

if (file_exists($dest)) {
  fail(500, 'Filename collision — please retry');
}
if (!move_uploaded_file($tmp, $dest)) {
  fail(500, 'Cannot save file');
}
@chmod($dest, 0644);

// Optional: re-encode JPEG to strip EXIF metadata (privacy).
if (($ext === 'jpg' || $ext === 'jpeg') && function_exists('imagecreatefromjpeg')) {
  $img = @imagecreatefromjpeg($dest);
  if ($img !== false) {
    @imagejpeg($img, $dest, 88);
    imagedestroy($img);
  }
}

$publicUrl = PUBLIC_BASE . '/' . basename($dest);

echo json_encode([
  'ok'   => true,
  'url'  => $publicUrl,
  'name' => basename($dest),
  'size' => filesize($dest),
]);
