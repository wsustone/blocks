const GRID_SIZE = 40;

const THEME_TIERS = [
  { minWave: 1, fill: '#1d4ed8', border: '#60a5fa' },
  { minWave: 4, fill: '#b45309', border: '#f97316' },
  { minWave: 7, fill: '#831843', border: '#f472b6' },
  { minWave: 11, fill: '#6b21a8', border: '#c084fc' },
];

const shuffleArray = (array) => {
  const working = [...array];
  for (let i = working.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [working[i], working[j]] = [working[j], working[i]];
  }
  return working;
};

export class EnemySystem {
  constructor(engine) {
    this.engine = engine;
    this.gridSize = GRID_SIZE;
    this.gridRows = Math.floor(engine.height / this.gridSize);
    this.gridCols = Math.floor(engine.width / this.gridSize);
    this.enemyCounter = 0;
    this.waveNumber = 1;
    this.waveThreatBase = 4;

    this.enemyTypes = [
      {
        name: 'normal',
        color: '#91a4ff',
        bounceCoefficient: 0.85,
        size: 30,
        maxHealth: 95,
        damageMultiplier: 1.0,
        stepCells: 1,
        cost: 1,
        weight: 5,
      },
      {
        name: 'bouncy',
        color: '#8bf8a0',
        bounceCoefficient: 1.4,
        size: 26,
        maxHealth: 80,
        damageMultiplier: 1.2,
        stepCells: 2,
        cost: 1.5,
        weight: 3,
      },
      {
        name: 'sticky',
        color: '#f472b6',
        bounceCoefficient: 0.35,
        size: 34,
        maxHealth: 140,
        damageMultiplier: 0.85,
        stepCells: 1,
        cost: 2,
        weight: 2,
      },
      {
        name: 'heavy',
        color: '#60a5fa',
        bounceCoefficient: 0.55,
        size: 42,
        maxHealth: 210,
        damageMultiplier: 0.65,
        stepCells: 1,
        cost: 2.5,
        weight: 1.6,
      },
      {
        name: 'boss',
        color: '#fbbf24',
        bounceCoefficient: 0.9,
        size: 56,
        maxHealth: 420,
        damageMultiplier: 0.9,
        stepCells: 1,
        cost: 4.5,
        weight: 0.6,
      },
      {
        name: 'triangle',
        color: '#f87171',
        bounceCoefficient: 1.1,
        size: 30,
        maxHealth: 90,
        damageMultiplier: 1.15,
        stepCells: 1,
        cost: 1.3,
        weight: 2.5,
      },
      {
        name: 'pentagon',
        color: '#c084fc',
        bounceCoefficient: 0.75,
        size: 32,
        maxHealth: 130,
        damageMultiplier: 0.9,
        stepCells: 1,
        cost: 2.2,
        weight: 1.8,
      },
      {
        name: 'hexagon',
        color: '#60a5fa',
        bounceCoefficient: 0.65,
        size: 36,
        maxHealth: 160,
        damageMultiplier: 0.75,
        stepCells: 1,
        cost: 2.8,
        weight: 1.4,
      },
      {
        name: 'heptagon',
        color: '#34d399',
        bounceCoefficient: 0.6,
        size: 40,
        maxHealth: 190,
        damageMultiplier: 0.7,
        stepCells: 1,
        cost: 3.4,
        weight: 1.0,
      },
    ];

    this.enemyTypesByName = this.enemyTypes.reduce((acc, type) => {
      acc[type.name] = type;
      return acc;
    }, {});

    this.spawnWave();
  }

  updateDimensions(width, height) {
    this.gridCols = Math.floor(width / this.gridSize);
    this.gridRows = Math.floor(height / this.gridSize);
  }

  getWaveConfig() {
    const comboPressure = this.engine?.comboMultiplier > 2 ? 2 : 0;
    const budget = this.waveThreatBase + Math.floor(this.waveNumber * 1.5) + comboPressure;
    return {
      budget,
      armoredChance: Math.min(0.1 + this.waveNumber * 0.02, 0.5),
      splitterChance: this.waveNumber % 4 === 0 ? 0.35 : 0.12,
      eliteChance: Math.max(0, this.waveNumber - 4) * 0.03,
      bossWave: this.waveNumber % 5 === 0,
    };
  }

