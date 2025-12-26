class GravityGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.balls = [];
        this.enemies = [];
        this.gravity = 0.5;
        this.friction = 0.99;
        this.bounce = 0.7;
        
        // Turn-based system
        this.maxBallsPerTurn = 5;
        this.ballsDroppedThisTurn = 0;
        this.currentTurn = 'player'; // 'player' or 'enemy'
        this.turnTimer = 0;
        this.enemyMoveSpeed = 0.15; // Reduced from 0.5
        
        // Damage system
        this.ballDamage = 25; // Base damage per ball hit
        
        this.setupCanvas();
        this.setupEventListeners();
        this.gameLoop();
    }
    
    setupCanvas() {
        // Set canvas size for mobile-friendly dimensions
        this.canvas.width = Math.min(window.innerWidth - 20, 800);
        this.canvas.height = Math.min(window.innerHeight - 100, 600);
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.canvas.width = Math.min(window.innerWidth - 20, 800);
            this.canvas.height = Math.min(window.innerHeight - 100, 600);
        });
    }
    
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.createBall(x, y);
        });
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            this.createBall(x, y);
        });
    }
    
    createEnemy() {
        const types = [
            { 
                name: 'normal', 
                color: '#FF4444', 
                bounceCoefficient: 0.8,
                speedMultiplier: 1.0,
                size: 30,
                maxHealth: 100,
                damageMultiplier: 1.0
            },
            { 
                name: 'bouncy', 
                color: '#44FF44', 
                bounceCoefficient: 1.5,
                speedMultiplier: 0.8,
                size: 25,
                maxHealth: 75,
                damageMultiplier: 1.2
            },
            { 
                name: 'sticky', 
                color: '#FF44FF', 
                bounceCoefficient: 0.3,
                speedMultiplier: 1.2,
                size: 35,
                maxHealth: 150,
                damageMultiplier: 0.8
            },
            { 
                name: 'heavy', 
                color: '#4444FF', 
                bounceCoefficient: 0.5,
                speedMultiplier: 0.6,
                size: 40,
                maxHealth: 200,
                damageMultiplier: 0.6
            }
        ];
        
        const type = types[Math.floor(Math.random() * types.length)];
        
        const enemy = {
            x: Math.random() * (this.canvas.width - type.size - 40) + 20,
            y: this.canvas.height - type.size - 10,
            width: type.size,
            height: type.size,
            speed: (this.enemyMoveSpeed + Math.random() * 0.1) * type.speedMultiplier,
            color: type.color,
            type: type.name,
            bounceCoefficient: type.bounceCoefficient,
            rotation: 0,
            health: type.maxHealth,
            maxHealth: type.maxHealth,
            damageMultiplier: type.damageMultiplier,
            flashTimer: 0,
            isDead: false,
            deathAnimation: 0
        };
        
        this.enemies.push(enemy);
    }
    
    updateEnemies() {
        if (this.currentTurn !== 'enemy') return;
        
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // Handle death animation
            if (enemy.isDead) {
                enemy.deathAnimation++;
                if (enemy.deathAnimation > 30) {
                    this.enemies.splice(i, 1);
                    this.updateUI();
                }
                continue;
            }
            
            // Update position
            enemy.y -= enemy.speed;
            
            // Update flash timer
            if (enemy.flashTimer > 0) {
                enemy.flashTimer--;
            }
            
            // Remove enemies that reach the top
            if (enemy.y < -50) {
                this.enemies.splice(i, 1);
                this.updateUI();
            }
        }
        
        // Spawn new enemies periodically
        if (Math.random() < 0.015) { // Reduced spawn rate
            this.createEnemy();
        }
    }
    
    checkCollisions() {
        for (const ball of this.balls) {
            for (const enemy of this.enemies) {
                if (enemy.isDead) continue;
                
                // Check collision between ball and enemy
                const dx = ball.x - (enemy.x + enemy.width / 2);
                const dy = ball.y - (enemy.y + enemy.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < ball.radius + enemy.width / 2) {
                    // Apply damage and bounce
                    this.applyDamage(ball, enemy, dx, dy, distance);
                }
            }
        }
    }
    
    applyDamage(ball, enemy, dx, dy, distance) {
        // Calculate damage based on ball velocity and enemy type
        const velocityMagnitude = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        const damage = this.ballDamage * enemy.damageMultiplier * (1 + velocityMagnitude * 0.1);
        
        // Apply damage
        enemy.health -= damage;
        enemy.flashTimer = 10; // Flash for 10 frames
        
        // Check if enemy is dead
        if (enemy.health <= 0) {
            enemy.isDead = true;
            enemy.health = 0;
        }
        
        // Calculate bounce (reduced if enemy is damaged)
        const healthRatio = enemy.health / enemy.maxHealth;
        const modifiedBounceCoeff = enemy.bounceCoefficient * (0.5 + healthRatio * 0.5);
        
        // Normalize collision vector
        const nx = dx / distance;
        const ny = dy / distance;
        
        // Calculate relative velocity
        const relativeVelocity = ball.vx * nx + ball.vy * ny;
        
        // Don't bounce if objects are moving apart
        if (relativeVelocity > 0) return;
        
        // Calculate bounce impulse
        const impulse = 2 * relativeVelocity * modifiedBounceCoeff;
        
        // Apply bounce to ball velocity
        ball.vx -= impulse * nx;
        ball.vy -= impulse * ny;
        
        // Separate objects to prevent overlap
        const overlap = (ball.radius + enemy.width / 2) - distance;
        const separationX = nx * overlap * 1.1;
        const separationY = ny * overlap * 1.1;
        
        ball.x += separationX;
        ball.y += separationY;
        
        // Add some spin/rotation to enemy for visual effect
        enemy.rotation += 0.1;
        
        this.updateUI();
    }
    
    updateTurns() {
        this.turnTimer++;
        
        // Switch turns every 300 frames (about 5 seconds at 60fps)
        if (this.turnTimer > 300) {
            this.turnTimer = 0;
            
            if (this.currentTurn === 'player') {
                // Switch to enemy turn
                this.currentTurn = 'enemy';
                this.ballsDroppedThisTurn = 0;
            } else {
                // Switch to player turn
                this.currentTurn = 'player';
                this.ballsDroppedThisTurn = 0;
            }
            
            this.updateUI();
        }
    }
    
    createBall(x, y) {
        // Check if player can drop more balls this turn
        if (this.currentTurn !== 'player' || this.ballsDroppedThisTurn >= this.maxBallsPerTurn) {
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
        
        this.balls.push(ball);
        this.ballsDroppedThisTurn++;
        this.updateUI();
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
        for (let i = this.balls.length - 1; i >= 0; i--) {
            const ball = this.balls[i];
            
            // Apply gravity
            ball.vy += this.gravity;
            
            // Apply friction
            ball.vx *= this.friction;
            ball.vy *= this.friction;
            
            // Update position
            ball.x += ball.vx;
            ball.y += ball.vy;
            
            // Add to trail
            ball.trail.push({ x: ball.x, y: ball.y });
            if (ball.trail.length > 10) {
                ball.trail.shift();
            }
            
            // Bounce off walls
            if (ball.x - ball.radius < 0 || ball.x + ball.radius > this.canvas.width) {
                ball.vx = -ball.vx * this.bounce;
                ball.x = ball.x - ball.radius < 0 ? ball.radius : this.canvas.width - ball.radius;
            }
            
            // Bounce off floor
            if (ball.y + ball.radius > this.canvas.height) {
                ball.vy = -ball.vy * this.bounce;
                ball.y = this.canvas.height - ball.radius;
                
                // Remove ball if it's barely moving
                if (Math.abs(ball.vy) < 0.5) {
                    this.balls.splice(i, 1);
                    this.updateUI();
                }
            }
            
            // Remove balls that go off top
            if (ball.y < -50) {
                this.balls.splice(i, 1);
                this.updateUI();
            }
        }
    }
    
    drawGame() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw turn indicator
        this.drawTurnIndicator();
        
        // Draw enemies
        this.drawEnemies();
        
        // Draw balls
        for (const ball of this.balls) {
            // Draw trail
            this.ctx.strokeStyle = ball.color + '40'; // Semi-transparent
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            for (let i = 0; i < ball.trail.length; i++) {
                const point = ball.trail[i];
                if (i === 0) {
                    this.ctx.moveTo(point.x, point.y);
                } else {
                    this.ctx.lineTo(point.x, point.y);
                }
            }
            this.ctx.stroke();
            
            // Draw ball
            this.ctx.fillStyle = ball.color;
            this.ctx.beginPath();
            this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Add highlight
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(ball.x - ball.radius/3, ball.y - ball.radius/3, ball.radius/3, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawEnemies() {
        for (const enemy of this.enemies) {
            this.ctx.save();
            
            // Handle death animation
            if (enemy.isDead) {
                this.ctx.globalAlpha = 1 - (enemy.deathAnimation / 30);
                this.ctx.translate(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
                this.ctx.scale(1 + enemy.deathAnimation * 0.05, 1 + enemy.deathAnimation * 0.05);
                this.ctx.rotate(enemy.rotation + enemy.deathAnimation * 0.2);
                this.ctx.translate(-enemy.width/2, -enemy.height/2);
            } else {
                // Apply rotation for visual effect
                this.ctx.translate(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
                this.ctx.rotate(enemy.rotation);
                this.ctx.translate(-enemy.width/2, -enemy.height/2);
                
                // Flash effect when damaged
                if (enemy.flashTimer > 0 && enemy.flashTimer % 4 < 2) {
                    this.ctx.globalAlpha = 0.6;
                }
            }
            
            // Draw enemy body
            this.ctx.fillStyle = enemy.color;
            this.ctx.fillRect(0, 0, enemy.width, enemy.height);
            
            // Draw health bar
            if (!enemy.isDead && enemy.health < enemy.maxHealth) {
                const healthPercent = enemy.health / enemy.maxHealth;
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                this.ctx.fillRect(2, -8, enemy.width - 4, 4);
                this.ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FFA500' : '#FF4444';
                this.ctx.fillRect(2, -8, (enemy.width - 4) * healthPercent, 4);
            }
            
            // Draw type-specific patterns
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            switch(enemy.type) {
                case 'bouncy':
                    // Draw spring pattern
                    for (let i = 0; i < 3; i++) {
                        this.ctx.fillRect(5, 5 + i * 8, enemy.width - 10, 3);
                    }
                    break;
                case 'sticky':
                    // Draw goo pattern
                    this.ctx.beginPath();
                    this.ctx.arc(enemy.width/2, enemy.height/2, enemy.width/4, 0, Math.PI * 2);
                    this.ctx.fill();
                    break;
                case 'heavy':
                    // Draw weight pattern
                    this.ctx.fillRect(enemy.width/2 - 2, 5, 4, enemy.height - 10);
                    this.ctx.fillRect(5, enemy.height/2 - 2, enemy.width - 10, 4);
                    break;
                default:
                    // Normal - draw simple face
                    this.ctx.fillRect(5, 8, 5, 5);
                    this.ctx.fillRect(enemy.width - 10, 8, 5, 5);
                    this.ctx.fillRect(10, enemy.height - 8, enemy.width - 20, 3);
            }
            
            this.ctx.restore();
        }
    }
    
    drawTurnIndicator() {
        const turnText = this.currentTurn === 'player' ? 'YOUR TURN' : 'ENEMY TURN';
        const turnColor = this.currentTurn === 'player' ? '#4CAF50' : '#FF4444';
        
        this.ctx.fillStyle = turnColor;
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(turnText, this.canvas.width / 2, 30);
        
        if (this.currentTurn === 'player') {
            const ballsText = `Balls: ${this.ballsDroppedThisTurn}/${this.maxBallsPerTurn}`;
            this.ctx.font = '16px Arial';
            this.ctx.fillText(ballsText, this.canvas.width / 2, 55);
        }
    }
    
    gameLoop() {
        this.updateBalls();
        this.updateEnemies();
        this.checkCollisions();
        this.updateTurns();
        this.drawGame();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    updateUI() {
        document.getElementById('ballCount').textContent = this.balls.length;
        document.getElementById('turnInfo').textContent = this.currentTurn === 'player' ? 
            `Your Turn (${this.ballsDroppedThisTurn}/${this.maxBallsPerTurn} balls)` : 'Enemy Turn';
        document.getElementById('enemyCount').textContent = this.enemies.length;
    }
    
    dropBall() {
        // Drop ball from random position at top
        const x = Math.random() * this.canvas.width;
        this.createBall(x, 20);
    }
    
    endTurn() {
        this.turnTimer = 300; // Force turn end
    }
    
    clearBalls() {
        this.balls = [];
        this.updateUI();
    }
}

// Global functions for button controls
let game;

function dropBall() {
    game.dropBall();
}

function clearBalls() {
    game.clearBalls();
}

function endTurn() {
    game.endTurn();
}

// Initialize game when page loads
window.addEventListener('load', () => {
    game = new GravityGame();
});
