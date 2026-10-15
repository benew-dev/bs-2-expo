// lib/format.js
//
// CORRECTIF : "Fdj" n'est pas un code ISO 4217 valide (le vrai code du
// franc djiboutien est "DJF", mais Intl le formatterait "DJF 1 000", pas
// "1 000 Fdj"). `Intl.NumberFormat({ currency: "Fdj" })` lève une
// RangeError sur un moteur strict (Hermes y compris selon la version) :
// on formate donc le nombre seul et on concatène "Fdj" à la main.
export const formatPrice = (price) => {
  const value = Number(price) || 0;
  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

  return `${formatted} Fdj`;
};