  pickTypeForBudget(budget) {
    const candidates = this.enemyTypes.filter((type) => type.cost <= budget + 0.4);
    const pool = candidates.length ? candidates : [this.enemyTypes[0]];
    const totalWeight = pool.reduce((sum, type) => sum + type.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const type of pool) {
      roll -= type.weight;
      if (roll <= 0) {
        return type;
      }
    }
    return pool[pool.length - 1];
  }

  rollModifiers(config) {
    const modifiers = [];
    if (Math.random() < config.armoredChance) modifiers.push('armored');
    if (Math.random() < config.splitterChance) modifiers.push('splitter');
    if (Math.random() < config.eliteChance) modifiers.push('elite');
    return modifiers;
  }

  spawnWave(configOverride = null) {
    if (this.gridCols <= 0) return;
    const config = configOverride ?? this.getWaveConfig();

    const spawnCount = 3 + Math.floor(Math.random() * 3); // 3–5 shapes
    const columns = shuffleArray([...Array(this.gridCols).keys()]);

    for (let i = 0; i < spawnCount; i += 1) {
      if (!columns.length) {
        columns.push(...shuffleArray([...Array(this.gridCols).keys()]));
      }
      const column = columns.shift();
      const enemyType = this.pickTypeForBudget(999); // ignore budget for fixed count
      const modifiers = this.rollModifiers(config);
      this.createEnemy({
        typeOverride: enemyType,
        positionX: column,
        positionY: this.gridRows - 1,
        modifiers,
      });
    }
  }

  spawnReinforcement() {
    const reinforcementConfig = this.getWaveConfig();
    reinforcementConfig.budget = Math.max(1, Math.floor(reinforcementConfig.budget * 0.4));
    reinforcementConfig.bossWave = false;
    this.spawnWave(reinforcementConfig);
  }

  advanceWave() {
    this.waveNumber += 1;
    this.spawnWave();
  }

  getThemeForWave(waveNumber) {
    for (let i = THEME_TIERS.length - 1; i >= 0; i -= 1) {
      if (waveNumber >= THEME_TIERS[i].minWave) {
        return THEME_TIERS[i];
      }
    }
    return THEME_TIERS[0];
  }

  getHealthMultiplier(isFragment) {
    if (isFragment) return 1;

    const baseHits = this.waveNumber === 1 ? (1 + Math.random() * 3) : 2;
    const extraBalls =
      (this.engine.baseBallsPerTurn || this.engine.baseBallBaseline || 5) -
      (this.engine.baseBallBaseline || 5);
    const ballFactor = 1 + Math.max(0, extraBalls) * 0.25;
    const waveFactor = 1 + (this.waveNumber - 1) * 0.15;

    const healthPerHit = this.engine.ballDamage;
    return (baseHits * healthPerHit * ballFactor * waveFactor) / healthPerHit;
  }

