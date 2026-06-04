import os
from PIL import Image
import colorsys

def get_dominant_color(image_path):
    try:
        img = Image.open(image_path).convert('RGB')
        img.thumbnail((50, 50))
        # Get average color
        pixels = list(img.getdata())
        avg_r = sum(p[0] for p in pixels) / len(pixels)
        avg_g = sum(p[1] for p in pixels) / len(pixels)
        avg_b = sum(p[2] for p in pixels) / len(pixels)
        # Convert to HLS
        h, l, s = colorsys.rgb_to_hls(avg_r/255.0, avg_g/255.0, avg_b/255.0)
        return h, s, l
    except Exception as e:
        print(f"Error processing {image_path}: {e}")
        return 0, 0, 0

gallery_dir = 'public/gallery/'
files = [f for f in os.listdir(gallery_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
file_colors = []

for f in files:
    h, s, l = get_dominant_color(os.path.join(gallery_dir, f))
    file_colors.append((f, h, s, l))

# Sort by Hue, then Saturation, then Lightness
file_colors.sort(key=lambda x: (x[1], x[2], x[3]))

for f, h, s, l in file_colors:
    print(f)
