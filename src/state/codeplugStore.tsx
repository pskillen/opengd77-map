import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react';
import {
  applyImportToCodeplug as mergeImportIntoCodeplug,
  type ImportApplyMode,
} from '../lib/importMerge.ts';
import {
  addChannel as addChannelMutation,
  addZone as addZoneMutation,
  deleteChannel as deleteChannelMutation,
  deleteZone as deleteZoneMutation,
  setZoneMembers as setZoneMembersMutation,
  updateChannel as updateChannelMutation,
  updateZone as updateZoneMutation,
  type ChannelInput,
  type ZoneInput,
} from '../lib/codeplugMutations.ts';
import type { ImportResult } from '../lib/import/types.ts';
import { emptyCodeplug, type Codeplug } from '../models/codeplug.ts';
import { defaultProjectName, newProject, type CodeplugProject } from '../models/codeplugProject.ts';
import {
  clearProjectsStorage,
  loadProjectsFromStorage,
  saveProjectsToStorage,
  StorageQuotaError,
  type ProjectsState,
} from './codeplugStorage.ts';

type ProjectsAction =
  | { type: 'IMPORT_NEW_PROJECT'; result: ImportResult; name?: string; mode?: ImportApplyMode }
  | { type: 'APPLY_IMPORT'; result: ImportResult; mode?: ImportApplyMode }
  | { type: 'SET_ACTIVE_PROJECT'; id: string }
  | { type: 'DELETE_PROJECT'; id: string }
  | { type: 'CLEAR' }
  | { type: 'ADD_CHANNEL'; input: ChannelInput }
  | { type: 'UPDATE_CHANNEL'; channelId: string; patch: Partial<ChannelInput> }
  | { type: 'DELETE_CHANNEL'; channelId: string }
  | { type: 'ADD_ZONE'; input: ZoneInput }
  | { type: 'UPDATE_ZONE'; zoneId: string; patch: Partial<ZoneInput> }
  | { type: 'DELETE_ZONE'; zoneId: string }
  | { type: 'SET_ZONE_MEMBERS'; zoneId: string; memberChannelIds: string[] };

function applyImportToCodeplug(
  codeplug: Codeplug,
  result: ImportResult,
  mode: ImportApplyMode = 'merge',
): Codeplug {
  return mergeImportIntoCodeplug(codeplug, result, mode).codeplug;
}

function touchProject(project: CodeplugProject): CodeplugProject {
  return { ...project, updatedAt: new Date().toISOString() };
}

function importNewProjectState(
  state: ProjectsState,
  result: ImportResult,
  name?: string,
  mode: ImportApplyMode = 'merge',
): ProjectsState {
  const projectName = name ?? defaultProjectName(result.recognised);
  const project = touchProject({
    ...newProject(projectName),
    codeplug: applyImportToCodeplug(emptyCodeplug(), result, mode),
  });
  return {
    projects: [...state.projects, project],
    activeProjectId: project.id,
  };
}

function updateActiveCodeplug(
  state: ProjectsState,
  updater: (codeplug: Codeplug) => Codeplug,
): ProjectsState {
  if (!state.activeProjectId) return state;
  const activeId = state.activeProjectId;
  return {
    ...state,
    projects: state.projects.map((project) => {
      if (project.id !== activeId) return project;
      return touchProject({
        ...project,
        codeplug: updater(project.codeplug),
      });
    }),
  };
}

