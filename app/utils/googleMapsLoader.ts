// utils/googleMapsLoader.ts
// this makes sure that Google Maps is loaded only once in the whole app.
let googleMapsLoadingPromise: Promise<void> | null = null;
let isGoogleMapsLoaded = false;

export const loadGoogleMaps = (apiKey: string): Promise<void> => {
  // If already loaded or loading, return existing promise
  if (isGoogleMapsLoaded) return Promise.resolve();
  if (googleMapsLoadingPromise) return googleMapsLoadingPromise;

  googleMapsLoadingPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) {
      isGoogleMapsLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      isGoogleMapsLoaded = true;
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return googleMapsLoadingPromise;
};