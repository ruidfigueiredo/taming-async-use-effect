"use client";
import { useEffect, useState } from "react";
import { useAsyncEffect } from "./useAsyncEffect";
import { PretendWork } from "./PretendWork";

const pretendWork = new PretendWork();

export default function Home() {
  const [componentRerenderCounter, setComponentRerenderCounter] =
    useState<number>(0);
  const [isTriggeringReRenders, setIsTriggeringRerenders] = useState(false);

  useAsyncEffect(async () => {
    await pretendWork.doWork();
    if (componentRerenderCounter === 1) {
      throw new Error(
        `Failing on render ${componentRerenderCounter} on purpose`
      );
    }
    return async () => {
      await pretendWork.finishUpWork();
    };
  }, [componentRerenderCounter]);

  //uncomment this to check what happens when we don't take care with async effects
  // useEffect(() => {
  //   pretendWork.doWork();
  //   return () => {
  //     pretendWork.finishUpWork();
  //   };
  // }, [componentRerenderCounter]);

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
