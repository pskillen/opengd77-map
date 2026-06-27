import type { EtccListing, EtccResponse } from './types.ts';
import { ETCC_API_BASE } from './types.ts';
import { readCachedResponse, writeCachedResponse } from './cache.ts';

export class EtccDirectoryError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'EtccDirectoryError';
  }
}

function buildUrl(path: string): string {
  const trimmed = path.replace(/^\//, '');
  return `${ETCC_API_BASE}/${trimmed}`;
}

export async function fetchEtccListings(path: string): Promise<EtccListing[]> {
  const url = buildUrl(path);
  const cached = readCachedResponse(url);
  if (cached) {
    return parseResponse(cached);
  }

  let response: Response;
  try {
    response = await fetch(url);
  } catch {
    if (cached) return parseResponse(cached);
    throw new EtccDirectoryError('Could not reach ukrepeater.net — check your network connection.');
  }

  const body = await response.text();
  if (!response.ok) {
    throw new EtccDirectoryError(
      `ukrepeater.net returned ${response.status}. The beta API may be unavailable.`,
      response.status,
    );
  }

  writeCachedResponse(url, body);
  return parseResponse(body);
}

function parseResponse(body: string): EtccListing[] {
  let parsed: EtccResponse;
  try {
    parsed = JSON.parse(body) as EtccResponse;
  } catch {
    throw new EtccDirectoryError('Invalid response from ukrepeater.net.');
  }
  if (!Array.isArray(parsed.data)) {
    throw new EtccDirectoryError('Unexpected response shape from ukrepeater.net.');
  }
  return parsed.data;
}

export async function fetchByCallsign(callsign: string): Promise<EtccListing[]> {
  const q = encodeURIComponent(callsign.trim().toLowerCase());
  return fetchEtccListings(`callsign/${q}`);
}

export async function fetchByLocator(locator: string): Promise<EtccListing[]> {
  const q = encodeURIComponent(locator.trim().toLowerCase());
  return fetchEtccListings(`locator/${q}`);
}

export async function fetchByBand(band: string): Promise<EtccListing[]> {
  const q = encodeURIComponent(band.trim().toLowerCase());
  return fetchEtccListings(`band/${q}`);
}

export async function fetchByKeeper(callsign: string): Promise<EtccListing[]> {
  const q = encodeURIComponent(callsign.trim().toLowerCase());
  return fetchEtccListings(`keeper/${q}`);
}

export async function fetchListingById(
  listingId: number,
  callsignHint?: string,
): Promise<EtccListing | null> {
  if (callsignHint?.trim()) {
    const listings = await fetchByCallsign(callsignHint);
    const match = listings.find((l) => l.id === listingId);
    if (match) return match;
  }
  return null;
}
