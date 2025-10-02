import { ScaleHelper } from '../utils/ScaleHelper.js';
import { SCALE_CONFIG, GAME_CONFIG, TEXT_SCALE_CONFIG } from '../config/GameConfig.js';

export class Situation extends Phaser.Scene {
    constructor() {
        super('Situation');
        this.situationData = null;
        this.situationNumber = 1;
        this.answerButtons = [];
        this.resultText = null;
        this.continueButton = null;
        this.isAnswerSelected = false;
        this.textBackground = null;
        this.titleText = null;
        this.problemText = null;
        this.isResizing = false;
    }

    init(data) {
        // Получаем номер ситуации из данных сцены
        this.situationNumber = data.situationNumber || 1;
        this.nextGame = data.nextGame || 'Match3';
    }

    preload() {
        // Загружаем случайное изображение фона с уникальным ключом
        const backgroundKey = `situationBackground_${this.situationNumber}`;
        console.log(`Загружаем ситуацию ${this.situationNumber}:`, backgroundKey);
        this.load.image(backgroundKey, `assets/situations/situatins_pics/fon_${this.situationNumber}.png`);
        
        // Загружаем кнопки
        this.load.image('homeButton', 'assets/buttons/home_1.png');
        this.load.image('homeButtonPressed', 'assets/buttons/home_2.png');
    }

