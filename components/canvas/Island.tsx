import { MeshReflectorMaterial, useGLTF } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";
import type { Group } from "three";

/**
 * The Toronto "diorama" base: a raised concrete city platform with a proper
 * street grid (asphalt, lane dashes, crosswalks, raised sidewalks) and a large
 * reflective **Lake Ontario** to the south. The lake is sized so its far edge
 * fogs into the horizon (see Environment) instead of ending abruptly.
 *
 * GLB seam preserved: pass `modelUrl` to swap the primitive base for a model.
 */

// World-Y reference points so props/buildings sit on the right surface.
export const GROUND_Y = 0; // top of the city platform
export const LAKE_Y = -0.3; // lake surface, below the waterfront
export const WATERFRONT_Z = 7; // south edge of the land (lake beyond)

// Land extents (the platform footprint).
export const LAND_MIN_X = -18;
export const LAND_MAX_X = 18;
export const LAND_MIN_Z = -18;

const PLATFORM_W = LAND_MAX_X - LAND_MIN_X; // 36
const PLATFORM_D = WATERFRONT_Z - LAND_MIN_Z; // 25
const PLATFORM_CZ = (WATERFRONT_Z + LAND_MIN_Z) / 2; // -5.5

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
      {/* Lake Ontario — big reflective plane; far edge dissolves into fog. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, LAKE_Y, 30]}>
        <planeGeometry args={[400, 400]} />
        <MeshReflectorMaterial
          resolution={512}
          mixBlur={1}
          blur={[400, 120]}
          mirror={0.6}
          mixStrength={2.6}
          color="#0a1430"
          metalness={0.7}
          roughness={0.8}
          depthScale={0}
        />
      </mesh>

      {/* City platform (the land). Top at GROUND_Y = 0. */}
      <mesh position={[0, -0.7, PLATFORM_CZ]} receiveShadow castShadow>
        <boxGeometry args={[PLATFORM_W, 1.4, PLATFORM_D]} />
        <meshStandardMaterial color="#10141d" roughness={1} flatShading />
      </mesh>

      {/* Waterfront seawall lip along the south edge. */}
      <mesh position={[0, -0.1, WATERFRONT_Z]} castShadow receiveShadow>
        <boxGeometry args={[PLATFORM_W, 0.4, 0.6]} />
        <meshStandardMaterial color="#1c2230" roughness={1} flatShading />
      </mesh>

      {/* Street grid: two avenues (E-W) + three streets (N-S). */}
      <Road axis="x" along={2} span={[LAND_MIN_X, LAND_MAX_X]} width={2.6} />
      <Road axis="x" along={-8} span={[LAND_MIN_X, LAND_MAX_X]} width={2.6} />
      <Road axis="z" along={-7} span={[LAND_MIN_Z, WATERFRONT_Z]} width={2.2} />
      <Road axis="z" along={4} span={[LAND_MIN_Z, WATERFRONT_Z]} width={2.2} />
      <Road axis="z" along={12} span={[LAND_MIN_Z, WATERFRONT_Z]} width={2.2} />

      {/* Sidewalks flanking the main avenue (z = 2). */}
      <Sidewalk axis="x" along={0.45} span={[LAND_MIN_X, LAND_MAX_X]} />
      <Sidewalk axis="x" along={3.55} span={[LAND_MIN_X, LAND_MAX_X]} />

      {/* Crosswalks where the main avenue meets each N-S street. */}
      {[-7, 4, 12].map((x) => (
        <Crosswalk key={x} position={[x, 0.03, 2]} />
      ))}
    </group>
  );
}

/** Asphalt strip with a dashed centre line. */
function Road({
  axis,
  along,
  span,
  width,
}: {
  axis: "x" | "z";
  along: number;
  span: [number, number];
  width: number;
}) {
  const length = span[1] - span[0];
  const mid = (span[0] + span[1]) / 2;
  const pos: [number, number, number] =
    axis === "x" ? [0, 0.02, along] : [along, 0.02, mid];
  const planeArgs: [number, number] =
    axis === "x" ? [length, width] : [width, length];
  const dashCount = Math.floor(length / 1.6);

  return (
    <group position={pos}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={planeArgs} />
        <meshStandardMaterial color="#0a0d14" roughness={0.7} metalness={0.2} />
      </mesh>
      {Array.from({ length: dashCount }).map((_, i) => {
        const o =
          axis === "x"
            ? (i - (dashCount - 1) / 2) * 1.6 - mid
            : (i - (dashCount - 1) / 2) * 1.6;
        const dpos: [number, number, number] =
          axis === "x" ? [o, 0.01, 0] : [0, 0.01, o];
        const dsize: [number, number] =
          axis === "x" ? [0.6, 0.09] : [0.09, 0.6];
        return (
          <mesh key={i} position={dpos} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={dsize} />
            <meshStandardMaterial
              color="#d8c14a"
              emissive="#d8c14a"
              emissiveIntensity={0.5}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/** A raised concrete sidewalk strip. */
function Sidewalk({
  axis,
  along,
  span,
}: {
  axis: "x" | "z";
  along: number;
  span: [number, number];
}) {
  const length = span[1] - span[0];
  const mid = (span[0] + span[1]) / 2;
  const pos: [number, number, number] =
    axis === "x" ? [0, 0.05, along] : [along, 0.05, mid];
  const args: [number, number, number] =
    axis === "x" ? [length, 0.1, 0.5] : [0.5, 0.1, length];
  return (
    <mesh position={[pos[0], pos[1], pos[2]]} receiveShadow castShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color="#2a3040" roughness={1} flatShading />
    </mesh>
  );
}

/** Zebra crosswalk stripes. */
function Crosswalk({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {[-0.8, -0.4, 0, 0.4, 0.8].map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.22, 2.4]} />
          <meshStandardMaterial
            color="#cfd6e0"
            emissive="#aab2c0"
            emissiveIntensity={0.25}
          />
        </mesh>
      ))}
    </group>
  );
}

/** GLB path: render a loaded base model in place of the primitives. */
function IslandModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene as Group} />;
}
