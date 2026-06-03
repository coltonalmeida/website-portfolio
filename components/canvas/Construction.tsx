/**
 * The Projects landmark: a **building under construction** — a partly-built
 * tower (clad lower floors with lit windows, bare girder floors above), a
 * **tower crane**, scaffolding, a shipping container, and work lights. Sits in
 * the open lot beside the CN Tower. `glow` (hover/active) boosts the lights.
 */
const CONCRETE = "#5a6170";
const STEEL = "#3a4150";
const CRANE = "#d9a521";

export default function Construction({ glow = 0 }: { glow?: number }) {
  const floors = [1.0, 2.0, 3.0, 4.0];
  const corners: [number, number][] = [
    [1.5, 1.5],
    [-1.5, 1.5],
    [1.5, -1.5],
    [-1.5, -1.5],
  ];

  return (
    <group>
      {/* Foundation slab */}
      <mesh position={[0, 0.1, 0]} receiveShadow castShadow>
        <boxGeometry args={[4.2, 0.2, 4.2]} />
        <meshStandardMaterial color="#2c313c" flatShading roughness={1} />
      </mesh>

      {/* Floor slabs */}
      {floors.map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.5, 0.16, 3.5]} />
          <meshStandardMaterial color={CONCRETE} flatShading roughness={1} />
        </mesh>
      ))}

      {/* Corner columns */}
      {corners.map(([x, z], i) => (
        <mesh key={i} position={[x, 2.3, z]} castShadow>
          <boxGeometry args={[0.22, 4.6, 0.22]} />
          <meshStandardMaterial color={STEEL} flatShading />
        </mesh>
      ))}

      {/* Elevator core (clad, lit) */}
      <mesh position={[0, 2.3, 0]} castShadow>
        <boxGeometry args={[1.3, 4.6, 1.3]} />
        <meshStandardMaterial color="#454c5b" flatShading roughness={1} />
      </mesh>

      {/* Lower clad floors with a few lit windows */}
      {[0.6, 1.6].map((y) => (
        <mesh key={y} position={[0, y, 1.78]}>
          <boxGeometry args={[3.2, 0.7, 0.06]} />
          <meshStandardMaterial
            color="#10141d"
            emissive="#ffd98a"
            emissiveIntensity={0.6 + glow * 0.6}
            flatShading
          />
        </mesh>
      ))}

      {/* Bare girders on the top floor */}
      {[-1, 0, 1].map((x) => (
        <mesh key={`gx${x}`} position={[x, 4.4, 0]}>
          <boxGeometry args={[0.1, 0.1, 3.4]} />
          <meshStandardMaterial color={STEEL} flatShading />
        </mesh>
      ))}

      {/* Safety netting panel (muted blue site mesh) */}
      <mesh position={[-1.8, 2.2, 0]}>
        <boxGeometry args={[0.05, 4, 3.3]} />
        <meshStandardMaterial
          color="#3a5a7a"
          emissive="#24405e"
          emissiveIntensity={0.15}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Scaffolding poles on the front */}
      {[-1.4, -0.4, 0.6, 1.6].map((x) => (
        <mesh key={`sc${x}`} position={[x, 1.6, 2.0]}>
          <cylinderGeometry args={[0.05, 0.05, 3.4, 6]} />
          <meshStandardMaterial color="#9aa0a8" flatShading />
        </mesh>
      ))}
      {[0.6, 2.0, 3.4].map((y) => (
        <mesh key={`scb${y}`} position={[0.1, y, 2.0]}>
          <boxGeometry args={[3.2, 0.06, 0.06]} />
          <meshStandardMaterial color="#9aa0a8" flatShading />
        </mesh>
      ))}

      {/* Tower crane */}
      <group position={[3.4, 0, 0.6]}>
        <mesh position={[0, 4, 0]} castShadow>
          <boxGeometry args={[0.3, 8, 0.3]} />
          <meshStandardMaterial color={CRANE} flatShading roughness={0.7} />
        </mesh>
        {/* operator cab */}
        <mesh position={[0, 7.6, 0]}>
          <boxGeometry args={[0.55, 0.5, 0.55]} />
          <meshStandardMaterial color="#2b2f38" flatShading />
        </mesh>
        {/* jib + counter-jib */}
        <mesh position={[-2.8, 8.0, 0]} castShadow>
          <boxGeometry args={[6.2, 0.18, 0.22]} />
          <meshStandardMaterial color={CRANE} flatShading />
        </mesh>
        <mesh position={[1.4, 8.0, 0]}>
          <boxGeometry args={[2.2, 0.18, 0.22]} />
          <meshStandardMaterial color={CRANE} flatShading />
        </mesh>
        {/* counterweight */}
        <mesh position={[2.3, 7.85, 0]}>
          <boxGeometry args={[0.5, 0.5, 0.4]} />
          <meshStandardMaterial color="#2b2f38" flatShading />
        </mesh>
        {/* cable + load */}
        <mesh position={[-5.4, 7.0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 1.8, 4]} />
          <meshStandardMaterial color="#1a1d24" />
        </mesh>
        <mesh position={[-5.4, 6.0, 0]} castShadow>
          <boxGeometry args={[0.6, 0.4, 0.6]} />
          <meshStandardMaterial color="#7c5a2a" flatShading />
        </mesh>
        {/* red beacon */}
        <mesh position={[0, 8.2, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#ff3030" emissive="#ff1a1a" emissiveIntensity={2.5 + glow * 2} />
        </mesh>
      </group>

      {/* Shipping container */}
      <mesh position={[-3, 0.45, 1.5]} rotation={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[2.2, 0.9, 1]} />
        <meshStandardMaterial color="#b5642a" flatShading roughness={1} />
      </mesh>

      {/* Grounded work light by the shipping container — keeps the lot lit
          without a glowing box floating in mid-air. */}
      <pointLight position={[-3, 1.2, 1.5]} intensity={2.0 + glow * 2.5} distance={8} color="#ffe7b0" />
    </group>
  );
}
