"use client";

import { useEffect, useMemo, useState } from "react";
import type { AdminOrderRecord } from "@/lib/demo-admin-ops";
import { formatSyp } from "@/lib/demo-currency";
import { EmptyState } from "@/components/EmptyState";

type CustomerAccountRow = {
  id?: string;
  fullName: string;
  phone: string;
  shopName: string;
  industrialArea: string;
};

function readCustomerAccounts(): CustomerAccountRow[] {
  try {
    const raw = localStorage.getItem("sareee-customer-accounts-v1");
    if (!raw) return [];
    const list = JSON.parse(raw) as CustomerAccountRow[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/**
 * Admin-only customer records — customers do not see their own history in-app.
 */
export function AdminCustomersPanel({
  orders,
}: {
  orders: AdminOrderRecord[];
}) {
  const [query, setQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<CustomerAccountRow[]>([]);

  useEffect(() => {
    setAccounts(readCustomerAccounts());
  }, [orders]);

  const customers = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        name: string;
        phone: string;
        shop: string;
        area: string;
        orders: AdminOrderRecord[];
      }
    >();

    for (const a of accounts) {
      const key = `${a.phone}|${a.fullName}`.toLowerCase();
      map.set(key, {
        key,
        name: a.fullName,
        phone: a.phone,
        shop: a.shopName,
        area: a.industrialArea,
        orders: [],
      });
    }

    for (const o of orders) {
      const key = `${o.customerPhone}|${o.customerName}`.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        existing.orders.push(o);
      } else {
        map.set(key, {
          key,
          name: o.customerName,
          phone: o.customerPhone,
          shop: o.pickupShop || o.deliveryShop || "—",
          area: o.pickupArea || o.deliveryArea || "—",
          orders: [o],
        });
      }
    }

    const q = query.trim().toLowerCase();
    return [...map.values()]
      .filter((c) => {
        if (!q) return true;
        return (
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.shop.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.orders.length - a.orders.length);
  }, [accounts, orders, query]);

  const selected = customers.find((c) => c.key === selectedKey) ?? null;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-white">سجلات العملاء</h2>
        <p className="mt-1 text-sm text-slate-400">
          الأدمن فقط بيشوف تاريخ طلبات كل عميل — التطبيق ما بيعرض سجل للعميل نفسه.
        </p>
      </div>

      <input
        className="ui-input"
        placeholder="بحث باسم العميل أو الهاتف أو المحل..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelectedKey(null);
        }}
      />

      {customers.length === 0 ? (
        <EmptyState
          title="ما في عملاء بعد"
          body="لما عميل يعمل حساب أو يطلب من واجهة العميل (نفس المتصفح)، بيظهر هون مع سجل طلباته."
          tone="neutral"
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <ul className="max-h-[55vh] space-y-2 overflow-y-auto">
            {customers.map((c) => (
              <li key={c.key}>
                <button
                  type="button"
                  onClick={() => setSelectedKey(c.key)}
                  className={`w-full rounded-2xl border px-3 py-3 text-right transition ${
                    selectedKey === c.key
                      ? "border-sky-500/50 bg-sky-950/40"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  <p className="font-semibold text-white">{c.name}</p>
                  <p className="text-xs text-slate-400">
                    {c.phone} · {c.shop} · {c.area}
                  </p>
                  <p className="mt-1 text-xs text-sky-300">
                    {c.orders.length} طلب مسجّل
                  </p>
                </button>
              </li>
            ))}
          </ul>

          <div className="ui-glass rounded-3xl p-4">
            {!selected ? (
              <EmptyState
                title="اختاروا عميل"
                body="من القائمة على اليمين/اليسار لتشوفوا كل طلباته وحالاتها."
                tone="wait"
              />
            ) : (
              <>
                <h3 className="font-bold text-sky-100">{selected.name}</h3>
                <p className="mt-1 text-xs text-slate-400">
                  {selected.phone} · {selected.shop}
                </p>
                {selected.orders.length === 0 ? (
                  <p className="mt-4 text-sm text-slate-500">
                    الحساب موجود — ما في طلبات مسجّلة بعد.
                  </p>
                ) : (
                  <ul className="mt-4 max-h-[45vh] space-y-2 overflow-y-auto">
                    {selected.orders
                      .slice()
                      .sort(
                        (a, b) =>
                          new Date(b.updatedAt).getTime() -
                          new Date(a.updatedAt).getTime(),
                      )
                      .map((o) => (
                        <li
                          key={o.id}
                          className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm"
                        >
                          <div className="flex justify-between gap-2">
                            <span className="font-bold text-white">
                              {o.orderNumber}
                            </span>
                            <span className="text-xs text-slate-400">
                              {o.status}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-400">
                            {o.pickupShop} ({o.pickupArea}) → {o.deliveryShop} (
                            {o.deliveryArea})
                          </p>
                          <p className="mt-1 text-xs text-emerald-300">
                            {formatSyp(o.totalCharge)}
                            {o.driverName ? ` · سائق: ${o.driverName}` : ""}
                          </p>
                        </li>
                      ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