  createEnemy(options = {}) {
    const {
      fragmentOf = null,
      typeOverride = null,
      positionX,
      positionY,
      healthOverride,
      sizeOverride,
      colorOverride,
      modifiers = [],
    } = options;

    const baseType =
      fragmentOf || typeOverride || this.enemyTypes[Math.floor(Math.random() * this.enemyTypes.length)];
    const theme = this.getThemeForWave(this.waveNumber);
    const healthMultiplier = this.getHealthMultiplier(Boolean(fragmentOf));
    const scaledHealth = Math.floor(
      (healthOverride ?? baseType.maxHealth) * healthMultiplier * (fragmentOf ? 0.35 : 1)
    );

    const gridX =
      typeof positionX === 'number'
        ? positionX
        : Math.floor(Math.random() * this.gridCols);
    const pixelX = gridX * this.gridSize + (this.gridSize - (sizeOverride ?? baseType.size)) / 2;
    const gridY = typeof positionY === 'number' ? positionY : this.gridRows - 2;
    const pixelY = gridY * this.gridSize;

    const enemy = {
      id: `enemy-${(this.enemyCounter += 1)}`,
      x: pixelX,
      y: pixelY,
      gridX,
      gridY,
      width: sizeOverride ?? baseType.size,
      height: sizeOverride ?? baseType.size,
      color: colorOverride ?? baseType.color ?? theme.fill,
      outlineColor: theme.border,
      type: baseType.name,
      bounceCoefficient: baseType.bounceCoefficient,
      stepCells: fragmentOf ? 1 : baseType.stepCells,
      rotation: Math.random() * Math.PI * 2,
      health: scaledHealth,
      maxHealth: scaledHealth,
      damageMultiplier: fragmentOf ? 0.6 : baseType.damageMultiplier,
      flashTimer: 0,
      dropsBall: fragmentOf ? false : Math.random() < 0.08,
      isFragment: Boolean(fragmentOf),
      fragmentSpawned: false,
      waveBorn: this.waveNumber,
      modifiers: new Set(modifiers),
    };

    if (enemy.modifiers.has('elite')) {
      enemy.width = Math.floor(enemy.width * 1.2);
      enemy.height = Math.floor(enemy.height * 1.2);
      enemy.isElite = true;
      enemy.color = colorOverride ?? theme.fill;
      enemy.outlineColor = '#fcd34d';
    }

    if (enemy.modifiers.has('armored')) {
      enemy.maxArmor = Math.floor(enemy.maxHealth * 0.35);
      enemy.armor = enemy.maxArmor;
      enemy.outlineColor = '#a3e635';
    }

    if (enemy.modifiers.has('splitter') && !enemy.isFragment) {
      enemy.forceFragment = true;
    }

    this.engine.enemies.push(enemy);
    return enemy;
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
        // enemy.rotation += 0.08; // blocks no longer spin

        if (enemy.gridY < 0) {
          this.engine.enemies.splice(i, 1);
        }
      }

      this.advanceWave();
      this.engine.startNewPlayerTurn();
      movementOccurred = true;
    } else {
      const minEnemies = Math.max(3, Math.floor(this.gridCols * 0.4));
      if (this.engine.enemies.length < minEnemies) {
        this.spawnReinforcement();
      }
    }

    return movementOccurred;
  }

  applyDamage(enemy, damage, enemyIndex) {
    let remainingDamage = damage;
    if (enemy.armor && enemy.armor > 0) {
      const absorbed = Math.min(enemy.armor, Math.floor(remainingDamage * 0.6));
      enemy.armor -= absorbed;
      remainingDamage -= Math.max(1, Math.floor(absorbed * 0.5));
    }

    enemy.health -= remainingDamage;
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
      if (enemy.forceFragment && !enemy.isFragment) {
        this.spawnFragment(enemy, true);
      }
      return true;
    }

    if (
      !enemy.isFragment &&
      !enemy.fragmentSpawned &&
      (enemy.health / enemy.maxHealth <= 0.35 || enemy.forceFragment)
    ) {
      this.spawnFragment(enemy, false);
      enemy.fragmentSpawned = true;
    }

    return false;
  }

  spawnFragment(enemy, aggressive) {
    const fragmentSize = Math.max(16, Math.floor(enemy.width * 0.6));
    const fragmentHealth = Math.max(30, Math.floor(enemy.maxHealth * 0.25));
    this.createEnemy({
      fragmentOf: {
        name: `${enemy.type}-fragment`,
        color: aggressive ? '#f97316' : '#FCD34D',
        bounceCoefficient: 1.15,
        size: fragmentSize,
        maxHealth: fragmentHealth,
        damageMultiplier: aggressive ? 1.1 : 0.8,
        stepCells: 1,
      },
      positionX: enemy.gridX,
      positionY: Math.max(enemy.gridY - 1, 0),
      healthOverride: fragmentHealth,
      sizeOverride: fragmentSize,
      colorOverride: aggressive ? '#f97316' : '#FCD34D',
    });
  }

  getEnemyTypeInfo() {
    return this.enemyTypes;
  }
}
