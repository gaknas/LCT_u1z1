import { ScaleHelper } from '../utils/ScaleHelper.js';
import { SCALE_CONFIG, GAME_CONFIG, TEXT_SCALE_CONFIG } from '../config/GameConfig.js';

export class Game extends Phaser.Scene {
    constructor() {
        super('Game');
        this.score = 0;
        this.lives = GAME_CONFIG.GAMEPLAY.INITIAL_LIVES;
        this.gameSpeed = 1;
        this.fallingObjects = [];
        this.spawnTimer = 0;
        this.spawnInterval = GAME_CONFIG.SPAWN.INTERVAL;
        this.targetScore = GAME_CONFIG.GAMEPLAY.CATCH_GAME_TARGET_SCORE; // Целевой счет из конфигурации
    }

    resetGameState() {
        console.log('Сброс состояния игры CatchGame');
        
        // Сбрасываем игровые параметры
        this.score = 0;
        this.lives = GAME_CONFIG.GAMEPLAY.INITIAL_LIVES;
        this.gameSpeed = 1;
        this.targetScore = GAME_CONFIG.GAMEPLAY.CATCH_GAME_TARGET_SCORE; // Сбрасываем целевой счет из конфигурации
        this.spawnTimer = 0;
        
        // Очищаем массив падающих объектов
        this.fallingObjects = [];
        
        // Очищаем группу падающих объектов, если она существует и инициализирована
        if (this.fallingObjectsGroup && this.fallingObjectsGroup.clear) {
            try {
                this.fallingObjectsGroup.clear(true, true);
                console.log('Группа падающих объектов очищена');
            } catch (error) {
                console.warn('Ошибка при очистке группы падающих объектов:', error);
            }
        } else {
            console.log('Группа падающих объектов не инициализирована, пропускаем очистку');
        }
        
        console.log('Состояние игры CatchGame сброшено');
    }

    preload() {
        // Загружаем ресурсы
        this.load.image('background', 'assets/back/back_2.png');
        this.load.image('catcher', 'assets/heroes/catch.png');
        
        // Загружаем иконки падающих предметов
        this.load.image('good1', 'assets/icons/front/1.png');
        this.load.image('good2', 'assets/icons/front/2.png'); 
        this.load.image('good3', 'assets/icons/front/3.png');
        this.load.image('good4', 'assets/icons/front/4.png');
        this.load.image('good5', 'assets/icons/front/5.png');
        this.load.image('good6', 'assets/icons/front/6.png');
        this.load.image('bad1', 'assets/icons/front/bad_1.png');
        this.load.image('bad2', 'assets/icons/front/bad_2.png');
        this.load.image('bad3', 'assets/icons/front/bad_3.png');
        this.load.image('bad4', 'assets/icons/front/bad_4.png');
        
        // Загружаем кнопки
        this.load.image('homeButton', 'assets/buttons/home_1.png');
        this.load.image('homeButtonPressed', 'assets/buttons/home_2.png');
    }

    create() {
        console.log('Создание сцены CatchGame');
        const { width, height } = this.scale;
        
        // Фон
        this.background = this.add.tileSprite(width / 2, height / 2, width, height, 'background');
        
        // Создаем площадку-ловушку
        this.catcher = this.physics.add.sprite(width / 2, height - 80, 'catcher');
        
        // Адаптивное масштабирование площадки
        ScaleHelper.adaptiveScaleWidth(this, this.catcher, 'catcher', SCALE_CONFIG.CATCHER);
        
        // Настраиваем физику для платформы
        this.catcher.setCollideWorldBounds(true);
        this.catcher.body.setImmovable(true);
        this.catcher.body.setGravityY(0); // Отключаем гравитацию для платформы
        this.catcher.body.setVelocityY(0); // Устанавливаем скорость по Y в 0
        
        // Группа для падающих объектов
        this.fallingObjectsGroup = this.physics.add.group();
        
        // Сбрасываем состояние игры после создания всех объектов
        this.resetGameState();
        
        // UI элементы
        this.createUI();
        
        // Настройка коллизий
        this.physics.add.collider(this.fallingObjectsGroup, this.catcher, this.catchObject, null, this);
        
        // Настройка сенсорного управления
        this.setupTouchControls();
        
        // Таймеры
        this.spawnTimer = this.time.now;
        
        // Обработчик изменения размера экрана
        this.scale.on('resize', () => {
            const { width: newWidth, height: newHeight } = this.scale;
            
            // Обновляем фон
            this.background.setSize(newWidth, newHeight);
            this.background.setPosition(newWidth / 2, newHeight / 2);
            
            // Пересчитываем масштабирование элементов
            ScaleHelper.adaptiveScaleWidth(this, this.catcher, 'catcher', SCALE_CONFIG.CATCHER);
            ScaleHelper.adaptiveScaleWidth(this, this.homeButton, 'homeButton', SCALE_CONFIG.HOME_BUTTON);
            
            // Обновляем позиции
            this.catcher.setPosition(newWidth / 2, newHeight - 80);
            this.homeButton.setPosition(newWidth - 50, 30);
            
            // Обновляем позиции UI текста
            this.scoreText.setPosition(20, 20);
            this.livesText.setPosition(20, 50);
        });
        
        console.log('Сцена CatchGame создана успешно');
    }

