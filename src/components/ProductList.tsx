"use client";

import type { ProductDTO } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";
import type { SortOption } from "@/lib/product-schema";

export function ProductList({
  products,
  sort,
  onConsumed,
  onQuantityChanged,
}: {
  products: ProductDTO[];
  sort: SortOption;
  onConsumed: (id: string) => void;
  onQuantityChanged?: (id: string, quantity: string | null) => void;
}) {
  const isExpirySort = sort === "expiry-asc" || sort === "expiry-desc";

  if (!isExpirySort) {
    return (
      <ul className="flex flex-col gap-3">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onConsumed={onConsumed}
            onQuantityChanged={onQuantityChanged}
          />
        ))}
      </ul>
    );
  }

  const withDate = products.filter((p) => p.expiryDate || p.recommendedConsumptionDate);
  const withoutDate = products.filter((p) => !p.expiryDate && !p.recommendedConsumptionDate);

  return (
    <div className="flex flex-col gap-6">
      {withDate.length > 0 && (
        <ul className="flex flex-col gap-3">
          {withDate.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onConsumed={onConsumed}
              onQuantityChanged={onQuantityChanged}
            />
          ))}
        </ul>
      )}
      {withoutDate.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">
            Senza data di consumo
          </h2>
          <ul className="flex flex-col gap-3">
            {withoutDate.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onConsumed={onConsumed}
                onQuantityChanged={onQuantityChanged}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
