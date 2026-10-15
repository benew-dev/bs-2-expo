// app/women.js
// Équivalent de app/women/page.jsx.
// Voir app/men.js pour le détail des adaptations (symétrique, seul le
// "type" change).

import ProductsScreen from "@/components/products/ProductsScreen";

export default function WomenScreen() {
  return <ProductsScreen type="women" basePath="/women" />;
}
