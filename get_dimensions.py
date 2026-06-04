import os
from PIL import Image
import json

gallery_dir = 'public/gallery/'
files = [
  "photo-output_1.JPG", "Horse.JPG", "Comet.JPG", "Sunset.jpg", "Game.JPG", "Dance.JPG",
  "View.jpg", "Reflection.JPG", "Fish.JPG", "Dream.JPG", "Thoughts.JPG", "Home.JPG",
  "Lights.jpg", "Idea.JPG", "Postcard.JPG", "Growth.jpg", "Curves.JPG", "Evening.jpg",
  "Afa.jpg", "Memory.jpg", "Leaf.JPG", "Dancing_Shadow.JPG", "Papavero.JPG", "Frame.jpg",
  "Beating_Light.jpg", "Innocence.jpg", "Thread.JPG", "Morning.JPG", "Dive.JPG", "Wind.JPG",
  "Night.JPG", "Blue.jpg", "Shell.JPG", "Spiral.JPG", "Mary_Moss.JPG", "The_Sun.jpg",
  "Fragility.JPG", "Le_Grand_Meaulnes.jpg"
]

data = []
for f in files:
    try:
        img = Image.open(os.path.join(gallery_dir, f))
        w, h = img.size
        data.append({"src": f, "aspectRatio": w / h})
    except Exception as e:
        print(e)

print(json.dumps(data, indent=2))
