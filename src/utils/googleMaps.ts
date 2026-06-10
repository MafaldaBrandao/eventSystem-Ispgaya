const GOOGLE_MAPS_SCRIPT_ID = 'google-maps-places-script';

export function getGoogleMapsApiKey(): string {
  return import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() || '';
}

export function hasGoogleMapsApiKey(): boolean {
  return getGoogleMapsApiKey().length > 0;
}

export function buildGoogleMapsQuery(location?: string | null, city?: string | null): string {
  return [location, city].map((value) => value?.trim()).filter(Boolean).join(', ');
}

export function buildGoogleMapsSearchUrl(location?: string | null, city?: string | null): string {
  const query = buildGoogleMapsQuery(location, city);
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : '';
}

export function buildGoogleMapsEmbedUrl(location?: string | null, city?: string | null): string {
  const query = buildGoogleMapsQuery(location, city);
  return query ? `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed` : '';
}

export async function loadGoogleMapsPlacesApi(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  if (window.google?.maps?.places) {
    return;
  }

  if (!hasGoogleMapsApiKey()) {
    throw new Error('Missing Google Maps API key.');
  }

  const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID) as HTMLScriptElement | null;
  if (existingScript) {
    await new Promise<void>((resolve, reject) => {
      if (window.google?.maps?.places) {
        resolve();
        return;
      }

      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps.')), {
        once: true,
      });
    });
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(getGoogleMapsApiKey())}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Maps.'));
    document.head.appendChild(script);
  });
}
