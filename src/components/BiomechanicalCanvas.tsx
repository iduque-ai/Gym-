import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {
  calculateBiomechanicalPose,
  EXERCISE_CATALOG,
  type BiomechanicalPose,
  type CameraPresetId,
  type ExerciseId,
} from '../utils/routineEngine';
import {
  createContactShadowTexture,
  createGymFloorTexture,
  createKnurlingBumpTexture,
  createPlatformWoodTexture,
  createRubberBumpTexture,
} from '../three/proceduralTextures';
import {
  buildGymBench,
  buildHexDumbbell,
  buildOlympicBarbell,
  buildPowerRack,
} from '../three/gymEquipmentBuilder';
import {
  applyBiomechanicalPoseToScene,
  buildAnatomicalAthlete,
} from '../three/anatomicalAthleteBuilder';

export interface BiomechanicalCanvasProps {
  exerciseId: ExerciseId;
  isPlaying: boolean;
  playbackSpeed: number;
  manualRepProgress: number | null;
  cameraPreset: CameraPresetId;
  cameraTriggerCount: number;
  showMuscleMap: boolean;
  showForceVectors: boolean;
  showBarPath: boolean;
  onPoseSample: (pose: BiomechanicalPose) => void;
}

const CAMERA_PRESETS: Record<
  CameraPresetId,
  { pos: [number, number, number]; target: [number, number, number] }
> = {
  isometric: { pos: [2.55, 1.72, 2.65], target: [0, 0.98, -0.05] },
  lateral: { pos: [3.35, 1.28, 0.0], target: [0, 0.96, -0.05] },
  frontal: { pos: [0.0, 1.38, 3.45], target: [0, 0.98, -0.05] },
  overhead: { pos: [0.05, 4.15, 0.95], target: [0, 0.92, -0.15] },
};

function getCameraFraming(
  presetId: CameraPresetId,
  exerciseId: ExerciseId,
  aspect = 1.4
): { pos: [number, number, number]; target: [number, number, number] } {
  const base = CAMERA_PRESETS[presetId];
  const isFloorOrBench =
    exerciseId === 'bench_press' ||
    exerciseId === 'push_up' ||
    exerciseId === 'pike_pushup';
  const isPullUp = exerciseId === 'pull_up';
  // Pull back slightly on narrow/portrait mobile containers so barbell plates & rack stay in frame
  const mobileZoomScale = aspect < 1.15 ? 1.24 : aspect < 1.35 ? 1.12 : 1.0;

  if (isFloorOrBench && presetId !== 'overhead') {
    return {
      pos: [
        base.pos[0] * 0.92 * mobileZoomScale,
        Math.max(0.95, base.pos[1] - 0.35),
        base.pos[2] * 0.92 * mobileZoomScale,
      ],
      target: [0, 0.56, 0.05],
    };
  }
  if (isPullUp && presetId !== 'overhead') {
    return {
      pos: [
        base.pos[0] * 1.05 * mobileZoomScale,
        base.pos[1] + 0.25,
        base.pos[2] * 1.05 * mobileZoomScale,
      ],
      target: [0, 1.34, -0.2],
    };
  }
  return {
    pos: [
      base.pos[0] * mobileZoomScale,
      base.pos[1] + (mobileZoomScale > 1 ? 0.08 : 0),
      base.pos[2] * mobileZoomScale,
    ],
    target: base.target,
  };
}

// Module-scoped scratch vectors for zero-GC camera damping
const _desiredCamPos = new THREE.Vector3();
const _desiredTargetPos = new THREE.Vector3();

