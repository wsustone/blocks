const BALL_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#F7DC6F',
];

export class BallPhysics {
  constructor(engine) {
    this.engine = engine;
  }

  createBall(x, y = 20, options = {}) {
    if (!this.engine.canDropBall()) {
      return false;
    }

    const { direction, speed } = options;

    const ball = {
      x,
      y,
      vx: direction ? 0 : (Math.random() - 0.5) * 2,
      vy: direction ? 0 : 0,
      radius: 6 + Math.random() * 6,
      color: this.getRandomColor(),
      trail: [],
      isBonus: false,
    };

    if (direction) {
      const magnitude = Math.sqrt(direction.x * direction.x + direction.y * direction.y) || 1;
      const normalizedX = direction.x / magnitude;
      const normalizedY = direction.y / magnitude;
      const baseSpeed = speed ?? 12;
      const shallowBoost = 1 + Math.max(0, 0.7 - Math.abs(normalizedY)) * 0.9;
      const finalSpeed = baseSpeed * shallowBoost;
      ball.vx = normalizedX * finalSpeed;
      ball.vy = normalizedY * finalSpeed;
    }

    this.engine.balls.push(ball);
    this.engine.ballsDroppedThisTurn += 1;
    this.engine.totalBallsDropped += 1;
    return true;
  }

  getRandomColor() {
    return BALL_COLORS[Math.floor(Math.random() * BALL_COLORS.length)];
  }

  updateBalls() {
    let changed = false;

    for (let i = this.engine.balls.length - 1; i >= 0; i -= 1) {
      const ball = this.engine.balls[i];

      ball.vy += this.engine.gravity;

      ball.vx *= this.engine.friction;
      ball.vy *= this.engine.friction;

      this.applyGravityWells(ball);

      ball.x += ball.vx;
      ball.y += ball.vy;

      ball.trail.push({ x: ball.x, y: ball.y });
      if (ball.trail.length > 10) {
        ball.trail.shift();
      }

      if (ball.x - ball.radius < 0) {
        this.applyWallBounce(ball, 1, 0);
        ball.x = ball.radius;
      } else if (ball.x + ball.radius > this.engine.width) {
        this.applyWallBounce(ball, -1, 0);
        ball.x = this.engine.width - ball.radius;
      }

      if (ball.y - ball.radius < 0) {
        this.applyWallBounce(ball, 0, 1);
        ball.y = ball.radius;
      } else if (ball.y + ball.radius > this.engine.height) {
        // Remove ball when it falls through the bottom
        this.engine.balls.splice(i, 1);
        changed = true;
      }

      if (ball.y < -50) {
        this.engine.balls.splice(i, 1);
        changed = true;
      }
    }

    return changed;
  }

  getVelocityMagnitude(ball) {
    return Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
  }

  applyGravityWells(ball) {
    if (!this.engine.gravityWells || this.engine.gravityWells.length === 0) {
      return;
    }

    this.engine.gravityWells.forEach((well) => {
      const dx = well.x - ball.x;
      const dy = well.y - ball.y;
      const distanceSq = dx * dx + dy * dy;
      const radius = well.radius;
      if (distanceSq > radius * radius || distanceSq === 0) return;

      const distance = Math.sqrt(distanceSq);
      const falloff = 1 - distance / radius;

      const dirX = dx / distance;
      const dirY = dy / distance;

      const radialForce = well.strength * falloff;
      ball.vx += dirX * radialForce;
      ball.vy += dirY * radialForce;

      const perpX = -dirY;
      const perpY = dirX;
      const tangentialForce =
        well.tangentialStrength * falloff * Math.sin(well.rotation);
      ball.vx += perpX * tangentialForce;
      ball.vy += perpY * tangentialForce;
    });
  }

  applyWallBounce(ball, normalX, normalY) {
    const velocityDotNormal = ball.vx * normalX + ball.vy * normalY;
    if (velocityDotNormal > 0) return;

    const impulse = (1 + this.engine.bounce) * velocityDotNormal;
    ball.vx -= impulse * normalX;
    ball.vy -= impulse * normalY;
  }
}
