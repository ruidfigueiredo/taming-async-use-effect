"use client";
import { useRef, useEffect } from "react";

export function useAsyncEffect(
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
