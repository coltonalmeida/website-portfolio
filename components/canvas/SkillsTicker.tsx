/**
 * The Skills landmark hit target. The real CN Tower GLB is now the visible
 * centerpiece (rendered ambiently in `City`), so this is just an **invisible
 * clickable region** wrapping the tower — it keeps the Skills zone selectable
 * (hover → pointer cursor, click → opens the section) while the skill content
 * itself lives in the DOM "Core Skills" overlay.
 *
 */
export default function SkillsTicker() {
  return (
    <mesh position={[0, 9, 0]} visible={false}>
      {/* Covers the tower shaft + SkyPod so clicking the tower selects Skills. */}
      <cylinderGeometry args={[2.6, 2.6, 18, 16]} />
      <meshBasicMaterial />
    </mesh>
  );
}
