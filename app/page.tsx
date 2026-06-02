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
    </main>
  );
}
