import { combineReducers, configureStore } from "@reduxjs/toolkit";
import userReducer from "./admin/adminSlice";
// import storage from "redux-persist/lib/storage";
import { persistReducer, persistStore } from "redux-persist";
import storageImport from "redux-persist/lib/storage";

const rootReducer = combineReducers({ user: userReducer });

const storage = storageImport.default || storageImport;

const persistConfig = {
  key: "root",
  version: 1,
  storage,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export const persistor = persistStore(store);
