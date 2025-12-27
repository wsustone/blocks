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

        const enemyLeft = enemy.x;
        const enemyRight = enemy.x + enemy.width;
        const enemyTop = enemy.y;
        const enemyBottom = enemy.y + enemy.height;

        const closestX = Math.max(enemyLeft, Math.min(ball.x, enemyRight));
        const closestY = Math.max(enemyTop, Math.min(ball.y, enemyBottom));
        let dx = ball.x - closestX;
        let dy = ball.y - closestY;
        const distanceSq = dx * dx + dy * dy;
        const radius = ball.radius;

        if (distanceSq <= radius * radius) {
          let distance = Math.sqrt(distanceSq);
          let normalX;
          let normalY;
          let penetration;

          if (distance > 0.0001) {
            normalX = dx / distance;
            normalY = dy / distance;
            penetration = radius - distance;
          } else {
            const centerX = enemyLeft + enemy.width / 2;
            const centerY = enemyTop + enemy.height / 2;
            const offsetX = ball.x - centerX;
            const offsetY = ball.y - centerY;
            const halfWidth = enemy.width / 2;
            const halfHeight = enemy.height / 2;

            const overlapX = halfWidth + radius - Math.abs(offsetX);
            const overlapY = halfHeight + radius - Math.abs(offsetY);

            if (overlapX < overlapY) {
              normalX = offsetX >= 0 ? 1 : -1;
              normalY = 0;
              penetration = overlapX;
            } else {
              normalX = 0;
              normalY = offsetY >= 0 ? 1 : -1;
              penetration = overlapY;
            }

            distance = radius - penetration;
            dx = normalX * distance;
            dy = normalY * distance;
          }

          const killed = this.handleCollision(
            ball,
            enemy,
            e,
            normalX,
            normalY,
            penetration
          );
          if (killed) break;
        }
      }
    }
  }

  handleCollision(ball, enemy, enemyIndex, normalX, normalY, penetration) {
    const velocityMagnitude = this.ballPhysics.getVelocityMagnitude(ball);
    const damage =
      this.engine.ballDamage * enemy.damageMultiplier * (1 + velocityMagnitude * 0.1);

    const wasKilled = this.enemySystem.applyDamage(enemy, damage, enemyIndex);

    const healthRatio = enemy.health / enemy.maxHealth;
    const modifiedBounceCoeff = enemy.bounceCoefficient * (0.5 + healthRatio * 0.5);

    // Bias normal toward nearest polygon face using enemy rotation
    const biasedNormal = this.getPolygonBiasedNormal(enemy, normalX, normalY);
    this.applyBounce(ball, biasedNormal.x, biasedNormal.y, penetration, modifiedBounceCoeff);
    return wasKilled;
  }

  getPolygonBiasedNormal(enemy, nx, ny) {
    const sides = {
      triangle: 3,
      normal: 4,
      bouncy: 4,
      sticky: 4,
      heavy: 4,
      boss: 4,
      pentagon: 5,
      hexagon: 6,
      heptagon: 7,
    }[enemy.type] || 4;

    const angleStep = (Math.PI * 2) / sides;
    const baseAngle = enemy.rotation; // current rotation

    // Find the nearest face angle to the current normal
    let bestFaceAngle = 0;
    let bestDot = -Infinity;
    for (let i = 0; i < sides; i += 1) {
      const faceAngle = baseAngle + i * angleStep;
      const faceNormalX = Math.cos(faceAngle);
      const faceNormalY = Math.sin(faceAngle);
      const dot = nx * faceNormalX + ny * faceNormalY;
      if (dot > bestDot) {
        bestDot = dot;
        bestFaceAngle = faceAngle;
      }
    }

    // Blend the AABB normal with the nearest face normal
    const blend = 0.6; // how much to bias toward the polygon face
    const biasedX = nx * (1 - blend) + Math.cos(bestFaceAngle) * blend;
    const biasedY = ny * (1 - blend) + Math.sin(bestFaceAngle) * blend;
    const len = Math.sqrt(biasedX * biasedX + biasedY * biasedY);
    return { x: biasedX / len, y: biasedY / len };
  }

  applyBounce(ball, nx, ny, penetration, bounceCoefficient) {
    if (!Number.isFinite(nx) || !Number.isFinite(ny)) return;

    const relativeVelocity = ball.vx * nx + ball.vy * ny;
    if (relativeVelocity > 0) return;

    const impulse = 2 * relativeVelocity * bounceCoefficient * 1.4; // 40% more bounce (lighter balls)
    ball.vx -= impulse * nx;
    ball.vy -= impulse * ny;

    const overlap = Math.max(0, penetration);
    const separationX = nx * overlap * 1.1;
    const separationY = ny * overlap * 1.1;
    ball.x += separationX;
    ball.y += separationY;
  }
}
