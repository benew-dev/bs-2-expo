// helpers/nav.js

export const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/men", label: "Men" },
  { href: "/women", label: "Women" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "À propos" },
  { href: "/contact", label: "Contactez-nous" },
];

// Même logique que usePathname + comparaison du web, adaptée à expo-router.
export function isActiveLink(pathname, href) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname?.startsWith(`${href}/`);
}
