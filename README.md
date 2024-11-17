# Taming async and useEffect (using nextjs but can be used in any react app)

The goal is to be able to use useEffect while calling async functions without creating situations where the next execution of useEffect does not happen until the cleanup of the previous useEffect is completed

# 1st experiment:

Make use of useRef to store the cleanup function of the last run. When useEffect run again await on the previous cleanup before starting the next run

How can I validate this is working?

Create a class that has an async method named doWork and another finishUpWork, both return a promise that is resolved by setTimeout as a way to pretend to doing some work

Create the class outside of the component in a regular module and keep track of the call number and log it so we can validate if we see in something like this in the console:

Doing work for call #1
Finishing up call #1
Doing work for call #2
...

```typescript
class PretendWork {
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

//DO NOT USE THIS VERSION. IF THERE'S AN ERROR IN THE EFFECT FUNCTION, THIS VERSION WON'T BE ABLE TO RECOVER
//USE THE VERSION AT THE END OR IN THE CODE
function useAsyncEffect(
  effect: () => Promise<() => Promise<any>>,
  deps: React.DependencyList
) {
  const previousRun = useRef<Promise<any> | null>(null);
  useEffect(() => {
    let thisRun: Promise<any>;
    if (previousRun.current) {
      thisRun = previousRun.current.then(() => effect());
    } else {
      thisRun = effect();
    }

    return () => {
      previousRun.current = thisRun.then((cleanup) => cleanup());
    };
  }, deps);
}

const pretendWork = new PretendWork();

export default function Home() {
  const [componentRerenderCounter, setComponentRerenderCounter] =
    useState<number>(0);
  const [isTriggeringReRenders, setIsTriggeringRerenders] = useState(false);

  useAsyncEffect(async () => {
    await pretendWork.doWork();
    return async () => {
      await pretendWork.finishUpWork();
    };
  }, [componentRerenderCounter]);

  useEffect(() => {
    if (isTriggeringReRenders) {
      const intervalId = setInterval(() => {
        console.log("-------");
        setComponentRerenderCounter((c) => c + 1);
      }, 2000);
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [isTriggeringReRenders]);

  return (
    <div>
      <h1>Call No {componentRerenderCounter}</h1>
      <button onClick={() => setIsTriggeringRerenders((t) => !t)}>
        {isTriggeringReRenders ? "Stop" : "Start"}
      </button>
    </div>
  );
}
```

This seems to work well, however there is the question of what will happen if an effect throws an error (or the cleanup function) that needs answering. Will it break the effect from the point where the error happens onwards?

Let's try to enumerate all possibilities

1st run, effect fails:

The cleanup will be affected as the then part will never run, will subsequent effects not run because they are waiting on a promise that will never resolve?

```
thisRun = effect(); //effect throws error
previousRun.current = thisRun.then((cleanup) => cleanup()); //cleanup is not called
```

Next use effect:

```
thisRun = previousRun.current.then(() => effect()); //previousRun.current is a rejected promise so effect() won't run, thisRun is now also the same rejected promise
previousRun.current = thisRun.then((cleanup) => cleanup()); //cleanup is not called, previousRun.current is being set to the same rejected promise it was before
```

No need to look at other cases as all of them will go into this loop and won't be able to recover from it.

Solution is to catch errors, log them but always return a resolved promise inside useAsyncEffect

Final version of useAsyncEffect:

```typescript
function useAsyncEffect(
  effect: () => Promise<() => Promise<any>>,
  deps: React.DependencyList
) {
  const previousRun = useRef<Promise<any> | null>(null);
  useEffect(() => {
    let thisRun: Promise<any>;
    if (previousRun.current) {
      thisRun = previousRun.current
        .then(() => effect())
        .catch((e) => {
          console.error(
            `Error in useAsyncEffect, cleanup function won't be executed. Make sure you handle errors in your effect to avoid this. Error details:`,
            e
          );
          return () => {};
        });
    } else {
      thisRun = effect();
    }

    return () => {
      previousRun.current = thisRun
        .then((cleanup) => cleanup())
        .catch((e) => {
          console.error(
            `Error in cleanup function of useAsyncEffect. Error details:`,
            e
          );
        });
    };
  }, deps);
}
```

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```