    create() {
        const { width, height } = this.scale;
        
        // Очищаем предыдущее состояние
        this.clearScene();
        
        // Фон с правильным ключом
        const backgroundKey = `situationBackground_${this.situationNumber}`;
        console.log(`Создаем фон с ключом:`, backgroundKey);
        this.background = this.add.image(width / 2, height / 2, backgroundKey);
        this.background.setDisplaySize(width, height);
        
        // Загружаем данные ситуации
        this.loadSituationData();
        
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

    loadSituationData() {
        // Загружаем данные ситуации из файла
        this.load.text(`situation_${this.situationNumber}`, `assets/situations/situatins_text/sit_${this.situationNumber}.txt`);
        
        this.load.once('complete', () => {
            this.parseSituationData();
        });
        
        this.load.start();
    }

    parseSituationData() {
        const textData = this.cache.text.get(`situation_${this.situationNumber}`);
        const lines = textData.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length < 3) {
            console.error('Недостаточно данных в файле ситуации');
            return;
        }
        
        const title = lines[0].replace(/«|»/g, ''); // Убираем кавычки
        
        // Ищем описание проблемы (может быть на разных строках)
        let problem = '';
        let answerStartIndex = 1;
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            // Если строка начинается с True/False, значит это ответ
            if (line.match(/^(True|False)\s+\d+\)/)) {
                answerStartIndex = i;
                break;
            }
            // Иначе это часть описания проблемы
            if (problem) {
                problem += ' ' + line;
            } else {
                problem = line;
            }
        }
        
        const answers = [];
        
        // Парсим ответы
        for (let i = answerStartIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
                const match = line.match(/^(True|False)\s+\d+\)\s+(.+)$/);
                if (match) {
                    answers.push({
                        text: match[2],
                        isCorrect: match[1] === 'True'
                    });
                }
            }
        }
        
        this.situationData = {
            title: title,
            problem: problem,
            answers: answers
        };
        
        // Создаем UI после загрузки данных
        this.createUI();
    }

    clearScene() {
        // Сбрасываем состояние
        this.isAnswerSelected = false;
        this.situationData = null;
        
        // Удаляем обработчик resize
        this.scale.off('resize');
        
        // Очищаем UI элементы
        if (this.textBackground) {
            this.textBackground.destroy();
            this.textBackground = null;
        }
        if (this.titleText) {
            this.titleText.destroy();
            this.titleText = null;
        }
        if (this.problemText) {
            this.problemText.destroy();
            this.problemText = null;
        }
        if (this.resultText) {
            this.resultText.destroy();
            this.resultText = null;
        }
        if (this.continueButton) {
            this.continueButton.destroy();
            this.continueButton = null;
        }
        if (this.homeButton) {
            this.homeButton.destroy();
            this.homeButton = null;
        }
        if (this.background) {
            this.background.destroy();
            this.background = null;
        }
        
        // Очищаем кнопки ответов
        this.answerButtons.forEach(buttonData => {
            if (buttonData.button) {
                buttonData.button.destroy();
            }
            if (buttonData.text) {
                buttonData.text.destroy();
            }
        });
        this.answerButtons = [];
        
        // Очищаем кэш изображений ситуаций (оставляем только текущее)
        for (let i = 1; i <= 9; i++) {
            if (i !== this.situationNumber) {
                const key = `situationBackground_${i}`;
                if (this.textures.exists(key)) {
                    this.textures.remove(key);
                }
            }
        }
    }

    createUI() {
        if (!this.situationData) {
            console.error('Данные ситуации не загружены');
            return;
        }
        
        const { width, height } = this.scale;
        
        // Полупрозрачный фон для текста
        this.textBackground = this.add.rectangle(width / 2, height / 2, width * 0.95, height * 0.85, 0x000000, 0.8);
        this.textBackground.setStrokeStyle(2, 0xffffff);
        
        // Заголовок - используем адаптивный текст
        const titleStyle = {
            ...GAME_CONFIG.UI.SITUATION_TITLE_STYLE,
            wordWrap: { width: width * 0.85 },
            align: 'center'
        };
        this.titleText = ScaleHelper.createAdaptiveText(this, width / 2, height * 0.15, this.situationData.title, titleStyle).setOrigin(0.5);
        
        // Описание проблемы - используем адаптивный текст
        const problemStyle = {
            ...GAME_CONFIG.UI.SITUATION_TEXT_STYLE,
            wordWrap: { 
                width: width * 0.85,
                useAdvancedWrap: true
            },
            align: 'center'
        };
        this.problemText = ScaleHelper.createAdaptiveText(this, width / 2, height * 0.3, this.situationData.problem, problemStyle).setOrigin(0.5);
        
        // Создаем кнопки ответов
        this.createAnswerButtons();
        
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
    }

    createAnswerButtons() {
        const { width, height } = this.scale;
        const buttonWidth = width * 0.9;
        const buttonHeight = 70;
        const buttonSpacing = 15;
        
        // Позиционируем кнопки вертикально по центру
        const startX = width / 2;
        const startY = height * 0.5;
        
        this.answerButtons = [];
        
        this.situationData.answers.forEach((answer, index) => {
            const y = startY + index * (buttonHeight + buttonSpacing);
            
            // Создаем кнопку
            const button = this.add.rectangle(startX, y, buttonWidth, buttonHeight, 0xffffff, 1);
            button.setStrokeStyle(3, 0x000000);
            button.setInteractive({ useHandCursor: true });
            
            // Определяем базовый размер шрифта в зависимости от длины текста
            let baseFontSize = 16;
            if (answer.text.length > 150) {
                baseFontSize = 12;
            } else if (answer.text.length > 100) {
                baseFontSize = 14;
            }
            
            // Текст кнопки - используем адаптивный текст
            const buttonTextStyle = {
                fontSize: baseFontSize,
                fill: '#000000',
                fontFamily: 'Gazprombank Sans, Arial, sans-serif',
                fontWeight: '600',
                wordWrap: { 
                    width: buttonWidth - 20,
                    useAdvancedWrap: true
                },
                align: 'center'
            };
            const buttonText = ScaleHelper.createAdaptiveText(this, startX, y, answer.text, buttonTextStyle).setOrigin(0.5);
            
            // Проверяем, помещается ли текст в кнопку
            const textBounds = buttonText.getBounds();
            if (textBounds.height > buttonHeight - 10) {
                // Если текст не помещается, уменьшаем размер шрифта еще больше
                let newFontSize = baseFontSize - 2;
                if (newFontSize < 10) newFontSize = 10;
                const adjustedStyle = {
                    ...buttonTextStyle,
                    fontSize: newFontSize
                };
                ScaleHelper.updateTextStyle(this, buttonText, adjustedStyle);
            }
            
            // Обработчик клика
            button.on('pointerdown', () => {
                if (!this.isAnswerSelected) {
                    this.selectAnswer(index, answer);
                }
            });
            
            // Эффект наведения
            button.on('pointerover', () => {
                if (!this.isAnswerSelected) {
                    button.setFillStyle(0xf0f0f0);
                }
            });
            
            button.on('pointerout', () => {
                if (!this.isAnswerSelected) {
                    button.setFillStyle(0xffffff);
                }
            });
            
            this.answerButtons.push({ button, text: buttonText, answer });
        });
    }

    selectAnswer(buttonIndex, answer) {
        this.isAnswerSelected = true;
        
        // Подсвечиваем выбранную кнопку
        const selectedButton = this.answerButtons[buttonIndex];
        selectedButton.button.setFillStyle(answer.isCorrect ? 0x90EE90 : 0xFFB6C1);
        
        // Показываем результат
        this.showResult(answer.isCorrect);
    }

    showResult(isCorrect) {
        const { width, height } = this.scale;
        
        // Текст результата - используем адаптивный текст
        const resultStyle = {
            fontSize: 28,
            fill: isCorrect ? '#00ff00' : '#ff0000',
            fontFamily: 'Gazprombank Sans, Arial, sans-serif',
            fontWeight: '700',
            stroke: '#000000',
            strokeThickness: 2
        };
        this.resultText = ScaleHelper.createAdaptiveText(this, width / 2, height * 0.75, 
            isCorrect ? 'Правильно!' : 'Неправильно!', resultStyle).setOrigin(0.5);
        
        // Кнопка продолжения - используем адаптивный текст
        const continueStyle = {
            fontSize: 22,
            fill: '#ffff00',
            fontFamily: 'Gazprombank Sans, Arial, sans-serif',
            fontWeight: '700',
            stroke: '#000000',
            strokeThickness: 2
        };
        this.continueButton = ScaleHelper.createAdaptiveText(this, width / 2, height * 0.85, 'Продолжить', continueStyle).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        this.continueButton.on('pointerdown', () => {
            this.goToNextLevel();
        });
        
        // Эффект наведения для кнопки продолжения
        this.continueButton.on('pointerover', () => {
            this.continueButton.setFillStyle('#ffffff');
        });
        
        this.continueButton.on('pointerout', () => {
            this.continueButton.setFillStyle('#ffff00');
        });
    }

    goToNextLevel() {
        console.log('Переход к следующему уровню:', this.nextGame);
        
        // Проверяем, что сцена существует
        if (this.scene.manager.getScene(this.nextGame)) {
            this.scene.start(this.nextGame);
        } else {
            console.error('Сцена не найдена:', this.nextGame);
            this.scene.start('Start');
        }
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
            
            // Обновляем позицию кнопки домой
            if (this.homeButton && this.homeButton.active) {
                this.homeButton.setPosition(newWidth - 50, 30);
            }
            
            // Обновляем фоновый блок
            if (this.textBackground && this.textBackground.active) {
                this.textBackground.setSize(newWidth * 0.95, newHeight * 0.85);
                this.textBackground.setPosition(newWidth / 2, newHeight / 2);
            }
            
            // Обновляем позиции текста
            if (this.titleText && this.titleText.active) {
                this.titleText.setPosition(newWidth / 2, newHeight * 0.15);
                this.titleText.setWordWrapWidth(newWidth * 0.85);
            }
            
            if (this.problemText && this.problemText.active) {
                this.problemText.setPosition(newWidth / 2, newHeight * 0.3);
                this.problemText.setWordWrapWidth(newWidth * 0.85);
            }
            
            // Обновляем кнопки ответов
            this.answerButtons.forEach((buttonData, index) => {
                if (buttonData.button && buttonData.button.active && 
                    buttonData.text && buttonData.text.active) {
                    const buttonWidth = newWidth * 0.9;
                    const buttonHeight = 70;
                    const buttonSpacing = 15;
                    const startY = newHeight * 0.5;
                    
                    const y = startY + index * (buttonHeight + buttonSpacing);
                    
                    buttonData.button.setSize(buttonWidth, buttonHeight);
                    buttonData.button.setPosition(newWidth / 2, y);
                    
                    buttonData.text.setPosition(newWidth / 2, y);
                    buttonData.text.setWordWrapWidth(buttonWidth - 20);
                }
            });
        } catch (error) {
            console.warn('Ошибка при изменении размера:', error);
        }
    }

    destroy() {
        // Удаляем обработчик resize при уничтожении сцены
        this.scale.off('resize');
        super.destroy();
    }
}
