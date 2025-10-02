// Конфигурация размеров для автоматического масштабирования
export const SCALE_CONFIG = {
    // Размеры для падающих объектов (адаптивные)
    FALLING_OBJECTS: {
        MAX_SIZE_PERCENT: 0.12, // 12% от ширины экрана
        MIN_SIZE: 25,
        MAX_SIZE: 70,
        FALLBACK_SCALE: 0.5
    },
    
    // Размеры для площадки-ловушки (адаптивные)
    CATCHER: {
        MAX_WIDTH_PERCENT: 0.25, // 25% от ширины экрана
        MIN_WIDTH: 70,
        MAX_WIDTH: 130,
        FALLBACK_SCALE: 0.7
    },
    
    // Размеры для кнопок в стартовом меню (адаптивные)
    START_BUTTONS: {
        MAX_WIDTH_PERCENT: 0.35, // 35% от ширины экрана
        MIN_WIDTH: 90,
        MAX_WIDTH: 180,
        FALLBACK_SCALE: 0.5
    },
    
    // Размеры для кнопки домой в игре (адаптивные)
    HOME_BUTTON: {
        MAX_WIDTH_PERCENT: 0.12, // 12% от ширины экрана
        MIN_WIDTH: 35,
        MAX_WIDTH: 70,
        FALLBACK_SCALE: 0.5
    },
    
    // Размеры для логотипа (адаптивные)
    LOGO: {
        MAX_WIDTH_PERCENT: 0.75, // 75% от ширины экрана
        MIN_WIDTH: 180,
        MAX_WIDTH: 350,
        FALLBACK_SCALE: 0.5
    },
    
    // Размеры для драгоценных камней в игре "три в ряд"
    MATCH3_GEMS: {
        MAX_SIZE_PERCENT: 0.1, // 10% от ширины экрана
        MIN_SIZE: 25,
        MAX_SIZE: 50,
        FALLBACK_SCALE: 0.08
    },
    
    // Размеры для кнопок ответов в ситуациях
    ANSWER_BUTTONS: {
        MAX_WIDTH_PERCENT: 0.9,
        MIN_WIDTH: 280,
        MAX_WIDTH: 400,
        HEIGHT_PERCENT: 0.08,
        MIN_HEIGHT: 50,
        MAX_HEIGHT: 80
    }
};

// Адаптивные размеры текста в зависимости от разрешения экрана
export const TEXT_SCALE_CONFIG = {
    BASE_WIDTH: 375,
    BASE_HEIGHT: 667,
    
    // Коэффициенты масштабирования
    getScaleFactor: function(screenWidth, screenHeight) {
        const widthScale = screenWidth / this.BASE_WIDTH;
        const heightScale = screenHeight / this.BASE_HEIGHT;
        // Используем минимальный коэффициент для сохранения пропорций
        return Math.min(widthScale, heightScale, 1.5); // Ограничиваем максимальное увеличение
    },
    
    // Адаптивные размеры шрифтов
    getFontSize: function(baseSize, screenWidth, screenHeight) {
        const scaleFactor = this.getScaleFactor(screenWidth, screenHeight);
        const scaledSize = Math.round(baseSize * scaleFactor);
        // Ограничиваем размеры для читаемости
        return Math.max(12, Math.min(scaledSize, baseSize * 1.5));
    }
};

// Игровые настройки
export const GAME_CONFIG = {
    // Физика
    PHYSICS: {
        GRAVITY_Y: 300,
        FALLING_OBJECT_GRAVITY_MULTIPLIER: 1.2,
        FALLING_OBJECT_VELOCITY_MULTIPLIER: 0.4
    },
    
    // Спавн объектов
    SPAWN: {
        INTERVAL: 600,
        BAD_OBJECT_CHANCE: 0.4
    },
    
    // Игровая механика
    GAMEPLAY: {
        INITIAL_LIVES: 3,
        POINTS_PER_GOOD_OBJECT: 10,
        SPEED_INCREASE_FACTOR: 0.01,
        RESTART_SCORE: 50,
        CATCH_GAME_TARGET_SCORE: 500, // Целевой счет для игры "Ловля предметов"
        MATCH3_TARGET_SCORE: 500 // Целевой счет для игры "Три в ряд"
    },
    
    UI: {
        TEXT_STYLE: {
            fontSize: 24,
            fill: '#ffffff',
            fontFamily: 'Gazprombank Sans, Arial, sans-serif',
            fontWeight: '400'
        },
        TITLE_TEXT_STYLE: {
            fontSize: 32,
            fill: '#ffffff',
            fontFamily: 'Gazprombank Sans, Arial, sans-serif',
            fontWeight: '700',
            align: 'center'
        },
        BUTTON_TEXT_STYLE: {
            fontSize: 18,
            fill: '#000000',
            fontFamily: 'Gazprombank Sans, Arial, sans-serif',
            fontWeight: '600',
            align: 'center'
        },
        SITUATION_TITLE_STYLE: {
            fontSize: 24,
            fill: '#ffffff',
            fontFamily: 'Gazprombank Sans, Arial, sans-serif',
            fontWeight: '700',
            align: 'center'
        },
        SITUATION_TEXT_STYLE: {
            fontSize: 16,
            fill: '#ffffff',
            fontFamily: 'Gazprombank Sans, Arial, sans-serif',
            fontWeight: '400',
            align: 'center'
        },
        RESULT_TEXT_STYLE: {
            fontSize: 28,
            fill: '#00ff00',
            fontFamily: 'Gazprombank Sans, Arial, sans-serif',
            fontWeight: '700',
            align: 'center'
        }
    }
};