    createUI() {
        const { width, height } = this.scale;
        
        // Счет - используем адаптивный текст
        this.scoreText = ScaleHelper.createAdaptiveText(this, 20, 20, 'Счет: 0 / ' + this.targetScore, GAME_CONFIG.UI.TEXT_STYLE);
        
        // Жизни - используем адаптивный текст
        this.livesText = ScaleHelper.createAdaptiveText(this, 20, 50, `Жизни: ${GAME_CONFIG.GAMEPLAY.INITIAL_LIVES}`, GAME_CONFIG.UI.TEXT_STYLE);
        
        // Кнопка домой
        this.homeButton = this.add.image(width - 50, 30, 'homeButton')
            .setInteractive({ useHandCursor: true });
        
        // Адаптивное масштабирование кнопки домой
        ScaleHelper.adaptiveScaleWidth(this, this.homeButton, 'homeButton', SCALE_CONFIG.HOME_BUTTON);
            
        this.homeButton.on('pointerdown', () => {
            this.homeButton.setTexture('homeButtonPressed');
        });
        
        this.homeButton.on('pointerup', () => {
            this.homeButton.setTexture('homeButton');
            this.scene.start('Start');
        });
    }

    setupTouchControls() {
        const { width } = this.scale;
        
        // Обработка касаний
        this.input.on('pointerdown', (pointer) => {
            this.isDragging = true;
        });
        
        this.input.on('pointermove', (pointer) => {
            if (this.isDragging) {
                // Ограничиваем движение в пределах экрана
                const newX = Phaser.Math.Clamp(pointer.x, 50, width - 50);
                this.catcher.setX(newX);
            }
        });
        
        this.input.on('pointerup', () => {
            this.isDragging = false;
        });
    }

    update(time) {
        // Фон статичный, без прокрутки
        
        // Убеждаемся, что платформа остается на своей позиции
        const { height } = this.scale;
        if (this.catcher && this.catcher.y !== height - 80) {
            this.catcher.setY(height - 80);
            this.catcher.body.setVelocityY(0);
        }
        
        // Спавн новых объектов
        if (time - this.spawnTimer > this.spawnInterval) {
            this.spawnFallingObject();
            this.spawnTimer = time;
        }
        
        // Обновляем падающие объекты
        this.fallingObjectsGroup.children.entries.forEach(obj => {
            if (obj.y > this.scale.height) {
                // Объект упал за экран
                if (!obj.isBad) {
                    // Если это был хороший объект, теряем жизнь
                    this.loseLife();
                }
                obj.destroy();
            }
        });
        
        // Увеличиваем скорость игры со временем
        this.gameSpeed = 1 + (this.score * GAME_CONFIG.GAMEPLAY.SPEED_INCREASE_FACTOR);
    }

    spawnFallingObject() {
        const { width } = this.scale;
        const x = Phaser.Math.Between(50, width - 50);
        
        // Шанс плохого объекта из конфигурации
        const isBad = Math.random() < GAME_CONFIG.SPAWN.BAD_OBJECT_CHANCE;
        let textureKey;
        
        if (isBad) {
            const badTextures = ['bad1', 'bad2', 'bad3', 'bad4'];
            textureKey = Phaser.Utils.Array.GetRandom(badTextures);
        } else {
            const goodTextures = ['good1', 'good2', 'good3', 'good4', 'good5', 'good6'];
            textureKey = Phaser.Utils.Array.GetRandom(goodTextures);
        }
        
        // Создаем объект с физикой
        const obj = this.physics.add.sprite(x, -50, textureKey);
        
        // Адаптивное масштабирование в зависимости от размера экрана
        ScaleHelper.adaptiveScale(this, obj, textureKey, SCALE_CONFIG.FALLING_OBJECTS);
        
        obj.isBad = isBad;
        
        // Настраиваем физику для падения
        obj.body.setGravityY(GAME_CONFIG.PHYSICS.GRAVITY_Y * this.gameSpeed * GAME_CONFIG.PHYSICS.FALLING_OBJECT_GRAVITY_MULTIPLIER);
        obj.body.setVelocityY(GAME_CONFIG.PHYSICS.GRAVITY_Y * this.gameSpeed * GAME_CONFIG.PHYSICS.FALLING_OBJECT_VELOCITY_MULTIPLIER);
        
        // Добавляем в группу
        this.fallingObjectsGroup.add(obj);
    }

