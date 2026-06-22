import { createContext, useContext, useEffect, useMemo, useState, ReactNode, useCallback } from "react";
import {
  Member, OrgSettings, loadMembers, saveMembers, loadSettings, saveSettings, newMember,
} from "./store";

interface AppCtx {
  members: Member[];
  settings: OrgSettings;
  addMember: (m: Partial<Member>) => Member;
  addMembers: (list: Partial<Member>[]) => number;
  updateMember: (id: string, patch: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  toggleHold: (id: string) => void;
  setStatus: (id: string, status: Member["status"]) => void;
  updateSettings: (s: OrgSettings) => void;
  refresh: () => void;
}

const Ctx = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [members, setMembers] = useState<Member[]>(() => loadMembers());
  const [settings, setSettings] = useState<OrgSettings>(() => loadSettings());

  useEffect(() => saveMembers(members), [members]);
  useEffect(() => saveSettings(settings), [settings]);

  const addMember = useCallback((m: Partial<Member>) => {
    const created = newMember(m);
    setMembers((prev) => [created, ...prev]);
    return created;
  }, []);

  const addMembers = useCallback((list: Partial<Member>[]) => {
    const created = list.map((m) => newMember(m));
    setMembers((prev) => [...created, ...prev]);
    return created.length;
  }, []);

  const updateMember = useCallback((id: string, patch: Partial<Member>) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch, updated_at: new Date().toISOString() } : m))
    );
  }, []);

  const deleteMember = useCallback((id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const toggleHold = useCallback((id: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, hold: !m.hold, updated_at: new Date().toISOString() } : m))
    );
  }, []);

  const setStatus = useCallback((id: string, status: Member["status"]) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              status,
              months_pending: status === "paid" ? 0 : m.months_pending,
              updated_at: new Date().toISOString(),
            }
          : m
      )
    );
  }, []);

  const updateSettings = useCallback((s: OrgSettings) => setSettings(s), []);
  const refresh = useCallback(() => {
    setMembers(loadMembers());
    setSettings(loadSettings());
  }, []);

  const value = useMemo<AppCtx>(
    () => ({ members, settings, addMember, addMembers, updateMember, deleteMember, toggleHold, setStatus, updateSettings, refresh }),
    [members, settings, addMember, addMembers, updateMember, deleteMember, toggleHold, setStatus, updateSettings, refresh]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used within AppProvider");
  return v;
}
