importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.2.0/workbox-sw.js');

if (workbox) {

  workbox.routing.registerRoute(
    // Cache image files.
    /\.(?:png|jpg|jpeg|svg|gif)$/,
    // Use the cache if it's available.
    new workbox.strategies.CacheFirst({
      // Use a custom cache name.
      cacheName: 'image-cache',
      plugins: [
        new workbox.expiration.Plugin({
          // Cache only 20 images.
          maxEntries: 20,
          // Cache for a maximum of 2 day.
          maxAgeSeconds: 2 * 24 * 60 * 60,
        })
      ],
    })
  );

  workbox.routing.registerRoute(
    // Cache image files.
    /\.(?:css|js|json|html)$/,
    // Use the cache if it's available.
    new workbox.strategies.CacheFirst({
      // Use a custom cache name.
      cacheName: 'files-cache',
      plugins: [
        new workbox.expiration.Plugin({
          // Cache only 20 files.
          maxEntries: 20,
          // Cache for a maximum of 2 day.
          maxAgeSeconds: 2 * 24 * 60 * 60,
        })
      ],
    })
  );

} else {
  console.log(`Boo! Workbox didn't load 😬`);
}