function projectsReducer(state: ProjectsState, action: ProjectsAction): ProjectsState {
  switch (action.type) {
    case 'IMPORT_NEW_PROJECT':
      return importNewProjectState(state, action.result, action.name, action.mode);

    case 'APPLY_IMPORT': {
      const mode = action.mode ?? 'merge';
      if (!state.activeProjectId) {
        return importNewProjectState(state, action.result, undefined, mode);
      }
      const activeId = state.activeProjectId;
      return {
        ...state,
        projects: state.projects.map((project) => {
          if (project.id !== activeId) return project;
          return touchProject({
            ...project,
            codeplug: applyImportToCodeplug(project.codeplug, action.result, mode),
          });
        }),
      };
    }

    case 'SET_ACTIVE_PROJECT': {
      if (!state.projects.some((p) => p.id === action.id)) return state;
      return { ...state, activeProjectId: action.id };
    }

    case 'DELETE_PROJECT': {
      const projects = state.projects.filter((p) => p.id !== action.id);
      let activeProjectId = state.activeProjectId;
      if (activeProjectId === action.id) {
        activeProjectId = projects[0]?.id ?? null;
      }
      return { projects, activeProjectId };
    }

    case 'CLEAR': {
      if (!state.activeProjectId) return state;
      const activeId = state.activeProjectId;
      return {
        ...state,
        projects: state.projects.map((project) => {
          if (project.id !== activeId) return project;
          return touchProject({ ...project, codeplug: emptyCodeplug() });
        }),
      };
    }

    case 'ADD_CHANNEL':
      return updateActiveCodeplug(state, (cp) => addChannelMutation(cp, action.input));

    case 'UPDATE_CHANNEL':
      return updateActiveCodeplug(state, (cp) =>
        updateChannelMutation(cp, action.channelId, action.patch),
      );

    case 'DELETE_CHANNEL':
      return updateActiveCodeplug(state, (cp) => deleteChannelMutation(cp, action.channelId));

    case 'ADD_ZONE':
      return updateActiveCodeplug(state, (cp) => addZoneMutation(cp, action.input));

    case 'UPDATE_ZONE':
      return updateActiveCodeplug(state, (cp) =>
        updateZoneMutation(cp, action.zoneId, action.patch),
      );

    case 'DELETE_ZONE':
      return updateActiveCodeplug(state, (cp) => deleteZoneMutation(cp, action.zoneId));

    case 'SET_ZONE_MEMBERS':
      return updateActiveCodeplug(state, (cp) =>
        setZoneMembersMutation(cp, action.zoneId, action.memberChannelIds),
      );

    default:
      return state;
  }
}

function emptyProjectsState(): ProjectsState {
  return { activeProjectId: null, projects: [] };
}

function activeProject(state: ProjectsState): CodeplugProject | null {
  if (!state.activeProjectId) return null;
  return state.projects.find((p) => p.id === state.activeProjectId) ?? null;
}

interface CodeplugContextValue {
  codeplug: Codeplug;
  applyImport: (result: ImportResult, mode?: ImportApplyMode) => void;
  clear: () => void;
  addChannel: (input: ChannelInput) => void;
  updateChannel: (channelId: string, patch: Partial<ChannelInput>) => void;
  deleteChannel: (channelId: string) => void;
  addZone: (input: ZoneInput) => void;
  updateZone: (zoneId: string, patch: Partial<ZoneInput>) => void;
  deleteZone: (zoneId: string) => void;
  setZoneMembers: (zoneId: string, memberChannelIds: string[]) => void;
  persistenceError: string | null;
  clearPersistenceError: () => void;
}

interface ProjectsContextValue {
  projects: CodeplugProject[];
  activeProjectId: string | null;
  activeProject: CodeplugProject | null;
  importNewProject: (result: ImportResult, name?: string) => void;
  applyImportToActive: (result: ImportResult, mode?: ImportApplyMode) => void;
  setActiveProject: (id: string) => void;
  deleteProject: (id: string) => void;
  persistenceError: string | null;
  clearPersistenceError: () => void;
}

const CodeplugContext = createContext<CodeplugContextValue | null>(null);
const ProjectsContext = createContext<ProjectsContextValue | null>(null);

