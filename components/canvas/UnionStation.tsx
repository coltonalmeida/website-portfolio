/**
 * The Experience landmark: a low-poly **Union Station** (Beaux-Arts colonnade
 * facade + glowing "UNION STATION" sign) with a platform canopy and a short
 * **GO train** alongside. Clicking it opens the roles timeline in the overlay.
 * `glow` (hover/active) brightens the sign, windows, and train.
 */
const STONE = "#8a8472";
const ROOF = "#3a3730";

export default function UnionStation({ glow = 0 }: { glow?: number }) {
  return (
    <group>
      {/* Main hall */}
      <mesh position={[0, 1.3, -2.2]} castShadow receiveShadow>
        <boxGeometry args={[7, 2.6, 3]} />
        <meshStandardMaterial color={STONE} flatShading roughness={1} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 2.75, -2.2]} castShadow>
        <boxGeometry args={[7.2, 0.4, 3.2]} />
        <meshStandardMaterial color={ROOF} flatShading roughness={1} />
      </mesh>

      {/* Lit window band on the hall */}
      <mesh position={[0, 1.5, -0.69]}>
        <boxGeometry args={[5.6, 1.0, 0.06]} />
        <meshStandardMaterial
          color="#1c1708"
          emissive="#ffd98a"
          emissiveIntensity={0.9 + glow}
          flatShading
        />
      </mesh>

      {/* Colonnade — a row of columns across the front */}
      {[-2.5, -1.5, -0.5, 0.5, 1.5, 2.5].map((x) => (
        <mesh key={x} position={[x, 1.2, -0.6]} castShadow>
          <cylinderGeometry args={[0.18, 0.2, 2.4, 8]} />
          <meshStandardMaterial color="#9b9483" flatShading roughness={1} />
        </mesh>
      ))}
      {/* Entablature over the columns */}
      <mesh position={[0, 2.5, -0.6]} castShadow>
        <boxGeometry args={[7, 0.5, 0.6]} />
        <meshStandardMaterial color="#7c7666" flatShading roughness={1} />
      </mesh>

      {/* "UNION STATION" sign (decorative glowing band) */}
      <mesh position={[0, 2.45, -0.28]}>
        <boxGeometry args={[4.2, 0.34, 0.08]} />
        <meshStandardMaterial
          color="#2a1c06"
          emissive="#ffcf7a"
          emissiveIntensity={1.6 + glow}
        />
      </mesh>
      {/* Clock */}
      <mesh position={[0, 3.0, -0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.08, 16]} />
        <meshStandardMaterial color="#0c0c0c" emissive="#cfe0ff" emissiveIntensity={1.2} />
      </mesh>

      {/* Platform + canopy */}
      <mesh position={[0, 0.1, 0.8]} receiveShadow>
        <boxGeometry args={[8.5, 0.2, 1.6]} />
        <meshStandardMaterial color="#2a2f3a" flatShading roughness={1} />
      </mesh>
      <mesh position={[0, 1.7, 0.8]} castShadow>
        <boxGeometry args={[8.5, 0.1, 1.8]} />
        <meshStandardMaterial color="#33301f" flatShading roughness={1} />
      </mesh>
      {[-3.8, 3.8].map((x) => (
        <mesh key={x} position={[x, 0.9, 0.8]}>
          <cylinderGeometry args={[0.07, 0.07, 1.6, 6]} />
          <meshStandardMaterial color="#23303a" flatShading />
        </mesh>
      ))}

      {/* GO train — locomotive + two coaches along the rail */}
      <group position={[0, 0, 2.4]}>
        {/* Rails */}
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[9, 1.4]} />
          <meshStandardMaterial color="#0a0d14" roughness={1} />
        </mesh>
        <TrainCar x={3.2} loco glow={glow} />
        <TrainCar x={0} glow={glow} />
        <TrainCar x={-3.2} glow={glow} />
      </group>
    </group>
  );
}

function TrainCar({
  x,
  loco = false,
  glow = 0,
}: {
  x: number;
  loco?: boolean;
  glow?: number;
}) {
  const body = loco ? "#1f6b3a" : "#d9dde2";
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, 0.95, 0]} castShadow>
        <boxGeometry args={[3, 1.6, 1.2]} />
        <meshStandardMaterial color={body} flatShading roughness={0.6} />
      </mesh>
      {/* Green livery stripe */}
      <mesh position={[0, 0.62, 0.61]}>
        <boxGeometry args={[3, 0.28, 0.04]} />
        <meshStandardMaterial color="#2f7d4f" flatShading />
      </mesh>
      {/* Lit window band */}
      <mesh position={[0, 1.15, 0.61]}>
        <boxGeometry args={[2.6, 0.4, 0.05]} />
        <meshStandardMaterial
          color="#161204"
          emissive="#ffe6ad"
          emissiveIntensity={1.1 + glow}
          flatShading
        />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 1.78, 0]} castShadow>
        <boxGeometry args={[3, 0.12, 1.1]} />
        <meshStandardMaterial color={loco ? "#15301f" : "#aeb4ba"} flatShading />
      </mesh>
      {/* Wheels */}
      {[0.9, -0.9].map((wx) => (
        <mesh key={wx} position={[wx, 0.22, 0]}>
          <boxGeometry args={[0.5, 0.3, 1.1]} />
          <meshStandardMaterial color="#14161c" flatShading />
        </mesh>
      ))}
      {loco && (
        <mesh position={[1.52, 0.8, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color="#fff6d8" emissive="#fff0c0" emissiveIntensity={2.6 + glow * 2} />
        </mesh>
      )}
    </group>
  );
}
