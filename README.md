# Fluxie

Super small helper class meant to greatly simplify the creation of a flux architecture using angular service, complete with a plugin system for devtools and caching support

## Installation

The latest version supports signals, and thus requires a version of angular 16 minimum, other versions can use the lts release that removes signals support

`npm i fluxie` Angular 16+

`npm i fluxie@lts` Other Angular Versions

## Syntax

> The `store.ts` files is a base class that can be extended by services to add the necessary methods and properties required to handle a centralized state

```ts
interface UsersState {
  users: IUser[];
  selection: IUser[];
}

@Injectable({ providedIn: "root" })
export class UsersService extends Store<UsersState> {
  constructor() {
    super({ users: [], selection: [] }, { storeName: "Users" });
  }
}
```

## Parameters

- `initialState`
  the initial state of the store

- `options` (required)
  - `storeName`
    name to use for the store
  - `debug`
    a boolean value, if true, enables debug logging
  - `plugins`
    an array of plugins to extend store behavior (see [Plugins](#plugins))

## API

### `select`

A `Signal<T>` that holds the current state.

### `select$`

An `Observable<T>` of the current state.

### `setState(actionName, mutationFn)`

Updates the state. `mutationFn` receives the current state and returns the new state.

```ts
this.setState("set users", (state) => ({ ...state, users }));
```

### `slice(projector)`

Returns a `Signal<K>` derived from a slice of the state. Useful to avoid recomputing when unrelated parts of the state change.

```ts
readonly users = this.slice(state => state.users);
```

### `slice$(projector)`

Returns an `Observable<K>` derived from a slice of the state, with `distinctUntilChanged` applied.

```ts
readonly users$ = this.slice$(state => state.users);
```

### `reset()`

Resets the state back to `initialState`.

```ts
this.reset();
```

## Plugins

Fluxie's caching and devtool features are opt-in plugins passed via the `plugins` option.

### Cache plugin

Persists the state to IndexedDB and restores it on init.

```ts
import { cachePlugin } from "fluxie";

super(initialState, {
  storeName: "Users",
  plugins: [cachePlugin()],
});
```

### Redux devtools plugin

Connects the store to the Redux DevTools browser extension.

```ts
import { reduxDevtoolsPlugin } from "fluxie";

super(initialState, {
  storeName: "Users",
  plugins: [reduxDevtoolsPlugin()],
});
```

The `storeName` option will be the store instance name in the devtools dropdown, and every service extending the `Store` class will be its own instance there.

## Global configuration

You can provide a global `FluxieConfig` that applies to all stores in your application via the `FLUXIE_CONFIG` injection token. Per-store `plugins` are merged with global ones.

```ts
import { FLUXIE_CONFIG, cachePlugin, reduxDevtoolsPlugin } from "fluxie";

bootstrapApplication(AppComponent, {
  providers: [
    {
      provide: FLUXIE_CONFIG,
      useValue: {
        plugins: [reduxDevtoolsPlugin()],
      },
    },
  ],
});
```

## Examples

`users.service.ts`

```ts
interface UsersState {
  users: IUser[];
  selection: IUser[];
}

@Injectable({ providedIn: "root" })
export class UsersService extends Store<UsersState> {
  constructor() {
    super({ users: [], selection: [] }, { storeName: "Users" });
  }

  users = computed(() => {
    return this.store.select().users.map((user) => new User(user));
  });

  users$: Observable<User[]> = this.store.select$.pipe(
    map((state) => state.users),
    map((users) => users.map((user) => new User(user)))
  );

  get() {
    this.http.get<IUser[]>(`${URL}/users`).subscribe((users) => {
      this.setUsers(users);
    });
  }

  updateRole(id: string, role: RoleEnum) {
    this.http.patch<IUser>(`${URL}/users/${id}`, { role }).subscribe((user) => {
      this.updateUser(id, user);
    });
  }

  setUsers(users: IUser[]) {
    this.setState("set users", (state) => ({
      ...state,
      users,
    }));
  }

  updateUser(id: string, user: IUser) {
    this.setState("update user", (state) => {
      return {
        ...state,
        users: state.users.map((currentUser) =>
          currentUser.id === id ? user : currentUser
        ),
      };
    });
  }

  toggleUserSelection(user: IUser) {
    this.setState("toggle user selection", (state) => {
      const newSelection = state.selection;
      const index = newSelection.findIndex(({ id }) => id === user.id);

      if (index > -1) {
        newSelection.splice(index, 1);
      } else {
        newSelection.push(user);
      }

      return {
        ...state,
        selection: newSelection,
      };
    });
  }

  emptySelection() {
    this.setState("empty selection", (state) => ({
      ...state,
      selection: [],
    }));
  }
}
```

`users.component.ts`

```ts
@Component({
  selector: "oney-users",
  templateUrl: "./users.component.html",
  styleUrls: ["./users.component.scss"],
})
export class UsersComponent implements OnInit {
  protected usersService = inject(UsersService);

  constructor() {}

  ngOnInit(): void {
    this.usersService.get();
  }
}
```

Via Observables:

```html
<article>
  @for (user of usersService.users$ | async) {
  <app-user [user]="user"></app-user>
  }
</article>
```

Via Signals:

```html
<article>
  @for (user of usersService.users()) {
  <app-user [user]="user"></app-user>
  }
</article>
```

Note: You are free to organize this however you want, although the recommended organization would be to split your service file into 3 files:

- `users.service.ts`
  makes http calls, and is overall the file your application calls to request state changes

  - in the example above, this would contain get and updateRole

- `users.query.ts`
  contains all of the variations of the filtered state used throughout the application

  - in the example above, this would contain users and users$

- `users.store.ts`
  the file that is only called by `users.service.ts` and `users.query.ts`, this is the file that contains the store initialization code, the state typing, and every method that directly alters the state

  - in the example above, this would contain setUsers, updateUser, toggleUserSelection and emptySelection

## Testing

In order to test a component or service using a store, you can simply setup a default state before all your tests

```ts
beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [User],
    providers: [
      UsersService,
      UsersStore,
      UsersQuery,
    ],
  }).compileComponents();

  const userStore = TestBed.inject(UsersStore);
  userStore.setState('[Test] setup store state', (defaultState) => ({
    ...defaultState,
    ...TEST_STATE_HERE,
  }));
});
```
