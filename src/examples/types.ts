// Типы игровых элементов
export type ElementType = 0 | 1 | 2 | 3 | 4 | 5;

export interface Position {
    row: number;
    col: number;
}

export interface GameElement {
    type: ElementType;
    position: Position;
    id: string;
}

export interface Move {
    from: Position;
    to: Position;
}

export interface Match {
    elements: Position[];
    type: ElementType;
}

export interface GameState {
    board: (ElementType | null)[][];
    score: number;
    moves: number;
    selectedElement: Position | null;
    isAnimating: boolean;
}

export interface GameConfig {
    boardSize: number;
    elementTypes: number;
    initialMoves: number;
    onLevelComplete: () => void;
}


export interface SwipeDirection {
    direction: 'up' | 'down' | 'left' | 'right';
    distance: number;
}

export interface AnimationState {
    isAnimating: boolean;
    animations: Animation[];
}

export interface Animation {
    element: GameElement;
    fromPosition: Position;
    toPosition: Position;
    duration: number;
    startTime: number;
}

// Константы игры
export const GAME_CONSTANTS = {
    BOARD_SIZE: 8,
    ELEMENT_TYPES: 6,
    INITIAL_MOVES: 30,
    MIN_MATCH_LENGTH: 3,
    ANIMATION_DURATION: 300,
    TOUCH_THRESHOLD: 10,
    SWIPE_THRESHOLD: 50,
    ELEMENT_SIZE: 40,
    BOARD_PADDING: 10
} as const;

// Цвета элементов (для отладки)
export const ELEMENT_COLORS = [
    '#ff6b6b', // Красный
    '#4ecdc4', // Бирюзовый
    '#45b7d1', // Синий
    '#f9ca24', // Желтый
    '#6c5ce7', // Фиолетовый
    '#fd79a8'  // Розовый
] as const;

// Символы для элементов (для отладки)
export const ELEMENT_SYMBOLS = ['♦', '♠', '♥', '♣', '★', '▲'] as const;
