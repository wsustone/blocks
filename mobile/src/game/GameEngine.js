export class GameEngine {
  constructor({ width, height }) {
    this.width = width;
    this.height = height;

    this.balls = [];
    this.enemies = [];

    this.gravity = 0.5;
    this.friction = 0.99;
    this.bounce = 0.7;

    this.baseBallsPerTurn = 5;
    this.maxBallsPerTurn = this.baseBallsPerTurn;
    this.ballsDroppedThisTurn = 0;
    this.totalBallsDropped = 0;
    this.pendingBonusBalls = 0;

    this.currentTurn = 'player';
    this.turnTimer = 0;
    this.enemyMovementRequested = false;

    this.ballDamage = 25;
  }

  setDimensions(width, height) {
    this.width = width;
    this.height = height;
  }

  updateTurns() {
    this.turnTimer += 1;

    if (this.turnTimer > 300) {
      this.turnTimer = 0;
      if (this.currentTurn === 'player') {
        return false;
      }

      this.currentTurn = 'player';
      this.ballsDroppedThisTurn = 0;
      return true;
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
    return (
      this.currentTurn === 'player' &&
      !this.enemyMovementRequested &&
      this.ballsDroppedThisTurn < this.maxBallsPerTurn
    );
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
      enemyCount: this.enemies.length,
      pendingBonus: this.pendingBonusBalls,
    };
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
