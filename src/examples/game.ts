import { GameLogic } from './gameLogic';
import { GameRenderer } from './gameRenderer';
import { TouchController } from './touchController';
import { GameConfig, Position, Move, GAME_CONSTANTS } from './types';

export class Game {
    private gameLogic: GameLogic;
    private renderer: GameRenderer;
    private touchController: TouchController;
    private canvas: HTMLCanvasElement;
    private animationFrame: number | null = null;
    private isRunning: boolean = false;

    // UI элементы
    private scoreElement: HTMLElement;
    private movesElement: HTMLElement;
    private newGameBtn: HTMLButtonElement;
    private hintBtn: HTMLButtonElement;
    private messagesElement: HTMLElement;

    constructor(canvas: HTMLCanvasElement, config: GameConfig) {
        this.canvas = canvas;
        
        // Инициализируем игровую логику
        this.gameLogic = new GameLogic(config);
        
        // Инициализируем рендерер
        this.renderer = new GameRenderer(canvas);
        
        // Получаем UI элементы
        this.scoreElement = document.getElementById('score')!;
        this.movesElement = document.getElementById('moves')!;
        this.newGameBtn = document.getElementById('newGameBtn') as HTMLButtonElement;
        this.hintBtn = document.getElementById('hintBtn') as HTMLButtonElement;
        this.messagesElement = document.getElementById('gameMessages')!;
        
        // Инициализируем контроллер касаний
        this.touchController = new TouchController(
            canvas,
            this.handleTap.bind(this),
            this.handleSwipe.bind(this)
        );
        
        // Настраиваем обработчики событий
        this.setupEventListeners();
        
        // Запускаем игру
        this.start();
    }

