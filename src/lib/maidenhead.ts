/** Maidenhead locator ↔ WGS84 coordinates. */

function normaliseLocator(locator: string): string {
  return locator.trim().toUpperCase().replace(/\s/g, '');
}

export function isValidLocator(locator: string): boolean {
  const s = normaliseLocator(locator);
  return /^[A-R]{2}[0-9]{2}([A-X]{2}([0-9]{2}([A-X]{2})?)?)?$/.test(s);
}

export function coordsToLocator(lat: number, lon: number, precision: 4 | 6 | 8 | 10 = 6): string {
  let latitude = Math.max(-90, Math.min(89.9999999, lat)) + 90;
  let longitude = Math.max(-180, Math.min(179.9999999, lon)) + 180;

  let result = '';
  result += String.fromCharCode(Math.floor(longitude / 20) + 65);
  result += String.fromCharCode(Math.floor(latitude / 10) + 65);

  if (precision < 4) return result;

  longitude %= 20;
  latitude %= 10;
  result += String(Math.floor(longitude / 2));
  result += String(Math.floor(latitude / 1));

  if (precision < 6) return result;

  longitude %= 2;
  latitude %= 1;
  result += String.fromCharCode(Math.floor(longitude / (2 / 24)) + 65);
  result += String.fromCharCode(Math.floor(latitude / (1 / 24)) + 65);

  if (precision < 8) return result;

  longitude %= 2 / 24;
  latitude %= 1 / 24;
  result += String(Math.floor(longitude / (2 / 240)));
  result += String(Math.floor(latitude / (1 / 240)));

  if (precision < 10) return result;

  longitude %= 2 / 240;
  latitude %= 1 / 240;
  result += String.fromCharCode(Math.floor(longitude / (2 / 240 / 24)) + 65);
  result += String.fromCharCode(Math.floor(latitude / (1 / 240 / 24)) + 65);

  return result;
}

export function locatorToCoords(locator: string): { lat: number; lon: number } | null {
  const s = normaliseLocator(locator);
  if (!isValidLocator(s)) return null;

  let longitude = (s.charCodeAt(0) - 65) * 20;
  let latitude = (s.charCodeAt(1) - 65) * 10;

  if (s.length >= 4) {
    longitude += parseInt(s[2], 10) * 2;
    latitude += parseInt(s[3], 10);
  }
  if (s.length >= 6) {
    longitude += (s.charCodeAt(4) - 65 + 0.5) * (2 / 24);
    latitude += (s.charCodeAt(5) - 65 + 0.5) * (1 / 24);
  } else if (s.length === 4) {
    longitude += 1;
    latitude += 0.5;
  }
  if (s.length >= 8) {
    longitude += (parseInt(s[6], 10) + 0.5) * (2 / 240);
    latitude += (parseInt(s[7], 10) + 0.5) * (1 / 240);
  }
  if (s.length >= 10) {
    longitude += (s.charCodeAt(8) - 65 + 0.5) * (2 / 240 / 24);
    latitude += (s.charCodeAt(9) - 65 + 0.5) * (1 / 240 / 24);
  }

  return { lat: latitude - 90, lon: longitude - 180 };
}
