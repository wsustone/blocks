export class GameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.balls = [];
        this.enemies = [];
        
        // Physics constants
        this.gravity = 0.5;
        this.friction = 0.99;
        this.bounce = 0.7;
        
        // Turn-based system
        this.baseBallsPerTurn = 5;
        this.maxBallsPerTurn = this.baseBallsPerTurn;
        this.ballsDroppedThisTurn = 0;
        this.totalBallsDropped = 0; // Track total balls dropped for health scaling
        this.pendingBonusBalls = 0;
        this.currentTurn = 'player'; // 'player' or 'enemy'
        this.turnTimer = 0;
        this.enemyMoveSpeed = 0.15;
        this.enemyMovementRequested = false;
        
        // Damage system
        this.ballDamage = 25;
        
        this.setupCanvas();
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
    
    setupEventListeners(createBallCallback) {
        // Mouse events
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            createBallCallback(x, y);
        });
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const x = touch.clientX - rect.left;
            const y = touch.clientY - rect.top;
            createBallCallback(x, y);
        });
    }
    
    updateTurns() {
        this.turnTimer++;
        
        // Switch turns every 300 frames (about 5 seconds at 60fps)
        if (this.turnTimer > 300) {
            this.turnTimer = 0;
            
            if (this.currentTurn === 'player') {
                // Player turns now end when balls are spent; timer only used for enemy phase visuals
                return false;
            } else {
                // Switch to player turn
                this.currentTurn = 'player';
                this.ballsDroppedThisTurn = 0;
            }
            return true; // Turn changed
        }
        return false;
    }
    
    endTurn() {
        if (this.currentTurn !== 'player') return;
        this.ballsDroppedThisTurn = this.maxBallsPerTurn;
        this.turnTimer = 0;
        if (this.balls.length === 0) {
            this.requestEnemyMovement();
        }
    }
    
    canDropBall() {
        return this.currentTurn === 'player'
            && !this.enemyMovementRequested
            && this.ballsDroppedThisTurn < this.maxBallsPerTurn;
    }
    
    clearBalls() {
        this.balls = [];
    }
    
    getTurnInfo() {
        return {
            currentTurn: this.currentTurn,
            ballsDropped: this.ballsDroppedThisTurn,
            maxBalls: this.maxBallsPerTurn,
            ballCount: this.balls.length,
            enemyCount: this.enemies.length
        };
    }

    isPlayerTurnComplete() {
        return this.currentTurn === 'player'
            && this.ballsDroppedThisTurn >= this.maxBallsPerTurn
            && this.balls.length === 0;
    }

    requestEnemyMovement() {
        if (this.enemyMovementRequested || this.currentTurn !== 'player') return;
        this.enemyMovementRequested = true;
        this.currentTurn = 'enemy';
        this.turnTimer = 0;
    }

    startNewPlayerTurn() {
        this.currentTurn = 'player';
        this.ballsDroppedThisTurn = 0;
        this.turnTimer = 0;
        this.enemyMovementRequested = false;
        this.maxBallsPerTurn = this.baseBallsPerTurn + this.pendingBonusBalls;
        this.pendingBonusBalls = 0;
    }
    
    addBonusBall(count = 1) {
        this.pendingBonusBalls += count;
    }
}
