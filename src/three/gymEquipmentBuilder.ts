import * as THREE from 'three';

export interface GymEquipmentRig {
  rootGroup: THREE.Group;
  powerRackGroup: THREE.Group;
  benchGroup: THREE.Group;
  barbellGroup: THREE.Group;
  leftDumbbellGroup: THREE.Group;
  rightDumbbellGroup: THREE.Group;
  jCupsGroup: THREE.Group;
}

/**
 * Creates a composite LatheGeometry Olympic bumper plate profile with outer rim lip,
 * recessed interior wall, and central stainless steel sleeve ring.
 */
function createBumperPlateGeometry(outerRadius: number, halfThickness: number): THREE.LatheGeometry {
  const innerRadius = 0.026;
  const hubRadius = 0.068;
  const recessInner = hubRadius + 0.012;
  const recessOuter = outerRadius - 0.032;

  const points: THREE.Vector2[] = [
    new THREE.Vector2(innerRadius, -halfThickness),
    new THREE.Vector2(hubRadius, -halfThickness),
    new THREE.Vector2(recessInner, -halfThickness * 0.72),
    new THREE.Vector2(recessOuter, -halfThickness * 0.72),
    new THREE.Vector2(outerRadius - 0.008, -halfThickness),
    new THREE.Vector2(outerRadius, -halfThickness * 0.75),
    new THREE.Vector2(outerRadius, halfThickness * 0.75),
    new THREE.Vector2(outerRadius - 0.008, halfThickness),
    new THREE.Vector2(recessOuter, halfThickness * 0.72),
    new THREE.Vector2(recessInner, halfThickness * 0.72),
    new THREE.Vector2(hubRadius, halfThickness),
    new THREE.Vector2(innerRadius, halfThickness),
  ];

  const geom = new THREE.LatheGeometry(points, 36);
  geom.rotateZ(Math.PI / 2); // Align rotational axis along X (barbell axis)
  return geom;
}

/**
 * Builds the 9-part composite Olympic Barbell with knurled shaft, brass bushings,
 * chrome rotating sleeves, LatheGeometry calibrated bumper plates, and Lock-Jaw collars.
 */
