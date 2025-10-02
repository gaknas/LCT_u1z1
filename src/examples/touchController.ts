import { Position, SwipeDirection, GAME_CONSTANTS } from './types';

export class TouchController {
    private canvas: HTMLCanvasElement;
    private onTap: (position: Position) => void;
    private onSwipe: (from: Position, to: Position, direction: SwipeDirection) => void;
    private startPosition: Position | null = null;
    private startTime: number = 0;
    private isDragging: boolean = false;
    private lastPosition: Position | null = null;

    constructor(
        canvas: HTMLCanvasElement,
        onTap: (position: Position) => void,
        onSwipe: (from: Position, to: Position, direction: SwipeDirection) => void
    ) {
        this.canvas = canvas;
        this.onTap = onTap;
        this.onSwipe = onSwipe;
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Touch события для мобильных устройств
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        this.canvas.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });

        // Mouse события для десктопа (для тестирования)
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));

        // Предотвращаем контекстное меню на долгом нажатии
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    private handleTouchStart(event: globalThis.TouchEvent): void {
        if (event.touches.length !== 1) return;
        
        event.preventDefault();
        const touch = event.touches[0];
        const position = this.getPositionFromCoordinates(touch.clientX, touch.clientY);
        
        if (position) {
            this.startPosition = position;
            this.startTime = Date.now();
            this.isDragging = false;
            this.lastPosition = position;
        }
    }

    private handleTouchMove(event: globalThis.TouchEvent): void {
        if (event.touches.length !== 1 || !this.startPosition) return;
        
        event.preventDefault();
        const touch = event.touches[0];
        const position = this.getPositionFromCoordinates(touch.clientX, touch.clientY);
        
        if (position) {
            const distance = this.calculateDistance(this.startPosition, position);
            
            if (distance > GAME_CONSTANTS.TOUCH_THRESHOLD) {
                this.isDragging = true;
                this.lastPosition = position;
            }
        }
    }

    private handleTouchEnd(event: globalThis.TouchEvent): void {
        if (!this.startPosition) return;
        
        event.preventDefault();
        const duration = Date.now() - this.startTime;
        
        if (this.isDragging && this.lastPosition) {
            // Обрабатываем свайп
            const distance = this.calculateDistance(this.startPosition, this.lastPosition);
            
            if (distance > GAME_CONSTANTS.SWIPE_THRESHOLD) {
                const direction = this.getSwipeDirection(this.startPosition, this.lastPosition);
                this.onSwipe(this.startPosition, this.lastPosition, direction);
            } else {
                // Слишком короткий свайп - считаем тапом
                this.onTap(this.startPosition);
            }
        } else {
            // Быстрый тап
            if (duration < 500) {
                this.onTap(this.startPosition);
            }
        }
        
        this.resetState();
    }

    private handleTouchCancel(event: globalThis.TouchEvent): void {
        this.resetState();
    }

    private handleMouseDown(event: MouseEvent): void {
        event.preventDefault();
        const position = this.getPositionFromCoordinates(event.clientX, event.clientY);
        
        if (position) {
            this.startPosition = position;
            this.startTime = Date.now();
            this.isDragging = false;
            this.lastPosition = position;
        }
    }

    private handleMouseMove(event: MouseEvent): void {
        if (!this.startPosition) return;
        
        event.preventDefault();
        const position = this.getPositionFromCoordinates(event.clientX, event.clientY);
        
        if (position) {
            const distance = this.calculateDistance(this.startPosition, position);
            
            if (distance > GAME_CONSTANTS.TOUCH_THRESHOLD) {
                this.isDragging = true;
                this.lastPosition = position;
            }
        }
    }

    private handleMouseUp(event: MouseEvent): void {
        if (!this.startPosition) return;
        
        event.preventDefault();
        const duration = Date.now() - this.startTime;
        
        if (this.isDragging && this.lastPosition) {
            // Обрабатываем свайп
            const distance = this.calculateDistance(this.startPosition, this.lastPosition);
            
            if (distance > GAME_CONSTANTS.SWIPE_THRESHOLD) {
                const direction = this.getSwipeDirection(this.startPosition, this.lastPosition);
                this.onSwipe(this.startPosition, this.lastPosition, direction);
            } else {
                // Слишком короткий свайп - считаем тапом
                this.onTap(this.startPosition);
            }
        } else {
            // Быстрый тап
            if (duration < 500) {
                this.onTap(this.startPosition);
            }
        }
        
        this.resetState();
    }

    private handleMouseLeave(event: MouseEvent): void {
        this.resetState();
    }

    private getPositionFromCoordinates(clientX: number, clientY: number): Position | null {
        const rect = this.canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        // Проверяем, что клик внутри canvas
        if (x < 0 || x >= rect.width || y < 0 || y >= rect.height) {
            return null;
        }
        
        // Преобразуем координаты в позицию на игровом поле
        const elementSize = rect.width / GAME_CONSTANTS.BOARD_SIZE;
        const col = Math.floor(x / elementSize);
        const row = Math.floor(y / elementSize);
        
        // Проверяем границы
        if (row >= 0 && row < GAME_CONSTANTS.BOARD_SIZE && 
            col >= 0 && col < GAME_CONSTANTS.BOARD_SIZE) {
            return { row, col };
        }
        
        return null;
    }

    private calculateDistance(pos1: Position, pos2: Position): number {
        const dx = pos2.col - pos1.col;
        const dy = pos2.row - pos1.row;
        return Math.sqrt(dx * dx + dy * dy);
    }

    private getSwipeDirection(from: Position, to: Position): SwipeDirection {
        const dx = to.col - from.col;
        const dy = to.row - from.row;
        
        // Определяем основное направление
        if (Math.abs(dx) > Math.abs(dy)) {
            return {
                direction: dx > 0 ? 'right' : 'left',
                distance: Math.abs(dx)
            };
        } else {
            return {
                direction: dy > 0 ? 'down' : 'up',
                distance: Math.abs(dy)
            };
        }
    }

    private resetState(): void {
        this.startPosition = null;
        this.lastPosition = null;
        this.isDragging = false;
        this.startTime = 0;
    }

    public destroy(): void {
        // Удаляем все обработчики событий
        this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        this.canvas.removeEventListener('touchmove', this.handleTouchMove);
        this.canvas.removeEventListener('touchend', this.handleTouchEnd);
        this.canvas.removeEventListener('touchcancel', this.handleTouchCancel);
        this.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.canvas.removeEventListener('mouseup', this.handleMouseUp);
        this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
    }
}
