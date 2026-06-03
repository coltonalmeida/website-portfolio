import Experience from "@/components/canvas/Experience";
import Nav from "@/components/ui/Nav";
import Overlay from "@/components/ui/Overlay";
import Loader from "@/components/ui/Loader";

export default function Home() {
  return (
    <main className="fixed inset-0 h-full w-full">
      <Experience />
      <Nav />
      <Overlay />
      <Loader />

      {/*
        CC-BY attribution for the CN Tower GLB (required by its licence).
        Hidden from the UI per request, but kept here so the credit isn't lost:
        “CN Tower” by nidhi3ds — CC BY
        https://sketchfab.com/3d-models/cn-tower-toronto-canada-game-ready-f8363ba3ad2d49f99fee759d6240b455
      */}
    </main>
  );
}
