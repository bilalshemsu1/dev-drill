import math
from PIL import Image, ImageDraw

def render_logo(size=512):
    # Render at 4x for high-quality supersampling / anti-aliasing
    scale = 4
    W = size * scale
    H = size * scale
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx = W / 2
    cy = H / 2

    # Hexagon vertices (pointy top)
    r = W * 0.44
    pts = []
    for i in range(6):
        angle_deg = 60 * i - 30
        angle_rad = math.radians(angle_deg)
        pts.append((cx + r * math.cos(angle_rad), cy + r * math.sin(angle_rad)))

    # Outer hex border with high-precision stroke
    border_pts = pts + [pts[0]]
    draw.line(border_pts, fill=(59, 130, 246, 255), width=int(14 * scale), joint='curve')

    # Center Code Brackets: < / >
    bracket_width = int(20 * scale)

    # Left bracket < (Electric Blue)
    left_pts = [
        (cx - 0.12 * W, cy - 0.14 * H),
        (cx - 0.28 * W, cy),
        (cx - 0.12 * W, cy + 0.14 * H)
    ]
    draw.line(left_pts, fill=(59, 130, 246, 255), width=bracket_width, joint='curve')

    # Central Drill Slash / (Cyan to Emerald)
    slash_width = int(18 * scale)
    slash_pts = [
        (cx + 0.08 * W, cy - 0.20 * H),
        (cx - 0.08 * W, cy + 0.20 * H)
    ]
    draw.line(slash_pts, fill=(6, 182, 212, 255), width=slash_width)

    # Right bracket > (Emerald Green)
    right_pts = [
        (cx + 0.12 * W, cy - 0.14 * H),
        (cx + 0.28 * W, cy),
        (cx + 0.12 * W, cy + 0.14 * H)
    ]
    draw.line(right_pts, fill=(16, 185, 129, 255), width=bracket_width, joint='curve')

    # Downsample using high-quality Lanczos resampling
    final = img.resize((size, size), Image.Resampling.LANCZOS)
    return final

# Generate PWA and Web Icons
sizes = {
    'D:/ncc_cpd\leetcode/offcode/public/icon-512.png': 512,
    'D:/ncc_cpd/leetcode/offcode/public/icon-maskable-512.png': 512,
    'D:/ncc_cpd/leetcode/offcode/public/icon-192.png': 192,
    'D:/ncc_cpd/leetcode/offcode/public/apple-touch-icon.png': 180,
    'D:/ncc_cpd/leetcode/offcode/public/icon.png': 512,
}

for path, sz in sizes.items():
    icon = render_logo(sz)
    icon.save(path, 'PNG')
    print(f"Saved {path} ({sz}x{sz})")

# Also save favicon.ico with full multi-resolution icon set for Windows
ico_img = render_logo(256)
ico_img.save('D:/ncc_cpd/leetcode/offcode/public/favicon.ico', format='ICO', sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
print("Saved favicon.ico with full Windows multi-resolution icon bundle")