    private setupEventListeners(): void {
        // Кнопка новой игры
        this.newGameBtn.addEventListener('click', () => {
            this.newGame();
        });
        
        // Кнопка подсказки
        this.hintBtn.addEventListener('click', () => {
            this.showHint();
        });
        
        // Обработка изменения размера окна
        window.addEventListener('resize', () => {
            this.renderer.resize();
        });
        
        // Обработка изменения ориентации
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.renderer.resize();
            }, 100);
        });
    }

    private start(): void {
        this.isRunning = true;
        this.gameLoop();
    }

    private gameLoop(): void {
        if (!this.isRunning) return;
        
        // Обновляем UI
        this.updateUI();
        
        // Рендерим игру
        this.renderer.render(this.gameLogic.getState());
        
        // Планируем следующий кадр
        this.animationFrame = requestAnimationFrame(() => this.gameLoop());
    }

    private updateUI(): void {
        const state = this.gameLogic.getState();
        this.scoreElement.textContent = state.score.toString();
        this.movesElement.textContent = state.moves.toString();
        
        // Проверяем завершение игры
        if (state.moves <= 0) {
            this.endGame();
        } else if (this.gameLogic.isLevelComplete()) {
            this.completeLevel();
        }
    }

    private handleTap(position: Position): void {
        const state = this.gameLogic.getState();
        
        if (state.isAnimating || state.moves <= 0) {
            return;
        }
        
        // Если уже выбран элемент
        if (state.selectedElement) {
            // Проверяем, можно ли сделать ход
            const move: Move = {
                from: state.selectedElement,
                to: position
            };
            
            if (this.gameLogic.tryMove(move)) {
                this.gameLogic.setSelectedElement(null);
                this.gameLogic.setAnimating(true);
                
                // Анимация завершается в gameLogic.processMatches
                setTimeout(() => {
                    this.gameLogic.setAnimating(false);
                }, 300);
            } else {
                // Если нельзя сделать ход, выбираем новый элемент
                this.gameLogic.setSelectedElement(position);
            }
        } else {
            // Выбираем элемент
            this.gameLogic.setSelectedElement(position);
        }
    }

    private handleSwipe(from: Position, to: Position): void {
        const move: Move = { from, to };
        
        if (this.gameLogic.tryMove(move)) {
            this.gameLogic.setSelectedElement(null);
            this.gameLogic.setAnimating(true);
            
            setTimeout(() => {
                this.gameLogic.setAnimating(false);
            }, 300);
        }
    }

    private showHint(): void {
        const state = this.gameLogic.getState();
        
        if (state.isAnimating || state.moves <= 0) {
            return;
        }
        
        // Находим доступный ход
        const hint = this.findAvailableMove();
        
        if (hint) {
            // Подсвечиваем элементы для подсказки
            this.gameLogic.setSelectedElement(hint.from);
            
            // Убираем подсказку через 2 секунды
            setTimeout(() => {
                this.gameLogic.setSelectedElement(null);
            }, 2000);
            
            this.showMessage('Подсказка показана!', 1000);
        } else {
            this.showMessage('Доступных ходов нет!', 1500);
        }
    }

    private findAvailableMove(): Move | null {
        const board = this.gameLogic.getBoard();
        
        for (let row = 0; row < GAME_CONSTANTS.BOARD_SIZE; row++) {
            for (let col = 0; col < GAME_CONSTANTS.BOARD_SIZE; col++) {
                const directions = [
                    { dr: -1, dc: 0 }, // вверх
                    { dr: 1, dc: 0 },  // вниз
                    { dr: 0, dc: -1 }, // влево
                    { dr: 0, dc: 1 }   // вправо
                ];
                
                for (const dir of directions) {
                    const newRow = row + dir.dr;
                    const newCol = col + dir.dc;
                    
                    if (newRow >= 0 && newRow < GAME_CONSTANTS.BOARD_SIZE &&
                        newCol >= 0 && newCol < GAME_CONSTANTS.BOARD_SIZE) {
                        
                        const move: Move = {
                            from: { row, col },
                            to: { row: newRow, col: newCol }
                        };
                        
                        if (this.wouldCreateMatch(move)) {
                            return move;
                        }
                    }
                }
            }
        }
        
        return null;
    }

    private wouldCreateMatch(move: Move): boolean {
        const board = this.gameLogic.getBoard();
        
        // Временно меняем элементы местами
        const temp = board[move.from.row][move.from.col];
        board[move.from.row][move.from.col] = board[move.to.row][move.to.col];
        board[move.to.row][move.to.col] = temp;
        
        // Проверяем совпадения
        const hasMatch1 = this.checkMatchesAt(board, move.from.row, move.from.col);
        const hasMatch2 = this.checkMatchesAt(board, move.to.row, move.to.col);
        
        return hasMatch1 || hasMatch2;
    }

    private checkMatchesAt(board: (number | null)[][], row: number, col: number): boolean {
        const type = board[row][col];
        if (type === null) return false;
        
        // Проверяем горизонтальное совпадение
        let horizontalCount = 1;
        
        // Влево
        for (let c = col - 1; c >= 0 && board[row][c] === type; c--) {
            horizontalCount++;
        }
        
        // Вправо
        for (let c = col + 1; c < GAME_CONSTANTS.BOARD_SIZE && board[row][c] === type; c++) {
            horizontalCount++;
        }
        
        if (horizontalCount >= GAME_CONSTANTS.MIN_MATCH_LENGTH) {
            return true;
        }
        
        // Проверяем вертикальное совпадение
        let verticalCount = 1;
        
        // Вверх
        for (let r = row - 1; r >= 0 && board[r][col] === type; r--) {
            verticalCount++;
        }
        
        // Вниз
        for (let r = row + 1; r < GAME_CONSTANTS.BOARD_SIZE && board[r][col] === type; r++) {
            verticalCount++;
        }
        
        return verticalCount >= GAME_CONSTANTS.MIN_MATCH_LENGTH;
    }

    private endGame(): void {
        this.isRunning = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        const score = this.gameLogic.getScore();
        this.showMessage(`Игра окончена! Очки: ${score}`, 3000);
    }

    private completeLevel(): void {
        this.isRunning = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        const score = this.gameLogic.getScore();
        this.showMessage(`Уровень пройден! Очки: ${score}`, 3000);
        
        // Вызываем callback завершения уровня
        this.gameLogic['config'].onLevelComplete();
    }

    private newGame(): void {
        this.gameLogic.resetGame();
        this.isRunning = true;
        this.gameLoop();
        this.showMessage('Новая игра началась!', 1500);
    }

    private showMessage(text: string, duration: number): void {
        this.messagesElement.textContent = text;
        this.messagesElement.classList.add('show');
        
        setTimeout(() => {
            this.messagesElement.classList.remove('show');
        }, duration);
    }

    public destroy(): void {
        this.isRunning = false;
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        this.touchController.destroy();
        this.renderer.destroy();
    }
}

// Инициализация игры при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameBoard') as HTMLCanvasElement;
    
    if (!canvas) {
        console.error('Canvas элемент не найден!');
        return;
    }
    
    const config: GameConfig = {
        boardSize: GAME_CONSTANTS.BOARD_SIZE,
        elementTypes: GAME_CONSTANTS.ELEMENT_TYPES,
        initialMoves: GAME_CONSTANTS.INITIAL_MOVES,
        onLevelComplete: () => {
            console.log('Уровень пройден!');
            // Здесь можно добавить логику для следующего уровня
        }
    };
    
    const game = new Game(canvas, config);
    
    // Сохраняем ссылку на игру для отладки
    (window as any).game = game;
});
