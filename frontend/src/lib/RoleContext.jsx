import React, { createContext, useContext, useEffect, useState } from "react";
import { getPermissions } from "../lib/api";

const RoleCtx = createContext({ role: "engineer", permissions: [], setRole: () => {} });

export function RoleProvider({ children }) {
  const [role, setRoleState] = useState(localStorage.getItem("mw_role") || "engineer");
  const [permissions, setPermissions] = useState([]);

  const refresh = async () => {
    try { const p = await getPermissions(); setPermissions(p.permissions); } catch { /* noop */ }
  };

  useEffect(() => { refresh(); }, [role]);

  const setRole = (r) => {
    localStorage.setItem("mw_role", r);
    setRoleState(r);
  };

  return (
    <RoleCtx.Provider value={{ role, permissions, setRole, can: (p) => permissions.includes(p) }}>
      {children}
    </RoleCtx.Provider>
  );
}

export const useRole = () => useContext(RoleCtx);
