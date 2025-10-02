// Константы игры
const GAME_CONSTANTS = {
    BOARD_SIZE: 8,
    ELEMENT_TYPES: 6,
    INITIAL_MOVES: 30,
    MIN_MATCH_LENGTH: 3,
    ANIMATION_DURATION: 300,
    TOUCH_THRESHOLD: 10,
    SWIPE_THRESHOLD: 50,
    ELEMENT_SIZE: 40,
    BOARD_PADDING: 10
};

// Цвета элементов
const ELEMENT_COLORS = [
    '#ff6b6b', // Красный
    '#4ecdc4', // Бирюзовый
    '#45b7d1', // Синий
    '#f9ca24', // Желтый
    '#6c5ce7', // Фиолетовый
    '#fd79a8'  // Розовый
];

// Символы для элементов
const ELEMENT_SYMBOLS = ['♦', '♠', '♥', '♣', '★', '▲'];

// Игровая логика
class GameLogic {
    constructor(config) {
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

    initializeBoard() {
        this.state.board = Array(this.boardSize).fill(null)
            .map(() => Array(this.boardSize).fill(null));
        this.generateSolvableBoard();
    }

    generateSolvableBoard() {
        let attempts = 0;
        const maxAttempts = 1000;
        
        do {
            this.fillBoardRandomly();
            attempts++;
        } while (!this.hasValidMoves() && attempts < maxAttempts);
        
        if (attempts >= maxAttempts) {
            this.generateGuaranteedSolvableBoard();
        }
    }

    fillBoardRandomly() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.state.board[row][col] === null) {
                    this.state.board[row][col] = this.getRandomElementType(row, col);
                }
            }
        }
    }

    getRandomElementType(row, col) {
        const validTypes = [];
        
        for (let type = 0; type < this.config.elementTypes; type++) {
            if (!this.wouldCreateMatch(row, col, type)) {
                validTypes.push(type);
            }
        }
        
        if (validTypes.length === 0) {
            return Math.floor(Math.random() * this.config.elementTypes);
        }
        
        return validTypes[Math.floor(Math.random() * validTypes.length)];
    }

    wouldCreateMatch(row, col, type) {
        // Проверяем горизонтальные совпадения
        let horizontalCount = 1;
        
        for (let c = col - 1; c >= 0 && this.state.board[row][c] === type; c--) {
            horizontalCount++;
        }
        
        for (let c = col + 1; c < this.boardSize && this.state.board[row][c] === type; c++) {
            horizontalCount++;
        }
        
        if (horizontalCount >= GAME_CONSTANTS.MIN_MATCH_LENGTH) {
            return true;
        }
        
        // Проверяем вертикальные совпадения
        let verticalCount = 1;
        
        for (let r = row - 1; r >= 0 && this.state.board[r][col] === type; r--) {
            verticalCount++;
        }
        
        for (let r = row + 1; r < this.boardSize && this.state.board[r][col] === type; r++) {
            verticalCount++;
        }
        
        return verticalCount >= GAME_CONSTANTS.MIN_MATCH_LENGTH;
    }

    generateGuaranteedSolvableBoard() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const type = ((row + col) % this.config.elementTypes);
                this.state.board[row][col] = type;
            }
        }
        
        this.createGuaranteedMatches();
    }

    createGuaranteedMatches() {
        const positions = [
            { row: 2, col: 2 },
            { row: 2, col: 3 },
            { row: 3, col: 2 }
        ];
        
        const type = 0;
        positions.forEach(pos => {
            this.state.board[pos.row][pos.col] = type;
        });
    }

    hasValidMoves() {
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.hasValidMoveFrom(row, col)) {
                    return true;
                }
            }
        }
        return false;
    }

    hasValidMoveFrom(row, col) {
        const directions = [
            { dr: -1, dc: 0 },
            { dr: 1, dc: 0 },
            { dr: 0, dc: -1 },
            { dr: 0, dc: 1 }
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
        const temp = this.state.board[row1][col1];
        this.state.board[row1][col1] = this.state.board[row2][col2];
        this.state.board[row2][col2] = temp;
        
        const hasMatch1 = this.checkMatchesAt(row1, col1).length > 0;
        const hasMatch2 = this.checkMatchesAt(row2, col2).length > 0;
        
        this.state.board[row2][col2] = this.state.board[row1][col1];
        this.state.board[row1][col1] = temp;
        
        return hasMatch1 || hasMatch2;
    }

    isValidPosition(row, col) {
        return row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize;
    }

    tryMove(move) {
        if (this.state.moves <= 0 || this.state.isAnimating) {
            return false;
        }
        
        if (!this.isValidMove(move)) {
            return false;
        }
        
        this.swapElements(move.from, move.to);
        
        const matches = this.findAllMatches();
        
        if (matches.length === 0) {
            this.swapElements(move.from, move.to);
            return false;
        }
        
        this.state.moves--;
        this.processMatches(matches);
        
        return true;
    }

    isValidMove(move) {
        if (!this.isValidPosition(move.from.row, move.from.col) ||
            !this.isValidPosition(move.to.row, move.to.col)) {
            return false;
        }
        
        const rowDiff = Math.abs(move.to.row - move.from.row);
        const colDiff = Math.abs(move.to.col - move.from.col);
        
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    swapElements(pos1, pos2) {
        const temp = this.state.board[pos1.row][pos1.col];
        this.state.board[pos1.row][pos1.col] = this.state.board[pos2.row][pos2.col];
        this.state.board[pos2.row][pos2.col] = temp;
    }

    findAllMatches() {
        const matches = [];
        
        // Горизонтальные совпадения
        for (let row = 0; row < this.boardSize; row++) {
            let count = 1;
            let currentType = this.state.board[row][0];
            
            for (let col = 1; col <= this.boardSize; col++) {
                if (col < this.boardSize && this.state.board[row][col] === currentType && currentType !== null) {
                    count++;
                } else {
                    if (count >= GAME_CONSTANTS.MIN_MATCH_LENGTH && currentType !== null) {
                        const elements = [];
                        for (let i = col - count; i < col; i++) {
                            elements.push({ row, col: i });
                        }
                        matches.push({ elements, type: currentType });
                    }
                    count = 1;
                    currentType = col < this.boardSize ? this.state.board[row][col] : null;
                }
            }
        }
        
        // Вертикальные совпадения
        for (let col = 0; col < this.boardSize; col++) {
            let count = 1;
            let currentType = this.state.board[0][col];
            
            for (let row = 1; row <= this.boardSize; row++) {
                if (row < this.boardSize && this.state.board[row][col] === currentType && currentType !== null) {
                    count++;
                } else {
                    if (count >= GAME_CONSTANTS.MIN_MATCH_LENGTH && currentType !== null) {
                        const elements = [];
                        for (let i = row - count; i < row; i++) {
                            elements.push({ row: i, col });
                        }
                        matches.push({ elements, type: currentType });
                    }
                    count = 1;
                    currentType = row < this.boardSize ? this.state.board[row][col] : null;
                }
            }
        }
        
        return matches;
    }

    processMatches(matches) {
        const positionsToRemove = new Set();
        
        matches.forEach(match => {
            match.elements.forEach(pos => {
                positionsToRemove.add(`${pos.row},${pos.col}`);
                this.state.score += 10;
            });
            
            this.state.score += (match.elements.length - 3) * 5;
        });
        
        positionsToRemove.forEach(posStr => {
            const [row, col] = posStr.split(',').map(Number);
            this.state.board[row][col] = null;
        });
        
        this.fillEmptySpaces();
        
        const newMatches = this.findAllMatches();
        if (newMatches.length > 0) {
            setTimeout(() => this.processMatches(newMatches), 300);
        } else {
            if (!this.hasValidMoves()) {
                if (this.state.moves > 0) {
                    this.shuffleBoard();
                } else {
                    this.state.isAnimating = false;
                }
            } else {
                this.state.isAnimating = false;
            }
        }
    }

    fillEmptySpaces() {
        for (let col = 0; col < this.boardSize; col++) {
            const elements = [];
            for (let row = this.boardSize - 1; row >= 0; row--) {
                if (this.state.board[row][col] !== null) {
                    elements.push(this.state.board[row][col]);
                }
            }
            
            for (let row = 0; row < this.boardSize; row++) {
                if (row < elements.length) {
                    this.state.board[row][col] = elements[elements.length - 1 - row];
                } else {
                    this.state.board[row][col] = this.getRandomElementType(row, col);
                }
            }
        }
    }

    shuffleBoard() {
        const elements = [];
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                if (this.state.board[row][col] !== null) {
                    elements.push(this.state.board[row][col]);
                }
            }
        }
        
        for (let i = elements.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [elements[i], elements[j]] = [elements[j], elements[i]];
        }
        
        let index = 0;
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                this.state.board[row][col] = elements[index++];
            }
        }
    }

    checkMatchesAt(row, col) {
        const matches = [];
        const type = this.state.board[row][col];
        
        if (type === null) return matches;
        
        let horizontalElements = [{ row, col }];
        
        for (let c = col - 1; c >= 0 && this.state.board[row][c] === type; c--) {
            horizontalElements.unshift({ row, col: c });
        }
        
        for (let c = col + 1; c < this.boardSize && this.state.board[row][c] === type; c++) {
            horizontalElements.push({ row, col: c });
        }
        
        if (horizontalElements.length >= GAME_CONSTANTS.MIN_MATCH_LENGTH) {
            matches.push({ elements: horizontalElements, type: type });
        }
        
        let verticalElements = [{ row, col }];
        
        for (let r = row - 1; r >= 0 && this.state.board[r][col] === type; r--) {
            verticalElements.unshift({ row: r, col });
        }
        
        for (let r = row + 1; r < this.boardSize && this.state.board[r][col] === type; r++) {
            verticalElements.push({ row: r, col });
        }
        
        if (verticalElements.length >= GAME_CONSTANTS.MIN_MATCH_LENGTH) {
            matches.push({ elements: verticalElements, type: type });
        }
        
        return matches;
    }

    getState() {
        return { ...this.state };
    }

    getBoard() {
        return this.state.board.map(row => [...row]);
    }

    isGameOver() {
        return this.state.moves <= 0;
    }

    isLevelComplete() {
        return this.state.score >= 1000;
    }

    getScore() {
        return this.state.score;
    }

    getMoves() {
        return this.state.moves;
    }

    setSelectedElement(position) {
        this.state.selectedElement = position;
    }

    getSelectedElement() {
        return this.state.selectedElement;
    }

    setAnimating(animating) {
        this.state.isAnimating = animating;
    }

    resetGame() {
        this.state.score = 0;
        this.state.moves = this.config.initialMoves;
        this.state.selectedElement = null;
        this.state.isAnimating = false;
        this.initializeBoard();
    }
}

