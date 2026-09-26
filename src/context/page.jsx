"use client";
import { createContext, useContext, useEffect, useState } from "react";
const STORAGE_KEY = "fitlog-data";
const FitContext = createContext(null);
function getSavedData() {
  if (typeof window === "undefined") {
    return {
      plan: [],
      saved: [],
    };
  }

  try {
    const savedData = window.localStorage.getItem(STORAGE_KEY);

    if (!savedData) {
      return {
        plan: [],
        saved: [],
      };
    }

    const parsedData = JSON.parse(savedData);

    return {
      plan: Array.isArray(parsedData.plan) ? parsedData.plan : [],
      saved: Array.isArray(parsedData.saved) ? parsedData.saved : [],
    };
  } catch {
    return {
      plan: [],
      saved: [],
    };
  }
}

export default function FitProvider({ children }) {
  const [plan, setPlan] = useState([]);
  const [saved, setSaved] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const savedData = getSavedData();

    setPlan(savedData.plan);
    setSaved(savedData.saved);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        plan,
        saved,
      })
    );
  }, [plan, saved, ready]);

  function addToPlan(workout) {
    const alreadyAdded = plan.some(
      (planWorkout) => planWorkout.id === workout.id
    );

    if (alreadyAdded) {
      return {
        ok: false,
        message: "Already in today's plan",
      };
    }

    if (plan.length >= 5) {
      return {
        ok: false,
        message: "Today's plan is full",
      };
    }

    const workoutWithStatus = {
      ...workout,
      done: false,
    };

    setPlan((currentPlan) => [...currentPlan, workoutWithStatus]);

    return {
      ok: true,
      message: "Added to today's plan",
    };
  }

  function saveWorkout(workout) {
    const alreadySaved = saved.some(
      (savedWorkout) => savedWorkout.id === workout.id
    );

    if (alreadySaved) {
      return {
        ok: false,
        message: "Already saved",
      };
    }

    setSaved((currentSaved) => [...currentSaved, workout]);

    return {
      ok: true,
      message: "Saved for later",
    };
  }

  function removeFromPlan(workoutId) {
    setPlan((currentPlan) =>
      currentPlan.filter((workout) => workout.id !== workoutId)
    );
  }

  function removeSaved(workoutId) {
    setSaved((currentSaved) =>
      currentSaved.filter((workout) => workout.id !== workoutId)
    );
  }

  function markDone(workoutId) {
    setPlan((currentPlan) =>
      currentPlan.map((workout) => {
        if (workout.id === workoutId) {
          return {
            ...workout,
            done: !workout.done,
          };
        }

        return workout;
      })
    );
  }

  const contextValue = {
    plan,
    saved,
    planCount: plan.length,
    saveCount: saved.length,
    addToPlan,
    saveWorkout,
    removeFromPlan,
    removeSaved,
    markDone,
    ready,
  };

  return (
    <FitContext.Provider value={contextValue}>
      {children}
    </FitContext.Provider>
  );
}

export function useFitLog() {
  const context = useContext(FitContext);

  if (!context) {
    throw new Error("useFitLog must be used inside FitProvider");
  }

  return context;
}