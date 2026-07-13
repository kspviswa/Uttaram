class Semaphore {
  private current = 0;
  private max: number;
  private queue: (() => void)[] = [];

  constructor(max: number) {
    this.max = max;
  }

  async acquire(): Promise<void> {
    if (this.current < this.max) {
      this.current++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift()!;
      next();
    } else {
      this.current--;
    }
  }

  setMax(max: number): void {
    if (max < 1) max = 1;
    this.max = max;
    while (this.queue.length > 0 && this.current < this.max) {
      this.current++;
      const next = this.queue.shift()!;
      next();
    }
  }
}

export const globalLlmSemaphore = new Semaphore(1000);
