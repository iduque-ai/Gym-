import * as THREE from 'three';
import type {
  BiomechanicalPose,
  ExerciseId,
  MuscleGroup,
} from '../utils/routineEngine';
import { EXERCISE_CATALOG } from '../utils/routineEngine';

// Module-scoped pre-allocated math objects for zero-GC per-frame updates
const _inactiveColor = new THREE.Color(0x334155);
const _primaryBaseColor = new THREE.Color(0xf59e0b);
const _primaryPeakColor = new THREE.Color(0xef4444);
const _secondaryColor = new THREE.Color(0x38bdf8);
const _scratchColor = new THREE.Color();
const _scratchEmissive = new THREE.Color();
const _leftHandWorld = new THREE.Vector3();
const _rightHandWorld = new THREE.Vector3();
const _trapWorld = new THREE.Vector3();

export interface AnatomicalAthleteRig {
  rootGroup: THREE.Group;
  pelvisGroup: THREE.Group;
  torsoGroup: THREE.Group;
  trapBarAnchor: THREE.Group;
  neckHeadGroup: THREE.Group;
  leftShoulderGroup: THREE.Group;
  rightShoulderGroup: THREE.Group;
  leftElbowGroup: THREE.Group;
  rightElbowGroup: THREE.Group;
  leftHandAnchor: THREE.Group;
  rightHandAnchor: THREE.Group;
  leftHipGroup: THREE.Group;
  rightHipGroup: THREE.Group;
  leftKneeGroup: THREE.Group;
  rightKneeGroup: THREE.Group;
  leftAnkleGroup: THREE.Group;
  rightAnkleGroup: THREE.Group;
  muscleMaterials: Record<MuscleGroup, THREE.MeshPhysicalMaterial>;
  telemetryGroup: THREE.Group;
  forceArrowGroup: THREE.Group;
  barPathRibbon: THREE.Mesh;
  plumbLine: THREE.Line;
}

