self.addEventListener("push", (event) => {
    const data = event.data.json();
  
    const options = {
      body: data.message,
      icon: "/logo192.png", // Substitua pelo ícone do seu app
      badge: "/badge.png", // Ícone pequeno para a notificação
      data: data.url, // Link para onde a notificação deve redirecionar
    };
  
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  });
  
  self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const notificationData = event.notification.data;
  
    if (notificationData) {
      clients.openWindow(notificationData);
    }
  });
  