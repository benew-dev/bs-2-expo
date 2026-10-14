// lib/cloudinary.js
// Construction manuelle d'URLs Cloudinary : pas de next-cloudinary sur RN.

export function cldUrl(
  publicId,
  { width, height, quality = "auto", crop = "fill" } = {},
) {
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName || !publicId) return null;

  const transformations = ["f_auto", `q_${quality}`, `c_${crop}`];
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformations.join(",")}/${publicId}`;
}
