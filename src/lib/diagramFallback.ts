/**
 * Fallback 2D Vector Diagrams for key Educational Topics
 * Provides Textbook-style, labeled, aesthetic pure SVG graphics
 */

export function getFallbackDiagramSvg(topic: string): string {
  const t = topic.toLowerCase().trim();

  // 1. CONDENSATION (WATER CYCLE)
  if (t.includes("condensation") || t.includes("water cycle") || t.includes("rain") || t.includes("evaporation")) {
    return `
<svg viewBox="0 0 500 350" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="background-color: #f8fafc; font-family: system-ui, sans-serif;">
  <!-- Sky background -->
  <rect width="500" height="230" fill="url(#skyGrad)" opacity="0.8"/>
  <rect y="230" width="500" height="120" fill="url(#waterGrad)"/>

  <defs>
    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#bae6fd" />
      <stop offset="100%" stop-color="#e0f2fe" />
    </linearGradient>
    <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#0369a1" />
    </linearGradient>
    <linearGradient id="sunGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="100%" stop-color="#f97316" />
    </linearGradient>
  </defs>

  <!-- Sun -->
  <circle cx="60" cy="50" r="30" fill="url(#sunGrad)" filter="drop-shadow(0 0 8px rgba(249,115,22,0.3))"/>
  <text x="60" y="95" font-size="10" font-weight="bold" fill="#c2410c" text-anchor="middle">Sunlight (Energy Source)</text>

  <!-- Green mountains on sides -->
  <path d="M-20 230 L100 130 L220 230 Z" fill="#22c55e" opacity="0.8" stroke="#16a34a" stroke-width="1.5"/>
  <path d="M120 230 L260 110 L380 230 Z" fill="#15803d" opacity="0.6"/>

  <!-- Clouds -->
  <!-- Left cloud (evaporating) -->
  <g fill="#ffffff" opacity="0.9" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.05))">
    <circle cx="340" cy="65" r="25"/>
    <circle cx="370" cy="60" r="30"/>
    <circle cx="400" cy="70" r="22"/>
    <rect x="330" y="70" width="80" height="20" rx="10"/>
  </g>

  <!-- Blue cooling condensation ring / label -->
  <path d="M340 100 Q 370 120 400 100" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-dasharray="4"/>
  <text x="370" y="125" font-size="11" font-weight="extrabold" fill="#1d4ed8" text-anchor="middle">CONDENSATION ZONE (Cooling Atmosphere)</text>

  <!-- Rising Vapor Arrows -->
  <g stroke="#0284c7" stroke-width="3" fill="none">
    <path d="M 120 260 C 130 220, 110, 180, 120, 140" stroke-dasharray="5,3"/>
    <path d="M 200 260 C 210 220, 190, 180, 200, 140" stroke-dasharray="5,3"/>
    <path d="M 120 145 L 115 155 M 120 145 L 128 153" stroke-width="2"/>
    <path d="M 200 145 L 195 155 M 200 145 L 208 153" stroke-width="2"/>
  </g>
  <text x="160" y="180" font-size="10.5" font-weight="bold" fill="#0369a1" text-anchor="middle">1. Evaporation (Rising Vapor)</text>

  <!-- Rain droplets from condensing cloud -->
  <g stroke="#3b82f6" stroke-width="2" fill="none" opacity="0.8">
    <line x1="350" y1="100" x2="340" y2="125" />
    <line x1="375" y1="105" x2="365" y2="130" />
    <line x1="400" y1="100" x2="390" y2="125" />
    
    <line x1="345" y1="140" x2="335" y2="165" />
    <line x1="370" y1="145" x2="360" y2="170" />
    <line x1="395" y1="140" x2="385" y2="165" />
  </g>

  <!-- Captions and Labels -->
  <text x="370" y="40" font-size="12" font-weight="black" fill="#1e293b" text-anchor="middle">2. Condensing Water Drops</text>
  <text x="250" y="30" font-size="14" font-weight="black" fill="#0f172a" text-anchor="middle" letter-spacing="-0.5">Water Condensation Diagram</text>

  <rect x="230" y="275" width="250" height="55" rx="12" fill="#ffffff" fill-opacity="0.9" stroke="#bae6fd" stroke-width="1.5" />
  <text x="245" y="293" font-size="9" font-weight="black" fill="#0369a1">HOW CONDENSATION WORKS:</text>
  <text x="245" y="308" font-size="8.5" font-weight="medium" fill="#334155">• Warm water vapor rises up and meets cold air</text>
  <text x="245" y="320" font-size="8.5" font-weight="medium" fill="#334155">• Cooling speeds down gas molecules into liquid droplets</text>

  <text x="250" y="343" font-size="8" font-weight="bold" fill="#64748b" text-anchor="middle">Textbook Style Illustration | Age-Appropriate STEM Model</text>
</svg>
`;
  }

  // 2. HUMAN HEART
  if (t.includes("heart") || t.includes("cardio") || t.includes("artery") || t.includes("vein") || t.includes("circulation")) {
    return dheart;
  }

  // 3. PLANT CELL
  if (t.includes("cell") || t.includes("plant") || t.includes("organelle") || t.includes("biology")) {
    return dcell;
  }

  // 4. SOLAR SYSTEM
  if (t.includes("solar") || t.includes("planet") || t.includes("sun") || t.includes("space") || t.includes("orbit")) {
    return dsolar;
  }

  // 5. PHOTOSYNTHESIS
  if (t.includes("photosynthesis") || t.includes("chlorophyll") || t.includes("leaf") || t.includes("carbon dioxide")) {
    return dphoto;
  }

  // DEFAULT/GENERIC SCIENCE DIAGRAM FALLBACK
  return `
<svg viewBox="0 0 500 350" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="background-color: #f8fafc; font-family: system-ui, sans-serif;">
  <!-- Styled educational framework -->
  <rect x="15" y="15" width="470" height="320" rx="16" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
  <circle cx="250" cy="170" r="60" fill="#e0f2fe" stroke="#3b82f6" stroke-width="3" opacity="0.6"/>
  <path d="M150 170 L350 170" stroke="#0284c7" stroke-width="2" stroke-dasharray="4"/>
  <path d="M250 80 L250 260" stroke="#0284c7" stroke-width="2" stroke-dasharray="4"/>

  <!-- Conceptual Atom/Node Graphic -->
  <circle cx="250" cy="170" r="12" fill="#3b82f6" stroke="#ffffff" stroke-width="2" />
  <circle cx="180" cy="130" r="18" fill="#10b981" stroke="#ffffff" stroke-width="2" />
  <circle cx="320" cy="210" r="18" fill="#ec4899" stroke="#ffffff" stroke-width="2" />
  <circle cx="320" cy="130" r="18" fill="#f59e0b" stroke="#ffffff" stroke-width="2" />
  <circle cx="180" cy="210" r="18" fill="#8b5cf6" stroke="#ffffff" stroke-width="2" />

  <!-- Connector Lines -->
  <line x1="250" y1="170" x2="180" y2="130" stroke="#64748b" stroke-width="1.5" />
  <line x1="250" y1="170" x2="320" y2="210" stroke="#64748b" stroke-width="1.5" />
  <line x1="250" y1="170" x2="320" y2="130" stroke="#64748b" stroke-width="1.5" />
  <line x1="250" y1="170" x2="180" y2="210" stroke="#64748b" stroke-width="1.5" />

  <!-- Text Labels -->
  <text x="250" y="45" font-size="14" font-weight="black" fill="#0f172a" text-anchor="middle" letter-spacing="-0.3">Structural Diagram: ${topic}</text>
  <text x="250" y="62" font-size="10" font-weight="bold" fill="#64748b" text-anchor="middle">Interactive Science Breakdown & Mechanics Mapping</text>

  <!-- Legend / Labels -->
  <text x="180" y="105" font-size="10" font-weight="black" fill="#047857" text-anchor="middle">Observation Node A</text>
  <text x="320" y="105" font-size="10" font-weight="black" fill="#b45309" text-anchor="middle">Reaction Factor B</text>
  <text x="180" y="242" font-size="10" font-weight="black" fill="#6d28d9" text-anchor="middle">Trigger Point C</text>
  <text x="320" y="242" font-size="10" font-weight="black" fill="#be185d" text-anchor="middle">Equilibrium Outlet D</text>
  <text x="250" y="196" font-size="9" font-weight="bold" fill="#1e3a8a" text-anchor="middle">Central Core</text>

  <!-- Descriptive details card inside diagram -->
  <rect x="100" y="275" width="300" height="42" rx="8" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1"/>
  <text x="250" y="291" font-size="9" font-weight="bold" fill="#334155" text-anchor="middle">26-06-18 STUDY NOTES MAPPED PRESET</text>
  <text x="250" y="305" font-size="8" font-weight="medium" fill="#64748b" text-anchor="middle">Core pathways trace back to physical forces with balancing system criteria.</text>
</svg>
`;
}

