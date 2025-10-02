import { 
    ElementType, 
    Position, 
    GameElement, 
    Move, 
    Match, 
    GameState, 
    GameConfig,
    GAME_CONSTANTS 
} from './types';

export class GameLogic {
    private config: GameConfig;
    private state: GameState;
    private boardSize: number;

    constructor(config: GameConfig) {
        this.config = config;
        this.boardSize = config.boardSize;
        this.state = {
            board: [],
            score: 0,
            moves: config.initialMoves,
            selectedElement: null,
            isAnimating: false
        };
        this.initializeBoard();
    }

    private initializeBoard(): void {
        // Создаем пустое поле
        this.state.board = Array(this.boardSize).fill(null)
            .map(() => Array(this.boardSize).fill(null));
        
        // Генерируем проходимый уровень
        this.generateSolvableBoard();
    }

    private generateSolvableBoard(): void {
        let attempts = 0;
        const maxAttempts = 1000;
        
        do {
            this.fillBoardRandomly();
            attempts++;
        } while (!this.hasValidMoves() && attempts < maxAttempts);
        
        if (attempts >= maxAttempts) {
            // Если не удалось сгенерировать проходимый уровень,
            // создаем простой уровень с гарантированными ходами
            this.generateGuaranteedSolvableBoard();
        }
    }