export function CodeplugProvider({ children }: { children: ReactNode }) {
  const [projectsState, dispatch] = useReducer(
    projectsReducer,
    undefined,
    () => loadProjectsFromStorage() ?? emptyProjectsState(),
  );
  const [persistenceError, setPersistenceError] = useState<string | null>(null);

  useEffect(() => {
    try {
      saveProjectsToStorage(projectsState);
    } catch (err) {
      const message =
        err instanceof StorageQuotaError
          ? 'Could not save to browser storage (quota exceeded). Your changes work for now but may be lost on reload.'
          : 'Could not save to browser storage. Your changes may be lost on reload.';
      queueMicrotask(() => setPersistenceError(message));
    }
  }, [projectsState]);

  const clearPersistenceError = useCallback(() => {
    setPersistenceError(null);
  }, []);

  const applyImport = useCallback((result: ImportResult, mode: ImportApplyMode = 'merge') => {
    setPersistenceError(null);
    dispatch({ type: 'APPLY_IMPORT', result, mode });
  }, []);

  const clear = useCallback(() => {
    setPersistenceError(null);
    dispatch({ type: 'CLEAR' });
    if (!projectsState.activeProjectId) {
      clearProjectsStorage();
    }
  }, [projectsState.activeProjectId]);

  const importNewProject = useCallback((result: ImportResult, name?: string) => {
    setPersistenceError(null);
    dispatch({ type: 'IMPORT_NEW_PROJECT', result, name });
  }, []);

  const applyImportToActive = useCallback(
    (result: ImportResult, mode: ImportApplyMode = 'merge') => {
      setPersistenceError(null);
      dispatch({ type: 'APPLY_IMPORT', result, mode });
    },
    [],
  );

  const setActiveProject = useCallback((id: string) => {
    setPersistenceError(null);
    dispatch({ type: 'SET_ACTIVE_PROJECT', id });
  }, []);

  const deleteProject = useCallback((id: string) => {
    setPersistenceError(null);
    dispatch({ type: 'DELETE_PROJECT', id });
  }, []);

  const addChannel = useCallback((input: ChannelInput) => {
    setPersistenceError(null);
    dispatch({ type: 'ADD_CHANNEL', input });
  }, []);

  const updateChannel = useCallback((channelId: string, patch: Partial<ChannelInput>) => {
    setPersistenceError(null);
    dispatch({ type: 'UPDATE_CHANNEL', channelId, patch });
  }, []);

  const deleteChannel = useCallback((channelId: string) => {
    setPersistenceError(null);
    dispatch({ type: 'DELETE_CHANNEL', channelId });
  }, []);

  const addZone = useCallback((input: ZoneInput) => {
    setPersistenceError(null);
    dispatch({ type: 'ADD_ZONE', input });
  }, []);

  const updateZone = useCallback((zoneId: string, patch: Partial<ZoneInput>) => {
    setPersistenceError(null);
    dispatch({ type: 'UPDATE_ZONE', zoneId, patch });
  }, []);

  const deleteZone = useCallback((zoneId: string) => {
    setPersistenceError(null);
    dispatch({ type: 'DELETE_ZONE', zoneId });
  }, []);

  const setZoneMembers = useCallback((zoneId: string, memberChannelIds: string[]) => {
    setPersistenceError(null);
    dispatch({ type: 'SET_ZONE_MEMBERS', zoneId, memberChannelIds });
  }, []);

  const current = activeProject(projectsState);
  const codeplug = current?.codeplug ?? emptyCodeplug();

  const codeplugValue = useMemo(
    () => ({
      codeplug,
      applyImport,
      clear,
      addChannel,
      updateChannel,
      deleteChannel,
      addZone,
      updateZone,
      deleteZone,
      setZoneMembers,
      persistenceError,
      clearPersistenceError,
    }),
    [
      codeplug,
      applyImport,
      clear,
      addChannel,
      updateChannel,
      deleteChannel,
      addZone,
      updateZone,
      deleteZone,
      setZoneMembers,
      persistenceError,
      clearPersistenceError,
    ],
  );

  const projectsValue = useMemo(
    () => ({
      projects: projectsState.projects,
      activeProjectId: projectsState.activeProjectId,
      activeProject: current,
      importNewProject,
      applyImportToActive,
      setActiveProject,
      deleteProject,
      persistenceError,
      clearPersistenceError,
    }),
    [
      projectsState,
      current,
      importNewProject,
      applyImportToActive,
      setActiveProject,
      deleteProject,
      persistenceError,
      clearPersistenceError,
    ],
  );

  return (
    <ProjectsContext.Provider value={projectsValue}>
      <CodeplugContext.Provider value={codeplugValue}>{children}</CodeplugContext.Provider>
    </ProjectsContext.Provider>
  );
}

export function useCodeplug(): CodeplugContextValue {
  const ctx = useContext(CodeplugContext);
  if (!ctx) throw new Error('useCodeplug must be used within CodeplugProvider');
  return ctx;
}

export function useProjects(): ProjectsContextValue {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error('useProjects must be used within CodeplugProvider');
  return ctx;
}

/** @internal test export */
export { applyImportToCodeplug, projectsReducer };
