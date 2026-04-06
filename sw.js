// Nousflow Service Worker — URL Blocking
const SW_VERSION = 'nousflow-v2';

let blockedDomains = [];
let allowedDomains = [];
let sessionActive = false;

self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'UPDATE_BLOCKING') {
    blockedDomains = e.data.blocked || [];
    allowedDomains = e.data.allowed || [];
    sessionActive = e.data.sessionActive || false;
  }
});

self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);
  const hostname = url.hostname.replace(/^www\./, '');

  if (!sessionActive || blockedDomains.length === 0) {
    event.respondWith(fetch(event.request));
    return;
  }

  const isAllowed = allowedDomains.some(function(d) {
    return hostname === d || hostname.endsWith('.' + d);
  });
  if (isAllowed) {
    event.respondWith(fetch(event.request));
    return;
  }

  const isBlocked = blockedDomains.some(function(d) {
    return hostname === d || hostname.endsWith('.' + d);
  });

  if (isBlocked) {
    const blockHtml = '<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Blocked by Nousflow</title><style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#0a0a0f;color:#fff;font-family:-apple-system,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:32px;text-align:center;}.logo{font-size:64px;margin-bottom:24px;animation:float 3s ease-in-out infinite;}@keyframes float{0%,100%{transform:translateY(0);}50%{transform:translateY(-10px);}}h1{font-size:22px;font-weight:800;margin-bottom:10px;line-height:1.2;}h1 span{color:#8b85ff;}p{font-size:14px;color:#666;line-height:1.6;margin-bottom:32px;}.btn{background:#6c63ff;color:#fff;border:none;border-radius:12px;padding:14px 32px;font-size:15px;font-weight:700;cursor:pointer;text-decoration:none;display:inline-block;width:100%;max-width:280px;}</style></head><body><div class="logo">🧠</div><h1>Blocked by<br><span>Nousflow</span></h1><p>Keep your mind in flow state.<br>This site is blocked during your session.</p><a href="/" class="btn">Back to session</a></body></html>';
    event.respondWith(new Response(blockHtml, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    }));
    return;
  }

  event.respondWith(fetch(event.request));
});

self.addEventListener('install', function(e) { self.skipWaiting(); });
self.addEventListener('activate', function(e) { e.waitUntil(clients.claim()); });