// ------------------------------------
// DETAILED VECTOR SVG STATICS
// ------------------------------------

const dheart = `
<svg viewBox="0 0 500 350" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="background-color: #fbfcfe; font-family: system-ui, sans-serif;">
  <rect width="100%" height="100%" fill="#fbfcfe"/>
  
  <!-- Diagram Title -->
  <text x="250" y="32" font-size="15" font-weight="900" fill="#0f172a" text-anchor="middle" letter-spacing="-0.5">Labelled Structural Heart Diagram</text>
  <text x="250" y="47" font-size="9.5" font-weight="bold" fill="#64748b" text-anchor="middle">Textbook Cardiology Anatomy Overview</text>

  <g transform="translate(45, -5)">
    <!-- Main Aorta Arch (Red) -->
    <path d="M 195 190 C 185 100, 240 60, 265 110" fill="none" stroke="#ef4444" stroke-width="25" stroke-linecap="round"/>
    
    <!-- Aorta branching vessels -->
    <path d="M 210 100 L 210 70" stroke="#ef4444" stroke-width="10" stroke-linecap="round" />
    <path d="M 230 92 L 230 65" stroke="#ef4444" stroke-width="10" stroke-linecap="round" />
    <path d="M 250 96 L 250 70" stroke="#ef4444" stroke-width="10" stroke-linecap="round" />

    <!-- Pulmonary Artery Arch (Blue) -->
    <path d="M 260 180 C 270 125, 170 140, 140 160" fill="none" stroke="#2563eb" stroke-width="18" stroke-linecap="round"/>

    <!-- Vena Cava superior / inferior (Blue) -->
    <rect x="135" y="70" width="18" height="100" rx="6" fill="#1d4ed8" opacity="0.9"/>
    <rect x="145" y="240" width="18" height="70" rx="6" fill="#1d4ed8" opacity="0.9"/>

    <!-- Left Heart muscle / ventricles (Red/Blue shaded) -->
    <path d="M 190 180 C 195 240, 230 300, 210 320 C 190 300, 160 270, 160 180 Z" fill="#b91c1c" stroke="#991b1b" stroke-width="2"/>
    <path d="M 220 180 C 220 250, 205 315, 210 320 Q 235 290 240 180 Z" fill="#dc2626" stroke="#991b1b" stroke-width="2" opacity="0.9"/>

    <!-- Atrial regions -->
    <circle cx="165" cy="170" r="28" fill="#1e40af" stroke="#1d4ed8" stroke-width="1.5" />
    <circle cx="245" cy="170" r="25" fill="#ef4444" stroke="#dc2626" stroke-width="1.5" />

    <!-- Septum wall divider -->
    <path d="M 194 184 L 208 318" stroke="#fca5a5" stroke-width="6" stroke-linecap="round" stroke-dasharray="2,2"/>
  </g>

  <!-- Labels & Callouts with pointers -->
  <g font-size="9" font-weight="black" fill="#1e293b">
    <!-- Superior Vena Cava -->
    <text x="45" y="105" text-anchor="start">Superior Vena Cava</text>
    <polyline points="135,103 160,103 182,103" stroke="#64748b" stroke-width="1" fill="none"/>
    <circle cx="182" cy="103" r="2" fill="#64748b"/>

    <!-- Right Atrium -->
    <text x="45" y="165" text-anchor="start">Right Atrium (Blue/Deox)</text>
    <polyline points="140,163 175,163 205,163" stroke="#64748b" stroke-width="1" fill="none"/>
    <circle cx="205" cy="163" r="2" fill="#64748b"/>

    <!-- Right Ventricle -->
    <text x="45" y="245" text-anchor="start">Right Ventricle</text>
    <polyline points="120,243 170,243 234,230" stroke="#64748b" stroke-width="1" fill="none"/>
    <circle cx="234" cy="230" r="2" fill="#64748b"/>

    <!-- Aorta -->
    <text x="455" y="90" text-anchor="end">Aorta (Main Arch)</text>
    <polyline points="455,88 320,88 260,111" stroke="#64748b" stroke-width="1" fill="none"/>
    <circle cx="260" cy="111" r="2" fill="#64748b"/>

    <!-- Pulmonary Artery -->
    <text x="455" y="135" text-anchor="end">Pulmonary Artery</text>
    <polyline points="455,133 340,133 245,133" stroke="#64748b" stroke-width="1" fill="none"/>
    <circle cx="245" cy="133" r="2" fill="#64748b"/>

    <!-- Left Atrium -->
    <text x="455" y="180" text-anchor="end">Left Atrium (Red/Ox)</text>
    <polyline points="455,178 330,178 288,175" stroke="#64748b" stroke-width="1" fill="none"/>
    <circle cx="288" cy="175" r="2" fill="#64748b"/>

    <!-- Left Ventricle -->
    <text x="455" y="255" text-anchor="end">Left Ventricle (Thick Muscle)</text>
    <polyline points="455,253 320,253 268,260" stroke="#64748b" stroke-width="1" fill="none"/>
    <circle cx="268" cy="260" r="2" fill="#64748b"/>
  </g>

  <!-- passive check valves labels -->
  <text x="175" y="342" font-size="8.5" font-weight="semibold" fill="#64748b" text-anchor="middle">CHECK VALVE: PASSIVE GATES PREVENT BACKFLOW</text>
</svg>
`;

