import { ScaleHelper } from '../utils/ScaleHelper.js';
import { SCALE_CONFIG, GAME_CONFIG, TEXT_SCALE_CONFIG } from '../config/GameConfig.js';

export class Start extends Phaser.Scene {

    constructor() {
        super('Start');
    }

    preload() {
        this.load.image('background', 'assets/back/back_2.png');
        this.load.image('logo', 'assets/name.gif');
        this.load.image('playButton', 'assets/buttons/play_1.png');
        this.load.image('playButtonPressed', 'assets/buttons/play_2.png');
        this.load.image('homeButton', 'assets/buttons/home_1.png');
        this.load.image('homeButtonPressed', 'assets/buttons/home_2.png');
    }

    create() {
        const { width, height } = this.scale;
        this.background = this.add.tileSprite(width / 2, height / 2, width, height, 'background');
        const logo = this.add.image(width / 2, height * 0.3, 'logo');
        // Адаптивное масштабирование
        ScaleHelper.adaptiveScaleWidth(this, logo, 'logo', SCALE_CONFIG.LOGO);
        const playButton = this.add.image(width / 2, height * 0.55, 'playButton')
            .setInteractive({ useHandCursor: true });
        ScaleHelper.adaptiveScaleWidth(this, playButton, 'playButton', SCALE_CONFIG.START_BUTTONS);

        const homeButton = this.add.image(width / 2, height * 0.7, 'homeButton')
            .setInteractive({ useHandCursor: true });
        ScaleHelper.adaptiveScaleWidth(this, homeButton, 'homeButton', SCALE_CONFIG.START_BUTTONS);
        playButton.on('pointerdown', () => {
            playButton.setTexture('playButtonPressed');
        });

        playButton.on('pointerup', () => {
            playButton.setTexture('playButton');
            const randomGame = Math.random() < 0.5 ? 'Game' : 'Match3';
            this.scene.start(randomGame);
        });

        homeButton.on('pointerdown', () => {
            homeButton.setTexture('homeButtonPressed');
        });

        homeButton.on('pointerup', () => {
            homeButton.setTexture('homeButton');
        });

        this.tweens.add({
            targets: logo,
            y: height * 0.35,
            duration: 1500,
            ease: 'Sine.inOut',
            yoyo: true,
            loop: -1
        });

        this.scale.on('resize', () => {
            const { width: newWidth, height: newHeight } = this.scale;
            this.background.setSize(newWidth, newHeight);
            this.background.setPosition(newWidth / 2, newHeight / 2);
            ScaleHelper.adaptiveScaleWidth(this, logo, 'logo', SCALE_CONFIG.LOGO);
            ScaleHelper.adaptiveScaleWidth(this, playButton, 'playButton', SCALE_CONFIG.START_BUTTONS);
            ScaleHelper.adaptiveScaleWidth(this, homeButton, 'homeButton', SCALE_CONFIG.START_BUTTONS);
            logo.setPosition(newWidth / 2, newHeight * 0.3);
            playButton.setPosition(newWidth / 2, newHeight * 0.55);
            homeButton.setPosition(newWidth / 2, newHeight * 0.7);
        });
    }

    update() {}
    
}
