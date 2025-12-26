export class GameEngine {
  constructor({ width, height }) {
    this.width = width;
    this.height = height;

    this.balls = [];
    this.enemies = [];

    this.gravity = 0.5;
    this.friction = 0.99;
    this.bounce = 0.85;

    this.baseBallsPerTurn = 5;
    this.maxBallsPerTurn = this.baseBallsPerTurn;
    this.ballsDroppedThisTurn = 0;
    this.totalBallsDropped = 0;
    this.pendingBonusBalls = 0;

    this.currentTurn = 'player';
    this.turnTimer = 0;
    this.enemyMovementRequested = false;

    this.ballDamage = 25;
    this.score = 0;
    this.comboMultiplier = 1;
    this.comboTimer = 0;
    this.comboWindow = 180;
    this.lastHitEnemyId = null;

    this.gravityWellTemplates = [
      {
        id: 'core-well',
        nx: 0.5,
        ny: 0.4,
        radiusMultiplier: 0.18,
        strength: 2.2,
        tangentialStrength: 1.1,
        rotationSpeed: 0.015,
        oscillation: {
          amplitude: 0.12,
          speed: 0.3,
        },
      },
    ];
    this.gravityWells = [];
    this.rebuildGravityWells();
  }

  setDimensions(width, height) {
    this.width = width;
    this.height = height;
    this.rebuildGravityWells();
  }

  rebuildGravityWells() {
    const scale = Math.min(this.width, this.height);
    this.gravityWells = this.gravityWellTemplates.map((template) => ({
      ...template,
      baseX: template.nx * this.width,
      baseY: template.ny * this.height,
      x: template.nx * this.width,
      y: template.ny * this.height,
      radius: template.radiusMultiplier * scale,
      rotation: 0,
      phase: Math.random() * Math.PI * 2,
    }));
  }

  updateTurns() {
    this.updateEnvironment();
    this.tickCombo();
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

  updateEnvironment(delta = 1 / 60) {
    this.gravityWells.forEach((well) => {
      well.rotation =
        (well.rotation + well.rotationSpeed * delta * 60) % (Math.PI * 2);

      if (well.oscillation) {
        well.phase = (well.phase + well.oscillation.speed * delta) % (Math.PI * 2);
        const horizontalOffset = Math.sin(well.phase) * well.oscillation.amplitude * this.width;
        const verticalOffset =
          Math.cos(well.phase * 0.8) * well.oscillation.amplitude * 0.35 * this.height;

        well.x = well.baseX + horizontalOffset;
        well.y = well.baseY + verticalOffset;
      }
    });
  }

  addScore(baseAmount) {
    const amount = Math.round(baseAmount * this.comboMultiplier);
    this.score += amount;
    return amount;
  }

  registerHit(enemyId) {
    if (this.lastHitEnemyId === enemyId) {
      this.comboMultiplier = Math.min(this.comboMultiplier + 0.1, 3);
    } else {
      this.comboMultiplier = 1.1;
      this.lastHitEnemyId = enemyId;
    }
    this.comboTimer = this.comboWindow;
  }

  registerKill(isFragment = false) {
    this.comboMultiplier = Math.min(
      this.comboMultiplier + (isFragment ? 0.05 : 0.2),
      4
    );
    this.comboTimer = this.comboWindow * 1.2;
  }

  tickCombo() {
    if (this.comboTimer > 0) {
      this.comboTimer -= 1;
      if (this.comboTimer <= 0) {
        this.comboMultiplier = 1;
        this.lastHitEnemyId = null;
      }
    }
  }
}
