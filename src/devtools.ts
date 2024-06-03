import { BehaviorSubject } from "rxjs";

interface DevtoolEvent {
  type: string;
  payload: { type: string; actionId: number };
  state: string;
  id: string;
  source: string;
}

let storeDevtoolInstance = {};
export let isDevtoolEnabled = false;

export function enableReduxDevtools() {
  isDevtoolEnabled = true;
}

export function initializeReduxDevtools(
  storeName: string,
  state: BehaviorSubject<any>,
  initialState: any
) {
  if (!isDevtoolInstalled()) {
    return false;
  }
  const newDevtoolInstance = window?.["__REDUX_DEVTOOLS_EXTENSION__"].connect({
    name: storeName,
  });
  newDevtoolInstance.init(initialState);

  newDevtoolInstance.subscribe((event: DevtoolEvent) => {
    if (event.type === "DISPATCH" && event.payload.type === "JUMP_TO_ACTION") {
      state.next(JSON.parse(event.state));
    }
  });

  storeDevtoolInstance[storeName] = newDevtoolInstance;
}

export function sendActionToDevtools(
  storeName: string,
  actionName: string,
  payload: any
) {
  if (!isDevtoolInstalled()) {
    return false;
  }

  if (!isDevtoolEnabled) {
    throw new Error(
      "Devtools not enabled, please call enableReduxDevtools() in app.module.ts"
    );
  }
  storeDevtoolInstance[storeName].send(actionName, payload);
}

function isDevtoolInstalled() {
  return window?.["__REDUX_DEVTOOLS_EXTENSION__"] !== undefined;
}
