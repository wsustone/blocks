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

  createBall(x, y = 20) {
    if (!this.engine.canDropBall()) {
      return false;
    }

    const ball = {
      x,
      y,
      vx: (Math.random() - 0.5) * 2,
      vy: 0,
      radius: 10 + Math.random() * 10,
      color: this.getRandomColor(),
      trail: [],
      isBonus: false,
    };

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

      ball.x += ball.vx;
      ball.y += ball.vy;

      ball.trail.push({ x: ball.x, y: ball.y });
      if (ball.trail.length > 10) {
        ball.trail.shift();
      }

      if (ball.x - ball.radius < 0 || ball.x + ball.radius > this.engine.width) {
        ball.vx = -ball.vx * this.engine.bounce;
        ball.x = ball.x - ball.radius < 0 ? ball.radius : this.engine.width - ball.radius;
      }

      if (ball.y + ball.radius > this.engine.height) {
        ball.vy = -ball.vy * this.engine.bounce;
        ball.y = this.engine.height - ball.radius;

        if (Math.abs(ball.vy) < 0.5) {
          this.engine.balls.splice(i, 1);
          changed = true;
        }
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
}
