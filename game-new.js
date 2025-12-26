import { GameEngine } from './modules/GameEngine.js';
import { BallPhysics } from './modules/BallPhysics.js';
import { EnemySystem } from './modules/EnemySystem.js';
import { CollisionSystem } from './modules/CollisionSystem.js';
import { RenderSystem } from './modules/RenderSystem.js';

class GravityGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.engine = new GameEngine(this.canvas);
        this.ballPhysics = new BallPhysics(this.engine);
        this.enemySystem = new EnemySystem(this.engine);
        this.collisionSystem = new CollisionSystem(this.engine, this.ballPhysics, this.enemySystem);
        this.renderSystem = new RenderSystem(this.engine, this.enemySystem);
        
        this.setupEventListeners();
        this.gameLoop();
    }
    
    setupEventListeners() {
        this.engine.setupEventListeners((x, y) => this.createBall(x, y));
    }
    
    createBall(x, y) {
        const created = this.ballPhysics.createBall(x, y);
        if (created) {
            this.updateUI();
        }
        return created;
    }
    
    gameLoop() {
        // Update game systems
        this.ballPhysics.updateBalls();
        const enemyTurnFinished = this.enemySystem.updateEnemies();
        this.collisionSystem.checkCollisions();
        
        // If player has dropped all balls and none remain active, trigger enemy movement
        if (this.engine.currentTurn === 'player'
            && !this.engine.enemyMovementRequested
            && this.engine.ballsDroppedThisTurn >= this.engine.maxBallsPerTurn
            && this.engine.balls.length === 0) {
            this.engine.requestEnemyMovement();
            this.updateUI();
        }
        
        // Update turns
        const turnChanged = this.engine.updateTurns();
        if (turnChanged || enemyTurnFinished) {
            this.updateUI();
        }
        
        // Render everything
        this.renderSystem.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    updateUI() {
        const turnInfo = this.engine.getTurnInfo();
        document.getElementById('ballCount').textContent = turnInfo.ballCount;
        document.getElementById('enemyCount').textContent = turnInfo.enemyCount;
        
        const turnText = turnInfo.currentTurn === 'player' ? 
            `Your Turn (${turnInfo.ballsDropped}/${turnInfo.maxBalls} balls)` : 'Enemy Turn';
        document.getElementById('turnInfo').textContent = turnText;
    }
    
    dropBall() {
        const x = Math.random() * this.canvas.width;
        this.createBall(x, 20);
    }
    
    endTurn() {
        this.engine.endTurn();
    }
    
    clearBalls() {
        this.engine.clearBalls();
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
