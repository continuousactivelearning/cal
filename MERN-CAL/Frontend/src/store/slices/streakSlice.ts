import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface StreakState {
  sectionstreak: number
}

const initialState: StreakState = {
  sectionstreak: 0,
}

const streakSlice = createSlice({
  name: 'streak',
  initialState,
  reducers: {
    setStreak: (state, action: PayloadAction<number>) => {
      console.log('📌 Redux: Updating Streak:', action.payload) 
      state.sectionstreak = action.payload
    },
  },
})

export const { setStreak } = streakSlice.actions
export default streakSlice.reducer
