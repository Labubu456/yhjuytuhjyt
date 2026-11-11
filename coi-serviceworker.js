/* Service worker sederhana untuk mengaktifkan cross-origin isolation (SharedArrayBuffer)
   di hosting statis seperti GitHub Pages. Terinspirasi dari coi-serviceworker (MIT). */

if (typeof window === 'undefined') {
  // ===== Bagian Service Worker =====
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

  self.addEventListener('fetch', (event) => {
    const r = event.request;
    if (r.cache === 'only-if-cached' && r.mode !== 'same-origin') return;

    // Mode "credentialless" mengizinkan resource lintas-origin (CDN) tanpa header CORP
    const request = r.mode === 'no-cors' ? new Request(r, { credentials: 'omit' }) : r;

    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 0) return response;
          const headers = new Headers(response.headers);
          headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
          headers.set('Cross-Origin-Opener-Policy', 'same-origin');
          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers
          });
        })
        .catch((e) => console.error(e))
    );
  });
} else {
  // ===== Bagian halaman: daftarkan service worker lalu reload sekali =====
  (() => {
    if (window.crossOriginIsolated) return;
    if (!window.isSecureContext || !navigator.serviceWorker) {
      console.warn('Service worker butuh https. Halaman ini tidak bisa cross-origin isolated.');
      return;
    }
    const src = window.document.currentScript.src;
    navigator.serviceWorker.register(src).then((reg) => {
      if (reg.active && !navigator.serviceWorker.controller) {
        window.location.reload();
      }
      reg.addEventListener('updatefound', () => window.location.reload());
    }).catch((err) => console.error('Gagal mendaftarkan service worker:', err));
  })();
}
