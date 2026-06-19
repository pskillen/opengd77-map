import { importFiles } from '../../lib/import/index.ts';
import {
  applyImportToCodeplug,
  previewImportMerge,
  type ImportApplyMode,
  type ImportMergeReport,
} from '../../lib/importMerge.ts';
import type { ImportResult } from '../../lib/import/types.ts';
import { emptyCodeplug, type Codeplug } from '../../models/codeplug.ts';
import { newProject } from '../../models/codeplugProject.ts';
import {
  CODEPLUG_STORAGE_KEY,
  loadProjectsFromStorage,
  serializeProjects,
} from '../../state/codeplugStorage.ts';
import { projectsReducer } from '../../state/codeplugStore.tsx';

export type ImportWorkflowStep = 'parse' | 'preview' | 'apply' | 'persist';

export interface ActiveImportWorkflowResult {
  parseResult: ImportResult;
  previewReport: ImportMergeReport;
  codeplugAfter: Codeplug;
  applyReport: ImportMergeReport;
  codeplugAfterReload?: Codeplug;
}

export async function runActiveImportWorkflow(opts: {
  codeplug: Codeplug;
  files: File[];
  mode?: ImportApplyMode;
  steps?: ImportWorkflowStep[];
}): Promise<ActiveImportWorkflowResult> {
  const mode = opts.mode ?? 'merge';
  const steps = opts.steps ?? ['parse', 'preview', 'apply'];

  const parseResult = await importFiles(opts.files);
  let previewReport = previewImportMerge(opts.codeplug, parseResult, mode);
  let codeplugAfter = opts.codeplug;
  let applyReport = previewReport;

  if (steps.includes('apply')) {
    const applied = applyImportToCodeplug(opts.codeplug, parseResult, mode);
    codeplugAfter = applied.codeplug;
    applyReport = applied.report;
    previewReport = previewImportMerge(opts.codeplug, parseResult, mode);
  }

  let codeplugAfterReload: Codeplug | undefined;
  if (steps.includes('persist')) {
    const project = newProject('Workflow test', codeplugAfter);
    localStorage.setItem(
      CODEPLUG_STORAGE_KEY,
      serializeProjects({ activeProjectId: project.id, projects: [project] }),
    );
    const reloaded = loadProjectsFromStorage();
    codeplugAfterReload =
      reloaded?.projects.find((p) => p.id === project.id)?.codeplug ?? undefined;
  }

  return {
    parseResult,
    previewReport,
    codeplugAfter,
    applyReport,
    codeplugAfterReload,
  };
}

export async function runNewProjectImportWorkflow(opts: {
  files: File[];
  mode?: ImportApplyMode;
}): Promise<{ parseResult: ImportResult; codeplug: Codeplug }> {
  const mode = opts.mode ?? 'merge';
  const parseResult = await importFiles(opts.files);
  const { codeplug } = applyImportToCodeplug(emptyCodeplug(), parseResult, mode);
  return { parseResult, codeplug };
}

export function runStoreActiveImport(opts: {
  activeProjectId: string;
  projects: ReturnType<typeof newProject>[];
  result: ImportResult;
  mode?: ImportApplyMode;
}) {
  const mode = opts.mode ?? 'merge';
  return projectsReducer(
    { activeProjectId: opts.activeProjectId, projects: opts.projects },
    { type: 'APPLY_IMPORT', result: opts.result, mode },
  );
}

export function channelIds(codeplug: Codeplug): string[] {
  return codeplug.channels.map((c) => c.id);
}