export function buildAnatomicalAthlete(): AnatomicalAthleteRig {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'AnatomicalAthleteRig';

  // Structural skeleton & joint ring materials (varied roughness/metalness >= 0.25)
  const carbonSkeletonMat = new THREE.MeshPhysicalMaterial({
    color: 0x1e293b,
    metalness: 0.75,
    roughness: 0.32,
    clearcoat: 0.3,
  });

  const jointTitaniumMat = new THREE.MeshPhysicalMaterial({
    color: 0xe2e8f0,
    metalness: 0.92,
    roughness: 0.14,
  });

  const visorGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0ea5e9,
    metalness: 0.2,
    roughness: 0.1,
    emissive: new THREE.Color(0x0284c7),
    emissiveIntensity: 0.45,
    clearcoat: 1.0,
  });

  const shoeSoleMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.1,
    roughness: 0.85,
  });

  const shoeWedgeMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    metalness: 0.35,
    roughness: 0.45,
  });

  // Create dedicated PBR material for each of the 9 anatomical muscle groups
  const createMuscleMat = () =>
    new THREE.MeshPhysicalMaterial({
      color: 0x334155,
      metalness: 0.22,
      roughness: 0.46,
      clearcoat: 0.35,
      clearcoatRoughness: 0.25,
      emissive: new THREE.Color(0x000000),
      emissiveIntensity: 0,
    });

  const muscleMaterials: Record<MuscleGroup, THREE.MeshPhysicalMaterial> = {
    cuadriceps: createMuscleMat(),
    gluteos: createMuscleMat(),
    isquiosurales: createMuscleMat(),
    pectoral: createMuscleMat(),
    dorsal: createMuscleMat(),
    deltoides: createMuscleMat(),
    biceps: createMuscleMat(),
    triceps: createMuscleMat(),
    core: createMuscleMat(),
  };

  // 1. PELVIS & GLUTEUS MAXIMUS GROUP
  const pelvisGroup = new THREE.Group();
  pelvisGroup.position.set(0, 0.95, 0);
  rootGroup.add(pelvisGroup);

  const pelvisCoreGeom = new THREE.CapsuleGeometry(0.11, 0.12, 8, 16);
  pelvisCoreGeom.rotateZ(Math.PI / 2);
  const pelvisMesh = new THREE.Mesh(pelvisCoreGeom, carbonSkeletonMat);
  pelvisMesh.castShadow = true;
  pelvisGroup.add(pelvisMesh);

  // Left & Right Gluteus Maximus Muscle Bellies
  const gluteGeom = new THREE.SphereGeometry(0.108, 20, 16);
  gluteGeom.scale(0.95, 1.08, 0.92);
  for (const side of [-1, 1]) {
    const glute = new THREE.Mesh(gluteGeom, muscleMaterials.gluteos);
    glute.position.set(side * 0.095, -0.02, -0.065);
    glute.castShadow = true;
    pelvisGroup.add(glute);
  }

  // 2. TORSO, CORE, PECTORALIS & LATISSIMUS DORSI GROUP
  const torsoGroup = new THREE.Group();
  torsoGroup.position.set(0, 0.08, 0);
  pelvisGroup.add(torsoGroup);

  // Upper Trapezius Barbell Shelf Anchor (follows torso inclination automatically)
  const trapBarAnchor = new THREE.Group();
  trapBarAnchor.position.set(0, 0.44, -0.105);
  torsoGroup.add(trapBarAnchor);

  // Lumbar & Rectus Abdominis Core Cylinder
  const coreGeom = new THREE.CylinderGeometry(0.135, 0.115, 0.25, 20);
  const coreMesh = new THREE.Mesh(coreGeom, muscleMaterials.core);
  coreMesh.position.set(0, 0.13, 0);
  coreMesh.castShadow = true;
  torsoGroup.add(coreMesh);

  // Spinal Vertebral Ridge Accent
  const spineRidgeGeom = new THREE.BoxGeometry(0.036, 0.42, 0.04);
  const spineRidge = new THREE.Mesh(spineRidgeGeom, jointTitaniumMat);
  spineRidge.position.set(0, 0.23, -0.115);
  torsoGroup.add(spineRidge);

  // Thoracic Ribcage Chassis
  const thoraxGeom = new THREE.CylinderGeometry(0.17, 0.135, 0.24, 24);
  const thoraxMesh = new THREE.Mesh(thoraxGeom, carbonSkeletonMat);
  thoraxMesh.position.set(0, 0.34, 0);
  thoraxMesh.castShadow = true;
  torsoGroup.add(thoraxMesh);

  // Sculpted Pectoralis Major Plates (Left & Right)
  const pecGeom = new THREE.BoxGeometry(0.145, 0.125, 0.075);
  for (const side of [-1, 1]) {
    const pec = new THREE.Mesh(pecGeom, muscleMaterials.pectoral);
    pec.position.set(side * 0.082, 0.36, 0.115);
    pec.rotation.y = side * -0.15;
    pec.castShadow = true;
    torsoGroup.add(pec);
  }

  // Sculpted Latissimus Dorsi Wings & Upper Traps (Left & Right)
  const latGeom = new THREE.ConeGeometry(0.125, 0.32, 16);
  latGeom.rotateZ(Math.PI);
  for (const side of [-1, 1]) {
    const lat = new THREE.Mesh(latGeom, muscleMaterials.dorsal);
    lat.position.set(side * 0.115, 0.28, -0.055);
    lat.rotation.z = side * 0.24;
    lat.scale.set(0.85, 1, 0.72);
    lat.castShadow = true;
    torsoGroup.add(lat);
  }

  // 3. CERVICAL NECK & CRANIAL BIOMECHANICAL HEAD
  const neckHeadGroup = new THREE.Group();
  neckHeadGroup.position.set(0, 0.48, 0);
  torsoGroup.add(neckHeadGroup);

  const neckGeom = new THREE.CylinderGeometry(0.052, 0.06, 0.09, 16);
  const neckMesh = new THREE.Mesh(neckGeom, carbonSkeletonMat);
  neckMesh.position.set(0, 0.04, 0);
  neckHeadGroup.add(neckMesh);

  const craniumGeom = new THREE.CapsuleGeometry(0.088, 0.075, 12, 20);
  const craniumMesh = new THREE.Mesh(craniumGeom, carbonSkeletonMat);
  craniumMesh.position.set(0, 0.16, 0.01);
  craniumMesh.castShadow = true;
  neckHeadGroup.add(craniumMesh);

  // Optical Telemetry Visor Band (Secondary Accent Detail)
  const visorGeom = new THREE.BoxGeometry(0.155, 0.038, 0.085);
  const visorMesh = new THREE.Mesh(visorGeom, visorGlassMat);
  visorMesh.position.set(0, 0.17, 0.065);
  neckHeadGroup.add(visorMesh);

  // 4. UPPER EXTREMITIES (Shoulders, Biceps, Triceps, Forearms, Hands)
  const buildArm = (side: -1 | 1) => {
    const shoulderGroup = new THREE.Group();
    shoulderGroup.position.set(side * 0.215, 0.42, 0);
    torsoGroup.add(shoulderGroup);

    // Deltoid Cap
    const deltGeom = new THREE.SphereGeometry(0.078, 18, 16);
    deltGeom.scale(1.0, 1.15, 0.95);
    const deltMesh = new THREE.Mesh(deltGeom, muscleMaterials.deltoides);
    deltMesh.castShadow = true;
    shoulderGroup.add(deltMesh);

    // Humerus Core Bone
    const humerusGeom = new THREE.CylinderGeometry(0.036, 0.032, 0.28, 16);
    const humerusMesh = new THREE.Mesh(humerusGeom, carbonSkeletonMat);
    humerusMesh.position.set(0, -0.14, 0);
    shoulderGroup.add(humerusMesh);

    // Anterior Biceps Brachii Belly
    const bicepGeom = new THREE.CapsuleGeometry(0.038, 0.13, 8, 14);
    const bicepMesh = new THREE.Mesh(bicepGeom, muscleMaterials.biceps);
    bicepMesh.position.set(0, -0.135, 0.026);
    bicepMesh.castShadow = true;
    shoulderGroup.add(bicepMesh);

    // Posterior Triceps Brachii Horseshoe Belly
    const tricepGeom = new THREE.CapsuleGeometry(0.038, 0.14, 8, 14);
    const tricepMesh = new THREE.Mesh(tricepGeom, muscleMaterials.triceps);
    tricepMesh.position.set(0, -0.13, -0.026);
    tricepMesh.castShadow = true;
    shoulderGroup.add(tricepMesh);

    // Elbow Pivot Ring & Forearm Group
    const elbowGroup = new THREE.Group();
    elbowGroup.position.set(0, -0.28, 0);
    shoulderGroup.add(elbowGroup);

    const elbowJointGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.055, 16);
    elbowJointGeom.rotateZ(Math.PI / 2);
    const elbowJointMesh = new THREE.Mesh(elbowJointGeom, jointTitaniumMat);
    elbowGroup.add(elbowJointMesh);

    const forearmGeom = new THREE.CylinderGeometry(0.04, 0.028, 0.25, 16);
    const forearmMesh = new THREE.Mesh(forearmGeom, carbonSkeletonMat);
    forearmMesh.position.set(0, -0.13, 0);
    forearmMesh.castShadow = true;
    elbowGroup.add(forearmMesh);

    // Gripping Hand & Implement Anchor
    const handAnchor = new THREE.Group();
    handAnchor.position.set(0, -0.26, 0);
    elbowGroup.add(handAnchor);

    const handGeom = new THREE.BoxGeometry(0.045, 0.068, 0.058);
    const handMesh = new THREE.Mesh(handGeom, jointTitaniumMat);
    handAnchor.add(handMesh);

    return { shoulderGroup, elbowGroup, handAnchor };
  };

  const leftArm = buildArm(-1);
  const rightArm = buildArm(1);

  // 5. LOWER EXTREMITIES (Hips, Quadriceps, Hamstrings, Knees, Calves, Lifting Shoes)
  const buildLeg = (side: -1 | 1) => {
    const hipGroup = new THREE.Group();
    hipGroup.position.set(side * 0.115, -0.04, 0);
    pelvisGroup.add(hipGroup);

    // Hip Joint Titanium Bearing
    const hipRingGeom = new THREE.SphereGeometry(0.056, 16, 16);
    const hipRingMesh = new THREE.Mesh(hipRingGeom, jointTitaniumMat);
    hipGroup.add(hipRingMesh);

    // Femur Structural Core
    const femurGeom = new THREE.CylinderGeometry(0.052, 0.044, 0.42, 16);
    const femurMesh = new THREE.Mesh(femurGeom, carbonSkeletonMat);
    femurMesh.position.set(0, -0.21, 0);
    hipGroup.add(femurMesh);

    // Anterior Quadriceps Femoris Muscle Belly (Vastus Lateralis / Rectus Femoris)
    const quadGeom = new THREE.CapsuleGeometry(0.062, 0.23, 10, 16);
    const quadMesh = new THREE.Mesh(quadGeom, muscleMaterials.cuadriceps);
    quadMesh.position.set(0, -0.20, 0.034);
    quadMesh.castShadow = true;
    hipGroup.add(quadMesh);

    // Posterior Hamstrings Belly (Biceps Femoris / Semitendinosus)
    const hamGeom = new THREE.CapsuleGeometry(0.056, 0.22, 10, 16);
    const hamMesh = new THREE.Mesh(hamGeom, muscleMaterials.isquiosurales);
    hamMesh.position.set(0, -0.21, -0.032);
    hamMesh.castShadow = true;
    hipGroup.add(hamMesh);

    // Knee Joint Group
    const kneeGroup = new THREE.Group();
    kneeGroup.position.set(0, -0.43, 0);
    hipGroup.add(kneeGroup);

    const patellaGeom = new THREE.CylinderGeometry(0.052, 0.052, 0.075, 20);
    patellaGeom.rotateZ(Math.PI / 2);
    const patellaMesh = new THREE.Mesh(patellaGeom, jointTitaniumMat);
    kneeGroup.add(patellaMesh);

    // Tibia / Gastrocnemius Calf
    const tibiaGeom = new THREE.CylinderGeometry(0.05, 0.035, 0.41, 16);
    const tibiaMesh = new THREE.Mesh(tibiaGeom, carbonSkeletonMat);
    tibiaMesh.position.set(0, -0.21, 0);
    tibiaMesh.castShadow = true;
    kneeGroup.add(tibiaMesh);

    const calfGeom = new THREE.CapsuleGeometry(0.046, 0.16, 8, 14);
    const calfMesh = new THREE.Mesh(calfGeom, carbonSkeletonMat);
    calfMesh.position.set(0, -0.15, -0.025);
    kneeGroup.add(calfMesh);

    // Ankle & Composite Olympic Weightlifting Shoe (grounded at bottom-center)
    const ankleGroup = new THREE.Group();
    ankleGroup.position.set(0, -0.42, 0);
    kneeGroup.add(ankleGroup);

    const shoeUpperGeom = new THREE.BoxGeometry(0.098, 0.055, 0.23);
    const shoeUpper = new THREE.Mesh(shoeUpperGeom, carbonSkeletonMat);
    shoeUpper.position.set(0, -0.025, 0.045);
    shoeUpper.castShadow = true;
    ankleGroup.add(shoeUpper);

    // Raised TPU Olympic Heel Wedge
    const heelWedgeGeom = new THREE.BoxGeometry(0.102, 0.024, 0.095);
    const heelWedge = new THREE.Mesh(heelWedgeGeom, shoeWedgeMat);
    heelWedge.position.set(0, -0.055, -0.02);
    ankleGroup.add(heelWedge);

    // Flat Rubber Outsole
    const soleGeom = new THREE.BoxGeometry(0.104, 0.014, 0.24);
    const soleMesh = new THREE.Mesh(soleGeom, shoeSoleMat);
    soleMesh.position.set(0, -0.062, 0.045);
    soleMesh.receiveShadow = true;
    ankleGroup.add(soleMesh);

    return { hipGroup, kneeGroup, ankleGroup };
  };

  const leftLeg = buildLeg(-1);
  const rightLeg = buildLeg(1);

  // 6. BIOMECHANICAL TELEMETRY & FORCE VECTOR OVERLAYS IN 3D SPACE
  const telemetryGroup = new THREE.Group();
  telemetryGroup.name = 'BiomechanicalTelemetry';
  rootGroup.add(telemetryGroup);

  // Vertical Center-of-Mass / Barbell Plumb Line
  const plumbPoints = [
    new THREE.Vector3(0, 0.03, 0),
    new THREE.Vector3(0, 2.35, 0),
  ];
  const plumbGeom = new THREE.BufferGeometry().setFromPoints(plumbPoints);
  const plumbMat = new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.65,
  });
  const plumbLine = new THREE.Line(plumbGeom, plumbMat);
  telemetryGroup.add(plumbLine);

  // 3D Force Vector Arrow Assembly (Shaft + Cone Head)
  const forceArrowGroup = new THREE.Group();
  const arrowShaftMat = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
    transparent: true,
    opacity: 0.88,
  });
  const arrowShaftGeom = new THREE.CylinderGeometry(0.014, 0.014, 0.55, 14);
  const arrowShaft = new THREE.Mesh(arrowShaftGeom, arrowShaftMat);
  arrowShaft.position.y = 0.275;
  forceArrowGroup.add(arrowShaft);

  const arrowConeGeom = new THREE.ConeGeometry(0.042, 0.11, 16);
  const arrowCone = new THREE.Mesh(arrowConeGeom, arrowShaftMat);
  arrowCone.position.y = 0.58;
  forceArrowGroup.add(arrowCone);
  telemetryGroup.add(forceArrowGroup);

  // Vertical Bar Path Trajectory Ribbon
  const ribbonGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.72, 12);
  const ribbonMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.5,
  });
  const barPathRibbon = new THREE.Mesh(ribbonGeom, ribbonMat);
  barPathRibbon.position.set(0, 1.25, 0);
  telemetryGroup.add(barPathRibbon);

  return {
    rootGroup,
    pelvisGroup,
    torsoGroup,
    trapBarAnchor,
    neckHeadGroup,
    leftShoulderGroup: leftArm.shoulderGroup,
    rightShoulderGroup: rightArm.shoulderGroup,
    leftElbowGroup: leftArm.elbowGroup,
    rightElbowGroup: rightArm.elbowGroup,
    leftHandAnchor: leftArm.handAnchor,
    rightHandAnchor: rightArm.handAnchor,
    leftHipGroup: leftLeg.hipGroup,
    rightHipGroup: rightLeg.hipGroup,
    leftKneeGroup: leftLeg.kneeGroup,
    rightKneeGroup: rightLeg.kneeGroup,
    leftAnkleGroup: leftLeg.ankleGroup,
    rightAnkleGroup: rightLeg.ankleGroup,
    muscleMaterials,
    telemetryGroup,
    forceArrowGroup,
    barPathRibbon,
    plumbLine,
  };
}

