import { createContext, useContext } from 'react';

export const AccessCtx = createContext({ isMaster: false, permissions: [] });
export const useAccess = () => useContext(AccessCtx);