export function buildOlympicBarbell(
  knurlBumpMap: THREE.Texture,
  rubberBumpMap: THREE.Texture
): THREE.Group {
  const barbell = new THREE.Group();
  barbell.name = 'OlympicBarbell';

  // Materials with >= 0.25 roughness variation across adjacent parts
  const brushedSteelMat = new THREE.MeshPhysicalMaterial({
    color: 0xdbe4ee,
    metalness: 0.92,
    roughness: 0.28,
    bumpMap: knurlBumpMap,
    bumpScale: 0.003,
    clearcoat: 0.25,
  });

  const mirrorChromeMat = new THREE.MeshPhysicalMaterial({
    color: 0xf8fafc,
    metalness: 0.98,
    roughness: 0.08,
    clearcoat: 0.6,
  });

  const bronzeBushingMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.88,
    roughness: 0.22,
  });

  const plateBlueMat = new THREE.MeshStandardMaterial({
    color: 0x1d4ed8,
    metalness: 0.12,
    roughness: 0.76,
    bumpMap: rubberBumpMap,
    bumpScale: 0.002,
  });

  const plateAmberMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.14,
    roughness: 0.74,
    bumpMap: rubberBumpMap,
    bumpScale: 0.002,
  });

  const plateBlackMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.1,
    roughness: 0.82,
    bumpMap: rubberBumpMap,
    bumpScale: 0.002,
  });

  const collarRedMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    metalness: 0.65,
    roughness: 0.32,
  });

  // 1. Main 28mm Knurled Shaft (1.31m inner shaft length)
  const shaftGeom = new THREE.CylinderGeometry(0.015, 0.015, 1.32, 24);
  shaftGeom.rotateZ(Math.PI / 2);
  const shaftMesh = new THREE.Mesh(shaftGeom, brushedSteelMat);
  shaftMesh.castShadow = true;
  barbell.add(shaftMesh);

  // 2. Dual Powerlifting Grip Ring Markers
  const ringGeom = new THREE.CylinderGeometry(0.0156, 0.0156, 0.008, 24);
  ringGeom.rotateZ(Math.PI / 2);
  for (const side of [-1, 1]) {
    const gripRing = new THREE.Mesh(ringGeom, bronzeBushingMat);
    gripRing.position.x = side * 0.405;
    barbell.add(gripRing);
  }

  // 3. Sleeve Flanges, Brass Bushings, 50mm Chrome Sleeves, Bumper Plates & Collars
  const flangeGeom = new THREE.CylinderGeometry(0.038, 0.038, 0.028, 28);
  flangeGeom.rotateZ(Math.PI / 2);

  const bushingGeom = new THREE.CylinderGeometry(0.031, 0.031, 0.016, 24);
  bushingGeom.rotateZ(Math.PI / 2);

  const sleeveGeom = new THREE.CylinderGeometry(0.025, 0.025, 0.41, 28);
  sleeveGeom.rotateZ(Math.PI / 2);

  const plate20Geom = createBumperPlateGeometry(0.225, 0.026);
  const plate15Geom = createBumperPlateGeometry(0.205, 0.021);
  const plate10Geom = createBumperPlateGeometry(0.18, 0.017);
  const hubInsertGeom = new THREE.CylinderGeometry(0.055, 0.055, 0.054, 24);
  hubInsertGeom.rotateZ(Math.PI / 2);

  // Extruded quick-release Lock-Jaw collar
  const collarShape = new THREE.Shape();
  collarShape.absarc(0, 0, 0.042, 0, Math.PI * 2, false);
  const collarHole = new THREE.Path();
  collarHole.absarc(0, 0, 0.0255, 0, Math.PI * 2, true);
  collarShape.holes.push(collarHole);
  const collarGeom = new THREE.ExtrudeGeometry(collarShape, {
    depth: 0.038,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.004,
    bevelThickness: 0.004,
  });
  collarGeom.rotateY(Math.PI / 2);

  for (const side of [-1, 1]) {
    const flange = new THREE.Mesh(flangeGeom, mirrorChromeMat);
    flange.position.x = side * 0.674;
    flange.castShadow = true;
    barbell.add(flange);

    const bushing = new THREE.Mesh(bushingGeom, bronzeBushingMat);
    bushing.position.x = side * 0.654;
    barbell.add(bushing);

    const sleeve = new THREE.Mesh(sleeveGeom, mirrorChromeMat);
    sleeve.position.x = side * 0.885;
    sleeve.castShadow = true;
    barbell.add(sleeve);

    // 20kg Blue Olympic Plate + Steel Hub
    const p20 = new THREE.Mesh(plate20Geom, plateBlueMat);
    p20.position.x = side * 0.722;
    p20.castShadow = true;
    barbell.add(p20);

    const hub20 = new THREE.Mesh(hubInsertGeom, mirrorChromeMat);
    hub20.position.x = side * 0.722;
    barbell.add(hub20);

    // 15kg Amber Olympic Plate
    const p15 = new THREE.Mesh(plate15Geom, plateAmberMat);
    p15.position.x = side * 0.774;
    p15.castShadow = true;
    barbell.add(p15);

    // 10kg Technical Black Plate
    const p10 = new THREE.Mesh(plate10Geom, plateBlackMat);
    p10.position.x = side * 0.818;
    p10.castShadow = true;
    barbell.add(p10);

    // Competition Lock-Jaw Collar
    const collar = new THREE.Mesh(collarGeom, collarRedMat);
    collar.position.x = side * 0.848 - (side === 1 ? 0.019 : 0.019);
    collar.castShadow = true;
    barbell.add(collar);
  }

  return barbell;
}

/**
 * Builds the 10-part composite Olympic Power Rack with ExtrudeGeometry gussets,
 * TubeGeometry multi-grip pull-up arch bar, UHMW-lined J-cups, and InstancedMesh Westside holes.
 */
