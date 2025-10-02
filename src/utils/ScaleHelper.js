// Утилита для автоматического масштабирования спрайтов
export class ScaleHelper {
    static adaptiveScale(scene, sprite, textureKey, config) {
        const texture = scene.textures.get(textureKey);
        const { width } = scene.scale;
        
        if (texture && texture.source && texture.source[0]) {
            const originalWidth = texture.source[0].width;
            const originalHeight = texture.source[0].height;
            
            // Вычисляем размер на основе процента от ширины экрана
            const targetSize = Math.min(
                Math.max(width * config.MAX_SIZE_PERCENT, config.MIN_SIZE || 0),
                config.MAX_SIZE || Infinity
            );
            
            const scale = Math.min(targetSize / originalWidth, targetSize / originalHeight);
            sprite.setScale(scale);
            return scale;
        } else {
            sprite.setScale(config.FALLBACK_SCALE || 1);
            return config.FALLBACK_SCALE || 1;
        }
    }
    
    static adaptiveScaleWidth(scene, sprite, textureKey, config) {
        const texture = scene.textures.get(textureKey);
        const { width } = scene.scale;
        
        if (texture && texture.source && texture.source[0]) {
            const originalWidth = texture.source[0].width;
            
            // Вычисляем ширину на основе процента от ширины экрана
            const targetWidth = Math.min(
                Math.max(width * config.MAX_WIDTH_PERCENT, config.MIN_WIDTH || 0),
                config.MAX_WIDTH || Infinity
            );
            
            const scale = Math.min(targetWidth / originalWidth, 1);
            sprite.setScale(scale);
            return scale;
        } else {
            sprite.setScale(config.FALLBACK_SCALE || 1);
            return config.FALLBACK_SCALE || 1;
        }
    }
    
    static scaleToMaxSize(scene, sprite, textureKey, maxSize, fallbackScale = 1) {
        const texture = scene.textures.get(textureKey);
        
        if (texture && texture.source && texture.source[0]) {
            const originalWidth = texture.source[0].width;
            const originalHeight = texture.source[0].height;
            const scale = Math.min(maxSize / originalWidth, maxSize / originalHeight);
            sprite.setScale(scale);
            return scale;
        } else {
            sprite.setScale(fallbackScale);
            return fallbackScale;
        }
    }
    
    static scaleToMaxWidth(scene, sprite, textureKey, maxWidth, fallbackScale = 1) {
        const texture = scene.textures.get(textureKey);
        
        if (texture && texture.source && texture.source[0]) {
            const originalWidth = texture.source[0].width;
            const scale = Math.min(maxWidth / originalWidth, 1);
            sprite.setScale(scale);
            return scale;
        } else {
            sprite.setScale(fallbackScale);
            return fallbackScale;
        }
    }

    static scaleToMaxHeight(scene, sprite, textureKey, maxHeight, fallbackScale = 1) {
        const texture = scene.textures.get(textureKey);
        
        if (texture && texture.source && texture.source[0]) {
            const originalHeight = texture.source[0].height;
            const scale = Math.min(maxHeight / originalHeight, 1);
            sprite.setScale(scale);
            return scale;
        } else {
            sprite.setScale(fallbackScale);
            return fallbackScale;
        }
    }
    
    static getTextureSize(scene, textureKey) {
        const texture = scene.textures.get(textureKey);
        
        if (texture && texture.source && texture.source[0]) {
            return {
                width: texture.source[0].width,
                height: texture.source[0].height
            };
        }
        
        return null;
    }

    static createAdaptiveTextStyle(scene, baseStyle) {
        const { width, height } = scene.scale;
        
        // Простая логика масштабирования
        const baseWidth = 375;
        const baseHeight = 667;
        const widthScale = width / baseWidth;
        const heightScale = height / baseHeight;
        const scaleFactor = Math.min(widthScale, heightScale, 1.5);
        
        const adaptiveStyle = { ...baseStyle };
        
        // Адаптируем размер шрифта
        if (baseStyle.fontSize) {
            const scaledSize = Math.round(baseStyle.fontSize * scaleFactor);
            // Ограничиваем размеры для читаемости
            const finalSize = Math.max(12, Math.min(scaledSize, baseStyle.fontSize * 1.5));
            adaptiveStyle.fontSize = finalSize + 'px';
        }
        
        return adaptiveStyle;
    }
    
    static createAdaptiveText(scene, x, y, text, baseStyle) {
        const adaptiveStyle = this.createAdaptiveTextStyle(scene, baseStyle);
        return scene.add.text(x, y, text, adaptiveStyle);
    }
    
    static updateTextStyle(scene, textObject, baseStyle) {
        const adaptiveStyle = this.createAdaptiveTextStyle(scene, baseStyle);
        textObject.setStyle(adaptiveStyle);
    }
}
