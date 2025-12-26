export class BallPhysics {
    constructor(gameEngine) {
        this.engine = gameEngine;
    }
    
    createBall(x, y) {
        if (!this.engine.canDropBall()) {
            return false;
        }
        
        const ball = {
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 2, // Small random horizontal velocity
            vy: 0,
            radius: 10 + Math.random() * 10, // Random size between 10-20
            color: this.getRandomColor(),
            trail: [] // For visual effect
        };
        
        this.engine.balls.push(ball);
        this.engine.ballsDroppedThisTurn++;
        this.engine.totalBallsDropped++; // Track total for health scaling
        return true;
    }
    
    getRandomColor() {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
            '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    updateBalls() {
        let stateChanged = false;
        for (let i = this.engine.balls.length - 1; i >= 0; i--) {
            const ball = this.engine.balls[i];
            
            // Apply gravity
            ball.vy += this.engine.gravity;
            
            // Apply friction
            ball.vx *= this.engine.friction;
            ball.vy *= this.engine.friction;
            
            // Update position
            ball.x += ball.vx;
            ball.y += ball.vy;
            
            // Add to trail
            ball.trail.push({ x: ball.x, y: ball.y });
            if (ball.trail.length > 10) {
                ball.trail.shift();
            }
            
            // Bounce off walls
            if (ball.x - ball.radius < 0 || ball.x + ball.radius > this.engine.canvas.width) {
                ball.vx = -ball.vx * this.engine.bounce;
                ball.x = ball.x - ball.radius < 0 ? ball.radius : this.engine.canvas.width - ball.radius;
            }
            
            // Bounce off floor
            if (ball.y + ball.radius > this.engine.canvas.height) {
                ball.vy = -ball.vy * this.engine.bounce;
                ball.y = this.engine.canvas.height - ball.radius;
                
                // Remove ball if it's barely moving
                if (Math.abs(ball.vy) < 0.5) {
                    this.engine.balls.splice(i, 1);
                    stateChanged = true;
                }
            }
            
            // Remove balls that go off top
            if (ball.y < -50) {
                this.engine.balls.splice(i, 1);
                stateChanged = true;
            }
        }
        return stateChanged;
    }
    
    getVelocityMagnitude(ball) {
        return Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    }
}
