/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  Camera,
  Activity,
  Compass,
  BookOpen,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import {
  calculateBiomechanicalPose,
  calculateRoutineMetrics,
  EXERCISE_CATALOG,
  generateRoutine,
  MUSCLE_LABELS,
  type BiomechanicalPose,
  type CameraPresetId,
  type ExerciseId,
  type GeneratedRoutine,
  type UserProfile,
} from './utils/routineEngine';
import {
  createWorkoutLogEntry,
  getInitialSeedWorkoutLogs,
  type WorkoutLogEntry,
} from './utils/progressEngine';
import { BiomechanicalCanvas } from './components/BiomechanicalCanvas';
import { RoutineDesignerModal } from './components/RoutineDesignerModal';
import { ActiveRoutineDrawer } from './components/ActiveRoutineDrawer';
import { TechniqueGuideDrawer } from './components/TechniqueGuideDrawer';
import { ProgressTrackerDrawer } from './components/ProgressTrackerDrawer';

const INITIAL_PROFILE: UserProfile = {
  weightKg: 78,
  heightCm: 178,
  age: 28,
  level: 'intermedio',
  goal: 'hipertrofia',
  daysPerWeek: 4,
  equipment: 'gimnasio_completo',
};

export default function App() {
  const [routine, setRoutine] = useState<GeneratedRoutine>(() =>
    generateRoutine(INITIAL_PROFILE)
  );
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [activeExerciseId, setActiveExerciseId] = useState<ExerciseId>('back_squat');

  // 3D Playback & Telemetry Controls
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [manualRepProgress, setManualRepProgress] = useState<number | null>(null);
  const [cameraPreset, setCameraPreset] = useState<CameraPresetId>('isometric');
  const [cameraTriggerCount, setCameraTriggerCount] = useState<number>(0);
  const [showMuscleMap, setShowMuscleMap] = useState<boolean>(true);
  const [showForceVectors, setShowForceVectors] = useState<boolean>(true);
  const [showBarPath, setShowBarPath] = useState<boolean>(true);
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);

  // Active Overlay Panels ('none' = 100% unobstructed 3D Studio)
  const [activeOverlay, setActiveOverlay] = useState<
    'none' | 'designer' | 'routine' | 'progress' | 'guide' | 'catalog'
  >('none');

  // Persistent Workout Progress History (weight, reps, sets, 1RM, volume)
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogEntry[]>(() => {
    try {
      const saved = window.localStorage.getItem('kinesis3d_workout_logs_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return getInitialSeedWorkoutLogs();
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('kinesis3d_workout_logs_v1', JSON.stringify(workoutLogs));
    } catch {
      // ignore storage errors
    }
  }, [workoutLogs]);

  // Live Pose Sample from 3D Engine (throttled to ~10Hz)
  const [livePose, setLivePose] = useState<BiomechanicalPose>(() =>
    calculateBiomechanicalPose('back_squat', 0.22)
  );

  const handlePoseSample = useCallback((pose: BiomechanicalPose) => {
    setLivePose(pose);
  }, []);

  // Keyboard shortcuts ('H' to hide/show bottom dock, 'Escape' to close drawers)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      if (e.key === 'h' || e.key === 'H') {
        setIsDockCollapsed((prev) => !prev);
      } else if (e.key === 'Escape') {
        setActiveOverlay('none');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSelectExercise = (
    exId: ExerciseId,
    preset?: CameraPresetId,
    inspectPhase: number | null = null
  ) => {
    const def = EXERCISE_CATALOG[exId];
    setActiveExerciseId(exId);
    setCameraPreset(preset || def.defaultCamera);
    setCameraTriggerCount((c) => c + 1);
    if (inspectPhase !== null) {
      setIsPlaying(false);
      setManualRepProgress(inspectPhase);
    } else {
      setManualRepProgress(null);
      setIsPlaying(true);
    }
  };

  const handleGenerateRoutine = (newProfile: UserProfile) => {
    const generated = generateRoutine(newProfile);
    setRoutine(generated);
    setSelectedDayIndex(0);
    const firstEx = generated.days[0]?.exercises[0]?.exerciseId || 'back_squat';
    handleSelectExercise(firstEx);
    setActiveOverlay('routine');
  };

  const handleToggleSetComplete = (dayIdx: number, itemId: string, setIdx: number) => {
    setRoutine((prev) => {
      const nextDays = prev.days.map((d, dI) => {
        if (dI !== dayIdx) return d;
        return {
          ...d,
          exercises: d.exercises.map((ex) => {
            if (ex.id !== itemId) return ex;
            const nextCompleted = [...ex.completedSets];
            nextCompleted[setIdx] = !nextCompleted[setIdx];
            return { ...ex, completedSets: nextCompleted };
          }),
        };
      });
      return {
        ...prev,
        days: nextDays,
        weeklyMetrics: calculateRoutineMetrics(nextDays, prev.profile),
      };
    });
  };

  const handleUpdateLoadKg = (dayIdx: number, itemId: string, newLoadKg: number) => {
    setRoutine((prev) => {
      const nextDays = prev.days.map((d, dI) => {
        if (dI !== dayIdx) return d;
        return {
          ...d,
          exercises: d.exercises.map((ex) =>
            ex.id === itemId ? { ...ex, targetLoadKg: newLoadKg } : ex
          ),
        };
      });
      return {
        ...prev,
        days: nextDays,
        weeklyMetrics: calculateRoutineMetrics(nextDays, prev.profile),
      };
    });
  };

  const handleAddExerciseToDay = (dayIdx: number, exId: ExerciseId) => {
    const def = EXERCISE_CATALOG[exId];
    setRoutine((prev) => {
      const nextDays = prev.days.map((d, dI) => {
        if (dI !== dayIdx) return d;
        const newItem = {
          id: `d${dayIdx + 1}-custom-${Date.now()}`,
          exerciseId: exId,
          sets: 3,
          reps: '8-12',
          targetLoadKg: Math.max(10, Math.round((prev.profile.weightKg * def.bodyweightRatioIntermedio) / 2.5) * 2.5),
          restSeconds: 90,
          rir: 2,
          completedSets: [false, false, false],
          notes: def.phases.eccentric.cue,
        };
        return {
          ...d,
          exercises: [...d.exercises, newItem],
        };
      });
      return {
        ...prev,
        days: nextDays,
        weeklyMetrics: calculateRoutineMetrics(nextDays, prev.profile),
      };
    });
  };

  const handleRemoveExerciseFromDay = (dayIdx: number, itemId: string) => {
    setRoutine((prev) => {
      const nextDays = prev.days.map((d, dI) => {
        if (dI !== dayIdx) return d;
        return {
          ...d,
          exercises: d.exercises.filter((ex) => ex.id !== itemId),
        };
      });
      return {
        ...prev,
        days: nextDays,
        weeklyMetrics: calculateRoutineMetrics(nextDays, prev.profile),
      };
    });
  };

  const handleAddWorkoutLog = (params: {
    dateISO: string;
    exerciseId: ExerciseId;
    weightKg: number;
    reps: number;
    sets: number;
    rir: number;
    notes: string;
  }) => {
    const newEntry = createWorkoutLogEntry(params);
    setWorkoutLogs((prev) => [...prev, newEntry]);
  };

  const handleDeleteWorkoutLog = (id: string) => {
    setWorkoutLogs((prev) => prev.filter((item) => item.id !== id));
  };

  const handleQuickLogFromRoutine = (
    exerciseId: ExerciseId,
    weightKg: number,
    reps: number,
    sets: number,
    rir: number
  ) => {
    const newEntry = createWorkoutLogEntry({
      dateISO: '2026-11-18',
      exerciseId,
      weightKg,
      reps,
      sets,
      rir,
      notes: 'Serie registrada desde Mi Rutina Activa',
    });
    setWorkoutLogs((prev) => [...prev, newEntry]);
    setActiveExerciseId(exerciseId);
    setActiveOverlay('progress');
  };

  const activeDef = EXERCISE_CATALOG[activeExerciseId];
  const repPct = Math.round(livePose.repProgress * 100);

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-[#090D16] text-slate-100 select-none"
      data-exercise={activeExerciseId}
      data-phase={livePose.phaseName}
    >
      {/* Full-Viewport 3D Biomechanical WebGL Scene */}
      <BiomechanicalCanvas
        exerciseId={activeExerciseId}
        isPlaying={isPlaying}
        playbackSpeed={playbackSpeed}
        manualRepProgress={manualRepProgress}
        cameraPreset={cameraPreset}
        cameraTriggerCount={cameraTriggerCount}
        showMuscleMap={showMuscleMap}
        showForceVectors={showForceVectors}
        showBarPath={showBarPath}
        onPoseSample={handlePoseSample}
      />

      {/* TOP BAR CONTRACT: Strictly 3 zones separated by gap-8 */}
      <header className="relative z-20 flex items-center justify-between gap-8 px-6 py-3.5 bg-[#090D16]/95 border-b border-slate-800/90">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#studio"
          onClick={(e) => {
            e.preventDefault();
            setActiveOverlay('none');
          }}
          className="text-xl font-display font-bold tracking-wider text-white whitespace-nowrap shrink-0"
        >
          KINESIS 3D
        </a>

        {/* Zone 2: 4 concise single-line navigation links */}
        <nav
          aria-label="Navegación principal"
          className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-300"
        >
          <a
            href="#laboratorio"
            onClick={(e) => {
              e.preventDefault();
              setActiveOverlay('none');
            }}
            className={`hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              activeOverlay === 'none' ? 'text-amber-400 underline' : ''
            }`}
          >
            Laboratorio 3D
          </a>
          <a
            href="#mi-rutina"
            onClick={(e) => {
              e.preventDefault();
              setActiveOverlay('routine');
            }}
            className={`hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              activeOverlay === 'routine' ? 'text-amber-400 underline' : ''
            }`}
          >
            Mi Rutina ({routine.days.length} Días)
          </a>
          <a
            href="#progreso"
            onClick={(e) => {
              e.preventDefault();
              setActiveOverlay('progress');
            }}
            className={`hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              activeOverlay === 'progress' ? 'text-amber-400 underline' : ''
            }`}
          >
            Progreso ({workoutLogs.length})
          </a>
          <a
            href="#guia-tecnica"
            onClick={(e) => {
              e.preventDefault();
              setActiveOverlay('guide');
            }}
            className={`hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              activeOverlay === 'guide' ? 'text-amber-400 underline' : ''
            }`}
          >
            Entrenador y Guía
          </a>
          <a
            href="#catalogo-3d"
            onClick={(e) => {
              e.preventDefault();
              setActiveOverlay('catalog');
            }}
            className={`hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
              activeOverlay === 'catalog' ? 'text-amber-400 underline' : ''
            }`}
          >
            Catálogo 3D
          </a>
        </nav>

        {/* Zone 3: 1 primary action CTA */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setActiveOverlay('designer')}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-500 rounded-lg hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0"
          >
            Diseñar Rutina
          </button>
        </div>
      </header>

      {/* MINIMAL TOP-LEFT SPEC & BIOMECHANICAL TELEMETRY BADGE (Non-occluding center viewport) */}
      {!isDockCollapsed && (
        <aside
          aria-label="Telemetría biomecánica del ejercicio actual"
          className="fixed top-16 left-5 z-10 w-[min(390px,90vw)] rounded-xl bg-[#0F172A]/95 border border-slate-800 p-4 shadow-xl pointer-events-auto"
        >
          {/* Unboxed Metadata Line (Zero-Pill Discipline) */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 flex-wrap">
            <span className="text-amber-400 font-medium">{activeDef.category}</span>
            <span aria-hidden="true">·</span>
            <span>{activeDef.equipmentLabel}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">Tempo {activeDef.tempo}</span>
          </div>

          <h1 className="text-xl font-display font-bold tracking-tight text-white mt-0.5">
            {activeDef.name}
          </h1>

          {/* Active Muscles Legend */}
          <div className="mt-1.5 flex items-center gap-3 text-xs">
            <span className="text-slate-400">
              Primarios:{' '}
              <strong className="text-red-400 font-medium">
                {activeDef.primaryMuscles.map((m) => MUSCLE_LABELS[m]).join(', ')}
              </strong>
            </span>
            <span aria-hidden="true" className="text-slate-600">
              /
            </span>
            <span className="text-slate-400">
              Sinergistas:{' '}
              <strong className="text-sky-400 font-medium">
                {activeDef.secondaryMuscles.map((m) => MUSCLE_LABELS[m]).join(', ')}
              </strong>
            </span>
          </div>

          {/* Live Phase & Tabular Joint Angles */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/90 grid grid-cols-4 gap-2 text-center">
            <div className="bg-[#090D16] rounded-lg py-1.5 px-2 border border-slate-800/80">
              <span className="block text-[11px] text-slate-400">Rodilla</span>
              <span className="font-mono text-xs font-semibold text-white">
                {livePose.jointAnglesDeg.knee}°
              </span>
            </div>
            <div className="bg-[#090D16] rounded-lg py-1.5 px-2 border border-slate-800/80">
              <span className="block text-[11px] text-slate-400">Cadera</span>
              <span className="font-mono text-xs font-semibold text-white">
                {livePose.jointAnglesDeg.hip}°
              </span>
            </div>
            <div className="bg-[#090D16] rounded-lg py-1.5 px-2 border border-slate-800/80">
              <span className="block text-[11px] text-slate-400">Codo</span>
              <span className="font-mono text-xs font-semibold text-white">
                {livePose.jointAnglesDeg.elbow}°
              </span>
            </div>
            <div className="bg-[#090D16] rounded-lg py-1.5 px-2 border border-slate-800/80">
              <span className="block text-[11px] text-slate-400">Tronco</span>
              <span className="font-mono text-xs font-semibold text-sky-400">
                {livePose.jointAnglesDeg.spineInclination}°
              </span>
            </div>
          </div>

          {/* Real-Time Phase Execution Cue */}
          <div className="mt-2.5 pt-2 border-t border-slate-800/90">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-amber-400">
                Fase {livePose.phaseName}
              </span>
              <span className="font-mono text-slate-400">Ciclo {repPct}%</span>
            </div>
            <p className="text-xs text-slate-300 mt-1 leading-snug">
              {livePose.phaseCue}
            </p>
          </div>

          {/* Quick drawer buttons for mobile & instant inspection */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/90 grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => setActiveOverlay('guide')}
              className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-medium bg-slate-800/90 text-slate-200 hover:bg-slate-700 transition-colors whitespace-nowrap"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Entrenador</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveOverlay('routine')}
              className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-medium bg-slate-800/90 text-slate-200 hover:bg-slate-700 transition-colors whitespace-nowrap"
            >
              <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Mi Rutina</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveOverlay('progress')}
              className="flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-medium bg-slate-800/90 text-slate-200 hover:bg-slate-700 transition-colors whitespace-nowrap"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Progreso</span>
            </button>
          </div>
        </aside>
      )}

      {/* UNIFIED COLLAPSIBLE BOTTOM CONTROL DOCK (Zero side-panel clutter, solid rgba surface) */}
      <div
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-10 w-[min(940px,95vw)] flex flex-col items-center pointer-events-auto"
        role="region"
        aria-label="Controles de animación y cámara 3D"
      >
        {/* Collapse / Expand Cinema Mode Toggle Tab */}
        <button
          type="button"
          onClick={() => setIsDockCollapsed((prev) => !prev)}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-t-lg bg-[#0F172A] border border-b-0 border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors whitespace-nowrap"
        >
          {isDockCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
              <span>Mostrar Controles 3D (H)</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
              <span>Ocultar Controles · Modo Cine (H)</span>
            </>
          )}
        </button>

        {/* Main Dock Body */}
        {!isDockCollapsed && (
          <div className="w-full rounded-xl bg-[#0F172A]/95 border border-slate-800 p-3.5 shadow-2xl space-y-2.5">
            {/* Row 1: All 8 3D Exercises visible at a glance in a 4x2 grid without horizontal clipping */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {Object.values(EXERCISE_CATALOG).map((ex) => {
                const isSelected = ex.id === activeExerciseId;
                return (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => handleSelectExercise(ex.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors truncate ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-semibold'
                        : 'bg-[#090D16] text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    {ex.name}
                  </button>
                );
              })}
            </div>

            {/* Row 2: Scrubber, Playback Speed, Camera Angles & Telemetry Toggles */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/80">
              {/* Play/Pause & Repetition Phase Scrubber */}
              <div className="flex items-center gap-2.5 flex-1 min-w-[230px]">
                <button
                  type="button"
                  onClick={() => {
                    if (manualRepProgress !== null) {
                      setManualRepProgress(null);
                      setIsPlaying(true);
                    } else {
                      setIsPlaying((p) => !p);
                    }
                  }}
                  aria-label={isPlaying ? 'Pausar animación 3D' : 'Reproducir animación 3D'}
                  className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center hover:bg-amber-400 transition-colors shrink-0"
                >
                  {isPlaying && manualRepProgress === null ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>

                <div className="flex-1 flex flex-col">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-0.5">
                    <label htmlFor="rep-phase-scrubber">
                      Fase: <strong className="text-white">{livePose.phaseName}</strong>
                    </label>
                    <span className="font-mono">{repPct}%</span>
                  </div>
                  <input
                    id="rep-phase-scrubber"
                    type="range"
                    min={0}
                    max={100}
                    value={
                      manualRepProgress !== null
                        ? Math.round(manualRepProgress * 100)
                        : repPct
                    }
                    onChange={(e) => {
                      const val = Number(e.target.value) / 100;
                      setIsPlaying(false);
                      setManualRepProgress(val);
                    }}
                    className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Speed Selectors */}
                <div className="flex items-center gap-1 bg-[#090D16] p-1 rounded-lg border border-slate-800">
                  {[0.5, 1, 1.5].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => {
                        setPlaybackSpeed(spd);
                        setManualRepProgress(null);
                        setIsPlaying(true);
                      }}
                      className={`px-2 py-1 rounded text-[11px] font-mono transition-colors whitespace-nowrap ${
                        playbackSpeed === spd
                          ? 'bg-slate-800 text-amber-400 font-semibold'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Camera Angle Presets */}
              <div className="flex items-center gap-1 bg-[#090D16] p-1 rounded-lg border border-slate-800">
                <Camera className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5 shrink-0" />
                {(
                  [
                    { id: 'isometric', label: '45°' },
                    { id: 'lateral', label: 'Sagital' },
                    { id: 'frontal', label: 'Frontal' },
                    { id: 'overhead', label: 'Cenital' },
                  ] as const
                ).map((cam) => (
                  <button
                    key={cam.id}
                    type="button"
                    onClick={() => {
                      setCameraPreset(cam.id);
                      setCameraTriggerCount((c) => c + 1);
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                      cameraPreset === cam.id
                        ? 'bg-amber-500 text-slate-950 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cam.label}
                  </button>
                ))}
              </div>

              {/* 3D Biomechanical Layer Toggles */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowMuscleMap((v) => !v)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                    showMuscleMap
                      ? 'bg-red-500/15 border-red-500/60 text-red-300'
                      : 'bg-[#090D16] border-slate-800 text-slate-400'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Músculos</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForceVectors((v) => !v);
                    setShowBarPath((v) => !v);
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
                    showForceVectors
                      ? 'bg-sky-500/15 border-sky-500/60 text-sky-300'
                      : 'bg-[#090D16] border-slate-800 text-slate-400'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Vectores</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* OVERLAY 1: Routine & Biometric Profile Configurator Modal */}
      <RoutineDesignerModal
        isOpen={activeOverlay === 'designer'}
        initialProfile={routine.profile}
        onClose={() => setActiveOverlay('none')}
        onGenerateRoutine={handleGenerateRoutine}
      />

      {/* OVERLAY 2: Active Multi-Day Routine & Set Logger Drawer */}
      <ActiveRoutineDrawer
        isOpen={activeOverlay === 'routine'}
        routine={routine}
        selectedDayIndex={selectedDayIndex}
        activeExerciseId={activeExerciseId}
        onSelectDay={setSelectedDayIndex}
        onInspectExercise3D={(exId) => handleSelectExercise(exId)}
        onToggleSetComplete={handleToggleSetComplete}
        onUpdateLoadKg={handleUpdateLoadKg}
        onAddExerciseToDay={handleAddExerciseToDay}
        onRemoveExerciseFromDay={handleRemoveExerciseFromDay}
        onQuickLogToHistory={handleQuickLogFromRoutine}
        onOpenProfileModal={() => setActiveOverlay('designer')}
        onClose={() => setActiveOverlay('none')}
      />

      {/* OVERLAY 3: Progress Tracker & Historical Analytics Drawer */}
      <ProgressTrackerDrawer
        isOpen={activeOverlay === 'progress'}
        logs={workoutLogs}
        activeExerciseId={activeExerciseId}
        userGoal={routine.profile.goal}
        onAddLog={handleAddWorkoutLog}
        onDeleteLog={handleDeleteWorkoutLog}
        onInspectExercise3D={(exId) => handleSelectExercise(exId)}
        onClose={() => setActiveOverlay('none')}
      />

      {/* OVERLAY 4 & 5: Technique Guide, Personal Trainer & 3D Catalog Drawer */}
      <TechniqueGuideDrawer
        isOpen={activeOverlay === 'guide' || activeOverlay === 'catalog'}
        initialTab={activeOverlay === 'catalog' ? 'catalog' : 'guide'}
        activeExerciseId={activeExerciseId}
        onSelectExercise3D={handleSelectExercise}
        onClose={() => setActiveOverlay('none')}
      />
    </div>
  );
}