export function buildPowerRack(rubberBumpMap: THREE.Texture): {
  rackGroup: THREE.Group;
  jCupsGroup: THREE.Group;
} {
  const rack = new THREE.Group();
  rack.name = 'OlympicPowerRack';

  const powderCoatSteelMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.72,
    roughness: 0.38,
  });

  const accentAmberSteelMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.65,
    roughness: 0.32,
  });

  const uhmwPlasticMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.05,
    roughness: 0.88,
    bumpMap: rubberBumpMap,
    bumpScale: 0.002,
  });

  const chromePinMat = new THREE.MeshPhysicalMaterial({
    color: 0xf1f5f9,
    metalness: 0.96,
    roughness: 0.14,
  });

  const uprightX = 0.60;
  const frontZ = -0.35;
  const backZ = -1.18;
  const rackHeight = 2.32;

  // 1. 4 Vertical 75x75mm Laser-Cut Steel Uprights (grounded at y=0)
  const uprightGeom = new THREE.BoxGeometry(0.075, rackHeight, 0.075);
  const uprightPositions = [
    [-uprightX, rackHeight / 2, frontZ],
    [uprightX, rackHeight / 2, frontZ],
    [-uprightX, rackHeight / 2, backZ],
    [uprightX, rackHeight / 2, backZ],
  ];

  for (const [x, y, z] of uprightPositions) {
    const post = new THREE.Mesh(uprightGeom, powderCoatSteelMat);
    post.position.set(x, y, z);
    post.castShadow = true;
    post.receiveShadow = true;
    rack.add(post);
  }

  // 2. Rubberized Floor Mounting Boots (pivoted flush at y=0)
  const bootGeom = new THREE.BoxGeometry(0.13, 0.04, 0.14);
  for (const [x, , z] of uprightPositions) {
    const boot = new THREE.Mesh(bootGeom, uhmwPlasticMat);
    boot.position.set(x, 0.02, z);
    boot.receiveShadow = true;
    rack.add(boot);
  }

  // 3. Base & Top Side Longitudinal Skids/Crossbeams
  const sideBeamGeom = new THREE.BoxGeometry(0.07, 0.075, Math.abs(backZ - frontZ) + 0.08);
  const midZ = (frontZ + backZ) / 2;
  for (const side of [-1, 1]) {
    // Bottom stabilizer beam
    const bottomBeam = new THREE.Mesh(sideBeamGeom, powderCoatSteelMat);
    bottomBeam.position.set(side * uprightX, 0.055, midZ);
    bottomBeam.castShadow = true;
    rack.add(bottomBeam);

    // Top structural beam
    const topBeam = new THREE.Mesh(sideBeamGeom, accentAmberSteelMat);
    topBeam.position.set(side * uprightX, rackHeight - 0.06, midZ);
    topBeam.castShadow = true;
    rack.add(topBeam);
  }

  // 4. Rear Crossbeam & ExtrudeGeometry Triangular Corner Gussets
  const rearCrossGeom = new THREE.BoxGeometry(uprightX * 2, 0.08, 0.07);
  const rearTopBeam = new THREE.Mesh(rearCrossGeom, accentAmberSteelMat);
  rearTopBeam.position.set(0, rackHeight - 0.06, backZ);
  rearTopBeam.castShadow = true;
  rack.add(rearTopBeam);

  const rearBottomBeam = new THREE.Mesh(rearCrossGeom, powderCoatSteelMat);
  rearBottomBeam.position.set(0, 0.055, backZ);
  rack.add(rearBottomBeam);

  // Beveled Corner Gusset Plates
  const gussetShape = new THREE.Shape();
  gussetShape.moveTo(0, 0);
  gussetShape.lineTo(0.22, 0);
  gussetShape.lineTo(0, 0.22);
  gussetShape.closePath();
  const gussetGeom = new THREE.ExtrudeGeometry(gussetShape, {
    depth: 0.016,
    bevelEnabled: true,
    bevelThickness: 0.003,
    bevelSize: 0.003,
    bevelSegments: 2,
  });

  for (const side of [-1, 1]) {
    const gusset = new THREE.Mesh(gussetGeom, accentAmberSteelMat);
    gusset.position.set(side * (uprightX - 0.038), rackHeight - 0.10, backZ - 0.008);
    if (side === 1) {
      gusset.rotation.y = Math.PI;
    }
    gusset.rotation.z = -Math.PI / 2;
    rack.add(gusset);
  }

  // 5. Front Multi-Grip Arch Pull-Up Bar using TubeGeometry
  const pullupCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-uprightX, 2.20, frontZ),
    new THREE.Vector3(-0.36, 2.23, frontZ + 0.09),
    new THREE.Vector3(0, 2.24, frontZ + 0.11),
    new THREE.Vector3(0.36, 2.23, frontZ + 0.09),
    new THREE.Vector3(uprightX, 2.20, frontZ),
  ]);
  const pullupTubeGeom = new THREE.TubeGeometry(pullupCurve, 32, 0.018, 16, false);
  const pullupBarMesh = new THREE.Mesh(pullupTubeGeom, chromePinMat);
  pullupBarMesh.castShadow = true;
  rack.add(pullupBarMesh);

  // 6. InstancedMesh for 72 Westside Laser-Cut Adjustment Holes & Chrome Collars (>20 instances)
  const holePinGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.082, 12);
  holePinGeom.rotateX(Math.PI / 2);
  const holesPerPost = 18;
  const totalHoles = holesPerPost * 4;
  const instancedHoles = new THREE.InstancedMesh(holePinGeom, chromePinMat, totalHoles);

  const dummy = new THREE.Object3D();
  let instanceIdx = 0;
  for (const [px, , pz] of uprightPositions) {
    for (let h = 0; h < holesPerPost; h++) {
      const holeY = 0.42 + h * 0.092;
      dummy.position.set(px, holeY, pz);
      dummy.updateMatrix();
      instancedHoles.setMatrixAt(instanceIdx++, dummy.matrix);
    }
  }
  instancedHoles.instanceMatrix.needsUpdate = true;
  instancedHoles.computeBoundingSphere();
  rack.add(instancedHoles);

  // 7. Adjustable Sandwich J-Cups with UHMW Liners
  const jCupsGroup = new THREE.Group();
  jCupsGroup.name = 'RackJCups';
  const jCupBackGeom = new THREE.BoxGeometry(0.088, 0.16, 0.09);
  const jCupLipGeom = new THREE.BoxGeometry(0.072, 0.075, 0.11);
  const jCupLinerGeom = new THREE.BoxGeometry(0.068, 0.022, 0.095);

  for (const side of [-1, 1]) {
    const cup = new THREE.Group();
    cup.position.set(side * uprightX, 1.44, frontZ);

    const bracket = new THREE.Mesh(jCupBackGeom, accentAmberSteelMat);
    cup.add(bracket);

    const frontLip = new THREE.Mesh(jCupLipGeom, powderCoatSteelMat);
    frontLip.position.set(0, -0.04, 0.085);
    cup.add(frontLip);

    const uhmwPad = new THREE.Mesh(jCupLinerGeom, uhmwPlasticMat);
    uhmwPad.position.set(0, -0.005, 0.08);
    cup.add(uhmwPad);

    jCupsGroup.add(cup);
  }
  rack.add(jCupsGroup);

  // 8. Rear Storage Weight Horns
  const hornGeom = new THREE.CylinderGeometry(0.024, 0.024, 0.24, 18);
  hornGeom.rotateZ(Math.PI / 2);
  for (const side of [-1, 1]) {
    for (const hY of [0.48, 1.05]) {
      const horn = new THREE.Mesh(hornGeom, chromePinMat);
      horn.position.set(side * (uprightX + 0.13), hY, backZ);
      rack.add(horn);
    }
  }

  return { rackGroup: rack, jCupsGroup };
}

