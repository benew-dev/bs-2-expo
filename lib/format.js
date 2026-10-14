// lib/format.js
export const formatPrice = (price) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "Fdj" }).format(
    price || 0,
  );
