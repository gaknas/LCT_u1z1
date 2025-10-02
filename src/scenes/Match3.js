import { ScaleHelper } from '../utils/ScaleHelper.js';
import { SCALE_CONFIG, GAME_CONFIG, TEXT_SCALE_CONFIG } from '../config/GameConfig.js';

export class Match3 extends Phaser.Scene {
    constructor() {
        super('Match3');
        this.score = 0;
        this.moves = 30; // Количество ходов
        this.targetScore = GAME_CONFIG.GAMEPLAY.MATCH3_TARGET_SCORE; // Целевой счет из конфигурации
        this.board = []; // Двумерный массив с типами драгоценных камней
        this.boardWidth = 7;
        this.boardHeight = 8;
        this.cellSize = 0;
        this.boardX = 0;
        this.boardY = 0;
        this.selectedElement = null; // {row, col}
        this.isAnimating = false;
        this.gemTypes = 7; // Количество типов драгоценных камней
        this.gemSprites = []; // Двумерный массив со спрайтами
        this.lastAnimationTime = 0; // Время последней анимации
    }

    preload() {
        // Загружаем фон
        this.load.image('background', 'assets/back/back_2.png');
        
        // Загружаем иконки драгоценных камней
        for (let i = 1; i <= this.gemTypes; i++) {
            this.load.image(`gem${i}`, `assets/tri_v_rad/front/${i}.png`);
        }
        
        // Загружаем кнопки
        this.load.image('homeButton', 'assets/buttons/home_1.png');
        this.load.image('homeButtonPressed', 'assets/buttons/home_2.png');
    }

    create() {
        const { width, height } = this.scale;
        
        // Сбрасываем состояние игры при создании
        this.resetGameState();
        
        // Фон
        this.background = this.add.tileSprite(width / 2, height / 2, width, height, 'background');
        
        // Вычисляем размеры игрового поля
        this.cellSize = Math.min(width * 0.12, height * 0.12);
        this.boardX = (width - this.boardWidth * this.cellSize) / 2;
        this.boardY = (height - this.boardHeight * this.cellSize) / 2 + 20;
        
        // Создаем игровое поле
        this.initializeBoard();
        
        // UI элементы
        this.createUI();
        
        // Обработчик изменения размера экрана
        this.scale.on('resize', () => {
            this.handleResize();
        });
    }

    resetGameState() {
        console.log('Сброс состояния игры');
        
        // Сбрасываем игровые параметры
        this.score = 0;
        this.moves = 30;
        this.targetScore = GAME_CONFIG.GAMEPLAY.MATCH3_TARGET_SCORE; // Сбрасываем целевой счет из конфигурации
        this.selectedElement = null;
        this.isAnimating = false;
        this.lastAnimationTime = 0;
        
        // Очищаем доску
        this.board = [];
        this.gemSprites = [];
        
        // Останавливаем все анимации
        if (this.tweens) {
            this.tweens.killAll();
        }
        
        console.log('Состояние игры сброшено');
    }

    restartGameWithZeroScore() {
        console.log('Перезапуск игры с нулевыми очками');
        
        // Полностью перезапускаем сцену, что автоматически сбросит все параметры
        this.scene.restart();
    }

    initializeBoard() {
        // Инициализируем пустое поле
        this.board = [];
        this.gemSprites = [];
        
        for (let row = 0; row < this.boardHeight; row++) {
            this.board[row] = [];
            this.gemSprites[row] = [];
            for (let col = 0; col < this.boardWidth; col++) {
                this.board[row][col] = 0;
                this.gemSprites[row][col] = null;
            }
        }
        
        // Заполняем поле случайными драгоценными камнями
        this.fillBoardRandomly();
        this.removeInitialMatches();
        this.createGemSprites();
    }

    fillBoardRandomly() {
        for (let row = 0; row < this.boardHeight; row++) {
            for (let col = 0; col < this.boardWidth; col++) {
                if (this.board[row][col] === 0) {
                    this.board[row][col] = this.getRandomGemType(row, col);
                }
            }
        }
    }

