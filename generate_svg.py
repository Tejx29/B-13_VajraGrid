import re

icon_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 220" width="100%" height="100%" fill="none">
  <!-- Radio Waves (Concentric Arcs with center gap) -->
  <g stroke="#F56920" stroke-width="7.5" stroke-linecap="butt" stroke-linejoin="round">
    <!-- Inner Arc -->
    <path d="M 78.8 73.7 A 22 22 0 0 1 97 46.2" />
    <path d="M 103 46.2 A 22 22 0 0 1 121.2 73.7" />
    
    <!-- Middle Arc -->
    <path d="M 61.4 78.4 A 40 40 0 0 1 97 28.1" />
    <path d="M 103 28.1 A 40 40 0 0 1 138.6 78.4" />
    
    <!-- Outer Arc -->
    <path d="M 44.0 83.0 A 58 58 0 0 1 97 10.1" />
    <path d="M 103 10.1 A 58 58 0 0 1 156.0 83.0" />
  </g>

  <!-- Center Beacon Red Node -->
  <circle cx="100" cy="68" r="6.5" fill="#E53935" />

  <!-- Shield Base Frame (Dark Gunmetal) -->
  <path d="M 100 204 L 38 148 L 38 98 L 24 92 L 62 74 L 100 90 L 138 74 L 176 92 L 162 98 L 162 148 Z" fill="#2C3038" />

  <!-- Shield Left Bevel Highlight (Faceted Wing) -->
  <path d="M 24 92 L 62 74 L 56 86 L 38 98 Z" fill="#58616F" />

  <!-- Inner Shield Cutout (Backdrop for Diamond) -->
  <polygon points="100,84 148,126 100,178 52,126" fill="#181A1F" />

  <!-- Central Amber Diamond -->
  <polygon points="100,88 142,126 100,166 58,126" fill="#F5A22D" />

  <!-- Lightning Bolt (Black) -->
  <polygon points="108,96 86,132 106,132 94,158 118,122 98,122" fill="#0A0A0A" />
</svg>
'''

with open('public/vajragrid-icon.svg', 'w') as f:
    f.write(icon_svg)

print("Icon SVG generated successfully")