    catchObject(catcher, fallingObject) {
        if (fallingObject.isBad) {
            // Поймали плохой объект - теряем жизнь
            this.loseLife();
        } else {
            // Поймали хороший объект - получаем очки
            this.score += GAME_CONFIG.GAMEPLAY.POINTS_PER_GOOD_OBJECT;
            this.scoreText.setText('Счет: ' + this.score + ' / ' + this.targetScore);
            
            // Проверяем, достигли ли целевого счета для перехода на следующий уровень
            if (this.score >= this.targetScore) {
                this.levelComplete();
            }
        }
        
        // Эффект при ловле
        this.createCatchEffect(fallingObject.x, fallingObject.y);
        
        fallingObject.destroy();
    }

    createCatchEffect(x, y) {
        // Создаем эффект частиц при ловле объекта
        const particles = this.add.particles(x, y, 'good1', {
            speed: { min: 50, max: 100 },
            scale: { start: 0.3, end: 0 },
            lifespan: 300
        });
        
        particles.explode(10);
        
        // Удаляем эффект через 1 секунду
        this.time.delayedCall(1000, () => {
            particles.destroy();
        });
    }

    loseLife() {
        this.lives--;
        this.livesText.setText('Жизни: ' + this.lives);
        
        if (this.lives <= 0) {
            this.gameOver();
        }
    }

    restartGame() {
        console.log('Перезапуск игры CatchGame');
        
        // Сбрасываем состояние
        this.resetGameState();
        
        // Обновляем UI
        if (this.scoreText) {
            this.scoreText.setText('Счет: 0 / ' + this.targetScore);
        }
        if (this.livesText) {
            this.livesText.setText('Жизни: ' + this.lives);
        }
        
        // Перезапускаем текущую игру
        this.scene.restart();
    }

    levelComplete() {
        console.log('Уровень завершен! Счет:', this.score, 'Цель:', this.targetScore);
        
        
        this.goToNextLevel();
       
    }

    goToNextLevel() {
        console.log('Переход на следующий уровень');
        
        // Определяем текущую игру
        const currentGame = 'Game';
        const otherGame = 'Match3';
        
        // 70% вероятность выбрать другую игру
        const shouldSwitchGame = Math.random() < 0.7;
        
        let nextGame;
        if (shouldSwitchGame) {
            nextGame = otherGame;
            console.log('Выбираем другую игру (70% вероятность)');
        } else {
            nextGame = currentGame;
            console.log('Остаемся в той же игре (30% вероятность)');
        }
        
        console.log('Текущая игра:', currentGame, 'Следующая игра:', nextGame);
        
        // Переходим к экрану завершения уровня
        this.scene.start('LevelComplete', {
            score: this.score,
            targetScore: this.targetScore,
            nextGame: nextGame
        });
    }

    gameOver() {
        const { width, height } = this.scale;
        
        // Останавливаем игру
        this.physics.pause();
        
        // Показываем экран окончания игры - используем адаптивный текст
        const gameOverText = ScaleHelper.createAdaptiveText(this, width / 2, height / 2, 'Игра окончена!\nСчет: ' + this.score, GAME_CONFIG.UI.TITLE_TEXT_STYLE).setOrigin(0.5);
        
        // Кнопка "Играть снова" - используем адаптивный текст
        const restartButtonStyle = {
            fontSize: 24,
            fill: '#ffff00',
            fontFamily: 'Gazprombank Sans, Arial, sans-serif',
            fontWeight: '600'
        };
        const restartButton = ScaleHelper.createAdaptiveText(this, width / 2, height / 2 + 100, 'Играть снова', restartButtonStyle).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        restartButton.on('pointerdown', () => {
            this.scene.restart();
        });
    }
}