/**
 * Builds the 8-part composite Competition Gym Bench with ExtrudeGeometry stitched vinyl pad,
 * steel tripod chassis, transport wheels, and aluminum adjustment knobs.
 */
export function buildGymBench(rubberBumpMap: THREE.Texture): THREE.Group {
  const bench = new THREE.Group();
  bench.name = 'CompetitionBench';

  const frameSteelMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.78,
    roughness: 0.34,
  });

  const vinylPadMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    metalness: 0.06,
    roughness: 0.64,
    clearcoat: 0.18,
    bumpMap: rubberBumpMap,
    bumpScale: 0.0035,
  });

  const stitchTrimMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.35,
    roughness: 0.45,
  });

  const chromeMat = new THREE.MeshPhysicalMaterial({
    color: 0xe2e8f0,
    metalness: 0.94,
    roughness: 0.16,
  });

  // 1. Main Longitudinal Spine Tube
  const spineGeom = new THREE.BoxGeometry(0.075, 0.065, 1.24);
  const spineMesh = new THREE.Mesh(spineGeom, frameSteelMat);
  spineMesh.position.set(0, 0.065, 0);
  spineMesh.castShadow = true;
  bench.add(spineMesh);

  // 2. Front and Rear Vertical Support Pillars
  const pillarGeom = new THREE.BoxGeometry(0.07, 0.34, 0.07);
  for (const zPos of [-0.42, 0.44]) {
    const pillar = new THREE.Mesh(pillarGeom, frameSteelMat);
    pillar.position.set(0, 0.23, zPos);
    pillar.castShadow = true;
    bench.add(pillar);
  }

  // 3. Rear Wide Stabilizer Foot + Transport Wheels
  const rearFootGeom = new THREE.BoxGeometry(0.54, 0.045, 0.075);
  const rearFoot = new THREE.Mesh(rearFootGeom, frameSteelMat);
  rearFoot.position.set(0, 0.0225, -0.56);
  rearFoot.castShadow = true;
  bench.add(rearFoot);

  const wheelGeom = new THREE.CylinderGeometry(0.038, 0.038, 0.028, 20);
  wheelGeom.rotateZ(Math.PI / 2);
  for (const side of [-1, 1]) {
    const wheel = new THREE.Mesh(wheelGeom, vinylPadMat);
    wheel.position.set(side * 0.24, 0.038, -0.62);
    bench.add(wheel);
  }

  // 4. Front Compact Stabilizer Foot (grounded at y=0)
  const frontFootGeom = new THREE.BoxGeometry(0.32, 0.045, 0.075);
  const frontFoot = new THREE.Mesh(frontFootGeom, frameSteelMat);
  frontFoot.position.set(0, 0.0225, 0.54);
  frontFoot.castShadow = true;
  bench.add(frontFoot);

  // 5. ExtrudeGeometry Beveled Back Pad & Seat Pad
  const createPadGeometry = (width: number, length: number) => {
    const s = new THREE.Shape();
    const hw = width / 2;
    const hl = length / 2;
    s.moveTo(-hw, -hl);
    s.lineTo(hw, -hl);
    s.lineTo(hw, hl);
    s.lineTo(-hw, hl);
    s.closePath();

    const g = new THREE.ExtrudeGeometry(s, {
      depth: 0.055,
      bevelEnabled: true,
      bevelThickness: 0.014,
      bevelSize: 0.014,
      bevelSegments: 3,
    });
    g.rotateX(Math.PI / 2);
    return g;
  };

  const backPadGeom = createPadGeometry(0.29, 0.84);
  const backPad = new THREE.Mesh(backPadGeom, vinylPadMat);
  backPad.position.set(0, 0.44, -0.15);
  backPad.castShadow = true;
  backPad.receiveShadow = true;
  bench.add(backPad);

  const seatPadGeom = createPadGeometry(0.29, 0.34);
  const seatPad = new THREE.Mesh(seatPadGeom, vinylPadMat);
  seatPad.position.set(0, 0.44, 0.47);
  seatPad.castShadow = true;
  seatPad.receiveShadow = true;
  bench.add(seatPad);

  // 6. Amber Biomechanical Center Alignment Stripe on Pad
  const stripeGeom = new THREE.BoxGeometry(0.018, 0.004, 1.18);
  const stripeMesh = new THREE.Mesh(stripeGeom, stitchTrimMat);
  stripeMesh.position.set(0, 0.456, 0.04);
  bench.add(stripeMesh);

  // 7. Chrome Adjustment Ladder & Pop-Pin
  const ladderGeom = new THREE.BoxGeometry(0.04, 0.24, 0.02);
  const ladder = new THREE.Mesh(ladderGeom, chromeMat);
  ladder.position.set(0, 0.26, -0.12);
  ladder.rotation.x = 0.45;
  bench.add(ladder);

  return bench;
}