    getRandomGemType(row, col) {
        const validTypes = [];
        
        for (let type = 1; type <= this.gemTypes; type++) {
            if (!this.wouldCreateMatch(row, col, type)) {
                validTypes.push(type);
            }
        }
        
        if (validTypes.length === 0) {
        return Math.floor(Math.random() * this.gemTypes) + 1;
        }
        
        return validTypes[Math.floor(Math.random() * validTypes.length)];
    }

    wouldCreateMatch(row, col, type) {
        // Проверяем горизонтальные совпадения
        let horizontalCount = 1;
        
        // Проверяем влево
        for (let c = col - 1; c >= 0 && this.board[row][c] === type; c--) {
            horizontalCount++;
        }
        
        // Проверяем вправо
        for (let c = col + 1; c < this.boardWidth && this.board[row][c] === type; c++) {
            horizontalCount++;
        }
        
        if (horizontalCount >= 3) {
            return true;
        }
        
        // Проверяем вертикальные совпадения
        let verticalCount = 1;
        
        // Проверяем вверх
        for (let r = row - 1; r >= 0 && this.board[r][col] === type; r--) {
            verticalCount++;
        }
        
        // Проверяем вниз
        for (let r = row + 1; r < this.boardHeight && this.board[r][col] === type; r++) {
            verticalCount++;
        }
        
        return verticalCount >= 3;
    }

    removeInitialMatches() {
        let hasMatches = true;
        while (hasMatches) {
            const matches = this.findAllMatches();
            if (matches.length > 0) {
                // Заменяем совпадающие камни новыми
                matches.forEach(match => {
                    match.elements.forEach(pos => {
                        this.board[pos.row][pos.col] = this.getRandomGemType(pos.row, pos.col);
                    });
                });
            } else {
                hasMatches = false;
            }
        }
    }

    createGemSprites() {
        // Удаляем старые спрайты
        for (let row = 0; row < this.boardHeight; row++) {
            for (let col = 0; col < this.boardWidth; col++) {
                if (this.gemSprites[row][col]) {
                    this.gemSprites[row][col].destroy();
                    this.gemSprites[row][col] = null;
                }
            }
        }

        // Создаем новые спрайты
        for (let row = 0; row < this.boardHeight; row++) {
            for (let col = 0; col < this.boardWidth; col++) {
                if (this.board[row][col] > 0) {
                    this.gemSprites[row][col] = this.createGemSprite(row, col, this.board[row][col]);
                }
            }
        }
    }

    createGemSprite(row, col, gemType) {
        const worldPos = this.getWorldPosition(row, col);
        
        // Создаем спрайт
        const gem = this.add.image(worldPos.x, worldPos.y, `gem${gemType}`);
        
        // Масштабируем драгоценный камень под размер ячейки
        const scale = (this.cellSize * 0.9) / 500; // 90% от размера ячейки для отступа
        gem.setScale(scale);
        
        // Делаем спрайт интерактивным
        gem.setInteractive();
        
        // Сохраняем информацию о позиции
        gem.boardRow = row;
        gem.boardCol = col;
        gem.gemType = gemType;
        
        // Обработчик клика
        gem.on('pointerdown', () => {
            this.handleTap(row, col);
        });
        
        return gem;
    }

    handleTap(row, col) {
        console.log('Клик по:', row, col, 'Анимация:', this.isAnimating, 'Ходы:', this.moves, 'Выбранный элемент:', this.selectedElement);

        if (this.isAnimating || this.moves <= 0) {
            console.log('Клик игнорирован - анимация или нет ходов');
            return;
        }
        
        // Если уже выбран элемент
        if (this.selectedElement) {
            console.log('Уже выбран элемент:', this.selectedElement);
            // Проверяем, можно ли сделать ход
            const move = {
                from: this.selectedElement,
                to: { row, col }
            };
            
            if (this.tryMove(move)) {
                console.log('Ход выполнен успешно');
                this.clearSelection();
                this.isAnimating = true;
                this.lastAnimationTime = this.time.now;
                // Анимация завершается в processMatches
            } else {
                console.log('Ход невалиден');
                // Если нельзя сделать ход, показываем анимацию "отклонения"
                this.showInvalidMoveAnimation();
                this.clearSelection();
                // Небольшая задержка перед выбором нового элемента
                this.time.delayedCall(100, () => {
                    this.selectedElement = { row, col };
                    this.highlightSelectedElement();
                });
            }
        } else {
            console.log('Выбираем новый элемент');
            // Убеждаемся, что предыдущий элемент очищен
            if (this.selectedElement) {
                console.log('Очищаем предыдущий элемент перед выбором нового');
                this.clearSelection();
            }
            // Небольшая задержка перед выбором нового элемента
            this.time.delayedCall(50, () => {
                this.selectedElement = { row, col };
                this.highlightSelectedElement();
            });
        }
    }

