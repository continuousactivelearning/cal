// src/store/store.ts

import { configureStore } from '@reduxjs/toolkit';
import { apiService } from './apiService';
import authReducer from './slices/authSlice';
import instituteReducer from './slices/instituteSlice';
import userReducer from './slices/usersSlice';
import videoDetailsReducer from './slices/videoDetailsSlice';
import courseReducer from './slices/courseSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    institute: instituteReducer,
    user: userReducer,
    videoDetails: videoDetailsReducer,
    course: courseReducer,
    [apiService.reducerPath]: apiService.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiService.middleware),
});

export default store;
