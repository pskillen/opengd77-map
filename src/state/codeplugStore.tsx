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
import type { EntityRef } from '../lib/entityRefs.ts';
import {
  applyImportToCodeplug as mergeImportIntoCodeplug,
  type ImportApplyMode,
} from '../lib/importMerge.ts';
import {
  addChannel as addChannelMutation,
  addContact as addContactMutation,
  addRxGroupList as addRxGroupListMutation,
  addTalkGroup as addTalkGroupMutation,
  addZone as addZoneMutation,
  deleteChannel as deleteChannelMutation,
  deleteContact as deleteContactMutation,
  deleteRxGroupList as deleteRxGroupListMutation,
  deleteTalkGroup as deleteTalkGroupMutation,
  deleteZone as deleteZoneMutation,
  setRxGroupListMembers as setRxGroupListMembersMutation,
  setZoneMembers as setZoneMembersMutation,
  updateChannel as updateChannelMutation,
  updateContact as updateContactMutation,
  updateRxGroupList as updateRxGroupListMutation,
  updateTalkGroup as updateTalkGroupMutation,
  updateZone as updateZoneMutation,
  type ChannelInput,
  type ContactInput,
  type RxGroupListInput,
  type TalkGroupInput,
  type ZoneInput,
} from '../lib/codeplugMutations.ts';
import type { ImportResult } from '../lib/import/types.ts';
import { emptyCodeplug, type Codeplug } from '../models/codeplug.ts';
import { defaultProjectName, newProject, type CodeplugProject } from '../models/codeplugProject.ts';
import type { ProjectMetadataPatch } from '../lib/validation/project.ts';
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
  | { type: 'SET_ZONE_MEMBERS'; zoneId: string; memberChannelIds: string[] }
  | { type: 'ADD_TALK_GROUP'; input: TalkGroupInput }
  | { type: 'UPDATE_TALK_GROUP'; talkGroupId: string; patch: Partial<TalkGroupInput> }
  | { type: 'DELETE_TALK_GROUP'; talkGroupId: string }
  | { type: 'ADD_CONTACT'; input: ContactInput }
  | { type: 'UPDATE_CONTACT'; contactId: string; patch: Partial<ContactInput> }
  | { type: 'DELETE_CONTACT'; contactId: string }
  | { type: 'ADD_RX_GROUP_LIST'; input: RxGroupListInput }
  | { type: 'UPDATE_RX_GROUP_LIST'; rglId: string; patch: Partial<RxGroupListInput> }
  | { type: 'DELETE_RX_GROUP_LIST'; rglId: string }
  | { type: 'SET_RX_GROUP_LIST_MEMBERS'; rglId: string; memberRefs: EntityRef[] }
  | { type: 'UPDATE_PROJECT'; id: string; patch: ProjectMetadataPatch }
  | { type: 'COMMIT_NEW_PROJECT'; metadata: ProjectMetadataPatch };

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

function commitNewProjectState(
  state: ProjectsState,
  metadata: ProjectMetadataPatch,
): ProjectsState {
  const name = metadata.name?.trim() ?? '';
  const project = touchProject({
    ...newProject(name),
    description: metadata.description ?? '',
    notes: metadata.notes ?? '',
    author: metadata.author ?? '',
    targetRadios: metadata.targetRadios ?? [],
  });
  return {
    projects: [...state.projects, project],
    activeProjectId: project.id,
  };
}