/**
 * Applies a BiomechanicalPose to the 3D Athlete Rig and updates equipment transforms & muscle shaders
 * with zero heap allocations inside the animation loop.
 */
export function applyBiomechanicalPoseToScene(
  athlete: AnatomicalAthleteRig,
  pose: BiomechanicalPose,
  exerciseId: ExerciseId,
  options: {
    showMuscleMap: boolean;
    showForceVectors: boolean;
    showBarPath: boolean;
  },
  equipment: {
    powerRackGroup: THREE.Group;
    benchGroup: THREE.Group;
    barbellGroup: THREE.Group;
    leftDumbbellGroup: THREE.Group;
    rightDumbbellGroup: THREE.Group;
    jCupsGroup: THREE.Group;
  }
): void {
  const r = pose.rigRadians;
  const d = pose.depthFactor;
  const def = EXERCISE_CATALOG[exerciseId];

  // 1. Configure Athlete Supine vs Standing Orientation
  if (r.athleteLyingOnBench) {
    // Bench Press Supine Position on Competition Bench
    athlete.pelvisGroup.position.set(0, 0.52, 0.24);
    athlete.pelvisGroup.rotation.set(-Math.PI / 2, 0, 0);
    athlete.torsoGroup.rotation.set(0, 0, 0);
    // Thighs angle slightly out and down toward floor, knees bend 90 deg so feet plant flat on floor
    athlete.leftHipGroup.rotation.set(0.15, 0, -0.32);
    athlete.rightHipGroup.rotation.set(0.15, 0, 0.32);
    athlete.leftKneeGroup.rotation.set(1.38, 0, 0);
    athlete.rightKneeGroup.rotation.set(1.38, 0, 0);
    athlete.leftAnkleGroup.rotation.set(-0.15, 0, 0);
    athlete.rightAnkleGroup.rotation.set(-0.15, 0, 0);

    // Arms press vertically in World +Y (which is Local +Z inside the -PI/2 X-rotated pelvisGroup).
    // Keeping shoulderPitch + elbowPitch = -PI/2 keeps forearms 100% vertical throughout the stroke!
    const shoulderPitch = -1.35 + 1.05 * d;
    const elbowPitch = -Math.PI / 2 - shoulderPitch;
    athlete.leftShoulderGroup.rotation.set(shoulderPitch, 0, -0.62);
    athlete.rightShoulderGroup.rotation.set(shoulderPitch, 0, 0.62);
    athlete.leftElbowGroup.rotation.set(elbowPitch, 0, 0);
    athlete.rightElbowGroup.rotation.set(elbowPitch, 0, 0);
    athlete.neckHeadGroup.rotation.set(0, 0, 0);
  } else {
    athlete.pelvisGroup.position.set(0, r.pelvisY, r.pelvisZ);
    athlete.pelvisGroup.rotation.set(0, 0, 0);
    athlete.torsoGroup.rotation.set(r.torsoPitch, 0, 0);

    athlete.leftHipGroup.rotation.set(r.leftHipPitch, 0, r.leftHipRoll);
    athlete.rightHipGroup.rotation.set(r.rightHipPitch, 0, r.rightHipRoll);
    athlete.leftKneeGroup.rotation.set(r.leftKneePitch, 0, 0);
    athlete.rightKneeGroup.rotation.set(r.rightKneePitch, 0, 0);
    athlete.leftAnkleGroup.rotation.set(r.leftAnklePitch, 0, 0);
    athlete.rightAnkleGroup.rotation.set(r.rightAnklePitch, 0, 0);

    athlete.neckHeadGroup.rotation.set(r.headPitch, 0, 0);

    if (exerciseId === 'back_squat') {
      // Angle arms outward and fold forearms back so hands grip the barbell on upper traps
      athlete.leftShoulderGroup.rotation.set(0.28, 0, -0.78);
      athlete.rightShoulderGroup.rotation.set(0.28, 0, 0.78);
      athlete.leftElbowGroup.rotation.set(-2.35, 0, 0);
      athlete.rightElbowGroup.rotation.set(-2.35, 0, 0);
    } else {
      athlete.leftShoulderGroup.rotation.set(r.leftShoulderPitch, 0, r.leftShoulderRoll);
      athlete.rightShoulderGroup.rotation.set(r.rightShoulderPitch, 0, r.rightShoulderRoll);
      athlete.leftElbowGroup.rotation.set(r.leftElbowPitch, 0, 0);
      athlete.rightElbowGroup.rotation.set(r.rightElbowPitch, 0, 0);
    }
  }

  if (exerciseId === 'pull_up') {
    // Offset athlete slightly forward under the front multi-grip pull-up arch bar
    athlete.pelvisGroup.position.z = -0.24 + r.pelvisZ;
  }

  // Update world matrices once so implement anchors lock accurately to hands / upper traps
  athlete.rootGroup.updateMatrixWorld(true);

  // 2. Configure Gym Equipment Visibility & Placement per Exercise
  const usesRack =
    exerciseId === 'back_squat' ||
    exerciseId === 'bench_press' ||
    exerciseId === 'overhead_press' ||
    exerciseId === 'pull_up';

  const usesBench =
    exerciseId === 'bench_press' || exerciseId === 'bulgarian_split_squat';

  const usesBarbell =
    exerciseId === 'back_squat' ||
    exerciseId === 'bench_press' ||
    exerciseId === 'romanian_deadlift' ||
    exerciseId === 'overhead_press' ||
    exerciseId === 'barbell_row';

  const usesDumbbells =
    exerciseId === 'bicep_curl' || exerciseId === 'bulgarian_split_squat';

  equipment.powerRackGroup.visible = usesRack;
  equipment.benchGroup.visible = usesBench;
  equipment.barbellGroup.visible = usesBarbell;
  equipment.leftDumbbellGroup.visible = usesDumbbells;
  equipment.rightDumbbellGroup.visible = usesDumbbells;

  if (exerciseId === 'bench_press') {
    equipment.benchGroup.position.set(0, 0.03, 0.08);
    equipment.benchGroup.rotation.y = 0;
    equipment.jCupsGroup.position.y = -0.35;
  } else if (exerciseId === 'bulgarian_split_squat') {
    equipment.benchGroup.position.set(0, 0.03, -0.68);
    equipment.benchGroup.rotation.y = Math.PI / 2;
  } else {
    equipment.jCupsGroup.position.y = 0;
  }

  if (usesBarbell) {
    if (exerciseId === 'back_squat') {
      // Lock barbell directly to the athlete's upper trapezius shelf anchor
      athlete.trapBarAnchor.getWorldPosition(_trapWorld);
      equipment.barbellGroup.position.set(0, _trapWorld.y, _trapWorld.z);
    } else if (
      exerciseId === 'bench_press' ||
      exerciseId === 'overhead_press' ||
      exerciseId === 'romanian_deadlift' ||
      exerciseId === 'barbell_row'
    ) {
      // Lock barbell directly between the athlete's left and right gripping hands
      athlete.leftHandAnchor.getWorldPosition(_leftHandWorld);
      athlete.rightHandAnchor.getWorldPosition(_rightHandWorld);
      equipment.barbellGroup.position.set(
        0,
        (_leftHandWorld.y + _rightHandWorld.y) * 0.5,
        (_leftHandWorld.z + _rightHandWorld.z) * 0.5
      );
    }
  }

  if (usesDumbbells) {
    // Attach dumbbells directly to athlete's gripping hands in world space
    athlete.leftHandAnchor.getWorldPosition(equipment.leftDumbbellGroup.position);
    athlete.rightHandAnchor.getWorldPosition(equipment.rightDumbbellGroup.position);
    if (exerciseId === 'bicep_curl') {
      equipment.leftDumbbellGroup.rotation.set(0, 0, 0);
      equipment.rightDumbbellGroup.rotation.set(0, 0, 0);
    } else {
      equipment.leftDumbbellGroup.rotation.set(0, Math.PI / 2, 0);
      equipment.rightDumbbellGroup.rotation.set(0, Math.PI / 2, 0);
    }
  }

  // 3. Update Dynamic Anatomical Muscle Activation Shaders
  const muscleKeys = Object.keys(athlete.muscleMaterials) as MuscleGroup[];
  for (let i = 0; i < muscleKeys.length; i++) {
    const mKey = muscleKeys[i];
    const mat = athlete.muscleMaterials[mKey];

    if (!options.showMuscleMap) {
      mat.color.copy(_inactiveColor);
      mat.emissive.setHex(0x000000);
      mat.emissiveIntensity = 0;
      continue;
    }

    const tension = pose.muscleTension[mKey] ?? 0.1;
    const isPrimary = def.primaryMuscles.includes(mKey);
    const isSecondary = def.secondaryMuscles.includes(mKey);

    if (isPrimary) {
      _scratchColor.lerpColors(_primaryBaseColor, _primaryPeakColor, tension);
      mat.color.copy(_scratchColor);
      _scratchEmissive.copy(_primaryPeakColor);
      mat.emissive.copy(_scratchEmissive);
      mat.emissiveIntensity = 0.25 + 0.55 * tension;
    } else if (isSecondary) {
      _scratchColor.lerpColors(_inactiveColor, _secondaryColor, tension);
      mat.color.copy(_scratchColor);
      mat.emissive.copy(_secondaryColor);
      mat.emissiveIntensity = 0.12 + 0.30 * tension;
    } else {
      mat.color.copy(_inactiveColor);
      mat.emissive.setHex(0x000000);
      mat.emissiveIntensity = 0;
    }
  }

  // 4. Update 3D Force Vectors & Bar Path Telemetry
  athlete.forceArrowGroup.visible = options.showForceVectors;
  athlete.plumbLine.visible = options.showForceVectors || options.showBarPath;
  athlete.barPathRibbon.visible = options.showBarPath;

  const barZ = usesBarbell ? equipment.barbellGroup.position.z : r.implementZ;
  const barY = usesBarbell ? equipment.barbellGroup.position.y : pose.forceVector.originY;

  if (options.showForceVectors) {
    athlete.forceArrowGroup.position.set(
      0.34,
      barY - (pose.forceVector.directionY < 0 ? 0.45 : 0),
      barZ
    );
    const scaleY = 0.55 + 0.75 * pose.forceVector.magnitude;
    athlete.forceArrowGroup.scale.set(1, scaleY * pose.forceVector.directionY, 1);
  }

  if (options.showBarPath) {
    athlete.barPathRibbon.position.set(0, 1.15, barZ);
  }
}
