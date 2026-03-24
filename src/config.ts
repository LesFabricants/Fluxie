import { InjectionToken } from "@angular/core";
import type { StorePlugin } from "./type";

export interface FluxieConfig {
  debug?: boolean;
  plugins?: StorePlugin<any>[];
}

export const FLUXIE_CONFIG = new InjectionToken<FluxieConfig>('FluxieConfig');
