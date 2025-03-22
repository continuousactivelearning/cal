interface ClockState {
  isClockRunning: boolean;
  elapsedTime: string;
}

const initialState: ClockState = {
  isClockRunning: false,
  elapsedTime: '00:00:00', // initial clock value
};

interface Action {
  type: string;
  payload?: string;
}

const clockReducer = (state = initialState, action: Action): ClockState => {
  switch (action.type) {
    case 'START_CLOCK':
      return { ...state, isClockRunning: true };
    case 'STOP_CLOCK':
      return { ...state, isClockRunning: false };
    case 'SET_ELAPSED_TIME':
      return { ...state, elapsedTime: action.payload || state.elapsedTime };
    default:
      return state;
  }
};

export default clockReducer;

