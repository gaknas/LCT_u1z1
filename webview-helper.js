// WebView Helper для улучшения совместимости с мобильными приложениями
(function() {
    'use strict';
    
    // Предотвращаем зум при двойном касании
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function (event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
    
    // Предотвращаем контекстное меню на длинном нажатии
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });
    
    // Предотвращаем выделение текста
    document.addEventListener('selectstart', function(e) {
        e.preventDefault();
    });
    
    // Обработка изменения ориентации
    window.addEventListener('orientationchange', function() {
        setTimeout(function() {
            // Принудительно обновляем размеры после изменения ориентации
            if (window.game && window.game.scale) {
                window.game.scale.refresh();
            }
        }, 100);
    });
    
    // Обработка изменения размера окна
    window.addEventListener('resize', function() {
        if (window.game && window.game.scale) {
            window.game.scale.refresh();
        }
    });
    
    // Уведомляем WebView о готовности
    if (window.Android && window.Android.onPageFinished) {
        window.Android.onPageFinished();
    }
    
    // Уведомляем iOS WebView о готовности
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.onPageFinished) {
        window.webkit.messageHandlers.onPageFinished.postMessage({});
    }
    
})();
