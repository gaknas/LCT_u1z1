import { ElementType, Position, GameState, GAME_CONSTANTS, ELEMENT_COLORS, ELEMENT_SYMBOLS } from './types';

export class GameRenderer {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private elementSize: number;
    private boardSize: number;
    private selectedPosition: Position | null = null;
    private animationFrame: number | null = null;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Не удалось получить контекст canvas');
        }
        this.ctx = ctx;
        this.boardSize = GAME_CONSTANTS.BOARD_SIZE;
        this.calculateElementSize();
        this.setupCanvas();
    }

    private calculateElementSize(): void {
        const canvasSize = Math.min(window.innerWidth - 40, 400);
        this.elementSize = canvasSize / this.boardSize;
        
        // Обновляем размер canvas
        this.canvas.width = canvasSize;
        this.canvas.height = canvasSize;
        this.canvas.style.width = canvasSize + 'px';
        this.canvas.style.height = canvasSize + 'px';
    }

    private setupCanvas(): void {
        // Устанавливаем высокое качество рендеринга
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        // Настройки рендеринга
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }

    public render(gameState: GameState): void {
        this.clearCanvas();
        this.renderGrid();
        this.renderElements(gameState);
        
        if (gameState.selectedElement) {
            this.renderSelection(gameState.selectedElement);
        }
        
        if (gameState.isAnimating) {
            this.renderAnimations();
        }
    }

    private clearCanvas(): void {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Рисуем фон
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    private renderGrid(): void {
        this.ctx.strokeStyle = '#e9ecef';
        this.ctx.lineWidth = 1;
        
        // Вертикальные линии
        for (let i = 0; i <= this.boardSize; i++) {
            const x = i * this.elementSize;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Горизонтальные линии
        for (let i = 0; i <= this.boardSize; i++) {
            const y = i * this.elementSize;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    private renderElements(gameState: GameState): void {
        const board = gameState.board;
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const elementType = board[row][col];
                
                if (elementType !== null) {
                    this.renderElement(row, col, elementType);
                }
            }
        }
    }

    private renderElement(row: number, col: number, type: ElementType): void {
        const x = col * this.elementSize;
        const y = row * this.elementSize;
        
        // Рисуем тень
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        
        // Создаем градиент для элемента
        const gradient = this.createElementGradient(x, y, type);
        this.ctx.fillStyle = gradient;
        
        // Рисуем округленный прямоугольник
        this.drawRoundedRect(x + 2, y + 2, this.elementSize - 4, this.elementSize - 4, 8);
        this.ctx.fill();
        
        // Убираем тень для символа
        this.ctx.shadowColor = 'transparent';
        
        // Рисуем символ элемента
        this.ctx.fillStyle = 'white';
        this.ctx.font = `bold ${this.elementSize * 0.4}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const symbolX = x + this.elementSize / 2;
        const symbolY = y + this.elementSize / 2;
        
        this.ctx.fillText(ELEMENT_SYMBOLS[type], symbolX, symbolY);
        
        // Добавляем внутреннюю подсветку
        this.renderElementHighlight(x, y);
    }

    private createElementGradient(x: number, y: number, type: ElementType): CanvasGradient {
        const gradient = this.ctx.createLinearGradient(
            x, y, 
            x + this.elementSize, 
            y + this.elementSize
        );
        
        const baseColor = ELEMENT_COLORS[type];
        gradient.addColorStop(0, this.lightenColor(baseColor, 20));
        gradient.addColorStop(0.5, baseColor);
        gradient.addColorStop(1, this.darkenColor(baseColor, 20));
        
        return gradient;
    }

    private lightenColor(color: string, percent: number): string {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    private darkenColor(color: string, percent: number): string {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
            (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
            (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
    }

    private drawRoundedRect(x: number, y: number, width: number, height: number, radius: number): void {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }

    private renderElementHighlight(x: number, y: number): void {
        // Создаем градиент для подсветки
        const highlightGradient = this.ctx.createLinearGradient(
            x, y, 
            x + this.elementSize, 
            y + this.elementSize
        );
        
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        highlightGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.1)');
        highlightGradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
        
        this.ctx.fillStyle = highlightGradient;
        this.drawRoundedRect(x + 2, y + 2, this.elementSize - 4, this.elementSize - 4, 8);
        this.ctx.fill();
    }

    private renderSelection(position: Position): void {
        const x = position.col * this.elementSize;
        const y = position.row * this.elementSize;
        
        // Анимированная рамка выбора
        const time = Date.now() / 1000;
        const pulse = Math.sin(time * 4) * 0.5 + 0.5;
        const alpha = 0.3 + pulse * 0.4;
        
        this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        this.ctx.lineWidth = 4;
        this.ctx.setLineDash([5, 5]);
        this.ctx.lineDashOffset = time * 20;
        
        this.ctx.beginPath();
        this.ctx.rect(x + 1, y + 1, this.elementSize - 2, this.elementSize - 2);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
        
        // Добавляем свечение
        this.ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        this.ctx.shadowBlur = 15;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.rect(x + 3, y + 3, this.elementSize - 6, this.elementSize - 6);
        this.ctx.stroke();
        
        this.ctx.shadowColor = 'transparent';
    }

    private renderAnimations(): void {
        // Здесь можно добавить анимации для падающих элементов
        // и исчезающих совпадений
    }

    public setSelectedPosition(position: Position | null): void {
        this.selectedPosition = position;
    }

    public resize(): void {
        this.calculateElementSize();
        this.setupCanvas();
    }

    public destroy(): void {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }

    public getPositionFromCoordinates(x: number, y: number): Position | null {
        const col = Math.floor(x / this.elementSize);
        const row = Math.floor(y / this.elementSize);
        
        if (row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize) {
            return { row, col };
        }
        
        return null;
    }

    public getElementSize(): number {
        return this.elementSize;
    }

    public getBoardSize(): number {
        return this.boardSize;
    }
}