    tryMove(move) {
        console.log('Попытка хода:', move);
        
        if (this.moves <= 0 || this.isAnimating) {
            console.log('Ход невозможен: нет ходов или идет анимация');
            return false;
        }
        
        if (!this.isValidMove(move)) {
            console.log('Ход невалиден');
            return false;
        }
        
        // Выполняем ход
        this.swapElements(move.from, move.to);
        
        // Проверяем совпадения
        const matches = this.findAllMatches();
        console.log('Найдено совпадений:', matches.length);
        
        if (matches.length === 0) {
            // Если нет совпадений, отменяем ход
            console.log('Нет совпадений, отменяем ход');
            this.swapElements(move.from, move.to);
            return false;
        }
        
        // Уменьшаем количество ходов
        this.moves--;
        console.log('Ход выполнен, осталось ходов:', this.moves);
        
        // Обрабатываем совпадения
        this.processMatches(matches);
        
        return true;
    }

    isValidMove(move) {
        if (!this.isValidPosition(move.from.row, move.from.col) ||
            !this.isValidPosition(move.to.row, move.to.col)) {
            return false;
        }
        
        // Проверяем, что элементы соседние
        const rowDiff = Math.abs(move.to.row - move.from.row);
        const colDiff = Math.abs(move.to.col - move.from.col);
        
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    isValidPosition(row, col) {
        return row >= 0 && row < this.boardHeight && col >= 0 && col < this.boardWidth;
    }

    swapElements(pos1, pos2) {
        const temp = this.board[pos1.row][pos1.col];
        this.board[pos1.row][pos1.col] = this.board[pos2.row][pos2.col];
        this.board[pos2.row][pos2.col] = temp;
        
        // Обновляем спрайты
        this.updateGemSprites();
    }

    updateGemSprites() {
        // Обновляем все спрайты в соответствии с board
        for (let row = 0; row < this.boardHeight; row++) {
            for (let col = 0; col < this.boardWidth; col++) {
                const expectedType = this.board[row][col];
                const sprite = this.gemSprites[row][col];
                
                if (expectedType === 0) {
                    // Ячейка должна быть пустой
                    if (sprite) {
                        sprite.destroy();
                        this.gemSprites[row][col] = null;
                    }
        } else {
                    // Ячейка должна содержать камень
                    if (!sprite || sprite.gemType !== expectedType) {
                        // Удаляем старый спрайт если есть
                        if (sprite) {
                            sprite.destroy();
                        }
                        // Создаем новый спрайт
                        this.gemSprites[row][col] = this.createGemSprite(row, col, expectedType);
                    } else {
                        // Обновляем позицию существующего спрайта
                        const pos = this.getWorldPosition(row, col);
                        sprite.setPosition(pos.x, pos.y);
                        sprite.boardRow = row;
                        sprite.boardCol = col;
                    }
                }
            }
        }
    }

    updateGemSpritesWithAnimation() {
        // Обновляем все спрайты в соответствии с board с анимацией
        for (let row = 0; row < this.boardHeight; row++) {
            for (let col = 0; col < this.boardWidth; col++) {
                const expectedType = this.board[row][col];
                const sprite = this.gemSprites[row][col];
                
                if (expectedType === 0) {
                    // Ячейка должна быть пустой
                    if (sprite) {
                        sprite.destroy();
                        this.gemSprites[row][col] = null;
                    }
                } else {
                    // Ячейка должна содержать камень
                    if (!sprite || sprite.gemType !== expectedType) {
                        // Удаляем старый спрайт если есть
                        if (sprite) {
                            sprite.destroy();
                        }
                        // Создаем новый спрайт
                        this.gemSprites[row][col] = this.createGemSprite(row, col, expectedType);
                        
                        // Анимация падения для новых элементов сверху
                        const startPos = this.getWorldPosition(-1, col); // Начинаем выше экрана
                        const endPos = this.getWorldPosition(row, col);
                        
                        this.gemSprites[row][col].setPosition(startPos.x, startPos.y);
                        
                        // Анимация падения - более плавная
                        this.tweens.add({
                            targets: this.gemSprites[row][col],
                            y: endPos.y,
                            duration: 600 + (row * 40), // Более длительная анимация
                            ease: 'Cubic.easeOut', // Более плавный easing
                            delay: col * 60, // Меньшая задержка между столбцами
                            onStart: () => {
                                // Добавляем тень для падающего элемента
                                this.gemSprites[row][col].setShadow(2, 2, 0x000000, 0.3, true);
                            },
                            onComplete: () => {
                                // Убираем тень когда элемент приземлился
                                this.gemSprites[row][col].clearShadow();
                }
            });
        } else {
                        // Обновляем позицию существующего спрайта с анимацией
                        const pos = this.getWorldPosition(row, col);
                        const currentPos = { x: sprite.x, y: sprite.y };
                        
                        // Если позиция изменилась, анимируем падение
                        if (Math.abs(currentPos.y - pos.y) > 5) {
            this.tweens.add({
                                targets: sprite,
                                y: pos.y,
                                duration: 300 + (row * 20), // Более плавная анимация
                                ease: 'Cubic.easeOut', // Более плавный easing
                                delay: col * 40, // Задержка для столбцов
                                onStart: () => {
                                    // Добавляем тень для падающего элемента
                                    sprite.setShadow(1, 1, 0x000000, 0.2, true);
                                },
                onComplete: () => {
                                    // Убираем тень когда элемент приземлился
                                    sprite.clearShadow();
                }
            });
        } else {
                            sprite.setPosition(pos.x, pos.y);
                        }
                        
                        sprite.boardRow = row;
                        sprite.boardCol = col;
                    }
                }
            }
        }
    }

    findAllMatches() {
        const matches = [];
        
        // Проверяем горизонтальные совпадения
        for (let row = 0; row < this.boardHeight; row++) {
            let count = 1;
            let currentType = this.board[row][0];
            
            for (let col = 1; col <= this.boardWidth; col++) {
                if (col < this.boardWidth && this.board[row][col] === currentType && currentType !== 0) {
                    count++;
        } else {
                    if (count >= 3 && currentType !== 0) {
                        const elements = [];
                        for (let i = col - count; i < col; i++) {
                            elements.push({ row, col: i });
                        }
                        matches.push({ elements, type: currentType });
                    }
                    count = 1;
                    currentType = col < this.boardWidth ? this.board[row][col] : 0;
                }
            }
        }
        
        // Проверяем вертикальные совпадения
        for (let col = 0; col < this.boardWidth; col++) {
            let count = 1;
            let currentType = this.board[0][col];
            
            for (let row = 1; row <= this.boardHeight; row++) {
                if (row < this.boardHeight && this.board[row][col] === currentType && currentType !== 0) {
                    count++;
                } else {
                    if (count >= 3 && currentType !== 0) {
                        const elements = [];
                        for (let i = row - count; i < row; i++) {
                            elements.push({ row: i, col });
                        }
                        matches.push({ elements, type: currentType });
                    }
                    count = 1;
                    currentType = row < this.boardHeight ? this.board[row][col] : 0;
                }
            }
        }
        
        return matches;
    }

    processMatches(matches) {
        this.lastAnimationTime = this.time.now;
        console.log('Обработка совпадений:', matches.length);
        
        // Удаляем совпавшие элементы
        const positionsToRemove = new Set();
        
        matches.forEach(match => {
            match.elements.forEach(pos => {
                positionsToRemove.add(`${pos.row},${pos.col}`);
                this.score += 10; // Базовые очки за элемент
            });
            
            // Дополнительные очки за длину совпадения
            this.score += (match.elements.length - 3) * 5;
        });
        
        // Удаляем элементы
        positionsToRemove.forEach(posStr => {
            const [row, col] = posStr.split(',').map(Number);
            this.board[row][col] = 0;
        });
        
        // Заполняем пустые места
        this.fillEmptySpaces();
        
        // Простая проверка - завершаем анимацию через 1 секунду
        this.time.delayedCall(1000, () => {
            console.log('Завершение анимации');
            this.isAnimating = false;
            
            // Проверяем, есть ли еще ходы
            if (!this.hasValidMoves()) {
                console.log('Нет доступных ходов');
                // Проверяем, достигнут ли целевой счет
                if (this.score < this.targetScore) {
                    console.log('Целевой счет не достигнут, показываем окно перезапуска');
                    this.showNoMovesDialog();
                } else {
                    console.log('Целевой счет достигнут, завершаем уровень');
                    this.levelComplete();
                }
            }
        });
    }

    fillEmptySpaces() {
        for (let col = 0; col < this.boardWidth; col++) {
            // Собираем все непустые элементы в столбце (снизу вверх)
            const elements = [];
            for (let row = this.boardHeight - 1; row >= 0; row--) {
                if (this.board[row][col] !== 0) {
                    elements.push(this.board[row][col]);
                }
            }
            
            // Заполняем столбец снизу вверх (элементы падают вниз)
            for (let row = this.boardHeight - 1; row >= 0; row--) {
                const elementsIndex = this.boardHeight - 1 - row;
                if (elementsIndex < elements.length) {
                    // Перемещаем существующий элемент вниз
                    this.board[row][col] = elements[elementsIndex];
        } else {
                    // Генерируем новый элемент сверху (в верхней части столбца)
                    this.board[row][col] = this.getRandomGemType(row, col);
                }
            }
        }
        
        // Обновляем спрайты без анимации для стабильности
        this.updateGemSprites();
        
        // Проверяем новые совпадения после заполнения
        this.checkForNewMatches();
    }

    checkForNewMatches() {
        console.log('Проверяем новые совпадения после заполнения');
        
        // Находим все совпадения на обновленном поле
        const newMatches = this.findAllMatches();
        
        if (newMatches.length > 0) {
            console.log('Найдены новые совпадения:', newMatches.length);
            // Обрабатываем новые совпадения
            this.processMatches(newMatches);
            } else {
            console.log('Новых совпадений не найдено');
            // Если новых совпадений нет, завершаем анимацию
                this.isAnimating = false;
        }
    }

    shuffleBoard() {
        console.log('Перемешиваем поле');
        
        // Сбрасываем состояние перед перемешиванием
        this.selectedElement = null;
            this.isAnimating = false;
        
        // Собираем все элементы
        const elements = [];
        for (let row = 0; row < this.boardHeight; row++) {
            for (let col = 0; col < this.boardWidth; col++) {
                if (this.board[row][col] !== 0) {
                    elements.push(this.board[row][col]);
                }
            }
        }
        
        // Перемешиваем
        for (let i = elements.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [elements[i], elements[j]] = [elements[j], elements[i]];
        }
        
        // Заполняем поле заново
        let index = 0;
        for (let row = 0; row < this.boardHeight; row++) {
            for (let col = 0; col < this.boardWidth; col++) {
                this.board[row][col] = elements[index++];
            }
        }
        
        // Обновляем спрайты
        this.updateGemSprites();
        
        console.log('Поле перемешано');
    }

    hasValidMoves() {
        for (let row = 0; row < this.boardHeight; row++) {
            for (let col = 0; col < this.boardWidth; col++) {
                if (this.hasValidMoveFrom(row, col)) {
                    return true;
                }
            }
        }
        return false;
    }

    hasValidMoveFrom(row, col) {
        const directions = [
            { dr: -1, dc: 0 }, // вверх
            { dr: 1, dc: 0 },  // вниз
            { dr: 0, dc: -1 }, // влево
            { dr: 0, dc: 1 }   // вправо
        ];
        
        for (const dir of directions) {
            const newRow = row + dir.dr;
            const newCol = col + dir.dc;
            
            if (this.isValidPosition(newRow, newCol)) {
                if (this.wouldCreateMatchAfterSwap(row, col, newRow, newCol)) {
                    return true;
                }
            }
        }
        
        return false;
    }

    wouldCreateMatchAfterSwap(row1, col1, row2, col2) {
        // Временно меняем элементы местами
        const temp = this.board[row1][col1];
        this.board[row1][col1] = this.board[row2][col2];
        this.board[row2][col2] = temp;
        
        // Проверяем, создает ли это совпадения
        const hasMatch1 = this.checkMatchesAt(row1, col1).length > 0;
        const hasMatch2 = this.checkMatchesAt(row2, col2).length > 0;
        
        // Возвращаем элементы на место
        this.board[row2][col2] = this.board[row1][col1];
        this.board[row1][col1] = temp;
        
        return hasMatch1 || hasMatch2;
    }

    checkMatchesAt(row, col) {
        const matches = [];
        const type = this.board[row][col];
        
        if (type === 0) return matches;
        
        // Проверяем горизонтальное совпадение
        let horizontalElements = [{ row, col }];
        
        // Влево
        for (let c = col - 1; c >= 0 && this.board[row][c] === type; c--) {
            horizontalElements.unshift({ row, col: c });
        }
        
        // Вправо
        for (let c = col + 1; c < this.boardWidth && this.board[row][c] === type; c++) {
            horizontalElements.push({ row, col: c });
        }
        
        if (horizontalElements.length >= 3) {
            matches.push({ elements: horizontalElements, type });
        }
        
        // Проверяем вертикальное совпадение
        let verticalElements = [{ row, col }];
        
        // Вверх
        for (let r = row - 1; r >= 0 && this.board[r][col] === type; r--) {
            verticalElements.unshift({ row: r, col });
        }
        
        // Вниз
        for (let r = row + 1; r < this.boardHeight && this.board[r][col] === type; r++) {
            verticalElements.push({ row: r, col });
        }
        
        if (verticalElements.length >= 3) {
            matches.push({ elements: verticalElements, type });
        }
        
        return matches;
    }

    getWorldPosition(row, col) {
        return {
            x: this.boardX + col * this.cellSize + this.cellSize / 2,
            y: this.boardY + row * this.cellSize + this.cellSize / 2
        };
    }

    highlightSelectedElement() {
        if (this.selectedElement) {
            const { row, col } = this.selectedElement;
            const sprite = this.gemSprites[row][col];
            
            console.log('Выделяем элемент:', this.selectedElement, 'Спрайт:', sprite);
            
            if (sprite) {
                // Увеличиваем размер
                sprite.setScale(sprite.scaleX * 1.1);
                
                // Добавляем желтый оттенок
                sprite.setTint(0xffff00);
                
                // Анимация "подпрыгивания" при выборе
                this.tweens.add({
                    targets: sprite,
                    y: sprite.y - 5,
                    duration: 150,
                    ease: 'Back.easeOut',
                    yoyo: true,
                    onComplete: () => {
                        // После подпрыгивания добавляем пульсирующую анимацию
                        this.tweens.add({
                            targets: sprite,
                            scaleX: sprite.scaleX * 1.05,
                            scaleY: sprite.scaleY * 1.05,
                            duration: 500,
                            ease: 'Sine.easeInOut',
                            yoyo: true,
                            repeat: -1
                        });
                    }
                });
                
                console.log('Элемент выделен успешно');
            } else {
                console.warn('Спрайт не найден для выделения');
            }
        }
    }

    clearSelection() {
        if (this.selectedElement) {
            const { row, col } = this.selectedElement;
            const sprite = this.gemSprites[row][col];
            
            console.log('Очищаем выделение элемента:', this.selectedElement);
            
            if (sprite) {
                // Возвращаем размер
                sprite.setScale(sprite.scaleX / 1.1);
                
                // Убираем оттенок
                sprite.clearTint();
                
                // Останавливаем анимацию
                this.tweens.killTweensOf(sprite);
                
                console.log('Элемент очищен успешно');
            } else {
                console.warn('Спрайт не найден для очистки');
            }
            
            this.selectedElement = null;
            console.log('Выбранный элемент сброшен');
        }
    }

    showInvalidMoveAnimation() {
        if (this.selectedElement) {
            const { row, col } = this.selectedElement;
            const sprite = this.gemSprites[row][col];
            
            if (sprite) {
                // Анимация "тряски" для невалидного хода
                this.tweens.add({
                    targets: sprite,
                    x: sprite.x - 3,
                    duration: 50,
                    ease: 'Power2',
                    yoyo: true,
                    repeat: 3,
                    onComplete: () => {
                        // Возвращаем в исходную позицию
                        const pos = this.getWorldPosition(row, col);
                        sprite.setPosition(pos.x, pos.y);
                    }
                });
            }
        }
    }

    showNoMovesDialog() {
        console.log('Показываем диалог отсутствия ходов. Счет:', this.score);
        
        this.isAnimating = true;
        
        const { width, height } = this.scale;
        
        // Создаем полупрозрачный фон
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
        
        // Показываем сообщение - используем адаптивный текст
        const noMovesText = ScaleHelper.createAdaptiveText(this, width / 2, height / 2 - 60, 'Нет возможных решений!', GAME_CONFIG.UI.TITLE_TEXT_STYLE).setOrigin(0.5);
        const questionText = ScaleHelper.createAdaptiveText(this, width / 2, height / 2 - 20, 'Попробовать снова?', GAME_CONFIG.UI.TEXT_STYLE).setOrigin(0.5);
        const scoreText = ScaleHelper.createAdaptiveText(this, width / 2, height / 2 + 10, 'Текущий счет: ' + this.score + ' / ' + this.targetScore, GAME_CONFIG.UI.TEXT_STYLE).setOrigin(0.5);
        
        // Кнопка "Начать сначала" - используем адаптивный текст
        const restartButton = ScaleHelper.createAdaptiveText(this, width / 2, height / 2 + 50, 'Начать сначала', GAME_CONFIG.UI.TEXT_STYLE).setOrigin(0.5);
        restartButton.setInteractive({ useHandCursor: true });
        restartButton.setTint(0x00ff00); // Зеленый цвет для выделения
        restartButton.on('pointerdown', () => {
            console.log('Перезапуск игры с нулевыми очками');
            this.restartGameWithZeroScore();
        });
        
        // Кнопка "Главное меню" - используем адаптивный текст
        const homeButton = ScaleHelper.createAdaptiveText(this, width / 2, height / 2 + 80, 'Главное меню', GAME_CONFIG.UI.TEXT_STYLE).setOrigin(0.5);
        homeButton.setInteractive({ useHandCursor: true });
        homeButton.on('pointerdown', () => {
            console.log('Переход в главное меню');
            this.scene.start('Start');
        });
    }

    gameOver() {
        console.log('Игра окончена. Счет:', this.score);
        
        this.isAnimating = true;
        
        const { width, height } = this.scale;
        
        // Создаем полупрозрачный фон
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
        
        // Показываем сообщение о поражении - используем адаптивный текст
        const gameOverText = ScaleHelper.createAdaptiveText(this, width / 2, height / 2 - 50, 'Нет ходов!', GAME_CONFIG.UI.TITLE_TEXT_STYLE).setOrigin(0.5);
        const scoreText = ScaleHelper.createAdaptiveText(this, width / 2, height / 2, 'Счет: ' + this.score, GAME_CONFIG.UI.TEXT_STYLE).setOrigin(0.5);
        
        // Кнопка "Играть снова" - используем адаптивный текст
        const playAgainButton = ScaleHelper.createAdaptiveText(this, width / 2, height / 2 + 50, 'Играть снова', GAME_CONFIG.UI.TEXT_STYLE).setOrigin(0.5);
        playAgainButton.setInteractive({ useHandCursor: true });
        playAgainButton.on('pointerdown', () => {
            console.log('Перезапуск игры');
            this.scene.restart();
        });
        
        // Кнопка "Главное меню" - используем адаптивный текст
        const homeButton = ScaleHelper.createAdaptiveText(this, width / 2, height / 2 + 80, 'Главное меню', GAME_CONFIG.UI.TEXT_STYLE).setOrigin(0.5);
        homeButton.setInteractive({ useHandCursor: true });
        homeButton.on('pointerdown', () => {
            console.log('Переход в главное меню');
            this.scene.start('Start');
        });
    }

    createUI() {
        const { width, height } = this.scale;
        
        // Счет - используем адаптивный текст
        this.scoreText = ScaleHelper.createAdaptiveText(this, 20, 20, 'Счет: 0', GAME_CONFIG.UI.TEXT_STYLE);
        
        // Ходы - используем адаптивный текст
        this.movesText = ScaleHelper.createAdaptiveText(this, 20, 50, 'Ходы: 30', GAME_CONFIG.UI.TEXT_STYLE);
        
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
        
        // Кнопка сброса для отладки
        const resetButtonStyle = {
            fontSize: 16,
            fill: '#ffffff',
            fontFamily: 'Gazprombank Sans, Arial, sans-serif',
            fontWeight: '600'
        };
        this.resetButton = ScaleHelper.createAdaptiveText(this, width - 50, 80, 'Сброс', resetButtonStyle).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        this.resetButton.on('pointerdown', () => {
            console.log('Сброс игры');
            this.isAnimating = false;
            this.selectedElement = null;
            this.scene.restart();
        });
    }

    update() {
        // Обновляем UI
        this.scoreText.setText('Счет: ' + this.score + ' / ' + this.targetScore);
        this.movesText.setText('Ходы: ' + this.moves);
        
        // Проверяем достижение целевого счета
        if (this.score >= this.targetScore && !this.isAnimating) {
            this.levelComplete();
            return;
        }
        
        // Проверяем завершение игры только если нет ходов И нет возможных решений
        if (this.moves <= 0 && !this.isAnimating && !this.hasValidMoves()) {
            if (this.score < this.targetScore) {
                this.showNoMovesDialog();
            } else {
                this.levelComplete();
            }
        }
    }

    levelComplete() {
        console.log('Уровень завершен! Счет:', this.score, 'Цель:', this.targetScore);
        console.log('Устанавливаем флаг анимации');
        
        
        this.goToNextLevel();
       
    }

    goToNextLevel() {
        console.log('Переход на следующий уровень');
        
        // Определяем текущую игру
        const currentGame = 'Match3';
        const otherGame = 'Game'; // Правильное название сцены
        
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

    handleResize() {
        const { width: newWidth, height: newHeight } = this.scale;
        
        // Обновляем фон
        this.background.setSize(newWidth, newHeight);
        this.background.setPosition(newWidth / 2, newHeight / 2);
        
        // Пересчитываем размеры поля
        this.cellSize = Math.min(newWidth * 0.12, newHeight * 0.12);
        this.boardX = (newWidth - this.boardWidth * this.cellSize) / 2;
        this.boardY = (newHeight - this.boardHeight * this.cellSize) / 2 + 20;
        
        // Обновляем позиции драгоценных камней
        for (let row = 0; row < this.boardHeight; row++) {
            for (let col = 0; col < this.boardWidth; col++) {
                if (this.gemSprites[row][col]) {
                    const pos = this.getWorldPosition(row, col);
                    this.gemSprites[row][col].setPosition(pos.x, pos.y);
                    const scale = (this.cellSize * 0.9) / 500;
                    this.gemSprites[row][col].setScale(scale);
                }
            }
        }
        
        // Обновляем позиции UI
        this.scoreText.setPosition(20, 20);
        this.movesText.setPosition(20, 50);
        this.homeButton.setPosition(newWidth - 50, 30);
    }
}
