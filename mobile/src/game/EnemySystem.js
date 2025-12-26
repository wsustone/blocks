const GRID_SIZE = 40;

export class EnemySystem {
  constructor(engine) {
    this.engine = engine;
    this.gridSize = GRID_SIZE;
    this.gridRows = Math.floor(engine.height / this.gridSize);
    this.gridCols = Math.floor(engine.width / this.gridSize);

    this.enemyTypes = [
      {
        name: 'normal',
        color: '#FF4444',
        bounceCoefficient: 0.8,
        size: 30,
        maxHealth: 100,
        damageMultiplier: 1.0,
        stepCells: 1,
      },
      {
        name: 'bouncy',
        color: '#44FF44',
        bounceCoefficient: 1.5,
        size: 25,
        maxHealth: 75,
        damageMultiplier: 1.2,
        stepCells: 2,
      },
      {
        name: 'sticky',
        color: '#FF44FF',
        bounceCoefficient: 0.3,
        size: 35,
        maxHealth: 150,
        damageMultiplier: 0.8,
        stepCells: 1,
      },
      {
        name: 'heavy',
        color: '#4444FF',
        bounceCoefficient: 0.5,
        size: 40,
        maxHealth: 200,
        damageMultiplier: 0.6,
        stepCells: 1,
      },
    ];

    // start with few enemies
    this.createEnemy();
    this.createEnemy();
  }

  updateDimensions(width, height) {
    this.gridCols = Math.floor(width / this.gridSize);
    this.gridRows = Math.floor(height / this.gridSize);
  }

  createEnemy() {
    const type = this.enemyTypes[Math.floor(Math.random() * this.enemyTypes.length)];
    const healthMultiplier = 1 + (this.engine.totalBallsDropped || 0) * 0.05;
    const scaledHealth = Math.floor(type.maxHealth * healthMultiplier);

    const gridX = Math.floor(Math.random() * this.gridCols);
    const pixelX = gridX * this.gridSize + (this.gridSize - type.size) / 2;
    const gridY = this.gridRows - 2;
    const pixelY = gridY * this.gridSize;

    const enemy = {
      x: pixelX,
      y: pixelY,
      gridX,
      gridY,
      width: type.size,
      height: type.size,
      color: type.color,
      type: type.name,
      bounceCoefficient: type.bounceCoefficient,
      stepCells: type.stepCells,
      rotation: 0,
      health: scaledHealth,
      maxHealth: scaledHealth,
      damageMultiplier: type.damageMultiplier,
      flashTimer: 0,
      dropsBall: Math.random() < 0.1,
    };

    this.engine.enemies.push(enemy);
  }

  updateEnemies() {
    let movementOccurred = false;

    if (this.engine.enemyMovementRequested) {
      for (let i = this.engine.enemies.length - 1; i >= 0; i -= 1) {
        const enemy = this.engine.enemies[i];

        if (!enemy) continue;

        if (enemy.flashTimer > 0) {
          enemy.flashTimer -= 1;
        }

        enemy.gridY -= enemy.stepCells;
        enemy.y = enemy.gridY * this.gridSize;
        enemy.rotation += 0.1;

        if (enemy.gridY < 0) {
          this.engine.enemies.splice(i, 1);
        }
      }

      if (Math.random() < 0.02) {
        this.createEnemy();
      }

      this.engine.startNewPlayerTurn();
      movementOccurred = true;
    } else {
      const maxEnemies = this.gridCols;
      if (this.engine.enemies.length < maxEnemies && Math.random() < 0.01) {
        this.createEnemy();
      }
    }

    return movementOccurred;
  }

  applyDamage(enemy, damage, enemyIndex) {
    enemy.health -= damage;
    enemy.flashTimer = 10;

    if (enemy.health <= 0) {
      if (enemy.dropsBall) {
        this.engine.addBonusBall();
      }

      this.engine.enemies.splice(enemyIndex, 1);
      return true;
    }

    return false;
  }

  getEnemyTypeInfo() {
    return this.enemyTypes;
  }
}
