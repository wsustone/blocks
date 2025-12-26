export class EnemySystem {
    constructor(gameEngine) {
        this.engine = gameEngine;
        this.gridSize = 40; // Size of each grid cell
        this.gridRows = Math.floor(this.engine.canvas.height / this.gridSize);
        this.gridCols = Math.floor(this.engine.canvas.width / this.gridSize);
        
        this.enemyTypes = [
            { 
                name: 'normal', 
                color: '#FF4444', 
                bounceCoefficient: 0.8,
                size: 30,
                maxHealth: 100,
                damageMultiplier: 1.0,
                stepCells: 1
            },
            { 
                name: 'bouncy', 
                color: '#44FF44', 
                bounceCoefficient: 1.5,
                size: 25,
                maxHealth: 75,
                damageMultiplier: 1.2,
                stepCells: 2
            },
            { 
                name: 'sticky', 
                color: '#FF44FF', 
                bounceCoefficient: 0.3,
                size: 35,
                maxHealth: 150,
                damageMultiplier: 0.8,
                stepCells: 1
            },
            { 
                name: 'heavy', 
                color: '#4444FF', 
                bounceCoefficient: 0.5,
                size: 40,
                maxHealth: 200,
                damageMultiplier: 0.6,
                stepCells: 1
            }
        ];

        // Seed initial enemies so gameplay starts with targets
        this.createEnemy();
        this.createEnemy();
    }
    
    createEnemy() {
        const type = this.enemyTypes[Math.floor(Math.random() * this.enemyTypes.length)];
        
        // Scale health based on total balls dropped this game
        const healthMultiplier = 1 + (this.engine.totalBallsDropped || 0) * 0.05;
        const scaledHealth = Math.floor(type.maxHealth * healthMultiplier);
        
        // Position enemy at bottom in grid-aligned position
        const gridX = Math.floor(Math.random() * this.gridCols);
        const pixelX = gridX * this.gridSize + (this.gridSize - type.size) / 2;
        const gridY = this.gridRows - 2; // Start one row up from bottom (to be fully visible)
        const pixelY = gridY * this.gridSize;
        
        const enemy = {
            x: pixelX,
            y: pixelY,
            gridX: gridX,
            gridY: gridY,
            width: type.size,
            height: type.size,
            stepCells: type.stepCells,
            color: type.color,
            type: type.name,
            bounceCoefficient: type.bounceCoefficient,
            rotation: 0,
            health: scaledHealth,
            maxHealth: scaledHealth,
            damageMultiplier: type.damageMultiplier,
            flashTimer: 0,
            isDead: false,
            deathAnimation: 0,
            dropsBall: Math.random() < 0.1 // 10% chance to drop a ball
        };
        
        this.engine.enemies.push(enemy);
    }
    
    updateEnemies() {
        let movementOccurred = false;
        
        if (this.engine.enemyMovementRequested) {
            for (let i = this.engine.enemies.length - 1; i >= 0; i--) {
                const enemy = this.engine.enemies[i];
                
                // Handle death animation
                if (enemy.isDead) {
                    enemy.deathAnimation++;
                    if (enemy.deathAnimation > 30) {
                        this.engine.enemies.splice(i, 1);
                    }
                    continue;
                }
                
                // Update flash timer
                if (enemy.flashTimer > 0) {
                    enemy.flashTimer--;
                }
                
                // Move up by step cells
                enemy.gridY -= enemy.stepCells;
                enemy.y = enemy.gridY * this.gridSize;
                enemy.rotation += 0.1;
                
                // Remove enemies that reach the top
                if (enemy.gridY < 0) {
                    this.engine.enemies.splice(i, 1);
                }
            }
            
            // Spawn new enemies after movement
            if (Math.random() < 0.02) {
                this.createEnemy();
            }
            
            this.engine.startNewPlayerTurn();
            movementOccurred = true;
        }
        
        // Spawn enemies passively during player turn so new threats appear
        if (!this.engine.enemyMovementRequested) {
            const maxEnemies = this.gridCols;
            if (this.engine.enemies.length < maxEnemies && Math.random() < 0.01) {
                this.createEnemy();
            }
        }
        
        return movementOccurred;
    }
    
    drawGrid(ctx) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        // Draw horizontal lines
        for (let row = 0; row <= this.gridRows; row++) {
            ctx.beginPath();
            ctx.moveTo(0, row * this.gridSize);
            ctx.lineTo(this.engine.canvas.width, row * this.gridSize);
            ctx.stroke();
        }
        
        // Draw vertical lines
        for (let col = 0; col <= this.gridCols; col++) {
            ctx.beginPath();
            ctx.moveTo(col * this.gridSize, 0);
            ctx.lineTo(col * this.gridSize, this.engine.canvas.height);
            ctx.stroke();
        }
    }
    
    applyDamage(enemy, damage, enemyIndex) {
        enemy.health -= damage;
        enemy.flashTimer = 10; // Flash for 10 frames
        
        if (enemy.health <= 0) {
            // Award bonus ball for next turn if applicable
            if (enemy.dropsBall) {
                this.engine.addBonusBall();
            }
            
            // Remove the defeated enemy immediately
            this.engine.enemies.splice(enemyIndex, 1);
            return true;
        }
        
        return false;
    }
    
    getEnemyTypeInfo() {
        return this.enemyTypes.map(type => ({
            name: type.name,
            color: type.color,
            bounce: type.bounceCoefficient,
            health: type.maxHealth,
            damage: type.damageMultiplier
        }));
    }
}
