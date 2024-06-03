# Fluxie

Super small helper class meant to greatly simplify the creation of a flux architecture using angular service, complete with redux devtool and caching support

**Warning**  
**Requires 2Kb of available space, make sure you have the space before installing !**

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
    super({ users: [], selection: [] }, { cache: true, storeName: "Users" });
  }
}
```

## Parameters

- `initialState`
  the initial state of the store

- `options` (optional)
  - `storeName`
    name to use for the store
  - `cache`
    a boolean value, if true, enables the caching of the state via IndexedDB

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
    super({ users: [], selection: [] });
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

## Devtool support

In order to add devtool support add this snippet to your `app.module.ts`, right after your imports:

```ts
if (!environment.production) {
  enableReduxDevtools();
}
```

Your redux devtool menu will now show all your store actions, the option `storeName` will be the store instance name there (defaults to the class name if not provided), and every service extending the `Store` class will be its own instance in the dropdown at the top.
