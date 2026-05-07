import { useRef, useState } from "react";
import { useCatalog } from "../lib/catalog";

export function ImportExportTab() {
  const { exportJson, importJson } = useCatalog();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  function handleExport() {
    const json = exportJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `yantach-catalog-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg({ kind: "ok", text: "Файл скачан" });
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = importJson(String(reader.result ?? ""));
      if (result.ok) {
        setMsg({ kind: "ok", text: "Каталог успешно загружен" });
      } else {
        setMsg({ kind: "err", text: `Ошибка: ${result.error}` });
      }
    };
    reader.readAsText(f);
  }

  return (
    <div className="max-w-[640px]">
      <h1 className="mb-4 text-[20px] font-extrabold">Импорт / Экспорт</h1>

      <p className="mb-5 text-[13px] text-ink-2">
        Сохраните весь каталог (товары, категории, баннеры, новости, настройки,
        статистику кликов) в JSON-файл — потом восстановите на этом или другом
        устройстве. Это надёжный способ переноса всех правок.
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-paper p-4">
          <div className="mb-2 text-[14px] font-bold">📤 Экспорт</div>
          <p className="mb-3 text-[12px] text-ink-2">
            Скачать JSON-файл со всем каталогом.
          </p>
          <button
            onClick={handleExport}
            className="w-full rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-dark"
          >
            Скачать JSON
          </button>
        </div>

        <div className="rounded-xl border border-line bg-paper p-4">
          <div className="mb-2 text-[14px] font-bold">📥 Импорт</div>
          <p className="mb-3 text-[12px] text-ink-2">
            Восстановить каталог из ранее экспортированного файла.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFile}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-lg border border-brand bg-white px-4 py-2 text-[13px] font-semibold text-brand hover:bg-brand-light"
          >
            Выбрать файл…
          </button>
        </div>
      </div>

      {msg && (
        <div
          className={`mt-4 rounded-lg px-3 py-2 text-[12px] ${
            msg.kind === "ok"
              ? "bg-brand-light text-brand"
              : "bg-discount/10 text-discount"
          }`}
        >
          {msg.text}
        </div>
      )}
    </div>
  );
}
