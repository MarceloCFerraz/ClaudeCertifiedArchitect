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

localforage.config({ name: "cca-f-practice", storeName: "state" });

// The ongoing run persists compactly: questions are rebuilt from (config, seed),
// so they are excluded here rather than serialized to IndexedDB.
const examPersistConfig = {
  key: "exam",
  storage: localforage,
  blacklist: ["questions"],
};

const historyPersistConfig = {
  key: "history",
  storage: localforage,
};

const rootReducer = combineReducers({
  exam: persistReducer(examPersistConfig, examReducer),
  history: persistReducer(historyPersistConfig, historyReducer),
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
const typeRootReducer = combineReducers({ exam: examReducer, history: historyReducer });
export type RootState = ReturnType<typeof typeRootReducer>;
export type AppDispatch = ThunkDispatch<RootState, undefined, UnknownAction> &
  Dispatch<UnknownAction>;
