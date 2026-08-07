import {
  combineReducers,
  configureStore,
  type Dispatch,
  type ThunkDispatch,
  type UnknownAction,
} from "@reduxjs/toolkit";
import localforage from "localforage";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  persistReducer,
  persistStore,
  REGISTER,
  REHYDRATE,
} from "redux-persist";
import examReducer from "./exam-slice";
import historyReducer from "./history-slice";
import pausedReducer from "./paused-slice";

localforage.config({ name: "cca-f-practice", storeName: "state" });

// A run stores its own draw. Rebuilding it from (config, seed) would be smaller, but a
// seed only reproduces the same questions against the same bank — edit questions.json
// and the stored answers, which are positional letters, would silently re-point at
// different text. Runs are written rarely (per answer, not per second), so the size is
// paid once and the exam a user resumes is always the exam they were given.
const examPersistConfig = {
  key: "exam",
  storage: localforage,
};

const historyPersistConfig = {
  key: "history",
  storage: localforage,
};

const pausedPersistConfig = {
  key: "paused",
  storage: localforage,
};

const rootReducer = combineReducers({
  exam: persistReducer(examPersistConfig, examReducer),
  history: persistReducer(historyPersistConfig, historyReducer),
  paused: persistReducer(pausedPersistConfig, pausedReducer),
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

// Types derive from the unpersisted slices so they match a plain store (used in
// tests) — there is no nested `_persist` key to account for, and thunks/selectors
// never read it.
const typeRootReducer = combineReducers({
  exam: examReducer,
  history: historyReducer,
  paused: pausedReducer,
});
export type RootState = ReturnType<typeof typeRootReducer>;
export type AppDispatch = ThunkDispatch<RootState, undefined, UnknownAction> &
  Dispatch<UnknownAction>;
