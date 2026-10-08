import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  AppData,
  Project,
  Settings,
  Task,
  Workspace,
  WorkspaceMember,
} from "./types";
import {
  readPersisted,
  writePersisted,
  clearPersisted,
} from "./services/persistence";
import { MockApi } from "./services/mockApi";
import { seedData } from "./mock/seed";

export type Store = AppData & {
  hydrated: boolean;
  error?: string;
  reset: () => Promise<void>;
  setActiveWorkspace: (id: string) => Promise<void>;
  updateSettings: (s: Partial<Settings>) => Promise<void>;
  createWorkspace: (
    input: Pick<Workspace, "name" | "description" | "color">,
  ) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  updateWorkspace: (id: string, p: Partial<Workspace>) => Promise<void>;
  createProject: (
    input: Omit<Project, "id" | "workspaceId" | "memberIds"> & {
      memberIds?: string[];
    },
  ) => Promise<void>;
  updateProject: (id: string, p: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  createTask: (
    input: Partial<Task> & Pick<Task, "title" | "projectId">,
  ) => Promise<void>;
  updateTask: (id: string, p: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  duplicateTask: (id: string) => Promise<void>;
  addComment: (id: string, body: string) => Promise<void>;
  addMember: (m: Omit<WorkspaceMember, "id" | "joinedAt">) => Promise<void>;
  updateMember: (id: string, p: Partial<WorkspaceMember>) => Promise<void>;
  removeMember: (id: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};
const Context = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [error, setError] = useState<string>();
  const api = useRef<MockApi>();
  useEffect(() => {
    let alive = true;
    readPersisted()
      .then((d) => {
        if (alive) {
          setData(d);
          api.current = new MockApi(d, writePersisted);
        }
      })
      .catch(() => {
        if (alive) {
          const d = seedData();
          setData(d);
          api.current = new MockApi(d, writePersisted);
          setError(
            "Saved demo data could not be loaded. A fresh copy is ready.",
          );
        }
      });
    return () => {
      alive = false;
    };
  }, []);
  const run = useCallback(async (fn: (client: MockApi) => Promise<AppData>) => {
    if (!api.current) throw new Error("FlowBoard is still loading.");
    try {
      const next = await fn(api.current);
      setData(next);
      setError(undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  }, []);
  const value = useMemo<Store | undefined>(() => {
    if (!data) return undefined;
    return {
      ...data,
      hydrated: true,
      error,
      reset: async () => {
        await clearPersisted();
        await run((c) => c.reset());
      },
      setActiveWorkspace: async (id) => run((c) => c.setWorkspace(id)),
      updateSettings: async (s) => run((c) => c.updateSettings(s)),
      createWorkspace: async (i) => run((c) => c.createWorkspace(i)),
      deleteWorkspace: async (id) => run((c) => c.deleteWorkspace(id)),
      updateWorkspace: async (id, p) => run((c) => c.updateWorkspace(id, p)),
      createProject: async (i) => run((c) => c.createProject(i)),
      updateProject: async (id, p) => run((c) => c.updateProject(id, p)),
      deleteProject: async (id) => run((c) => c.deleteProject(id)),
      createTask: async (i) => run((c) => c.createTask(i)),
      updateTask: async (id, p) => run((c) => c.updateTask(id, p)),
      deleteTask: async (id) => run((c) => c.deleteTask(id)),
      duplicateTask: async (id) => run((c) => c.duplicateTask(id)),
      addComment: async (id, b) => run((c) => c.addComment(id, b)),
      addMember: async (m) => run((c) => c.addMember(m)),
      updateMember: async (id, p) => run((c) => c.updateMember(id, p)),
      removeMember: async (id) => run((c) => c.removeMember(id)),
      markNotificationRead: async (id) =>
        run((c) => c.markNotificationRead(id)),
      markAllRead: async () => run((c) => c.markAllRead()),
    };
  }, [data, error, run]);
  if (!value)
    return (
      <div className="loading-screen">
        <span className="brand-mark">✦</span>
        <strong>Opening your workspace…</strong>
        <small>Loading local demo data</small>
      </div>
    );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useStore() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useStore must be within StoreProvider");
  return ctx;
}
