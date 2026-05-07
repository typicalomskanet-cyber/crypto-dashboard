import { useState } from "react";
import { useCatalog } from "../lib/catalog";
import type { PromoCode } from "../data/promos";
import { Field, inputCls, textareaCls } from "./AdminApp";

export function PromosTab() {
  const { promos, addPromo, updatePromo, removePromo } = useCatalog();
  const [editing, setEditing] = useState<PromoCode | null>(null);

  function startNew() {
    setEditing({
      id: `promo-${Date.now()}`,
      code: "",
      percent: 10,
      description: "",
      featured: false,
      active: true,
    });
  }

  function save(p: PromoCode) {
    if (promos.find(x => x.id === p.id)) updatePromo(p.id, p);
    else addPromo(p);
    setEditing(null);
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h1 className="text-[20px] font-extrabold">Промокоды</h1>
        <span className="text-sm text-ink-2">({promos.length})</span>
        <button
          onClick={startNew}
          className="ml-auto h-9 rounded-lg bg-brand px-3 text-[13px] font-semibold text-white hover:bg-brand-dark"
        >
          + Добавить
        </button>
      </div>

      <div className="grid gap-2">
        {promos.map(p => (
          <div
            key={p.id}
            className={`flex flex-wrap items-center gap-3 rounded-xl border p-3 ${
              p.active ? "border-line bg-paper" : "border-line bg-white opacity-60"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-ink px-2 py-1 font-mono text-[12px] font-bold tracking-wider text-white">
                {p.code || "—"}
              </span>
              <span className="rounded-md bg-discount/10 px-2 py-0.5 text-[11px] font-bold text-discount">
                −{p.percent}%
              </span>
              {p.featured && (
                <span className="rounded-md bg-accent/40 px-2 py-0.5 text-[11px] font-bold text-ink">
                  В шапке
                </span>
              )}
              {!p.active && (
                <span className="rounded-md bg-paper px-2 py-0.5 text-[11px] text-ink-2">Не активен</span>
              )}
            </div>
            <div className="flex-1 text-[13px] text-ink-2">
              {p.description || <i>Без описания</i>}
              {p.expiresAt && (
                <span className="ml-2 text-[11px] text-ink-2">до {p.expiresAt}</span>
              )}
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setEditing(p)}
                className="rounded-lg border border-line bg-white px-3 py-1.5 text-[12px] hover:border-brand hover:text-brand"
              >
                Редакт.
              </button>
              <button
                onClick={() => updatePromo(p.id, { active: !p.active })}
                className="rounded-lg border border-line bg-white px-3 py-1.5 text-[12px] hover:border-brand hover:text-brand"
              >
                {p.active ? "Выключить" : "Включить"}
              </button>
              <button
                onClick={() => {
                  if (confirm(`Удалить промокод ${p.code}?`)) removePromo(p.id);
                }}
                className="rounded-lg border border-line bg-white px-3 py-1.5 text-[12px] text-ink-2 hover:border-discount hover:text-discount"
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
        {promos.length === 0 && (
          <div className="rounded-xl border border-dashed border-line p-6 text-center text-ink-2">
            Промокодов пока нет. Нажмите «Добавить».
          </div>
        )}
      </div>

      {editing && (
        <PromoEditor
          value={editing}
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function PromoEditor({
  value,
  onCancel,
  onSave,
}: {
  value: PromoCode;
  onCancel(): void;
  onSave(p: PromoCode): void;
}) {
  const [v, setV] = useState<PromoCode>(value);

  function patch<K extends keyof PromoCode>(k: K, val: PromoCode[K]) {
    setV(prev => ({ ...prev, [k]: val }));
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-3">
      <div className="max-h-[90vh] w-full max-w-[520px] overflow-auto rounded-2xl bg-white p-5 shadow-2xl">
        <div className="mb-3 text-[18px] font-extrabold">Промокод</div>
        <div className="grid gap-3">
          <Field label="Код">
            <input
              className={inputCls + " font-mono uppercase tracking-wider"}
              value={v.code}
              onChange={e => patch("code", e.target.value.toUpperCase().slice(0, 24))}
              placeholder="SUMMER15"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Скидка, %">
              <input
                type="number"
                min={1}
                max={100}
                className={inputCls}
                value={v.percent}
                onChange={e => patch("percent", Math.max(1, Math.min(100, Number(e.target.value) || 0)))}
              />
            </Field>
            <Field label="Действует до" hint="не обязательно">
              <input
                type="date"
                className={inputCls}
                value={v.expiresAt ?? ""}
                onChange={e => patch("expiresAt", e.target.value || undefined)}
              />
            </Field>
          </div>
          <Field label="Описание">
            <textarea
              className={textareaCls}
              value={v.description}
              onChange={e => patch("description", e.target.value)}
              placeholder="Скидка 15% на товары категории Электроника"
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={v.featured}
              onChange={e => patch("featured", e.target.checked)}
              className="h-4 w-4 accent-brand"
            />
            Показывать в шапке сайта (промо-полоса)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={v.active}
              onChange={e => patch("active", e.target.checked)}
              className="h-4 w-4 accent-brand"
            />
            Активен
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-line bg-white px-4 py-2 text-[13px] text-ink-2 hover:text-ink"
          >
            Отмена
          </button>
          <button
            onClick={() => v.code.trim() && onSave(v)}
            disabled={!v.code.trim()}
            className="rounded-lg bg-brand px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}
