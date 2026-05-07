<?php
// Yantach Shop — image upload endpoint.
// Drop into your hosting's web root next to index.html.
// Authenticated by a static token passed in the X-Upload-Token header
// (or `?token=` query param). Replace UPLOAD_TOKEN below with your own
// secret on first deploy and mirror it in the admin panel.

declare(strict_types=1);

const UPLOAD_TOKEN = 'a764bd68c87dde34f8fccd239ca9d677';
const UPLOAD_DIR   = __DIR__ . '/uploads';
const PUBLIC_BASE  = '/uploads';
const MAX_BYTES    = 8 * 1024 * 1024; // 8 MB
const ALLOWED      = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'];

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-Upload-Token');
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

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  fail(405, 'POST only');
}

$token = $_SERVER['HTTP_X_UPLOAD_TOKEN'] ?? ($_GET['token'] ?? '');
if (!hash_equals(UPLOAD_TOKEN, (string)$token)) {
  fail(401, 'Bad token');
}

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

$name = (string)$file['name'];
$ext  = strtolower(pathinfo($name, PATHINFO_EXTENSION));
if (!in_array($ext, ALLOWED, true)) {
  fail(415, 'Unsupported extension: ' . $ext);
}

if (!is_dir(UPLOAD_DIR)) {
  if (!mkdir(UPLOAD_DIR, 0775, true) && !is_dir(UPLOAD_DIR)) {
    fail(500, 'Cannot create uploads directory');
  }
}

$baseName = pathinfo($name, PATHINFO_FILENAME);
$slug = preg_replace('/[^a-z0-9]+/i', '-', strtolower($baseName));
$slug = trim((string)$slug, '-');
if ($slug === '') $slug = 'img';
$slug = substr($slug, 0, 40);

$dest = sprintf('%s/%d-%s.%s', UPLOAD_DIR, time(), $slug, $ext);
if (!move_uploaded_file($file['tmp_name'], $dest)) {
  fail(500, 'Cannot save file');
}
@chmod($dest, 0644);

$publicUrl = PUBLIC_BASE . '/' . basename($dest);

echo json_encode([
  'ok'   => true,
  'url'  => $publicUrl,
  'name' => basename($dest),
  'size' => filesize($dest),
]);
