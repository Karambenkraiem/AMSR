export function getMobileOS() {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'android';
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return 'ios';
  return null;
}

// true quand l'app tourne dans la coque Capacitor (native Android/iOS)
export const isNativeApp = () => !!(window.Capacitor?.isNativePlatform?.());

// APK distribué en pièce jointe de la dernière Release GitHub du dépôt
// (pas de compte développeur Google Play) : ce lien redirige toujours vers
// l'asset "amsr-steg.apk" de la release la plus récente.
export const APK_URL = 'https://github.com/Karambenkraiem/AMSR/releases/latest/download/amsr-steg.apk';

// Pas de compte développeur Apple pour l'instant : iOS reste indisponible.
export const IOS_AVAILABLE = false;
export const APPSTORE_URL = 'https://apps.apple.com/app/amsr-steg/id000000000';