export const BiomechanicalCanvas: React.FC<BiomechanicalCanvasProps> = ({
  exerciseId,
  isPlaying,
  playbackSpeed,
  manualRepProgress,
  cameraPreset,
  cameraTriggerCount,
  showMuscleMap,
  showForceVectors,
  showBarPath,
  onPoseSample,
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);

  // Store mutable props in refs so React HUD updates never tear down or reset WebGL
  const stateRef = useRef({
    exerciseId,
    isPlaying,
    playbackSpeed,
    manualRepProgress,
    cameraPreset,
    showMuscleMap,
    showForceVectors,
    showBarPath,
    onPoseSample,
    isCameraTransitioning: true,
    repProgressAccum: 0.18,
  });

  useEffect(() => {
    const prevExercise = stateRef.current.exerciseId;
    stateRef.current.exerciseId = exerciseId;
    stateRef.current.isPlaying = isPlaying;
    stateRef.current.playbackSpeed = playbackSpeed;
    stateRef.current.manualRepProgress = manualRepProgress;
    stateRef.current.showMuscleMap = showMuscleMap;
    stateRef.current.showForceVectors = showForceVectors;
    stateRef.current.showBarPath = showBarPath;
    stateRef.current.onPoseSample = onPoseSample;

    if (prevExercise !== exerciseId && manualRepProgress === null) {
      stateRef.current.repProgressAccum = 0.22;
      stateRef.current.isCameraTransitioning = true;
    }
  }, [
    exerciseId,
    isPlaying,
    playbackSpeed,
    manualRepProgress,
    showMuscleMap,
    showForceVectors,
    showBarPath,
    onPoseSample,
  ]);

  useEffect(() => {
    stateRef.current.cameraPreset = cameraPreset;
    stateRef.current.isCameraTransitioning = true;
  }, [cameraPreset, cameraTriggerCount]);

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    // 1. Software-WebGL detection from GPU renderer string
    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.domElement.setAttribute('data-testid', 'biomechanical-canvas');
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // WebGL context loss safety
    const onContextLost = (e: Event) => {
      e.preventDefault();
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    // 2. Scene, Horizon Fog & Mandatory Studio Environment Reflection
    const scene = new THREE.Scene();
    const bgHex = 0x090d16;
    scene.background = new THREE.Color(bgHex);
    scene.fog = new THREE.FogExp2(bgHex, 0.042);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    pmremGenerator.dispose();

    // 3. Camera & OrbitControls
    const initialAspect = width / Math.max(1, height);
    const camera = new THREE.PerspectiveCamera(
      initialAspect < 1.15 ? 46 : 42,
      initialAspect,
      0.1,
      60
    );
    const initialPreset = getCameraFraming(
      stateRef.current.cameraPreset,
      stateRef.current.exerciseId,
      initialAspect
    );
    camera.position.set(...initialPreset.pos);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...initialPreset.target);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.07;
    controls.minDistance = 1.6;
    controls.maxDistance = 8.5;
    controls.maxPolarAngle = Math.PI * 0.485;
    controls.update();

    // Cancel automated camera transition when user interacts manually
    const onControlsStart = () => {
      stateRef.current.isCameraTransitioning = false;
    };
    controls.addEventListener('start', onControlsStart);

    // 4. Balanced Studio Lighting Rig (Warm Key + Cool Hemisphere Fill + Rim + Softboxes)
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x090d16, 1.15);
    hemiLight.position.set(0, 12, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff3e0, 2.6);
    keyLight.position.set(3.8, 5.4, 3.6);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    const d = 3.2;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 14;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x7dd3fc, 0.85);
    fillLight.position.set(-3.6, 2.8, 2.2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xf59e0b, 1.45);
    rimLight.position.set(0.2, 3.6, -4.2);
    scene.add(rimLight);

    if (!isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      const softboxTop = new THREE.RectAreaLight(0xffffff, 3.2, 2.6, 1.8);
      softboxTop.position.set(0, 3.9, 1.4);
      softboxTop.lookAt(0, 1.0, 0);
      scene.add(softboxTop);
    }

    // 5. Procedural Textures & Ground Surfaces (Disjoint Y offsets >= 0.015 to avoid Z-fighting)
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    const floorTex = createGymFloorTexture(maxAnisotropy);
    const rubberBumpTex = createRubberBumpTexture(maxAnisotropy);
    const knurlBumpTex = createKnurlingBumpTexture(maxAnisotropy);
    const platformWoodTex = createPlatformWoodTexture(maxAnisotropy);
    const contactShadowTex = createContactShadowTexture();

    // Base Studio Rubber Floor at y = 0
    const floorGeom = new THREE.PlaneGeometry(32, 32);
    floorGeom.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: floorTex,
      bumpMap: rubberBumpTex,
      bumpScale: 0.003,
      roughness: 0.84,
      metalness: 0.08,
    });
    const floorMesh = new THREE.Mesh(floorGeom, floorMat);
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Olympic Lifting Platform Chassis at y = 0.014 (Composite 3-part base + rubber wings + center wood calibration zone)
    const platformGroup = new THREE.Group();
    const platformFrameGeom = new THREE.BoxGeometry(2.64, 0.026, 2.44);
    const platformFrameMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.78,
      roughness: 0.35,
    });
    const platformFrame = new THREE.Mesh(platformFrameGeom, platformFrameMat);
    platformFrame.position.set(0, 0.013, -0.2);
    platformFrame.receiveShadow = true;
    platformGroup.add(platformFrame);

    const platformCenterGeom = new THREE.BoxGeometry(1.38, 0.006, 2.36);
    const platformCenterMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: platformWoodTex,
      roughness: 0.42,
      metalness: 0.12,
    });
    const platformCenter = new THREE.Mesh(platformCenterGeom, platformCenterMat);
    platformCenter.position.set(0, 0.027, -0.2);
    platformCenter.receiveShadow = true;
    platformGroup.add(platformCenter);

    // Left & Right EPDM Rubber Deadlifting Drop Zones
    const dropZoneGeom = new THREE.BoxGeometry(0.58, 0.006, 2.36);
    const dropZoneMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      bumpMap: rubberBumpTex,
      bumpScale: 0.004,
      roughness: 0.88,
      metalness: 0.06,
    });
    for (const side of [-1, 1]) {
      const dz = new THREE.Mesh(dropZoneGeom, dropZoneMat);
      dz.position.set(side * 0.99, 0.027, -0.2);
      dz.receiveShadow = true;
      platformGroup.add(dz);
    }
    scene.add(platformGroup);

    // Soft Radial Contact Shadow Plane at y = 0.032 with polygonOffset
    const shadowDiscGeom = new THREE.CircleGeometry(1.15, 32);
    shadowDiscGeom.rotateX(-Math.PI / 2);
    const shadowDiscMat = new THREE.MeshBasicMaterial({
      map: contactShadowTex,
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
    const shadowDisc = new THREE.Mesh(shadowDiscGeom, shadowDiscMat);
    shadowDisc.position.set(0, 0.032, -0.05);
    scene.add(shadowDisc);

    // 6. Build Composite Multi-Part Gym Equipment & Articulated Anatomical Athlete
    const { rackGroup, jCupsGroup } = buildPowerRack(rubberBumpTex);
    rackGroup.position.y = 0.03;
    scene.add(rackGroup);

    const benchGroup = buildGymBench(rubberBumpTex);
    benchGroup.position.y = 0.03;
    scene.add(benchGroup);

    const barbellGroup = buildOlympicBarbell(knurlBumpTex, rubberBumpTex);
    scene.add(barbellGroup);

    const leftDumbbellGroup = buildHexDumbbell(knurlBumpTex, rubberBumpTex);
    const rightDumbbellGroup = buildHexDumbbell(knurlBumpTex, rubberBumpTex);
    scene.add(leftDumbbellGroup);
    scene.add(rightDumbbellGroup);

    const athleteRig = buildAnatomicalAthlete();
    athleteRig.rootGroup.position.y = 0.03;
    scene.add(athleteRig.rootGroup);

    // Apply initial pose immediately and pre-warm shaders on hardware GPUs
    const initialPose = calculateBiomechanicalPose(
      stateRef.current.exerciseId,
      stateRef.current.repProgressAccum
    );
    applyBiomechanicalPoseToScene(
      athleteRig,
      initialPose,
      stateRef.current.exerciseId,
      {
        showMuscleMap: stateRef.current.showMuscleMap,
        showForceVectors: stateRef.current.showForceVectors,
        showBarPath: stateRef.current.showBarPath,
      },
      {
        powerRackGroup: rackGroup,
        benchGroup,
        barbellGroup,
        leftDumbbellGroup,
        rightDumbbellGroup,
        jCupsGroup,
      }
    );
    stateRef.current.onPoseSample(initialPose);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // 7. Responsive Resize Handler + ResizeObserver for Split Studio Container
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w <= 0 || h <= 0) return;
      const aspect = w / h;
      camera.fov = aspect < 1.15 ? 46 : 42;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.render(scene, camera);
    };
    window.addEventListener('resize', handleResize);
    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => handleResize())
        : null;
    resizeObserver?.observe(container);

    // 8. Animation Loop with Software-WebGL fenceSync Pacing & 10Hz HUD Telemetry Throttling
    let frameId = 0;
    let isUnmounted = false;
    let lastTimestamp = performance.now();
    let lastHudSampleTime = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || typeof gl.fenceSync !== 'function') {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (isUnmounted) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (isUnmounted) return;
      const now = performance.now();
      const dt = Math.min((now - lastTimestamp) / 1000, 0.12);
      lastTimestamp = now;

      const st = stateRef.current;
      const def = EXERCISE_CATALOG[st.exerciseId];

      // Advance repetition cycle or use manual scrubber position
      if (st.manualRepProgress !== null) {
        st.repProgressAccum = st.manualRepProgress;
      } else if (st.isPlaying) {
        st.repProgressAccum =
          (st.repProgressAccum + (dt * st.playbackSpeed) / def.cycleDurationSec) % 1;
      }

      const pose = calculateBiomechanicalPose(st.exerciseId, st.repProgressAccum);

      applyBiomechanicalPoseToScene(
        athleteRig,
        pose,
        st.exerciseId,
        {
          showMuscleMap: st.showMuscleMap,
          showForceVectors: st.showForceVectors,
          showBarPath: st.showBarPath,
        },
        {
          powerRackGroup: rackGroup,
          benchGroup,
          barbellGroup,
          leftDumbbellGroup,
          rightDumbbellGroup,
          jCupsGroup,
        }
      );

      // Exponential camera preset damping (1 - Math.exp(-k * dt))
      if (st.isCameraTransitioning) {
        const preset = getCameraFraming(
          st.cameraPreset,
          st.exerciseId,
          camera.aspect
        );
        _desiredCamPos.set(...preset.pos);
        _desiredTargetPos.set(...preset.target);

        const alpha = isSoftwareGl ? 0.35 : 1 - Math.exp(-6.5 * dt);
        camera.position.lerp(_desiredCamPos, alpha);
        controls.target.lerp(_desiredTargetPos, alpha);

        if (
          camera.position.distanceToSquared(_desiredCamPos) < 0.0005 &&
          controls.target.distanceToSquared(_desiredTargetPos) < 0.0005
        ) {
          camera.position.copy(_desiredCamPos);
          controls.target.copy(_desiredTargetPos);
          st.isCameraTransitioning = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);

      // Throttle HUD React callback to ~10Hz so React state never runs at 60Hz
      if (now - lastHudSampleTime >= 110) {
        lastHudSampleTime = now;
        st.onPoseSample(pose);
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      isUnmounted = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      resizeObserver?.disconnect();
      controls.removeEventListener('start', onControlsStart);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      controls.dispose();
      envTarget.dispose();
      floorTex.dispose();
      rubberBumpTex.dispose();
      knurlBumpTex.dispose();
      platformWoodTex.dispose();
      contactShadowTex.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={canvasMountRef}
      className="relative w-full h-full overflow-hidden bg-[#090D16]"
      aria-label="Laboratorio Biomecánico 3D interactivo"
    />
  );
};
