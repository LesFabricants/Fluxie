import { BehaviorSubject } from "rxjs";

export interface StorePlugin<T> {
  onInit?(options: StoreOptions, state: BehaviorSubject<T>, initialState: T): void;
  onSetState?(actionName: string, newState: T): void;
}

export interface StoreOptions {
  storeName: string;
  debug?: boolean;
  plugins?: StorePlugin<any>[];
}
