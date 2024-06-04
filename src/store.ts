import { BehaviorSubject, Observable } from "rxjs";
import {
  initializeReduxDevtools,
  isDevtoolEnabled,
  sendActionToDevtools,
} from "./devtools";
import { Signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";

interface Options {
  storeName: string;
  cache?: boolean;
}

export class Store<T = any> {
  private options: Options;
  private state: BehaviorSubject<T>;
  readonly select$: Observable<T>;
  readonly select: Signal<T | undefined>;
  private db?: IDBDatabase;

  constructor(initialState: T, options?: Partial<Options>) {
    this.options = {
      ...options,
      storeName: options?.storeName ?? this.constructor.name,
    };
    this.state = new BehaviorSubject(initialState);
    this.select$ = this.state.asObservable();
    this.select = toSignal(this.state);
    if (options?.cache) {
      const request = globalThis.indexedDB.open("__FLUXIE_STORE", 1);
      request.onerror = () => {
        console.error(`IndexedDB error: ${request.error}`);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.initializeFromIndexedDB();
      };

      request.onupgradeneeded = (e) => {
        this.db = request.result;
        if (e.newVersion === 1) {
          this.db.createObjectStore("cachedData");
        }
        this.initializeFromIndexedDB();
      };
    }
    if (isDevtoolEnabled) {
      initializeReduxDevtools(
        this.options.storeName,
        this.state,
        this.state.getValue()
      );
    }
  }

  public setState(actionName: string, mutationFn: (state: T) => T) {
    const newState = mutationFn(this.state.getValue());
    this.state.next(newState);
    if (this.options?.cache) {
      this.sendToIndexedDB(this.state.getValue());
    }
    if (isDevtoolEnabled) {
      sendActionToDevtools(this.options.storeName, actionName, newState);
    }
  }

  private async initializeFromIndexedDB(): Promise<any> {
    const request = this.db!.transaction("cachedData")
      .objectStore("cachedData")
      .get(this.options.storeName);

    request.onsuccess = () => {
      const data = request.result as T;

      if (data) {
        this.state.next(data);
      } else {
        this.sendToIndexedDB(this.state.getValue());
      }
    };
  }

  private async sendToIndexedDB(state: T) {
    this.db!.transaction("cachedData", "readwrite")
      .objectStore("cachedData")
      .put(state, this.options.storeName);
  }
}
