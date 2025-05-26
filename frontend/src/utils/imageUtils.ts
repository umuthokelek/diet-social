// utils/imageUtils.ts

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5177').replace(/\/$/, '');

export function getImageUrl(fileName: string | null | undefined): string | null {
  if (!fileName) return null;

  // Remove /api/images/ or /images/ prefix if included in fileName
  const cleanFileName = fileName.replace(/^(\/api)?\/images\//, '');

  // Remove /api from the base URL ONLY for image URLs
  const baseForImages = API_BASE_URL.replace(/\/api$/, '');

  const finalUrl = `${baseForImages}/images/${cleanFileName}`;

  console.log('Image URL transformation:', {
    original: fileName,
    cleaned: cleanFileName,
    final: finalUrl,
  });

  return finalUrl;
}