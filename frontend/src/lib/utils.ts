import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  
  // Clean the image URL by removing any existing path prefixes
  const cleanFileName = imageUrl
    .replace(/^\/?(api\/)?images\//, '') // Remove /images/, images/, or /api/images/
    .replace(/^\/+/, ''); // Remove any leading slashes
  
  // Always use the backend server URL
  const backendUrl = 'http://localhost:5177';
  const finalUrl = `${backendUrl}/images/${cleanFileName}`;
  
  console.log('Original imageUrl:', imageUrl);
  console.log('Cleaned fileName:', cleanFileName);
  console.log('Final image URL:', finalUrl);
  
  return finalUrl;
} 