const dcell = `
<svg viewBox="0 0 500 350" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="background-color: #f7fee7; font-family: system-ui, sans-serif;">
  <rect width="100%" height="100%" fill="#f7fee7"/>

  <!-- Diagram Title -->
  <text x="250" y="30" font-size="15" font-weight="900" fill="#1a2e05" text-anchor="middle" letter-spacing="-0.5">Labelled Plant Cell Structure</text>
  <text x="250" y="45" font-size="9" font-weight="extrabold" fill="#4d7c0f" text-anchor="middle">Standard Eukaryotic Organelle Map</text>

  <!-- Hexagonal Cell Wall (Outer green boundary) -->
  <polygon points="120,90 240,60 360,90 380,240 250,290 100,240" fill="#ecfccb" stroke="#15803d" stroke-width="8" stroke-linejoin="round"/>
  <!-- Cell Membrane (Inner light green liner) -->
  <polygon points="122,94 238,65 356,94 374,236 248,284 104,236" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linejoin="round"/>

  <!-- Large Central Vacuole (Water pressure storage) -->
  <path d="M 140 130 C 150 100, 240 100, 260 140 C 265 180, 200 230, 150 220 C 120 200, 130 160, 140 130 Z" fill="#93c5fd" stroke="#2563eb" stroke-width="2" opacity="0.8"/>
  <text x="185" y="165" font-size="9.5" font-weight="bold" fill="#1e40af" text-anchor="middle">Central Vacuole</text>
  <text x="185" y="176" font-size="8" font-weight="medium" fill="#1d4ed8" text-anchor="middle">(Turgor Water Pressure)</text>

  <!-- Nucleus (Control Center) -->
  <circle cx="310" cy="180" r="30" fill="#a855f7" stroke="#7e22ce" stroke-width="2" opacity="0.9"/>
  <!-- Nucleolus -->
  <circle cx="315" cy="175" r="10" fill="#6b21a8" />

  <!-- Mitochondria (Powerhouse) -->
  <g transform="translate(140, 235) rotate(-30)">
    <ellipse cx="0" cy="0" rx="14" ry="8" fill="#f97316" stroke="#c2410c" stroke-width="1.5"/>
    <path d="M -11 0 Q -5 4, 0 -2 T 11 0" stroke="#fef08a" stroke-width="1" fill="none"/>
  </g>

  <!-- Chloroplasts (Green sugar factories) -->
  <g transform="translate(260, 90)">
    <ellipse cx="0" cy="0" rx="15" ry="9" fill="#16a34a" stroke="#14532d" stroke-width="2"/>
    <line x1="-8" y1="-3" x2="8" y2="-3" stroke="#22c55e" stroke-width="1.5"/>
    <line x1="-10" y1="2" x2="10" y2="2" stroke="#22c55e" stroke-width="1.5"/>
  </g>
  <g transform="translate(340, 120) rotate(15)">
    <ellipse cx="0" cy="0" rx="15" ry="9" fill="#16a34a" stroke="#14532d" stroke-width="2"/>
    <line x1="-8" y1="-3" x2="8" y2="-3" stroke="#22c55e" stroke-width="1.5"/>
    <line x1="-10" y1="2" x2="10" y2="2" stroke="#22c55e" stroke-width="1.5"/>
  </g>

  <!-- Labels -->
  <g font-size="9" font-weight="black" fill="#1e3a8a">
    <!-- Cell Wall -->
    <text x="40" y="85" text-anchor="start">Cell Wall (Rigid Outer)</text>
    <polyline points="135,83 110,83 175,81" stroke="#4d7c0f" stroke-width="1" fill="none"/>
    <circle cx="175" cy="81" r="2" fill="#4d7c0f"/>

    <!-- Chloroplast -->
    <text x="40" y="115" text-anchor="start">Chloroplast (Photosynthesis)</text>
    <polyline points="160,113 220,113 250,95" stroke="#4d7c0f" stroke-width="1" fill="none"/>
    <circle cx="250" cy="95" r="2" fill="#4d7c0f"/>

    <!-- Mitochondria -->
    <text x="40" y="270" text-anchor="start">Mitochondria (Energy ATP)</text>
    <polyline points="140,268 120,268 135,245" stroke="#4d7c0f" stroke-width="1" fill="none"/>
    <circle cx="135" cy="245" r="2" fill="#4d7c0f"/>

    <!-- Nucleus Control -->
    <text x="455" y="170" text-anchor="end">Nucleus (Genetic DNA)</text>
    <polyline points="455,168 370,168 322,175" stroke="#4d7c0f" stroke-width="1" fill="none"/>
    <circle cx="322" cy="175" r="2" fill="#4d7c0f"/>

    <!-- Cell Membrane -->
    <text x="455" y="240" text-anchor="end">Cell Membrane</text>
    <polyline points="455,238 395,238 314,261" stroke="#4d7c0f" stroke-width="1" fill="none"/>
    <circle cx="314" cy="261" r="2" fill="#4d7c0f"/>
  </g>
</svg>
`;

