import type { StorePlugin } from "../type";

interface DevtoolEvent {
  type: string;
  payload: { type: string; actionId: number };
  state: string;
  id: string;
  source: string;
}

export function reduxDevtoolsPlugin<T>(): StorePlugin<T> {
  let connection: any;

  function isDevtoolInstalled() {
    // @ts-ignore
    return window?.["__REDUX_DEVTOOLS_EXTENSION__"] !== undefined;
  }

  return {
    onInit({storeName}, state, initialState) {
      if (!isDevtoolInstalled()) {
        return false;
      }

      // @ts-ignore
      connection = window?.["__REDUX_DEVTOOLS_EXTENSION__"].connect({ name: storeName });
      connection?.init(initialState);
      connection.subscribe((event: DevtoolEvent) => {
        if (event.type === "DISPATCH" && event.payload.type === "JUMP_TO_ACTION") {
          state.next(JSON.parse(event.state));
        }
      });
    },
    onSetState(actionName, newState) {
      if (!isDevtoolInstalled()) {
        return false;
      }

      connection?.send(actionName, newState);
    }
  };
}
