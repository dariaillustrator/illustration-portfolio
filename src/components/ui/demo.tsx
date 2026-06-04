import * as React from "react";
import { Gallery, GalleryGrid, GalleryImage } from "@/components/ui/shared-element-gallery";

const IMAGES = [
  { id: "1", src: "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/215f11bd-8f46-486d-8b18-377cf347096f_3840w.webp" },
  { id: "2", src: "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/edaf8dff-6ac4-4fed-b5ff-f41e6863a090_3840w.jpg" },
  { id: "3", src: "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/1ab0a4be-b66e-441b-9576-a9d5ac06f8fb_3840w.jpg" },
  { id: "4", src: "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/32ecf28d-1c1d-4769-9096-c1094771e78c_3840w.webp" },
  { id: "5", src: "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/1e5d812f-98e8-460c-ab63-780281a96167_3840w.jpg" },
  { id: "6", src: "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/5b2eae1d-50c9-4fc6-bc0b-6e04ab1507b1_3840w.webp" },
  { id: "7", src: "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/765e26b6-040b-48cb-96df-db0ea0f7f300_3840w.jpg" },
  { id: "8", src: "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/00d83233-ec00-4110-bf1d-95338af5875e_3840w.jpg" },
  { id: "9", src: "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/60645413-4071-4ba2-9dca-f0008184633d_3840w.jpg" },
  { id: "10", src: "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/df91b8b5-69b1-4e4e-b5e1-6716a8c8bcf1_3840w.jpg" },
  { id: "11", src: "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/c2d21a7c-b90f-4b76-b3a7-15903b6f8bf5_3840w.webp" },
  { id: "12", src: "https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/4f3f7238-ddee-4491-88ab-3db3caaaf654_3840w.webp" },
];

export default function GalleryDemo() {
  // Fix for app.tsx infrastructure horizontal scrolling
  React.useEffect(() => {
    document.documentElement.style.overflowX = "hidden";
    document.body.style.overflowX = "hidden";
    return () => {
      document.documentElement.style.overflowX = "";
      document.body.style.overflowX = "";
    };
  }, []);

  return (
    <div className="w-full self-start min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-24">
        <header className="mb-16 space-y-4">
          <h1 className="text-5xl font-bold tracking-tight text-primary">
            Curated Spaces
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            A premium photo experience with seamless shared-element transitions. 
            Tap any image to expand, drag vertically to dismiss.
          </p>
        </header>

        <Gallery>
          <GalleryGrid>
            {IMAGES.map((image) => (
              <GalleryImage 
                key={image.id} 
                id={image.id} 
                src={image.src} 
                alt={`Premium photography ${image.id}`} 
              />
            ))}
          </GalleryGrid>
        </Gallery>
      </div>
    </div>
  );
}
