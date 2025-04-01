// actions.ts
import { START_CLOCK, STOP_CLOCK, SET_ELAPSED_TIME } from './actionTypes'; // Ensure this path is correct

export const startClock = () => ({
  type: START_CLOCK,
});

export const stopClock = () => ({
  type: STOP_CLOCK,
});

export const setElapsedTime = (time: string) => ({
  type: SET_ELAPSED_TIME,
  payload: time,
});



