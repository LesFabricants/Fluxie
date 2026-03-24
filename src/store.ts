import { BehaviorSubject, distinctUntilChanged, map, Observable } from "rxjs";
import { computed, inject, Injector, Signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import type { StoreOptions } from "./type";

export class Store<T = any> {
  private options: StoreOptions;
  private readonly initialState: T;
  private state: BehaviorSubject<T>;
  readonly select$: Observable<T>;
  readonly select: Signal<T>;

  private readonly injector = inject(Injector);

  constructor(initialState: T, options: StoreOptions) {
  constructor(initialState: T, options?: Partial<Options>) {
    this.options = {
      ...options,
      storeName: options?.storeName ?? this.constructor.name,
    };
    this.initialState = initialState;
    this.state = new BehaviorSubject(initialState);
    this.select$ = this.state.asObservable();
    this.select = toSignal(this.state, { injector: this.injector, requireSync: true });

    this.options.plugins?.forEach(p => p.onInit?.(this.options, this.state, initialState));
  }

  public setState(actionName: string, mutationFn: (state: T) => T) {
    const newState = mutationFn(this.state.getValue());
    this.state.next(newState);

    this.options.plugins?.forEach(p => p.onSetState?.(actionName, newState));
  }

  public slice$<K>(projector: (state: T) => K): Observable<K> {
    return this.state.pipe(map(projector), distinctUntilChanged());
  }

  public slice<K>(projector: (state: T) => K): Signal<K> {
    return computed(() => projector(this.select()));
  }

  public reset() {
    this.setState('reset', () => this.initialState);
  }
}
