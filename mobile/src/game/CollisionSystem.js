export class CollisionSystem {
  constructor(engine, ballPhysics, enemySystem) {
    this.engine = engine;
    this.ballPhysics = ballPhysics;
    this.enemySystem = enemySystem;
  }

  checkCollisions() {
    for (let b = this.engine.balls.length - 1; b >= 0; b -= 1) {
      const ball = this.engine.balls[b];
      for (let e = this.engine.enemies.length - 1; e >= 0; e -= 1) {
        const enemy = this.engine.enemies[e];
        if (!enemy) continue;

        const dx = ball.x - (enemy.x + enemy.width / 2);
        const dy = ball.y - (enemy.y + enemy.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < ball.radius + enemy.width / 2) {
          const killed = this.handleCollision(ball, enemy, e, dx, dy, distance);
          if (killed) break;
        }
      }
    }
  }

  handleCollision(ball, enemy, enemyIndex, dx, dy, distance) {
    const velocityMagnitude = this.ballPhysics.getVelocityMagnitude(ball);
    const damage =
      this.engine.ballDamage * enemy.damageMultiplier * (1 + velocityMagnitude * 0.1);

    const wasKilled = this.enemySystem.applyDamage(enemy, damage, enemyIndex);

    const healthRatio = enemy.health / enemy.maxHealth;
    const modifiedBounceCoeff = enemy.bounceCoefficient * (0.5 + healthRatio * 0.5);

    this.applyBounce(ball, enemy, dx, dy, distance, modifiedBounceCoeff);
    enemy.rotation += 0.1;
    return wasKilled;
  }

  applyBounce(ball, enemy, dx, dy, distance, bounceCoefficient) {
    if (distance === 0) return;

    const nx = dx / distance;
    const ny = dy / distance;

    const relativeVelocity = ball.vx * nx + ball.vy * ny;
    if (relativeVelocity > 0) return;

    const impulse = 2 * relativeVelocity * bounceCoefficient;
    ball.vx -= impulse * nx;
    ball.vy -= impulse * ny;

    const overlap = ball.radius + enemy.width / 2 - distance;
    const separationX = nx * overlap * 1.1;
    const separationY = ny * overlap * 1.1;
    ball.x += separationX;
    ball.y += separationY;
  }
}
