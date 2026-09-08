import { createContext } from "react";
import type { RadarTransitionContextValue } from "../types";

export const RadarTransitionContext = createContext<RadarTransitionContextValue | null>(null);
