// Registreert de service worker met een relatief pad, zodat dit op elk sub-pad werkt.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Geen internet bij de allereerste registratie, of een browser zonder support:
      // de app werkt dan gewoon online verder, zonder offline-cache.
    });
  });
}
