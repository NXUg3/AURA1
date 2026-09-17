export class FixedStepLoop {
  constructor({ update, render, logicHz = 60, getRenderHz = () => 60, maxFrameMs = 100 }) {
    this.update = update;
    this.render = render;
    this.stepMs = 1000 / logicHz;
    this.getRenderHz = getRenderHz;
    this.maxFrameMs = maxFrameMs;
    this.accumulator = 0;
    this.lastTime = 0;
    this.lastRenderTime = 0;
    this.running = false;
    this.boundFrame = timestamp => this.frame(timestamp);
  }

  start() {
    if (this.running) return;
    this.running = true;
    requestAnimationFrame(this.boundFrame);
  }

  stop() { this.running = false; }

  frame(timestamp) {
    if (!this.running) return;
    requestAnimationFrame(this.boundFrame);
    if (!this.lastTime) this.lastTime = timestamp;
    const elapsed = Math.min(this.maxFrameMs, Math.max(0, timestamp - this.lastTime));
    this.lastTime = timestamp;
    this.accumulator += elapsed;
    while (this.accumulator >= this.stepMs) {
      this.update(this.stepMs, timestamp);
      this.accumulator -= this.stepMs;
    }
    const renderInterval = 1000 / Math.max(1, this.getRenderHz());
    if (timestamp - this.lastRenderTime >= renderInterval * 0.9) {
      this.lastRenderTime = timestamp;
      this.render(timestamp, this.accumulator / this.stepMs);
    }
  }
}
