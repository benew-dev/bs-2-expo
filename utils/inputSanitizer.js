// utils/inputSanitizer.js (mobile)
// Équivalent de utils/inputSanitizer.js (web), adapté : expo-router donne
// les paramètres de recherche sous forme d'objet simple
// (useLocalSearchParams()), pas d'URLSearchParams — qui n'existe pas
// nativement sur Hermes/React Native sans polyfill supplémentaire.

/**
 * Nettoie une chaîne basique (trim + espaces multiples).
 * Pas d'encodage HTML - React Native échappe déjà le texte affiché.
 */
export const cleanString = (value) => {
  if (!value || typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ");
};

/**
 * Parse un nombre de manière sûre.
 */
export const parseNumber = (value, defaultValue = null) => {
  if (value === null || value === undefined || value === "") {
    return defaultValue;
  }

  const num = Number(value);
  return isNaN(num) || !isFinite(num) ? defaultValue : num;
};

/**
 * Vérifie un ObjectId MongoDB (format seulement).
 */
export const isValidObjectId = (value) => {
  if (!value) return false;
  return /^[0-9a-fA-F]{24}$/.test(String(value).trim());
};

/**
 * Parse les paramètres de recherche produits.
 *
 * `params` est un objet simple (ex: issu de useLocalSearchParams()) plutôt
 * qu'une URLSearchParams. Si un paramètre est répété dans l'URL, expo-router
 * renvoie un tableau : on ne garde que la première valeur.
 */
export const parseProductSearchParams = (params = {}, defaultType = null) => {
  const get = (key) => {
    const value = params?.[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const result = {};

  // Type : fourni par l'écran appelant (men/women), jamais par l'URL
  const type = get("type") || defaultType;
  if (type && ["men", "women"].includes(type)) {
    result.type = type;
  }

  // Keyword
  const keyword = get("keyword");
  if (keyword) {
    result.keyword = cleanString(keyword);
  }

  // Category - vérifier ObjectId
  const category = get("category");
  if (category && isValidObjectId(category)) {
    result.category = String(category).trim();
  }

  // Note
  const ratings = get("ratings") ?? get("ratings[gte]");
  if (ratings) {
    result["ratings[gte]"] = parseNumber(ratings);
  }

  // Prix min/max
  const minPrice = get("min") ?? get("price[gt]");
  if (minPrice) {
    const min = parseNumber(minPrice);
    if (min !== null && min >= 0) {
      result["price[gt]"] = min;
    }
  }

  const maxPrice = get("max") ?? get("price[lt]");
  if (maxPrice) {
    const max = parseNumber(maxPrice);
    if (max !== null && max >= 0) {
      result["price[lt]"] = max;
    }
  }

  // Page
  const page = parseNumber(get("page"), 1);
  result.page = Math.max(1, Math.min(page, 1000));

  return result;
};

/**
 * Construit une query string propre à partir d'un objet de paramètres.
 * Pas d'URLSearchParams (non garanti sur RN) : construction manuelle avec
 * encodeURIComponent.
 */
export const buildQueryString = (params = {}) => {
  const parts = [];

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      parts.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
      );
    }
  });

  return parts.join("&");
};

export default {
  cleanString,
  parseNumber,
  isValidObjectId,
  parseProductSearchParams,
  buildQueryString,
};
