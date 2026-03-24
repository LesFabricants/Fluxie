import { BehaviorSubject } from "rxjs";
import type { StoreOptions, StorePlugin } from "../type";

export function cachePlugin<T>(): StorePlugin<T> {
  let db: IDBDatabase;
  let options!: StoreOptions;

  async function initializeFromIndexedDB(state: BehaviorSubject<T>): Promise<any> {
    const request = db!.transaction("cachedData")
      .objectStore("cachedData")
      .get(options.storeName);

    request.onsuccess = () => {
      const data = request.result as T;

      if (data) {
        state.next(data);
      } else {
        sendToIndexedDB(state.getValue());
      }
    };
  }

  async function sendToIndexedDB(state: T) {
    const request = db!
      .transaction("cachedData", "readwrite")
      .objectStore("cachedData")
      .put(state, options.storeName);

    if (options.debug) {
      request.onerror = () => {
        console.error(`[Fluxie store ${options.storeName}] Failed to persist state: ${request.error}`);
      };
    }
  }

  return {
    onInit(storeOptions, state, initialState) {
      options = storeOptions;
      if (globalThis.indexedDB) {
        const request = globalThis.indexedDB.open("__FLUXIE_STORE", 1);
        if (options.debug) {
          request.onerror = () => {
            console.error(`[Fluxie store ${options.storeName}] IndexedDB error: ${request.error}`);
          };
        }
  
        request.onsuccess = () => {
          db = request.result;
          initializeFromIndexedDB(state);
        };
  
        request.onupgradeneeded = (e) => {
          db = request.result;
          if (e.newVersion === 1) {
            db.createObjectStore("cachedData");
          }
        };
      } else if (options.debug) {
        console.debug("fluxie caching is not supported in this environment");
      }
    },
    onSetState(actionName, newState) {
      sendToIndexedDB(newState);
    }
  };
}
