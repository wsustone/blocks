const GRID_SIZE = 40;

export class EnemySystem {
  constructor(engine) {
    this.engine = engine;
    this.gridSize = GRID_SIZE;
    this.gridRows = Math.floor(engine.height / this.gridSize);
    this.gridCols = Math.floor(engine.width / this.gridSize);
    this.enemyCounter = 0;

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

  createEnemy(options = {}) {
    const {
      fragmentOf = null,
      positionX,
      positionY,
      healthOverride,
      sizeOverride,
      colorOverride,
    } = options;

    const type =
      fragmentOf ||
      this.enemyTypes[Math.floor(Math.random() * this.enemyTypes.length)];
    const healthMultiplier =
      fragmentOf || {
        value: 1 + (this.engine.totalBallsDropped || 0) * 0.05,
      };
    const scaledHealth = Math.floor(
      (healthOverride ?? type.maxHealth * (fragmentOf ? 0.35 : healthMultiplier.value))
    );

    const gridX =
      typeof positionX === 'number'
        ? positionX
        : Math.floor(Math.random() * this.gridCols);
    const pixelX = gridX * this.gridSize + (this.gridSize - (sizeOverride ?? type.size)) / 2;
    const gridY =
      typeof positionY === 'number' ? positionY : this.gridRows - 2;
    const pixelY = gridY * this.gridSize;

    const enemy = {
      id: `enemy-${this.enemyCounter += 1}`,
      x: pixelX,
      y: pixelY,
      gridX,
      gridY,
      width: sizeOverride ?? type.size,
      height: sizeOverride ?? type.size,
      color: colorOverride ?? type.color,
      type: type.name,
      bounceCoefficient: type.bounceCoefficient,
      stepCells: fragmentOf ? 1 : type.stepCells,
      rotation: 0,
      health: scaledHealth,
      maxHealth: scaledHealth,
      damageMultiplier: fragmentOf ? 0.6 : type.damageMultiplier,
      flashTimer: 0,
      dropsBall: fragmentOf ? false : Math.random() < 0.1,
      isFragment: Boolean(fragmentOf),
      fragmentSpawned: false,
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

        if (enemy.isFragment) {
          enemy.y -= 0.8;
        } else {
          enemy.gridY -= enemy.stepCells;
          enemy.y = enemy.gridY * this.gridSize;
        }
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
    if (enemy.id) {
      this.engine.registerHit(enemy.id);
    }
    enemy.flashTimer = 10;

    if (enemy.health <= 0) {
      if (enemy.dropsBall) {
        this.engine.addBonusBall();
      }

      this.engine.registerKill(enemy.isFragment);
      this.engine.addScore(enemy.maxHealth);
      this.engine.enemies.splice(enemyIndex, 1);
      return true;
    }

    if (
      !enemy.isFragment &&
      !enemy.fragmentSpawned &&
      enemy.health / enemy.maxHealth <= 0.35
    ) {
      this.spawnFragment(enemy);
      enemy.fragmentSpawned = true;
    }

    return false;
  }

  spawnFragment(enemy) {
    const fragmentSize = Math.max(16, Math.floor(enemy.width * 0.6));
    const fragmentHealth = Math.max(20, Math.floor(enemy.maxHealth * 0.25));
    this.createEnemy({
      fragmentOf: {
        name: `${enemy.type}-fragment`,
        color: '#FCD34D',
        bounceCoefficient: 1.2,
        size: fragmentSize,
        maxHealth: fragmentHealth,
        damageMultiplier: 0.8,
        stepCells: 1,
      },
      positionX: enemy.gridX,
      positionY: Math.max(enemy.gridY - 1, 0),
      healthOverride: fragmentHealth,
      sizeOverride: fragmentSize,
      colorOverride: '#FCD34D',
    });
  }

  getEnemyTypeInfo() {
    return this.enemyTypes;
  }
}
