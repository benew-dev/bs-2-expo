// app/men.js
// Équivalent de app/men/page.jsx.
//
// Adaptations : pas de Server Component ni de metadata Next.js (titre
// d'onglet web, sans équivalent natif direct) ; pas de dynamic/revalidate
// (cache serveur Next, non pertinent côté RN) ; toute la logique de fetch +
// filtres + pagination est centralisée dans ProductsScreen (partagée avec
// app/women.js), les deux pages web ne différant que par le type forcé.

import ProductsScreen from "@/components/products/ProductsScreen";

export default function MenScreen() {
  return <ProductsScreen type="men" basePath="/men" />;
}