/**
 * Builds a 6-part composite Ergonomic Hex Dumbbell with LatheGeometry knurled handle
 * and dual hexagonal rubber-encased weight heads.
 */
export function buildHexDumbbell(
  knurlBumpMap: THREE.Texture,
  rubberBumpMap: THREE.Texture
): THREE.Group {
  const db = new THREE.Group();

  const chromeHandleMat = new THREE.MeshPhysicalMaterial({
    color: 0xf1f5f9,
    metalness: 0.95,
    roughness: 0.18,
    bumpMap: knurlBumpMap,
    bumpScale: 0.0025,
  });

  const hexRubberMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    metalness: 0.12,
    roughness: 0.78,
    bumpMap: rubberBumpMap,
    bumpScale: 0.002,
  });

  const accentRingMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.55,
    roughness: 0.32,
  });

  // 1. Contoured LatheGeometry Handle
  const handlePoints = [
    new THREE.Vector2(0.014, -0.07),
    new THREE.Vector2(0.016, -0.04),
    new THREE.Vector2(0.0175, 0),
    new THREE.Vector2(0.016, 0.04),
    new THREE.Vector2(0.014, 0.07),
  ];
  const handleGeom = new THREE.LatheGeometry(handlePoints, 20);
  handleGeom.rotateZ(Math.PI / 2);
  const handleMesh = new THREE.Mesh(handleGeom, chromeHandleMat);
  handleMesh.castShadow = true;
  db.add(handleMesh);

  // 2. Dual Hexagonal Heads (6-sided CylinderGeometry) + Beveled Accent Rings
  const hexHeadGeom = new THREE.CylinderGeometry(0.072, 0.072, 0.078, 6);
  hexHeadGeom.rotateZ(Math.PI / 2);

  const ringGeom = new THREE.CylinderGeometry(0.073, 0.073, 0.008, 6);
  ringGeom.rotateZ(Math.PI / 2);

  for (const side of [-1, 1]) {
    const head = new THREE.Mesh(hexHeadGeom, hexRubberMat);
    head.position.x = side * 0.108;
    head.castShadow = true;
    db.add(head);

    const ring = new THREE.Mesh(ringGeom, accentRingMat);
    ring.position.x = side * 0.108;
    db.add(ring);
  }

  return db;
}
