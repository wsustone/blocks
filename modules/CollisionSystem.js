export class CollisionSystem {
    constructor(gameEngine, ballPhysics, enemySystem) {
        this.engine = gameEngine;
        this.ballPhysics = ballPhysics;
        this.enemySystem = enemySystem;
    }
    
    checkCollisions() {
        for (let b = this.engine.balls.length - 1; b >= 0; b--) {
            const ball = this.engine.balls[b];
            for (let e = this.engine.enemies.length - 1; e >= 0; e--) {
                const enemy = this.engine.enemies[e];
                if (!enemy) continue;
                
                // Check collision between ball and enemy
                const dx = ball.x - (enemy.x + enemy.width / 2);
                const dy = ball.y - (enemy.y + enemy.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < ball.radius + enemy.width / 2) {
                    // Apply damage and bounce
                    const enemyDestroyed = this.handleCollision(ball, enemy, e, dx, dy, distance);
                    if (enemyDestroyed) {
                        break;
                    }
                }
            }
        }
    }
    
    handleCollision(ball, enemy, enemyIndex, dx, dy, distance) {
        // Calculate damage based on ball velocity and enemy type
        const velocityMagnitude = this.ballPhysics.getVelocityMagnitude(ball);
        const damage = this.engine.ballDamage * enemy.damageMultiplier * (1 + velocityMagnitude * 0.1);
        
        // Apply damage
        const wasKilled = this.enemySystem.applyDamage(enemy, damage, enemyIndex);
        
        // Calculate bounce (reduced if enemy is damaged)
        const healthRatio = enemy.health / enemy.maxHealth;
        const modifiedBounceCoeff = enemy.bounceCoefficient * (0.5 + healthRatio * 0.5);
        
        // Apply bounce physics
        this.applyBounce(ball, enemy, dx, dy, distance, modifiedBounceCoeff);
        
        // Add visual feedback
        enemy.rotation += 0.1;
        
        return wasKilled;
    }
    
    applyBounce(ball, enemy, dx, dy, distance, bounceCoefficient) {
        // Normalize collision vector
        const nx = dx / distance;
        const ny = dy / distance;
        
        // Calculate relative velocity
        const relativeVelocity = ball.vx * nx + ball.vy * ny;
        
        // Don't bounce if objects are moving apart
        if (relativeVelocity > 0) return;
        
        // Calculate bounce impulse
        const impulse = 2 * relativeVelocity * bounceCoefficient;
        
        // Apply bounce to ball velocity
        ball.vx -= impulse * nx;
        ball.vy -= impulse * ny;
        
        // Separate objects to prevent overlap
        const overlap = (ball.radius + enemy.width / 2) - distance;
        const separationX = nx * overlap * 1.1;
        const separationY = ny * overlap * 1.1;
        
        ball.x += separationX;
        ball.y += separationY;
    }
}
