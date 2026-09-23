// PURE module: 5 dieren met naam en een eenvoudige inline SVG (geen externe afbeeldingen).
// De SVG's zijn decoratief (aria-hidden in de UI); de zichtbare/toegankelijke naam is de tekst.

export const DIEREN = [
  {
    id: 'beer',
    naam: 'Beer',
    svg: '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><circle cx="16" cy="14" r="7" fill="#8a5a35"/><circle cx="48" cy="14" r="7" fill="#8a5a35"/><circle cx="32" cy="34" r="22" fill="#a9723f"/><circle cx="23" cy="30" r="3.5" fill="#2b1c10"/><circle cx="41" cy="30" r="3.5" fill="#2b1c10"/><circle cx="32" cy="40" r="7" fill="#e7c9a3"/><circle cx="32" cy="41" r="2.5" fill="#2b1c10"/></svg>',
  },
  {
    id: 'schildpad',
    naam: 'Schildpad',
    svg: '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><ellipse cx="32" cy="36" rx="22" ry="18" fill="#4a8f5c"/><path d="M32 20 L44 30 L38 46 L26 46 L20 30 Z" fill="#2f6b3f"/><circle cx="14" cy="24" r="7" fill="#5fac72"/><circle cx="11" cy="22" r="2" fill="#1c3a22"/></svg>',
  },
  {
    id: 'vis',
    naam: 'Vis',
    svg: '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><ellipse cx="28" cy="32" rx="20" ry="13" fill="#3b82b4"/><path d="M48 32 L62 20 L62 44 Z" fill="#2f6b93"/><circle cx="18" cy="28" r="3" fill="#0f2a3b"/><path d="M14 32 Q8 26 2 32 Q8 38 14 32 Z" fill="#2f6b93"/></svg>',
  },
  {
    id: 'uil',
    naam: 'Uil',
    svg: '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><ellipse cx="32" cy="36" rx="20" ry="22" fill="#8a6d3f"/><circle cx="23" cy="28" r="8" fill="#fff"/><circle cx="41" cy="28" r="8" fill="#fff"/><circle cx="23" cy="28" r="3.5" fill="#2b1c10"/><circle cx="41" cy="28" r="3.5" fill="#2b1c10"/><path d="M32 32 L28 40 L36 40 Z" fill="#c97b2e"/></svg>',
  },
  {
    id: 'vos',
    naam: 'Vos',
    svg: '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false"><path d="M18 14 L28 30 L14 30 Z" fill="#c9622c"/><path d="M46 14 L50 30 L36 30 Z" fill="#c9622c"/><circle cx="32" cy="36" r="20" fill="#e07b3a"/><path d="M32 40 L24 48 Q32 54 40 48 Z" fill="#fff"/><circle cx="24" cy="32" r="3" fill="#2b1c10"/><circle cx="40" cy="32" r="3" fill="#2b1c10"/></svg>',
  },
];

export function vindDier(id) {
  return DIEREN.find((d) => d.id === id) ?? null;
}
