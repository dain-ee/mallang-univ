/* 말랑대학 알림 (11/4). 홈 화면 앱에서 알림을 켜면 scripts/push/send.js 가 보낸 알림을 띄워요.
   화면 파일을 저장해 두지는 않아요 (새 버전은 loader.js 가 바꿔요) */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('push', (e) => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || '말랑대학', { body: d.body || '', icon: d.icon || 'assets/appicon/ghost.png', tag: d.tag || 'mu', data: { url: d.url || './' } }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const L = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of L) if ('focus' in c) return c.focus();
    return self.clients.openWindow(new URL((e.notification.data || {}).url || './', self.registration.scope).href);
  })());
});
