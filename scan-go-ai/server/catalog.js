export const products = [
  { id: "milk-1", name: "Fresh Milk 1L", category: "Dairy", price: 62, barcode: "8901234567012", emoji: "🥛" },
  { id: "bread-1", name: "Whole Wheat Bread", category: "Bakery", price: 45, barcode: "8901234567029", emoji: "🍞" },
  { id: "eggs-1", name: "Farm Eggs (6)", category: "Dairy", price: 72, barcode: "8901234567036", emoji: "🥚" },
  { id: "apples-1", name: "Fresh Apples 1kg", category: "Fruits", price: 160, barcode: "8901234567043", emoji: "🍎" },
  { id: "rice-1", name: "Basmati Rice 1kg", category: "Grocery", price: 115, barcode: "8901234567050", emoji: "🍚" },
  { id: "soap-1", name: "Herbal Soap", category: "Personal care", price: 38, barcode: "8901234567067", emoji: "🧼" }
];

export function getCartFromIds(items = []) {
  return items.map(({ id, quantity }) => {
    const product = products.find((p) => p.id === id);
    if (!product) throw new Error(`Unknown product: ${id}`);
    const qty = Math.max(1, Math.min(99, Number(quantity) || 1));
    return { ...product, quantity: qty };
  });
}
