import { combineReducers, configureStore } from "@reduxjs/toolkit";
import localforage from "localforage";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
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

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
