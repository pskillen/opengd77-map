import type { Codeplug } from '../../../models/codeplug.ts';
import type { CodeplugProject } from '../../../models/codeplugProject.ts';
import type { ExportOptions } from '../../import-export/types.ts';
import { serialiseNativeYaml } from '../../nativeYaml/serde.ts';
import { newProject } from '../../../models/codeplugProject.ts';

export function serialiseNativeYamlExport(
  codeplug: Codeplug,
  options?: ExportOptions & { project?: CodeplugProject },
): string {
  const baseProject =
    options?.project ??
    newProject(options?.fileName?.replace(/\.ya?ml$/i, '') || 'Exported codeplug', codeplug);
  const project: CodeplugProject = { ...baseProject, codeplug };
  return serialiseNativeYaml(project);
}
