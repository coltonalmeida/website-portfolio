import { LAKE_Y } from "./Island";

/**
 * The Contact landmark: a wooden **ferry dock** reaching over Lake Ontario,
 * with a moored **Toronto Island ferry** (hull, deck, wheelhouse, smokestack,
 * lit windows), a glowing dock lamp, and a Canada-Post mailbox. `glow`
 * (hover/active) brightens the lamp and the ferry's lights.
 */
export default function WaterfrontDock({ glow = 0 }: { glow?: number }) {
  const pilingTop = 0.0;
  const pilingBottom = LAKE_Y - 0.7;
  const pilingY = (pilingTop + pilingBottom) / 2;
  const pilingH = pilingTop - pilingBottom;

  return (
    <group>
      {/* Deck */}
      <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 0.16, 4.4]} />
        <meshStandardMaterial color="#5b3a22" flatShading roughness={1} />
      </mesh>
      {[-1.5, -0.75, 0, 0.75, 1.5].map((z) => (
        <mesh key={z} position={[0, 0.14, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.2, 0.05]} />
          <meshStandardMaterial color="#3f2817" />
        </mesh>
      ))}
      {/* Pilings */}
      {[
        [-1.4, -2.0],
        [1.4, -2.0],
        [-1.4, 2.0],
        [1.4, 2.0],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, pilingY, z]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, pilingH, 6]} />
          <meshStandardMaterial color="#3a2616" flatShading roughness={1} />
        </mesh>
      ))}

      {/* Dock lamp */}
      <group position={[1.3, 0, -1.9]}>
        <mesh position={[0, 0.9, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.08, 1.7, 6]} />
          <meshStandardMaterial color="#23303a" flatShading />
        </mesh>
        <mesh position={[0, 1.85, 0]}>
          <sphereGeometry args={[0.16, 10, 10]} />
          <meshStandardMaterial color="#22d3c5" emissive="#22d3c5" emissiveIntensity={2 + glow * 2} />
        </mesh>
        <pointLight position={[0, 1.85, 0]} intensity={3 + glow * 5} distance={9} color="#22d3c5" />
      </group>

      {/* Canada-Post mailbox */}
      <group position={[-1.2, 0, -1.8]}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[0.4, 0.6, 0.3]} />
          <meshStandardMaterial color="#b8242b" flatShading roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.78, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.3, 8, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#9c1f25" flatShading />
        </mesh>
      </group>

      <Ferry glow={glow} />
    </group>
  );
}

/** A low-poly Toronto Island ferry moored to the west of the dock. */
function Ferry({ glow }: { glow: number }) {
  return (
    <group position={[-2.9, LAKE_Y + 0.25, 0.4]}>
      {/* Hull */}
      <mesh position={[0, 0.0, 0]} castShadow>
        <boxGeometry args={[1.7, 0.5, 4.2]} />
        <meshStandardMaterial color="#1f3a5c" flatShading roughness={0.8} />
      </mesh>
      {/* Hull waterline stripe */}
      <mesh position={[0, -0.18, 0]}>
        <boxGeometry args={[1.74, 0.16, 4.24]} />
        <meshStandardMaterial color="#b8242b" flatShading />
      </mesh>
      {/* Main deck house */}
      <mesh position={[0, 0.55, -0.2]} castShadow>
        <boxGeometry args={[1.4, 0.7, 3.0]} />
        <meshStandardMaterial color="#e6e9ee" flatShading roughness={0.7} />
      </mesh>
      {/* Lit deck windows (both sides) */}
      {[0.71, -0.71].map((x) => (
        <mesh key={x} position={[x, 0.6, -0.2]}>
          <boxGeometry args={[0.04, 0.34, 2.6]} />
          <meshStandardMaterial
            color="#161204"
            emissive="#ffe6ad"
            emissiveIntensity={1.1 + glow}
            flatShading
          />
        </mesh>
      ))}
      {/* Upper deck + wheelhouse */}
      <mesh position={[0, 1.05, 0.4]} castShadow>
        <boxGeometry args={[1.1, 0.5, 1.2]} />
        <meshStandardMaterial color="#d7dde3" flatShading />
      </mesh>
      {/* Smokestack */}
      <mesh position={[0, 1.5, -0.6]} castShadow>
        <cylinderGeometry args={[0.16, 0.18, 0.7, 10]} />
        <meshStandardMaterial color="#b8242b" flatShading />
      </mesh>
      {/* Mast with a green nav light */}
      <mesh position={[0, 1.6, 1.0]}>
        <cylinderGeometry args={[0.03, 0.03, 1.0, 6]} />
        <meshStandardMaterial color="#2b2f38" />
      </mesh>
      <mesh position={[0, 2.1, 1.0]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#7CFC00" emissive="#7CFC00" emissiveIntensity={2 + glow} />
      </mesh>
    </group>
  );
}
