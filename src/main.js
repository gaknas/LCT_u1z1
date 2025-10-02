import { Start } from './scenes/Start.js';
import { Game } from './scenes/Game.js';
import { Match3 } from './scenes/Match3.js';
import { Situation } from './scenes/Situation.js';
import { LevelComplete } from './scenes/LevelComplete.js';
import { GAME_CONFIG } from './config/GameConfig.js';

const config = {
    type: Phaser.AUTO,
    title: 'Catch Game',
    description: 'Mobile vertical catching game',
    parent: 'game-container',
    width: 375, // Мобильная ширина
    height: 667, // Мобильная высота (iPhone 6/7/8 размер)
    backgroundColor: '#040218',
    pixelArt: false,
    scene: [
        Start,
        Game,
        Match3,
        Situation,
        LevelComplete
    ],
    scale: {
        mode: Phaser.Scale.RESIZE, // Используем RESIZE для лучшей адаптивности
        autoCenter: Phaser.Scale.CENTER_BOTH,
        min: {
            width: 320,
            height: 568
        },
        max: {
            width: 414,
            height: 896
        },
        // Добавляем обработчики изменения размера
        resizeInterval: 100 // Минимальный интервал между вызовами resize
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: GAME_CONFIG.PHYSICS.GRAVITY_Y },
            debug: false
        }
    },
    input: {
        activePointers: 3 // Поддержка мультитач
    },
    // Настройки для лучшей производительности на мобильных устройствах
    render: {
        antialias: true,
        pixelArt: false
    }
}

new Phaser.Game(config);
            