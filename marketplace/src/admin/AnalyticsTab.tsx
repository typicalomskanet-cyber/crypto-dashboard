import { useMemo } from "react";
import { useCatalog } from "../lib/catalog";

export function AnalyticsTab() {
  const { products, clicks } = useCatalog();

  const rows = useMemo(() => {
    return Object.entries(clicks)
      .map(([id, count]) => {
        const p = products.find(x => x.id === id);
        return {
          id,
          title: p?.title ?? "(удалённый товар)",
          brand: p?.brand ?? "",
          count,
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [products, clicks]);

  const total = rows.reduce((s, r) => s + r.count, 0);

  function exportCsv() {
    const header = "id,title,brand,clicks\n";
    const body = rows
      .map(r => `${r.id},"${r.title.replace(/"/g, '""')}",${r.brand},${r.count}`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `yantach-clicks-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h1 className="text-[20px] font-extrabold">Аналитика</h1>
        <span className="text-[12px] text-ink-2">всего кликов «Купить»: <b>{total}</b></span>
        {rows.length > 0 && (
          <button
            onClick={exportCsv}
            className="ml-auto rounded-lg bg-paper px-4 py-2 text-[13px] font-semibold hover:bg-brand-light hover:text-brand"
          >
            Экспорт CSV
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line p-6 text-center text-ink-2">
          Пока ни одного клика на «Купить». Метрика накапливается, когда
          посетители сайта переходят к партнёру.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[500px] text-[13px]">
            <thead className="bg-paper text-left text-[11px] uppercase tracking-wide text-ink-2">
              <tr>
                <th className="p-2">Товар</th>
                <th className="p-2 text-right">Кликов</th>
                <th className="p-2 text-right">Доля</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-t border-line">
                  <td className="p-2">
                    <div className="font-semibold">{r.title}</div>
                    <div className="text-[11px] text-ink-2">{r.brand} · {r.id}</div>
                  </td>
                  <td className="p-2 text-right font-semibold">{r.count}</td>
                  <td className="p-2 text-right text-[12px] text-ink-2">
                    {total > 0 ? `${((r.count / total) * 100).toFixed(1)}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
