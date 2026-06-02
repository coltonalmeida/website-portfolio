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

      {/* CC-BY attribution for the CN Tower GLB (required by its licence). */}
      <a
        href="https://sketchfab.com/3d-models/cn-tower-toronto-canada-game-ready-f8363ba3ad2d49f99fee759d6240b455"
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto fixed bottom-2 left-3 z-10 text-[10px] leading-tight text-white/40 transition hover:text-white/70"
      >
        “CN Tower” by nidhi3ds — CC BY
      </a>
    </main>
  );
}
