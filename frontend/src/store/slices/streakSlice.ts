import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface StreakState {
  sectionstreak: number
}

// ✅ Initial state of the streak (default is 0)
const initialState: StreakState = {
  sectionstreak: 0,
}

// ✅ Create a slice with actions
const streakSlice = createSlice({
  name: 'streak',
  initialState,
  reducers: {
    // Action to update the streak value
    setStreak: (state, action: PayloadAction<number>) => {
      state.sectionstreak = action.payload
    },
  },
})

// ✅ Export the actions to use in components
export const { setStreak } = streakSlice.actions

// ✅ Export reducer to use in store
export default streakSlice.reducer