// Рендерер игры
class GameRenderer {
    constructor(canvas) {
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

    calculateElementSize() {
        const canvasSize = Math.min(window.innerWidth - 40, 400);
        this.elementSize = canvasSize / this.boardSize;
        
        this.canvas.width = canvasSize;
        this.canvas.height = canvasSize;
        this.canvas.style.width = canvasSize + 'px';
        this.canvas.style.height = canvasSize + 'px';
    }

    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }

    render(gameState) {
        this.clearCanvas();
        this.renderGrid();
        this.renderElements(gameState);
        
        if (gameState.selectedElement) {
            this.renderSelection(gameState.selectedElement);
        }
    }

    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    renderGrid() {
        this.ctx.strokeStyle = '#e9ecef';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i <= this.boardSize; i++) {
            const x = i * this.elementSize;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let i = 0; i <= this.boardSize; i++) {
            const y = i * this.elementSize;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    renderElements(gameState) {
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

    renderElement(row, col, type) {
        const x = col * this.elementSize;
        const y = row * this.elementSize;
        
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 2;
        
        const gradient = this.createElementGradient(x, y, type);
        this.ctx.fillStyle = gradient;
        
        this.drawRoundedRect(x + 2, y + 2, this.elementSize - 4, this.elementSize - 4, 8);
        this.ctx.fill();
        
        this.ctx.shadowColor = 'transparent';
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = `bold ${this.elementSize * 0.4}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        const symbolX = x + this.elementSize / 2;
        const symbolY = y + this.elementSize / 2;
        
        this.ctx.fillText(ELEMENT_SYMBOLS[type], symbolX, symbolY);
        
        this.renderElementHighlight(x, y);
    }

    createElementGradient(x, y, type) {
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

    lightenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }

    darkenColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) - amt;
        const G = (num >> 8 & 0x00FF) - amt;
        const B = (num & 0x0000FF) - amt;
        return "#" + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
            (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
            (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
    }

    drawRoundedRect(x, y, width, height, radius) {
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

    renderElementHighlight(x, y) {
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

    renderSelection(position) {
        const x = position.col * this.elementSize;
        const y = position.row * this.elementSize;
        
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

    resize() {
        this.calculateElementSize();
        this.setupCanvas();
    }

    destroy() {
        // Очистка ресурсов
    }
}

// Контроллер касаний
class TouchController {
    constructor(canvas, onTap, onSwipe) {
        this.canvas = canvas;
        this.onTap = onTap;
        this.onSwipe = onSwipe;
        this.startPosition = null;
        this.startTime = 0;
        this.isDragging = false;
        this.lastPosition = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        this.canvas.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false });

        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));

        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    handleTouchStart(event) {
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

    handleTouchMove(event) {
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

    handleTouchEnd(event) {
        if (!this.startPosition) return;
        
        event.preventDefault();
        const duration = Date.now() - this.startTime;
        
        if (this.isDragging && this.lastPosition) {
            const distance = this.calculateDistance(this.startPosition, this.lastPosition);
            
            if (distance > GAME_CONSTANTS.SWIPE_THRESHOLD) {
                const direction = this.getSwipeDirection(this.startPosition, this.lastPosition);
                this.onSwipe(this.startPosition, this.lastPosition, direction);
            } else {
                this.onTap(this.startPosition);
            }
        } else {
            if (duration < 500) {
                this.onTap(this.startPosition);
            }
        }
        
        this.resetState();
    }

    handleTouchCancel(event) {
        this.resetState();
    }

    handleMouseDown(event) {
        event.preventDefault();
        const position = this.getPositionFromCoordinates(event.clientX, event.clientY);
        
        if (position) {
            this.startPosition = position;
            this.startTime = Date.now();
            this.isDragging = false;
            this.lastPosition = position;
        }
    }

    handleMouseMove(event) {
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

    handleMouseUp(event) {
        if (!this.startPosition) return;
        
        event.preventDefault();
        const duration = Date.now() - this.startTime;
        
        if (this.isDragging && this.lastPosition) {
            const distance = this.calculateDistance(this.startPosition, this.lastPosition);
            
            if (distance > GAME_CONSTANTS.SWIPE_THRESHOLD) {
                const direction = this.getSwipeDirection(this.startPosition, this.lastPosition);
                this.onSwipe(this.startPosition, this.lastPosition, direction);
            } else {
                this.onTap(this.startPosition);
            }
        } else {
            if (duration < 500) {
                this.onTap(this.startPosition);
            }
        }
        
        this.resetState();
    }

    handleMouseLeave(event) {
        this.resetState();
    }

    getPositionFromCoordinates(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        if (x < 0 || x >= rect.width || y < 0 || y >= rect.height) {
            return null;
        }
        
        const elementSize = rect.width / GAME_CONSTANTS.BOARD_SIZE;
        const col = Math.floor(x / elementSize);
        const row = Math.floor(y / elementSize);
        
        if (row >= 0 && row < GAME_CONSTANTS.BOARD_SIZE && 
            col >= 0 && col < GAME_CONSTANTS.BOARD_SIZE) {
            return { row, col };
        }
        
        return null;
    }

    calculateDistance(pos1, pos2) {
        const dx = pos2.col - pos1.col;
        const dy = pos2.row - pos1.row;
        return Math.sqrt(dx * dx + dy * dy);
    }

    getSwipeDirection(from, to) {
        const dx = to.col - from.col;
        const dy = to.row - from.row;
        
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

    resetState() {
        this.startPosition = null;
        this.lastPosition = null;
        this.isDragging = false;
        this.startTime = 0;
    }

    destroy() {
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

// Основной класс игры
class Game {
    constructor(canvas, config) {
        this.canvas = canvas;
        
        this.gameLogic = new GameLogic(config);
        this.renderer = new GameRenderer(canvas);
        
        this.scoreElement = document.getElementById('score');
        this.movesElement = document.getElementById('moves');
        this.newGameBtn = document.getElementById('newGameBtn');
        this.hintBtn = document.getElementById('hintBtn');
        this.messagesElement = document.getElementById('gameMessages');
        
        this.touchController = new TouchController(
            canvas,
            this.handleTap.bind(this),
            this.handleSwipe.bind(this)
        );
        
        this.setupEventListeners();
        this.start();
    }

    setupEventListeners() {
        this.newGameBtn.addEventListener('click', () => {
            this.newGame();
        });
        
        this.hintBtn.addEventListener('click', () => {
            this.showHint();
        });
        
        window.addEventListener('resize', () => {
            this.renderer.resize();
        });
        
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.renderer.resize();
            }, 100);
        });
    }

    start() {
        this.isRunning = true;
        this.gameLoop();
    }

    gameLoop() {
        if (!this.isRunning) return;
        
        this.updateUI();
        this.renderer.render(this.gameLogic.getState());
        this.animationFrame = requestAnimationFrame(() => this.gameLoop());
    }

    updateUI() {
        const state = this.gameLogic.getState();
        this.scoreElement.textContent = state.score.toString();
        this.movesElement.textContent = state.moves.toString();
        
        if (state.moves <= 0) {
            this.endGame();
        } else if (this.gameLogic.isLevelComplete()) {
            this.completeLevel();
        }
    }

    handleTap(position) {
        const state = this.gameLogic.getState();
        
        if (state.isAnimating || state.moves <= 0) {
            return;
        }
        
        if (state.selectedElement) {
            const move = {
                from: state.selectedElement,
                to: position
            };
            
            if (this.gameLogic.tryMove(move)) {
                this.gameLogic.setSelectedElement(null);
                this.gameLogic.setAnimating(true);
                
                setTimeout(() => {
                    this.gameLogic.setAnimating(false);
                }, 300);
            } else {
                this.gameLogic.setSelectedElement(position);
            }
        } else {
            this.gameLogic.setSelectedElement(position);
        }
    }

    handleSwipe(from, to) {
        const move = { from, to };
        
        if (this.gameLogic.tryMove(move)) {
            this.gameLogic.setSelectedElement(null);
            this.gameLogic.setAnimating(true);
            
            setTimeout(() => {
                this.gameLogic.setAnimating(false);
            }, 300);
        }
    }

    showHint() {
        const state = this.gameLogic.getState();
        
        if (state.isAnimating || state.moves <= 0) {
            return;
        }
        
        const hint = this.findAvailableMove();
        
        if (hint) {
            this.gameLogic.setSelectedElement(hint.from);
            
            setTimeout(() => {
                this.gameLogic.setSelectedElement(null);
            }, 2000);
            
            this.showMessage('Подсказка показана!', 1000);
        } else {
            this.showMessage('Доступных ходов нет!', 1500);
        }
    }

    findAvailableMove() {
        const board = this.gameLogic.getBoard();
        
        for (let row = 0; row < GAME_CONSTANTS.BOARD_SIZE; row++) {
            for (let col = 0; col < GAME_CONSTANTS.BOARD_SIZE; col++) {
                const directions = [
                    { dr: -1, dc: 0 },
                    { dr: 1, dc: 0 },
                    { dr: 0, dc: -1 },
                    { dr: 0, dc: 1 }
                ];
                
                for (const dir of directions) {
                    const newRow = row + dir.dr;
                    const newCol = col + dir.dc;
                    
                    if (newRow >= 0 && newRow < GAME_CONSTANTS.BOARD_SIZE &&
                        newCol >= 0 && newCol < GAME_CONSTANTS.BOARD_SIZE) {
                        
                        const move = {
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

    wouldCreateMatch(move) {
        const board = this.gameLogic.getBoard();
        
        const temp = board[move.from.row][move.from.col];
        board[move.from.row][move.from.col] = board[move.to.row][move.to.col];
        board[move.to.row][move.to.col] = temp;
        
        const hasMatch1 = this.checkMatchesAt(board, move.from.row, move.from.col);
        const hasMatch2 = this.checkMatchesAt(board, move.to.row, move.to.col);
        
        return hasMatch1 || hasMatch2;
    }

    checkMatchesAt(board, row, col) {
        const type = board[row][col];
        if (type === null) return false;
        
        let horizontalCount = 1;
        
        for (let c = col - 1; c >= 0 && board[row][c] === type; c--) {
            horizontalCount++;
        }
        
        for (let c = col + 1; c < GAME_CONSTANTS.BOARD_SIZE && board[row][c] === type; c++) {
            horizontalCount++;
        }
        
        if (horizontalCount >= GAME_CONSTANTS.MIN_MATCH_LENGTH) {
            return true;
        }
        
        let verticalCount = 1;
        
        for (let r = row - 1; r >= 0 && board[r][col] === type; r--) {
            verticalCount++;
        }
        
        for (let r = row + 1; r < GAME_CONSTANTS.BOARD_SIZE && board[r][col] === type; r++) {
            verticalCount++;
        }
        
        return verticalCount >= GAME_CONSTANTS.MIN_MATCH_LENGTH;
    }

    endGame() {
        this.isRunning = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        const score = this.gameLogic.getScore();
        this.showMessage(`Игра окончена! Очки: ${score}`, 3000);
    }

    completeLevel() {
        this.isRunning = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        const score = this.gameLogic.getScore();
        this.showMessage(`Уровень пройден! Очки: ${score}`, 3000);
        
        this.gameLogic.config.onLevelComplete();
    }

    newGame() {
        this.gameLogic.resetGame();
        this.isRunning = true;
        this.gameLoop();
        this.showMessage('Новая игра началась!', 1500);
    }

    showMessage(text, duration) {
        this.messagesElement.textContent = text;
        this.messagesElement.classList.add('show');
        
        setTimeout(() => {
            this.messagesElement.classList.remove('show');
        }, duration);
    }

    destroy() {
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
    const canvas = document.getElementById('gameBoard');
    
    if (!canvas) {
        console.error('Canvas элемент не найден!');
        return;
    }
    
    const config = {
        boardSize: GAME_CONSTANTS.BOARD_SIZE,
        elementTypes: GAME_CONSTANTS.ELEMENT_TYPES,
        initialMoves: GAME_CONSTANTS.INITIAL_MOVES,
        onLevelComplete: () => {
            console.log('Уровень пройден!');
        }
    };
    
    const game = new Game(canvas, config);
    
    // Сохраняем ссылку на игру для отладки
    window.game = game;
});
