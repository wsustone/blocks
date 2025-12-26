export class RenderSystem {
    constructor(gameEngine, enemySystem) {
        this.engine = gameEngine;
        this.enemySystem = enemySystem;
    }
    
    render() {
        // Clear canvas
        this.engine.ctx.clearRect(0, 0, this.engine.canvas.width, this.engine.canvas.height);
        
        // Draw grid
        this.enemySystem.drawGrid(this.engine.ctx);
        
        // Draw turn indicator
        this.drawTurnIndicator();
        
        // Draw enemies
        this.drawEnemies();
        
        // Draw balls
        this.drawBalls();
    }
    
    drawBalls() {
        for (const ball of this.engine.balls) {
            // Draw trail
            this.engine.ctx.strokeStyle = ball.color + '40'; // Semi-transparent
            this.engine.ctx.lineWidth = 2;
            this.engine.ctx.beginPath();
            for (let i = 0; i < ball.trail.length; i++) {
                const point = ball.trail[i];
                if (i === 0) {
                    this.engine.ctx.moveTo(point.x, point.y);
                } else {
                    this.engine.ctx.lineTo(point.x, point.y);
                }
            }
            this.engine.ctx.stroke();
            
            // Draw ball
            this.engine.ctx.fillStyle = ball.color;
            this.engine.ctx.beginPath();
            this.engine.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            this.engine.ctx.fill();
            
            // Special effects for bonus balls
            if (ball.isBonus) {
                // Add glowing effect
                this.engine.ctx.shadowBlur = 15;
                this.engine.ctx.shadowColor = ball.color;
                this.engine.ctx.strokeStyle = ball.color;
                this.engine.ctx.lineWidth = 2;
                this.engine.ctx.beginPath();
                this.engine.ctx.arc(ball.x, ball.y, ball.radius + 3, 0, Math.PI * 2);
                this.engine.ctx.stroke();
                this.engine.ctx.shadowBlur = 0;
                
                // Add star highlight
                this.engine.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                this.engine.ctx.beginPath();
                this.engine.ctx.arc(ball.x - ball.radius/3, ball.y - ball.radius/3, ball.radius/4, 0, Math.PI * 2);
                this.engine.ctx.fill();
            } else {
                // Regular ball highlight
                this.engine.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                this.engine.ctx.beginPath();
                this.engine.ctx.arc(ball.x - ball.radius/3, ball.y - ball.radius/3, ball.radius/3, 0, Math.PI * 2);
                this.engine.ctx.fill();
            }
        }
    }
    
    drawEnemies() {
        for (const enemy of this.engine.enemies) {
            this.engine.ctx.save();
            
            // Handle death animation
            if (enemy.isDead) {
                this.engine.ctx.globalAlpha = 1 - (enemy.deathAnimation / 30);
                this.engine.ctx.translate(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
                this.engine.ctx.scale(1 + enemy.deathAnimation * 0.05, 1 + enemy.deathAnimation * 0.05);
                this.engine.ctx.rotate(enemy.rotation + enemy.deathAnimation * 0.2);
                this.engine.ctx.translate(-enemy.width/2, -enemy.height/2);
            } else {
                // Apply rotation for visual effect
                this.engine.ctx.translate(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
                this.engine.ctx.rotate(enemy.rotation);
                this.engine.ctx.translate(-enemy.width/2, -enemy.height/2);
                
                // Flash effect when damaged
                if (enemy.flashTimer > 0 && enemy.flashTimer % 4 < 2) {
                    this.engine.ctx.globalAlpha = 0.6;
                }
            }
            
            // Draw enemy body
            this.engine.ctx.fillStyle = enemy.color;
            this.engine.ctx.fillRect(0, 0, enemy.width, enemy.height);
            
            // Draw health bar
            if (!enemy.isDead && enemy.health < enemy.maxHealth) {
                const healthPercent = enemy.health / enemy.maxHealth;
                this.engine.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                this.engine.ctx.fillRect(2, -8, enemy.width - 4, 4);
                this.engine.ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FFA500' : '#FF4444';
                this.engine.ctx.fillRect(2, -8, (enemy.width - 4) * healthPercent, 4);
            }
            
            // Draw type-specific patterns
            this.drawEnemyPattern(enemy);
            
            this.engine.ctx.restore();
        }
    }
    
    drawEnemyPattern(enemy) {
        this.engine.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        switch(enemy.type) {
            case 'bouncy':
                // Draw spring pattern
                for (let i = 0; i < 3; i++) {
                    this.engine.ctx.fillRect(5, 5 + i * 8, enemy.width - 10, 3);
                }
                break;
            case 'sticky':
                // Draw goo pattern
                this.engine.ctx.beginPath();
                this.engine.ctx.arc(enemy.width/2, enemy.height/2, enemy.width/4, 0, Math.PI * 2);
                this.engine.ctx.fill();
                break;
            case 'heavy':
                // Draw weight pattern
                this.engine.ctx.fillRect(enemy.width/2 - 2, 5, 4, enemy.height - 10);
                this.engine.ctx.fillRect(5, enemy.height/2 - 2, enemy.width - 10, 4);
                break;
            default:
                // Normal - draw simple face
                this.engine.ctx.fillRect(5, 8, 5, 5);
                this.engine.ctx.fillRect(enemy.width - 10, 8, 5, 5);
                this.engine.ctx.fillRect(10, enemy.height - 8, enemy.width - 20, 3);
        }
    }
    
    drawTurnIndicator() {
        const turnText = this.engine.currentTurn === 'player' ? 'YOUR TURN' : 'ENEMY TURN';
        const turnColor = this.engine.currentTurn === 'player' ? '#4CAF50' : '#FF4444';
        
        this.engine.ctx.fillStyle = turnColor;
        this.engine.ctx.font = 'bold 20px Arial';
        this.engine.ctx.textAlign = 'center';
        this.engine.ctx.fillText(turnText, this.engine.canvas.width / 2, 30);
        
        if (this.engine.currentTurn === 'player') {
            const ballsText = `Balls: ${this.engine.ballsDroppedThisTurn}/${this.engine.maxBallsPerTurn}`;
            this.engine.ctx.font = '16px Arial';
            this.engine.ctx.fillText(ballsText, this.engine.canvas.width / 2, 55);
        }
    }
}
