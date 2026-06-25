export interface GoogleDriveLogoProps {
  size?: number;
}

/** Multicolor Google Drive product icon (SVG). */
export default function GoogleDriveLogo({ size = 18 }: GoogleDriveLogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 87.3 78" aria-hidden focusable="false">
      <path
        d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z"
        fill="#0066da"
      />
      <path
        d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0-1.2 4.5h27.5z"
        fill="#00ac47"
      />
      <path
        d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.8 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l13.752 23.85z"
        fill="#ea4335"
      />
      <path
        d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z"
        fill="#00832d"
      />
      <path
        d="m59.8 53h-32.15l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z"
        fill="#2684fc"
      />
      <path
        d="m73.4 26.5 12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-20.35 35.3 13.75 23.8c1.35-.8 2.5-1.9 3.3-3.3z"
        fill="#ffba00"
      />
    </svg>
  );
}
