import { ScaleHelper } from '../utils/ScaleHelper.js';
import { SCALE_CONFIG, GAME_CONFIG, TEXT_SCALE_CONFIG } from '../config/GameConfig.js';

export class LevelComplete extends Phaser.Scene {
    constructor() {
        super('LevelComplete');
        this.score = 0;
        this.targetScore = 0;
        this.nextGame = 'Match3';
        this.isResizing = false;
    }

    init(data) {
        this.score = data.score || 0;
        this.targetScore = data.targetScore || 0;
        this.nextGame = data.nextGame || 'Match3';
    }

    preload() {
        // Загружаем фон
        this.load.image('background', 'assets/back/back_2.png');
        
        // Загружаем кнопки
        this.load.image('homeButton', 'assets/buttons/home_1.png');
        this.load.image('homeButtonPressed', 'assets/buttons/home_2.png');
    }

    create() {
        const { width, height } = this.scale;
        
        // Фон
        this.background = this.add.image(width / 2, height / 2, 'background');
        this.background.setDisplaySize(width, height);
        
        // Полупрозрачный фон для текста
        this.textBackground = this.add.rectangle(width / 2, height / 2, width * 0.9, height * 0.7, 0x000000, 0.8);
        this.textBackground.setStrokeStyle(3, 0x00ff00);
        
        // Заголовок - используем адаптивный текст
        const titleStyle = {
            fontSize: 32,
            fill: '#00ff00',
            fontFamily: 'Gazprombank Sans, Arial, sans-serif',
            fontWeight: '700',
            stroke: '#000000',
            strokeThickness: 3
        };
        this.titleText = ScaleHelper.createAdaptiveText(this, width / 2, height * 0.3, 'Уровень завершен!', titleStyle).setOrigin(0.5);
        
        // Счет - используем адаптивный текст
        const scoreStyle = {
            fontSize: 24,
            fill: '#ffffff',
            fontFamily: 'Gazprombank Sans, Arial, sans-serif',
            fontWeight: '700',
            stroke: '#000000',
            strokeThickness: 2
        };
        this.scoreText = ScaleHelper.createAdaptiveText(this, width / 2, height * 0.4, `Счет: ${this.score} / ${this.targetScore}`, scoreStyle).setOrigin(0.5);
        
        // Сообщение о достижении цели - используем адаптивный текст
        const messageStyle = {
            fontSize: 20,
            fill: '#ffff00',
            fontFamily: 'Gazprombank Sans, Arial, sans-serif',
            fontWeight: '700',
            stroke: '#000000',
            strokeThickness: 2
        };
        this.messageText = ScaleHelper.createAdaptiveText(this, width / 2, height * 0.5, 'Отлично! Вы достигли цели!', messageStyle).setOrigin(0.5);
        
        // Кнопка продолжения - используем адаптивный текст
        const continueStyle = {
            fontSize: 28,
            fill: '#ffff00',
            fontFamily: 'Gazprombank Sans, Arial, sans-serif',
            fontWeight: '700',
            stroke: '#000000',
            strokeThickness: 3
        };
        this.continueButton = ScaleHelper.createAdaptiveText(this, width / 2, height * 0.65, 'Продолжить', continueStyle).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        // Создаем прямоугольник для кнопки
        this.buttonBackground = this.add.rectangle(width / 2, height * 0.65, 200, 60, 0x4CAF50, 1);
        this.buttonBackground.setStrokeStyle(3, 0x000000);
        this.buttonBackground.setInteractive({ useHandCursor: true });
        
        // Перемещаем текст кнопки на передний план
        this.continueButton.setDepth(1);
        
        // Обработчики для кнопки продолжения
        this.continueButton.on('pointerdown', () => {
            this.goToSituation();
        });
        
        this.buttonBackground.on('pointerdown', () => {
            this.goToSituation();
        });
        
        // Эффекты наведения
        this.continueButton.on('pointerover', () => {
            this.buttonBackground.setFillStyle(0x45a049);
            this.continueButton.setFillStyle('#ffffff');
        });
        
        this.continueButton.on('pointerout', () => {
            this.buttonBackground.setFillStyle(0x4CAF50);
            this.continueButton.setFillStyle('#ffff00');
        });
        
        this.buttonBackground.on('pointerover', () => {
            this.buttonBackground.setFillStyle(0x45a049);
            this.continueButton.setFillStyle('#ffffff');
        });
        
        this.buttonBackground.on('pointerout', () => {
            this.buttonBackground.setFillStyle(0x4CAF50);
            this.continueButton.setFillStyle('#ffff00');
        });
        
        // Кнопка домой
        this.homeButton = this.add.image(width - 50, 30, 'homeButton')
            .setInteractive({ useHandCursor: true });
        
        ScaleHelper.adaptiveScaleWidth(this, this.homeButton, 'homeButton', SCALE_CONFIG.HOME_BUTTON);
        
        this.homeButton.on('pointerdown', () => {
            this.homeButton.setTexture('homeButtonPressed');
        });
        
        this.homeButton.on('pointerup', () => {
            this.homeButton.setTexture('homeButton');
            this.scene.start('Start');
        });
        
        // Обработчик изменения размера экрана с защитой от множественных вызовов
        this.scale.on('resize', () => {
            if (!this.isResizing) {
                this.isResizing = true;
                this.time.delayedCall(100, () => {
                    this.handleResize();
                    this.isResizing = false;
                });
            }
        });
    }

    goToSituation() {
        console.log('Переход к сцене ситуаций');
        
        // Выбираем случайную ситуацию (1-9)
        const situationNumber = Math.floor(Math.random() * 9) + 1;
        
        // Переходим к сцене ситуации
        this.scene.start('Situation', {
            situationNumber: situationNumber,
            nextGame: this.nextGame
        });
    }

    handleResize() {
        if (!this.scene || !this.scene.isActive()) {
            return; // Сцена не активна, не обновляем
        }
        
        const { width: newWidth, height: newHeight } = this.scale;
        
        try {
            // Обновляем фон
            if (this.background && this.background.active) {
                this.background.setDisplaySize(newWidth, newHeight);
                this.background.setPosition(newWidth / 2, newHeight / 2);
            }
            
            // Обновляем фоновый блок
            if (this.textBackground && this.textBackground.active) {
                this.textBackground.setSize(newWidth * 0.9, newHeight * 0.7);
                this.textBackground.setPosition(newWidth / 2, newHeight / 2);
            }
            
            // Обновляем позиции текста
            if (this.titleText && this.titleText.active) {
                this.titleText.setPosition(newWidth / 2, newHeight * 0.3);
            }
            
            if (this.scoreText && this.scoreText.active) {
                this.scoreText.setPosition(newWidth / 2, newHeight * 0.4);
            }
            
            if (this.messageText && this.messageText.active) {
                this.messageText.setPosition(newWidth / 2, newHeight * 0.5);
            }
            
            // Обновляем кнопку продолжения
            if (this.continueButton && this.continueButton.active && 
                this.buttonBackground && this.buttonBackground.active) {
                this.continueButton.setPosition(newWidth / 2, newHeight * 0.65);
                this.buttonBackground.setPosition(newWidth / 2, newHeight * 0.65);
            }
            
            // Обновляем позицию кнопки домой
            if (this.homeButton && this.homeButton.active) {
                this.homeButton.setPosition(newWidth - 50, 30);
            }
        } catch (error) {
            console.warn('Ошибка при изменении размера LevelComplete:', error);
        }
    }

    destroy() {
        // Удаляем обработчик resize при уничтожении сцены
        this.scale.off('resize');
        super.destroy();
    }
}
