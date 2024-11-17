"use client";
export class PretendWork {
  counter: number = 0;

  async doWork() {
    console.log(`${++this.counter} doWork`);
    await new Promise((r) => setTimeout(r, Math.random() * 1000));
    console.log(`${this.counter} done work`);
  }
  async finishUpWork() {
    console.log(`${this.counter} finishUpWork`);
    await new Promise((r) => setTimeout(r, Math.random() * 1000));
    console.log(`${this.counter} done finishUpWork`);
  }
}
