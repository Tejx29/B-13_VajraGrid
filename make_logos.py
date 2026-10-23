# Generate official high fidelity SVG files for VajraGrid

icon_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="100%" height="100%" fill="none">
  <defs>
    <!-- Top Inverted Triangle Gradient -->
    <linearGradient id="vj-tri-grad" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="#D82618" />
      <stop offset="65%" stop-color="#EA4314" />
      <stop offset="100%" stop-color="#FA6507" />
    </linearGradient>

    <!-- Left Red Wing Gradient -->
    <linearGradient id="vj-red-wing" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EB3E17" />
      <stop offset="50%" stop-color="#E3320E" />
      <stop offset="100%" stop-color="#DD2406" />
    </linearGradient>

    <!-- Right Blue Wing Gradient -->
    <linearGradient id="vj-blue-wing" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2E54E8" />
      <stop offset="60%" stop-color="#2449D8" />
      <stop offset="100%" stop-color="#1B3DC5" />
    </linearGradient>

    <!-- Outer Blue Wings Gradient -->
    <linearGradient id="vj-blue-outer" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3259ED" />
      <stop offset="100%" stop-color="#1F42CE" />
    </linearGradient>

    <!-- Seam Ambient Occlusion / Shadow -->
    <linearGradient id="vj-seam-shadow" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#582307" stop-opacity="0.9" />
      <stop offset="40%" stop-color="#3F1905" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#2449D8" stop-opacity="0" />
    </linearGradient>
  </defs>

  <!-- 1. Left Outer Blue Stripe -->
  <polygon points="50,250 50,405 245,705 355,705 150,390 50,250" fill="url(#vj-blue-outer)" stroke="#1C37B0" stroke-width="3" stroke-linejoin="round" />

  <!-- 2. Right Outer Blue Stripe -->
  <polygon points="950,250 950,405 755,705 645,705 850,390 950,250" fill="url(#vj-blue-outer)" stroke="#1C37B0" stroke-width="3" stroke-linejoin="round" />

  <!-- 3. Top Center Inverted Triangle -->
  <polygon points="380,150 620,150 500,330" fill="url(#vj-tri-grad)" stroke="#B81E12" stroke-width="3.5" stroke-linejoin="round" />

  <!-- 4. Left Inner Red/Orange Main Chevron -->
  <polygon points="55,150 270,150 500,510 605,670 500,835" fill="url(#vj-red-wing)" stroke="#BF1F07" stroke-width="3" stroke-linejoin="round" />

  <!-- 5. Right Inner Blue Main Chevron -->
  <polygon points="730,150 945,150 605,670 500,510" fill="url(#vj-blue-wing)" stroke="#1C37B0" stroke-width="3" stroke-linejoin="round" />

  <!-- 6. Shadow / Bevel at Seam Overlap -->
  <polygon points="500,510 535,455 640,615 605,670" fill="url(#vj-seam-shadow)" />
</svg>
'''

logo_svg = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 740 200" width="100%" height="100%" fill="none">
  <defs>
    <!-- Top Inverted Triangle Gradient -->
    <linearGradient id="vj-tri-grad-full" x1="50%" y1="0%" x2="50%" y2="100%">
      <stop offset="0%" stop-color="#D82618" />
      <stop offset="65%" stop-color="#EA4314" />
      <stop offset="100%" stop-color="#FA6507" />
    </linearGradient>

    <!-- Left Red Wing Gradient -->
    <linearGradient id="vj-red-wing-full" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EB3E17" />
      <stop offset="50%" stop-color="#E3320E" />
      <stop offset="100%" stop-color="#DD2406" />
    </linearGradient>

    <!-- Right Blue Wing Gradient -->
    <linearGradient id="vj-blue-wing-full" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2E54E8" />
      <stop offset="60%" stop-color="#2449D8" />
      <stop offset="100%" stop-color="#1B3DC5" />
    </linearGradient>

    <!-- Outer Blue Wings Gradient -->
    <linearGradient id="vj-blue-outer-full" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3259ED" />
      <stop offset="100%" stop-color="#1F42CE" />
    </linearGradient>

    <!-- Seam Ambient Occlusion / Shadow -->
    <linearGradient id="vj-seam-shadow-full" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#582307" stop-opacity="0.9" />
      <stop offset="40%" stop-color="#3F1905" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#2449D8" stop-opacity="0" />
    </linearGradient>
  </defs>

  <!-- Scaled Emblem Icon (Height 170, Aspect Ratio 1:1) -->
  <g transform="translate(15, 15) scale(0.17)">
    <polygon points="50,250 50,405 245,705 355,705 150,390 50,250" fill="url(#vj-blue-outer-full)" stroke="#1C37B0" stroke-width="16" stroke-linejoin="round" />
    <polygon points="950,250 950,405 755,705 645,705 850,390 950,250" fill="url(#vj-blue-outer-full)" stroke="#1C37B0" stroke-width="16" stroke-linejoin="round" />
    <polygon points="380,150 620,150 500,330" fill="url(#vj-tri-grad-full)" stroke="#B81E12" stroke-width="20" stroke-linejoin="round" />
    <polygon points="55,150 270,150 500,510 605,670 500,835" fill="url(#vj-red-wing-full)" stroke="#BF1F07" stroke-width="16" stroke-linejoin="round" />
    <polygon points="730,150 945,150 605,670 500,510" fill="url(#vj-blue-wing-full)" stroke="#1C37B0" stroke-width="16" stroke-linejoin="round" />
    <polygon points="500,510 535,455 640,615 605,670" fill="url(#vj-seam-shadow-full)" />
  </g>

  <!-- Wordmark "VajraGrid" with Crisp Notion Typography -->
  <text
    x="210"
    y="128"
    fill="#FFFFFF"
    font-family="'NotionInter', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    font-size="84"
    font-weight="600"
    letter-spacing="-1.5px"
  >
    VajraGrid
  </text>
</svg>
'''

import shutil
with open('public/vajragrid-icon.svg', 'w') as f:
    f.write(icon_svg)

with open('public/vajragrid-logo.svg', 'w') as f:
    f.write(logo_svg)

shutil.copyfile('public/vajragrid-icon.svg', 'public/image (3).svg')
shutil.copyfile('public/vajragrid-icon.svg', 'public/vajragrid-emblem.svg')

print("Generated vajragrid-icon.svg, vajragrid-logo.svg, image (3).svg and vajragrid-emblem.svg")