const dsolar = `
<svg viewBox="0 0 500 350" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="background-color: #0b1329; font-family: system-ui, sans-serif;">
  <!-- Dark Space Background with stars -->
  <rect width="100%" height="100%" fill="#0b1329"/>
  
  <g fill="#ffffff" opacity="0.5">
    <circle cx="30" cy="30" r="1" />
    <circle cx="140" cy="50" r="1.5" />
    <circle cx="90" cy="180" r="1.2" />
    <circle cx="280" cy="40" r="1" />
    <circle cx="430" cy="110" r="1.5" />
    <circle cx="450" cy="240" r="1" />
    <circle cx="230" cy="285" r="2" />
    <circle cx="330" cy="310" r="1.2" />
    <circle cx="70" cy="320" r="1" />
  </g>

  <!-- Title -->
  <text x="250" y="32" font-size="15" font-weight="900" fill="#f8fafc" text-anchor="middle" letter-spacing="-0.3">2D Solar System & Orbits Map</text>
  <text x="250" y="47" font-size="9" font-weight="bold" fill="#94a3b8" text-anchor="middle">Textbook Astronomy Elliptical Mechanics</text>

  <!-- Orbits (Dotted Ellipses centered at Sun) -->
  <ellipse cx="60" cy="180" rx="90" ry="50" fill="none" stroke="#334155" stroke-dasharray="3,3" stroke-width="1"/>
  <ellipse cx="60" cy="180" rx="140" ry="75" fill="none" stroke="#334155" stroke-dasharray="3,3" stroke-width="1"/>
  <ellipse cx="60" cy="180" rx="190" ry="105" fill="none" stroke="#334155" stroke-dasharray="3,3" stroke-width="1"/>
  <ellipse cx="60" cy="180" rx="250" ry="135" fill="none" stroke="#475569" stroke-dasharray="3,3" stroke-width="1.2"/>
  <ellipse cx="60" cy="180" rx="330" ry="165" fill="none" stroke="#475569" stroke-dasharray="4,4" stroke-width="1.5"/>

  <!-- Sun (Huge radiant sphere on left) -->
  <circle cx="10" cy="180" r="75" fill="url(#sunNeon)" stroke="#fef08a" stroke-width="2"/>
  <text x="45" y="183" font-size="11" font-weight="black" fill="#1e293b">SUN</text>

  <defs>
    <radialGradient id="sunNeon" cx="40%" cy="50%" r="60%">
      <stop offset="0%" stop-color="#fffbeb" />
      <stop offset="10%" stop-color="#fef08a" />
      <stop offset="60%" stop-color="#f97316" />
      <stop offset="100%" stop-color="#e11d48" />
    </radialGradient>
  </defs>

  <!-- Planets (Placed on their respective orbit lines) -->
  <!-- 1. Mercury -->
  <g transform="translate(100, 140)">
    <circle r="6" fill="#94a3b8" stroke="#cbd5e1" stroke-width="1"/>
    <text y="-10" font-size="8" font-weight="bold" fill="#cbd5e1" text-anchor="middle">Mercury</text>
  </g>

  <!-- 2. Venus -->
  <g transform="translate(180, 215)">
    <circle r="10" fill="#fb923c" stroke="#fed7aa" stroke-width="1"/>
    <text y="18" font-size="8" font-weight="bold" fill="#cbd5e1" text-anchor="middle">Venus</text>
  </g>

  <!-- 3. Earth -->
  <g transform="translate(230, 130)">
    <circle r="12" fill="#3b82f6" stroke="#38bdf8" stroke-width="1.5"/>
    <!-- Moon -->
    <circle cx="16" cy="-8" r="3" fill="#cbd5e1" />
    <text y="-16" font-size="9" font-weight="black" fill="#38bdf8" text-anchor="middle">Earth (Life Zone)</text>
  </g>

  <!-- 4. Mars -->
  <g transform="translate(290, 235)">
    <circle r="9" fill="#ef4444" stroke="#fca5a5" stroke-width="1"/>
    <text y="17" font-size="8" font-weight="bold" fill="#cbd5e1" text-anchor="middle">Mars</text>
  </g>

  <!-- 5. Jupiter (Giant with banding) -->
  <g transform="translate(360, 110)">
    <circle r="22" fill="#d97706" stroke="#fbbf24" stroke-width="2"/>
    <line x1="-20" y1="-5" x2="20" y2="-5" stroke="#f59e0b" stroke-width="2.5"/>
    <line x1="-20" y1="5" x2="20" y2="5" stroke="#f59e0b" stroke-width="2.5"/>
    <text y="-28" font-size="9.5" font-weight="black" fill="#fbbf24" text-anchor="middle">Jupiter (Giant)</text>
  </g>

  <!-- Keplerian Law Label -->
  <rect x="260" y="295" width="220" height="40" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1"/>
  <text x="370" y="311" font-size="8.5" font-weight="bold" fill="#94a3b8" text-anchor="middle">REVELATION KEYPOINT:</text>
  <text x="370" y="325" font-size="8" font-weight="semibold" fill="#f8fafc" text-anchor="middle">Orbits are elliptical, governed by Kepler's gravity law.</text>
</svg>
`;

