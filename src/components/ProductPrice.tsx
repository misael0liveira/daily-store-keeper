import { formatBRL, getProductPricing, type Product } from "@/store/useStore";

export function ProductPrice({ product, now }: { product: Product; now?: number }) {
  const pricing = getProductPricing(product, now);
  return (
    <span className="product-prices">
      {pricing.active && (
        <del className="product-original-price">
          <span className="sr-only">Preço original: </span>
          {formatBRL(pricing.originalPrice)}
        </del>
      )}
      <span className="product-current-price">
        <span className="sr-only">{pricing.active ? "Preço com desconto: " : "Preço: "}</span>
        {formatBRL(pricing.price)}
      </span>
    </span>
  );
}
