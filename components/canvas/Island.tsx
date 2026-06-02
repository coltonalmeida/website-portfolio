import { MeshReflectorMaterial, useGLTF } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";
import type { Group } from "three";

/**
 * The Toronto "diorama" base: a raised concrete city platform (the land) and a
 * large reflective **Lake Ontario** plane to the south that catches the city
 * lights. Streets with faint lane markings hint at city blocks. Flat-shaded,
 * low-poly. (Formerly the island terrain; same role — the world's ground.)
 *
 * GLB seam preserved: pass `modelUrl` to swap the primitive base for a loaded
 * model without touching zone/camera wiring.
 */

// World-Y reference points so props/buildings sit on the right surface.
export const GROUND_Y = 0; // top of the city platform
export const LAKE_Y = -0.25; // lake surface, a touch below the waterfront

type IslandProps = ThreeElements["group"] & {
  modelUrl?: string;
};

export default function Island({ modelUrl, ...groupProps }: IslandProps) {
  return (
    <group {...groupProps}>
      {modelUrl ? <IslandModel url={modelUrl} /> : <CityGround />}
    </group>
  );
}

function CityGround() {
  return (
    <group>
      {/* Lake Ontario — reflective plane that mirrors the lit city. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, LAKE_Y, 12]}>
        <planeGeometry args={[200, 200]} />
        <MeshReflectorMaterial
          resolution={512}
          mixBlur={1}
          blur={[400, 120]}
          mirror={0.55}
          mixStrength={2.2}
          color="#0a1226"
          metalness={0.6}
          roughness={0.85}
          depthScale={0}
        />
      </mesh>

      {/* City platform (the land). Top sits at GROUND_Y = 0. */}
      <mesh position={[0, -0.6, -3]} receiveShadow castShadow>
        <boxGeometry args={[22, 1.2, 16]} />
        <meshStandardMaterial color="#12161f" roughness={1} flatShading />
      </mesh>

      {/* Waterfront seawall lip along the south edge (z = +5). */}
      <mesh position={[0, -0.08, 5]} castShadow receiveShadow>
        <boxGeometry args={[22, 0.35, 0.5]} />
        <meshStandardMaterial color="#1c2230" roughness={1} flatShading />
      </mesh>

      {/* Streets — slightly raised dark asphalt strips with lane dashes. */}
      <Road position={[0, 0.012, 1.5]} size={[22, 2]} dashAxis="x" />
      <Road position={[-1, 0.012, -3]} size={[2, 16]} dashAxis="z" />
    </group>
  );
}

/** A flat asphalt strip with a dashed centre line (emissive, faint). */
function Road({
  position,
  size,
  dashAxis,
}: {
  position: [number, number, number];
  size: [number, number];
  dashAxis: "x" | "z";
}) {
  const [w, l] = size;
  const length = dashAxis === "x" ? w : l;
  const dashCount = Math.floor(length / 1.4);

  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, l]} />
        <meshStandardMaterial color="#0b0e15" roughness={1} />
      </mesh>
      {Array.from({ length: dashCount }).map((_, i) => {
        const offset = (i - (dashCount - 1) / 2) * 1.4;
        const pos: [number, number, number] =
          dashAxis === "x" ? [offset, 0.01, 0] : [0, 0.01, offset];
        const dashSize: [number, number] =
          dashAxis === "x" ? [0.5, 0.08] : [0.08, 0.5];
        return (
          <mesh key={i} position={pos} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={dashSize} />
            <meshStandardMaterial
              color="#d8c14a"
              emissive="#d8c14a"
              emissiveIntensity={0.6}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/** GLB path: render a loaded base model in place of the primitives. */
function IslandModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene as Group} />;
}
