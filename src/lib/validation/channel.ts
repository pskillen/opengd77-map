import type { Channel, ChannelModeProfile, Codeplug } from '../../models/codeplug.ts';
import { isDmrMode } from '../channelModes.ts';
import { composeChannelWireName } from '../channelNaming.ts';

export interface ValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export function validateChannel(
  input: Partial<Channel> & { name: string },
  codeplug: Codeplug,
  channelId?: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const callsign = (input.callsign ?? '').trim();
  const name = (input.name ?? '').trim();

  if (!name && !callsign) {
    issues.push({
      field: 'name',
      message: 'Enter a channel name or callsign',
      severity: 'error',
    });
  }

  const wirePreview = composeChannelWireName({
    callsign,
    name,
    exportNameMode: input.exportNameMode ?? 'name_only',
  });

  if (wirePreview) {
    const duplicateWire = codeplug.channels.find(
      (ch) => composeChannelWireName(ch) === wirePreview && ch.id !== channelId,
    );
    if (duplicateWire) {
      issues.push({
        field: 'exportNameMode',
        message: `Another channel already exports as "${wirePreview}"`,
        severity: 'warning',
      });
    }
  }

  if (name) {
    const duplicateName = codeplug.channels.find((ch) => ch.name === name && ch.id !== channelId);
    if (duplicateName) {
      issues.push({
        field: 'name',
        message: 'Another channel already uses this name',
        severity: 'warning',
      });
    }
  }

  if (
    input.rxFrequency != null &&
    (!Number.isFinite(input.rxFrequency) || input.rxFrequency <= 0)
  ) {
    issues.push({ field: 'rxFrequency', message: 'Invalid RX frequency', severity: 'error' });
  }
  if (
    input.txFrequency != null &&
    (!Number.isFinite(input.txFrequency) || input.txFrequency <= 0)
  ) {
    issues.push({ field: 'txFrequency', message: 'Invalid TX frequency', severity: 'error' });
  }

  const ref = input.contactRef;
  if (ref) {
    const exists =
      ref.kind === 'talkGroup'
        ? codeplug.talkGroups.some((tg) => tg.id === ref.id)
        : codeplug.contacts.some((c) => c.id === ref.id);
    if (!exists) {
      issues.push({
        field: 'contactRef',
        message: 'Selected TX contact not found in project',
        severity: 'warning',
      });
    }
  }

  const rgl = input.rxGroupListId?.trim();
  if (rgl) {
    if (!codeplug.rxGroupLists.some((list) => list.id === rgl)) {
      issues.push({
        field: 'rxGroupListId',
        message: 'Selected RX group list not found in project',
        severity: 'warning',
      });
    }
  }

  if (input.multiMode) {
    const profiles = input.modeProfiles ?? [];
    if (profiles.length < 2) {
      issues.push({
        field: 'modeProfiles',
        message: 'Multi-mode channels need at least two mode profiles',
        severity: 'error',
      });
    }
    const modes = new Set<string>();
    for (let i = 0; i < profiles.length; i++) {
      const profile = profiles[i];
      if (modes.has(profile.mode)) {
        issues.push({
          field: `modeProfiles.${i}.mode`,
          message: `Duplicate mode profile: ${profile.mode}`,
          severity: 'error',
        });
      }
      modes.add(profile.mode);
      issues.push(...validateModeProfile(profile, codeplug, i));
    }
  }

  return issues;
}

function validateModeProfile(
  profile: ChannelModeProfile,
  codeplug: Codeplug,
  index: number,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const prefix = `modeProfiles.${index}`;

  if (profile.contactRef) {
    const ref = profile.contactRef;
    const exists =
      ref.kind === 'talkGroup'
        ? codeplug.talkGroups.some((tg) => tg.id === ref.id)
        : codeplug.contacts.some((c) => c.id === ref.id);
    if (!exists) {
      issues.push({
        field: `${prefix}.contactRef`,
        message: 'Selected TX contact not found in project',
        severity: 'warning',
      });
    }
  }

  if (profile.rxGroupListId?.trim()) {
    if (!codeplug.rxGroupLists.some((list) => list.id === profile.rxGroupListId)) {
      issues.push({
        field: `${prefix}.rxGroupListId`,
        message: 'Selected RX group list not found in project',
        severity: 'warning',
      });
    }
  }

  if (isDmrMode(profile.mode)) {
    if (profile.colourCode != null && (profile.colourCode < 0 || profile.colourCode > 15)) {
      issues.push({
        field: `${prefix}.colourCode`,
        message: 'Colour code must be 0–15',
        severity: 'error',
      });
    }
  }

  return issues;
}

export function hasValidationErrors(issues: ValidationIssue[]): boolean {
  return issues.some((i) => i.severity === 'error');
}

export function isSimplex(rxFrequency: number | null, txFrequency: number | null): boolean {
  if (rxFrequency == null || txFrequency == null) return false;
  return rxFrequency === txFrequency;
}