    private fillBoardRandomly(): void {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.state.board[row][col] === null) {
                    this.state.board[row][col] = this.getRandomElementType(row, col);
                }
            }
        }
    }

    private getRandomElementType(row: number, col: number): ElementType {
        const validTypes: ElementType[] = [];
        
        for (let type = 0; type < this.config.elementTypes; type++) {
            if (!this.wouldCreateMatch(row, col, type as ElementType)) {
                validTypes.push(type as ElementType);
            }
        }
        
        if (validTypes.length === 0) {
            return Math.floor(Math.random() * this.config.elementTypes) as ElementType;
        }
        
        return validTypes[Math.floor(Math.random() * validTypes.length)];
    }

    private wouldCreateMatch(row: number, col: number, type: ElementType): boolean {
        // Проверяем горизонтальные совпадения
        let horizontalCount = 1;
        
        // Проверяем влево
        for (let c = col - 1; c >= 0 && this.state.board[row][c] === type; c--) {
            horizontalCount++;
        }
        
        // Проверяем вправо
        for (let c = col + 1; c < this.boardSize && this.state.board[row][c] === type; c++) {
            horizontalCount++;
        }
        
        if (horizontalCount >= GAME_CONSTANTS.MIN_MATCH_LENGTH) {
            return true;
        }
        
        // Проверяем вертикальные совпадения
        let verticalCount = 1;
        
        // Проверяем вверх
        for (let r = row - 1; r >= 0 && this.state.board[r][col] === type; r--) {
            verticalCount++;
        }
        
        // Проверяем вниз
        for (let r = row + 1; r < this.boardSize && this.state.board[r][col] === type; r++) {
            verticalCount++;
        }
        
        return verticalCount >= GAME_CONSTANTS.MIN_MATCH_LENGTH;
    }

    private generateGuaranteedSolvableBoard(): void {
        // Создаем простой паттерн с гарантированными ходами
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const type = ((row + col) % this.config.elementTypes) as ElementType;
                this.state.board[row][col] = type;
            }
        }
        
        // Создаем несколько готовых комбинаций
        this.createGuaranteedMatches();
    }

    private createGuaranteedMatches(): void {
        // Создаем L-образные фигуры для гарантированных ходов
        const positions = [
            { row: 2, col: 2 },
            { row: 2, col: 3 },
            { row: 3, col: 2 }
        ];
        
        const type = 0 as ElementType;
        positions.forEach(pos => {
            this.state.board[pos.row][pos.col] = type;
        });
    }

    private hasValidMoves(): boolean {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.hasValidMoveFrom(row, col)) {
                    return true;
                }
            }
        }
        return false;
    }

    private hasValidMoveFrom(row: number, col: number): boolean {
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

    private wouldCreateMatchAfterSwap(row1: number, col1: number, row2: number, col2: number): boolean {
        // Временно меняем элементы местами
        const temp = this.state.board[row1][col1];
        this.state.board[row1][col1] = this.state.board[row2][col2];
        this.state.board[row2][col2] = temp;
        
        // Проверяем, создает ли это совпадения
        const hasMatch1 = this.checkMatchesAt(row1, col1).length > 0;
        const hasMatch2 = this.checkMatchesAt(row2, col2).length > 0;
        
        // Возвращаем элементы на место
        this.state.board[row2][col2] = this.state.board[row1][col1];
        this.state.board[row1][col1] = temp;
        
        return hasMatch1 || hasMatch2;
    }

    private isValidPosition(row: number, col: number): boolean {
        return row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize;
    }

    public tryMove(move: Move): boolean {
        if (this.state.moves <= 0 || this.state.isAnimating) {
            return false;
        }
        
        if (!this.isValidMove(move)) {
            return false;
        }
        
        // Выполняем ход
        this.swapElements(move.from, move.to);
        
        // Проверяем совпадения
        const matches = this.findAllMatches();
        
        if (matches.length === 0) {
            // Если нет совпадений, отменяем ход
            this.swapElements(move.from, move.to);
            return false;
        }
        
        // Уменьшаем количество ходов
        this.state.moves--;
        
        // Обрабатываем совпадения
        this.processMatches(matches);
        
        return true;
    }

    private isValidMove(move: Move): boolean {
        if (!this.isValidPosition(move.from.row, move.from.col) ||
            !this.isValidPosition(move.to.row, move.to.col)) {
            return false;
        }
        
        // Проверяем, что элементы соседние
        const rowDiff = Math.abs(move.to.row - move.from.row);
        const colDiff = Math.abs(move.to.col - move.from.col);
        
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    private swapElements(pos1: Position, pos2: Position): void {
        const temp = this.state.board[pos1.row][pos1.col];
        this.state.board[pos1.row][pos1.col] = this.state.board[pos2.row][pos2.col];
        this.state.board[pos2.row][pos2.col] = temp;
    }

    private findAllMatches(): Match[] {
        const matches: Match[] = [];
        
        // Проверяем горизонтальные совпадения
        for (let row = 0; row < this.boardSize; row++) {
            let count = 1;
            let currentType = this.state.board[row][0];
            
            for (let col = 1; col <= this.boardSize; col++) {
                if (col < this.boardSize && this.state.board[row][col] === currentType && currentType !== null) {
                    count++;
                } else {
                    if (count >= GAME_CONSTANTS.MIN_MATCH_LENGTH && currentType !== null) {
                        const elements: Position[] = [];
                        for (let i = col - count; i < col; i++) {
                            elements.push({ row, col: i });
                        }
                        matches.push({ elements, type: currentType as ElementType });
                    }
                    count = 1;
                    currentType = col < this.boardSize ? this.state.board[row][col] : null;
                }
            }
        }
        
        // Проверяем вертикальные совпадения
        for (let col = 0; col < this.boardSize; col++) {
            let count = 1;
            let currentType = this.state.board[0][col];
            
            for (let row = 1; row <= this.boardSize; row++) {
                if (row < this.boardSize && this.state.board[row][col] === currentType && currentType !== null) {
                    count++;
                } else {
                    if (count >= GAME_CONSTANTS.MIN_MATCH_LENGTH && currentType !== null) {
                        const elements: Position[] = [];
                        for (let i = row - count; i < row; i++) {
                            elements.push({ row: i, col });
                        }
                        matches.push({ elements, type: currentType as ElementType });
                    }
                    count = 1;
                    currentType = row < this.boardSize ? this.state.board[row][col] : null;
                }
            }
        }
        
        return matches;
    }

    private processMatches(matches: Match[]): void {
        // Удаляем совпавшие элементы
        const positionsToRemove = new Set<string>();
        
        matches.forEach(match => {
            match.elements.forEach(pos => {
                positionsToRemove.add(`${pos.row},${pos.col}`);
                this.state.score += 10; // Базовые очки за элемент
            });
            
            // Дополнительные очки за длину совпадения
            this.state.score += (match.elements.length - 3) * 5;
        });
        
        // Удаляем элементы
        positionsToRemove.forEach(posStr => {
            const [row, col] = posStr.split(',').map(Number);
            this.state.board[row][col] = null;
        });
        
        // Заполняем пустые места
        this.fillEmptySpaces();
        
        // Проверяем новые совпадения после заполнения
        const newMatches = this.findAllMatches();
        if (newMatches.length > 0) {
            setTimeout(() => this.processMatches(newMatches), 300);
        } else {
            // Проверяем, есть ли еще ходы
            if (!this.hasValidMoves()) {
                // Если ходов нет, но еще есть попытки, перемешиваем поле
                if (this.state.moves > 0) {
                    this.shuffleBoard();
                } else {
                    // Игра окончена
                    this.state.isAnimating = false;
                }
            } else {
                this.state.isAnimating = false;
            }
        }
    }

    private fillEmptySpaces(): void {
        for (let col = 0; col < this.boardSize; col++) {
            // Собираем все непустые элементы в столбце
            const elements: ElementType[] = [];
            for (let row = this.boardSize - 1; row >= 0; row--) {
                if (this.state.board[row][col] !== null) {
                    elements.push(this.state.board[row][col] as ElementType);
                }
            }
            
            // Заполняем столбец сверху вниз
            for (let row = 0; row < this.boardSize; row++) {
                if (row < elements.length) {
                    this.state.board[row][col] = elements[elements.length - 1 - row];
                } else {
                    // Генерируем новый элемент сверху
                    this.state.board[row][col] = this.getRandomElementType(row, col);
                }
            }
        }
    }

    private shuffleBoard(): void {
        // Собираем все элементы
        const elements: ElementType[] = [];
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.state.board[row][col] !== null) {
                    elements.push(this.state.board[row][col] as ElementType);
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
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                this.state.board[row][col] = elements[index++];
            }
        }
    }

    private checkMatchesAt(row: number, col: number): Match[] {
        const matches: Match[] = [];
        const type = this.state.board[row][col];
        
        if (type === null) return matches;
        
        // Проверяем горизонтальное совпадение
        let horizontalElements: Position[] = [{ row, col }];
        
        // Влево
        for (let c = col - 1; c >= 0 && this.state.board[row][c] === type; c--) {
            horizontalElements.unshift({ row, col: c });
        }
        
        // Вправо
        for (let c = col + 1; c < this.boardSize && this.state.board[row][c] === type; c++) {
            horizontalElements.push({ row, col: c });
        }
        
        if (horizontalElements.length >= GAME_CONSTANTS.MIN_MATCH_LENGTH) {
            matches.push({ elements: horizontalElements, type: type as ElementType });
        }
        
        // Проверяем вертикальное совпадение
        let verticalElements: Position[] = [{ row, col }];
        
        // Вверх
        for (let r = row - 1; r >= 0 && this.state.board[r][col] === type; r--) {
            verticalElements.unshift({ row: r, col });
        }
        
        // Вниз
        for (let r = row + 1; r < this.boardSize && this.state.board[r][col] === type; r++) {
            verticalElements.push({ row: r, col });
        }
        
        if (verticalElements.length >= GAME_CONSTANTS.MIN_MATCH_LENGTH) {
            matches.push({ elements: verticalElements, type: type as ElementType });
        }
        
        return matches;
    }

    public getState(): GameState {
        return { ...this.state };
    }

    public getBoard(): (ElementType | null)[][] {
        return this.state.board.map(row => [...row]);
    }

    public isGameOver(): boolean {
        return this.state.moves <= 0;
    }

    public isLevelComplete(): boolean {
        // Уровень считается пройденным, если набрано определенное количество очков
        return this.state.score >= 1000;
    }

    public getScore(): number {
        return this.state.score;
    }

    public getMoves(): number {
        return this.state.moves;
    }

    public setSelectedElement(position: Position | null): void {
        this.state.selectedElement = position;
    }

    public getSelectedElement(): Position | null {
        return this.state.selectedElement;
    }

    public setAnimating(animating: boolean): void {
        this.state.isAnimating = animating;
    }

    public resetGame(): void {
        this.state.score = 0;
        this.state.moves = this.config.initialMoves;
        this.state.selectedElement = null;
        this.state.isAnimating = false;
        this.initializeBoard();
    }
}
