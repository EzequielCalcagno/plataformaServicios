export const GOOGLE_PLACES_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY as string;

if (!GOOGLE_PLACES_KEY) {
  console.warn('⚠️ Falta EXPO_PUBLIC_GOOGLE_PLACES_KEY en .env');
}
