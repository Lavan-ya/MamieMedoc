"use client";

import { AlertTriangle, Check, ClipboardList } from "lucide-react";
import { STOCK_ITEMS, type StockItem } from "@/lib/data";

type InventoryCardProps = {
  items?: StockItem[];
  onOrderAll?: () => void;
};

export function InventoryCard({ items = STOCK_ITEMS, onOrderAll }: InventoryCardProps) {
  return (
    <section className="card inventory-card" id="inventory" aria-labelledby="inventory-title">
      <div className="inventory-header">
        <div className="inventory-title">
          <ClipboardList size={20} strokeWidth={1.9} aria-hidden="true" />
          <h2 id="inventory-title">Inventory &amp; Stock</h2>
        </div>
        {onOrderAll ? (
          <button type="button" className="text-button" onClick={onOrderAll}>
            Order All Refills
          </button>
        ) : null}
      </div>

      <ul className="stock-list">
        {items.map((item) => (
          <li className={`stock-row stock-row--${item.status}`} key={item.name}>
            <span className="stock-status-icon" aria-hidden="true">
              {item.status === "low" ? (
                <AlertTriangle size={15} strokeWidth={2.2} />
              ) : (
                <Check size={15} strokeWidth={2.8} />
              )}
            </span>
            <div className="stock-copy">
              <h3>{item.name}</h3>
              <p>{item.remaining}</p>
            </div>
            <span className={`stock-pill stock-pill--${item.status}`}>
              <span>{item.days}</span>
              <small>{item.status === "low" ? "Low stock" : "Healthy stock"}</small>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}