const dphoto = `
<svg viewBox="0 0 500 350" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="background-color: #f0fdf4; font-family: system-ui, sans-serif;">
  <rect width="100%" height="100%" fill="#f0fdf4"/>

  <!-- Title -->
  <text x="250" y="30" font-size="15" font-weight="900" fill="#14532d" text-anchor="middle" letter-spacing="-0.5">Labelled Photosynthesis Process Flow</text>
  <text x="250" y="46" font-size="9" font-weight="extrabold" fill="#16a34a" text-anchor="middle">How Plants Convert Light into Food & Glucose</text>

  <!-- Sunlight Source -->
  <g transform="translate(60, 70)">
    <circle cx="0" cy="0" r="22" fill="#f59e0b" opacity="0.9"/>
    <!-- Sunrays pointers -->
    <path d="M 0 0 L 32 32 M 0 0 L 45 10 M 0 0 L 10 40" stroke="#f59e0b" stroke-width="2" stroke-dasharray="2,2"/>
    <text x="0" y="34" font-size="8.5" font-weight="black" fill="#d97706" text-anchor="middle">Sunlight Energy</text>
  </g>

  <!-- Large Central Detailed Leaf (green) -->
  <path d="M 120 220 C 120 120, 240 100, 320 150 C 340 210, 260 250, 120 220 Z" fill="#22c55e" stroke="#15803d" stroke-width="4"/>
  <!-- Leaf Veins -->
  <path d="M 120 220 Q 220 170 320 150" fill="none" stroke="#16a34a" stroke-width="2.5"/>
  <path d="M 170 195 Q 185 160 210 150" fill="none" stroke="#16a34a" stroke-width="1.5"/>
  <path d="M 220 175 Q 235 145 260 135" fill="none" stroke="#16a34a" stroke-width="1.5"/>

  <!-- Reactant Side (Inputs) -->
  <!-- Water taking in -->
  <g stroke="#2563eb" stroke-width="2" fill="none" transform="translate(10, 180)">
    <rect x="0" y="40" width="70" height="25" rx="6" fill="#dbeafe" stroke="#3b82f6" stroke-width="1"/>
    <text x="35" y="55" font-size="8.5" font-weight="black" fill="#1e40af" text-anchor="middle" stroke="none">H₂O (Water)</text>
    <!-- Arrow to Leaf -->
    <path d="M 72 52 L 115 210" stroke="#3b82f6" stroke-width="2" marker-end="url(#arrow)"/>
  </g>

  <!-- CO2 taking in -->
  <g transform="translate(15, 110)">
    <rect x="0" y="0" width="85" height="25" rx="6" fill="#f1f5f9" stroke="#64748b" stroke-width="1"/>
    <text x="42" y="15" font-size="8.5" font-weight="black" fill="#334155" text-anchor="middle">CO₂ (Carbon Dioxide)</text>
    <!-- Arrow to Leaf -->
    <path d="M 87 15 L 170 145" stroke="#64748b" stroke-width="2" fill="none"/>
  </g>

  <!-- Product Side (Outputs) -->
  <!-- Oxygen emission -->
  <g transform="translate(365, 80)">
    <rect x="0" y="0" width="90" height="25" rx="6" fill="#f0fdf4" stroke="#16a34a" stroke-width="1"/>
    <text x="45" y="15" font-size="8.5" font-weight="black" fill="#15803d" text-anchor="middle">O₂ (Oxygen Out)</text>
    <path d="M -15 45 L -80 65" stroke="#16a34a" stroke-dasharray="3,1" stroke-width="2" fill="none"/>
    <path d="M -70 55 L -80 65 L -72 73" stroke="#16a34a" stroke-width="2" fill="none"/>
  </g>

  <!-- Glucose creation -->
  <g transform="translate(365, 230)">
    <rect x="0" y="0" width="105" height="25" rx="6" fill="#fdf2f8" stroke="#db2777" stroke-width="1"/>
    <text x="52" y="15" font-size="8.5" font-weight="black" fill="#9d174d" text-anchor="middle">C₆H₁₂O₆ (Glucose Food)</text>
    <path d="M -15 -15 L -100 -12" stroke="#db2777" stroke-dasharray="3,1" stroke-width="2" fill="none"/>
    <path d="M -22 -22 L -15 -15 L -25 -8" stroke="#db2777" stroke-width="2" fill="none"/>
  </g>

  <!-- Equation card in the middle bottom -->
  <rect x="50" y="285" width="400" height="42" rx="10" fill="#ffffff" stroke="#bbf7d0" stroke-width="1.5"/>
  <text x="250" y="302" font-size="10.5" font-weight="black" fill="#166534" text-anchor="middle">PHOTOSYNTHESIS CHEMICAL EQUATION</text>
  <text x="250" y="318" font-size="9" font-weight="bold" fill="#15803d" text-anchor="middle">6 CO₂ + 6 H₂O + Light Energy ──▶ C₆H₁₂O₆ + 6 O₂</text>

  <!-- Chlorophyll note in leaf -->
  <text x="240" y="195" font-size="8.5" font-weight="extrabold" fill="#14532d" text-anchor="middle">Chlorophyll absorbs light</text>
</svg>
`;
