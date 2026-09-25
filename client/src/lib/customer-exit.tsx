"use client";

import { createContext, useContext } from "react";

/** Lets customer screens exit back to role pick (RootShell). */
export const CustomerExitContext = createContext<(() => void) | null>(null);

export function useCustomerExit() {
  return useContext(CustomerExitContext);
}