function importNewProjectState(
  state: ProjectsState,
  result: ImportResult,
  name?: string,
  mode: ImportApplyMode = 'merge',
): ProjectsState {
  const projectName = name ?? result.suggestedProjectName ?? defaultProjectName(result.recognised);
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

    case 'ADD_TALK_GROUP':
      return updateActiveCodeplug(state, (cp) => addTalkGroupMutation(cp, action.input));

    case 'UPDATE_TALK_GROUP':
      return updateActiveCodeplug(state, (cp) =>
        updateTalkGroupMutation(cp, action.talkGroupId, action.patch),
      );

    case 'DELETE_TALK_GROUP':
      return updateActiveCodeplug(state, (cp) => deleteTalkGroupMutation(cp, action.talkGroupId));

    case 'ADD_CONTACT':
      return updateActiveCodeplug(state, (cp) => addContactMutation(cp, action.input));

    case 'UPDATE_CONTACT':
      return updateActiveCodeplug(state, (cp) =>
        updateContactMutation(cp, action.contactId, action.patch),
      );

    case 'DELETE_CONTACT':
      return updateActiveCodeplug(state, (cp) => deleteContactMutation(cp, action.contactId));

    case 'ADD_RX_GROUP_LIST':
      return updateActiveCodeplug(state, (cp) => addRxGroupListMutation(cp, action.input));

    case 'UPDATE_RX_GROUP_LIST':
      return updateActiveCodeplug(state, (cp) =>
        updateRxGroupListMutation(cp, action.rglId, action.patch),
      );

    case 'DELETE_RX_GROUP_LIST':
      return updateActiveCodeplug(state, (cp) => deleteRxGroupListMutation(cp, action.rglId));

    case 'SET_RX_GROUP_LIST_MEMBERS':
      return updateActiveCodeplug(state, (cp) =>
        setRxGroupListMembersMutation(cp, action.rglId, action.memberRefs),
      );

    case 'UPDATE_PROJECT': {
      const { id, patch } = action;
      return {
        ...state,
        projects: state.projects.map((project) => {
          if (project.id !== id) return project;
          return touchProject({ ...project, ...patch });
        }),
      };
    }

    case 'COMMIT_NEW_PROJECT':
      return commitNewProjectState(state, action.metadata);

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
  addTalkGroup: (input: TalkGroupInput) => void;
  updateTalkGroup: (talkGroupId: string, patch: Partial<TalkGroupInput>) => void;
  deleteTalkGroup: (talkGroupId: string) => void;
  addContact: (input: ContactInput) => void;
  updateContact: (contactId: string, patch: Partial<ContactInput>) => void;
  deleteContact: (contactId: string) => void;
  addRxGroupList: (input: RxGroupListInput) => void;
  updateRxGroupList: (rglId: string, patch: Partial<RxGroupListInput>) => void;
  deleteRxGroupList: (rglId: string) => void;
  setRxGroupListMembers: (rglId: string, memberRefs: EntityRef[]) => void;
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
  updateProject: (id: string, patch: ProjectMetadataPatch) => void;
  commitNewProject: (metadata: ProjectMetadataPatch) => void;
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

  const updateProject = useCallback((id: string, patch: ProjectMetadataPatch) => {
    setPersistenceError(null);
    dispatch({ type: 'UPDATE_PROJECT', id, patch });
  }, []);

  const commitNewProject = useCallback((metadata: ProjectMetadataPatch) => {
    setPersistenceError(null);
    dispatch({ type: 'COMMIT_NEW_PROJECT', metadata });
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

  const addTalkGroup = useCallback((input: TalkGroupInput) => {
    setPersistenceError(null);
    dispatch({ type: 'ADD_TALK_GROUP', input });
  }, []);

  const updateTalkGroup = useCallback((talkGroupId: string, patch: Partial<TalkGroupInput>) => {
    setPersistenceError(null);
    dispatch({ type: 'UPDATE_TALK_GROUP', talkGroupId, patch });
  }, []);

  const deleteTalkGroup = useCallback((talkGroupId: string) => {
    setPersistenceError(null);
    dispatch({ type: 'DELETE_TALK_GROUP', talkGroupId });
  }, []);

  const addContact = useCallback((input: ContactInput) => {
    setPersistenceError(null);
    dispatch({ type: 'ADD_CONTACT', input });
  }, []);

  const updateContact = useCallback((contactId: string, patch: Partial<ContactInput>) => {
    setPersistenceError(null);
    dispatch({ type: 'UPDATE_CONTACT', contactId, patch });
  }, []);

  const deleteContact = useCallback((contactId: string) => {
    setPersistenceError(null);
    dispatch({ type: 'DELETE_CONTACT', contactId });
  }, []);

  const addRxGroupList = useCallback((input: RxGroupListInput) => {
    setPersistenceError(null);
    dispatch({ type: 'ADD_RX_GROUP_LIST', input });
  }, []);

  const updateRxGroupList = useCallback((rglId: string, patch: Partial<RxGroupListInput>) => {
    setPersistenceError(null);
    dispatch({ type: 'UPDATE_RX_GROUP_LIST', rglId, patch });
  }, []);

  const deleteRxGroupList = useCallback((rglId: string) => {
    setPersistenceError(null);
    dispatch({ type: 'DELETE_RX_GROUP_LIST', rglId });
  }, []);

  const setRxGroupListMembers = useCallback((rglId: string, memberRefs: EntityRef[]) => {
    setPersistenceError(null);
    dispatch({ type: 'SET_RX_GROUP_LIST_MEMBERS', rglId, memberRefs });
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
      addTalkGroup,
      updateTalkGroup,
      deleteTalkGroup,
      addContact,
      updateContact,
      deleteContact,
      addRxGroupList,
      updateRxGroupList,
      deleteRxGroupList,
      setRxGroupListMembers,
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
      addTalkGroup,
      updateTalkGroup,
      deleteTalkGroup,
      addContact,
      updateContact,
      deleteContact,
      addRxGroupList,
      updateRxGroupList,
      deleteRxGroupList,
      setRxGroupListMembers,
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
      updateProject,
      commitNewProject,
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
      updateProject,
      commitNewProject,
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
