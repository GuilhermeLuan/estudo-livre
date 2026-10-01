// Service worker mínimo: habilita a instalação do PWA. Não há modo offline,
// então não intercepta nem armazena nenhuma requisição.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
