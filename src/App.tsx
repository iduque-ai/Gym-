/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Play,
  Pause,
  Camera,
  Activity,
  Compass,
  Maximize2,
  Minimize2,
  Dumbbell,
  Calendar,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import {
  calculateBiomechanicalPose,
  calculateRoutineMetrics,
  EXERCISE_CATALOG,
  generateRoutine,
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
import { TechniqueLabPanel } from './components/TechniqueLabPanel';
import { RoutinePanel } from './components/RoutinePanel';
import { ProgressPanel } from './components/ProgressPanel';
import { CoachPanel } from './components/CoachPanel';

const INITIAL_PROFILE: UserProfile = {
  weightKg: 78,
  heightCm: 178,
  age: 28,
  level: 'intermedio',
  goal: 'hipertrofia',
  daysPerWeek: 4,
  equipment: 'gimnasio_completo',
};

type WorkspaceTab = 'technique' | 'routine' | 'progress' | 'coach';

const ROUTINE_STORAGE_KEY = 'kinesis3d_routine_v1';
const LOGS_STORAGE_KEY = 'kinesis3d_workout_logs_v1';

function loadInitialRoutine(): GeneratedRoutine {
  try {
    const saved = window.localStorage.getItem(ROUTINE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as GeneratedRoutine;
      if (
        parsed &&
        parsed.profile &&
        Array.isArray(parsed.days) &&
        parsed.days.length > 0 &&
        parsed.days.every((d) =>
          d.exercises.every((ex) => Boolean(EXERCISE_CATALOG[ex.exerciseId]))
        )
      ) {
        return {
          ...parsed,
          weeklyMetrics: calculateRoutineMetrics(parsed.days, parsed.profile),
        };
      }
    }
  } catch {
    // fallback to default routine
  }
  return generateRoutine(INITIAL_PROFILE);
}

export default function App() {
  const [routine, setRoutine] = useState<GeneratedRoutine>(loadInitialRoutine);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [activeExerciseId, setActiveExerciseId] = useState<ExerciseId>('back_squat');

  // Workspace Navigation & Designer Modal
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('technique');
  const [isDesignerOpen, setIsDesignerOpen] = useState<boolean>(false);
  const [isCinemaMode, setIsCinemaMode] = useState<boolean>(false);

  // 3D Playback & Layer Controls
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [manualRepProgress, setManualRepProgress] = useState<number | null>(null);
  const [cameraPreset, setCameraPreset] = useState<CameraPresetId>('isometric');
  const [cameraTriggerCount, setCameraTriggerCount] = useState<number>(0);
  const [showMuscleMap, setShowMuscleMap] = useState<boolean>(true);
  const [showForceVectors, setShowForceVectors] = useState<boolean>(true);
  const [showBarPath, setShowBarPath] = useState<boolean>(true);

  // Persistent Workout Progress History (weight, reps, sets, 1RM, volume)
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLogEntry[]>(() => {
    try {
      const saved = window.localStorage.getItem(LOGS_STORAGE_KEY);
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
      window.localStorage.setItem(ROUTINE_STORAGE_KEY, JSON.stringify(routine));
    } catch {
      // ignore storage errors
    }
  }, [routine]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(workoutLogs));
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

  // Keyboard shortcuts ('Escape' closes modal/cinema mode)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

      if (e.key === 'Escape') {
        setIsDesignerOpen(false);
        setIsCinemaMode(false);
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
    if (window.innerWidth < 1024) {
      setActiveTab('technique');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGenerateRoutine = (newProfile: UserProfile) => {
    const generated = generateRoutine(newProfile);
    setRoutine(generated);
    setSelectedDayIndex(0);
    const firstEx = generated.days[0]?.exercises[0]?.exerciseId || 'back_squat';
    handleSelectExercise(firstEx);
    setIsDesignerOpen(false);
    setIsCinemaMode(false);
    setActiveTab('routine');
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
          targetLoadKg: Math.max(
            10,
            Math.round(
              (prev.profile.weightKg * def.bodyweightRatioIntermedio) / 2.5
            ) * 2.5
          ),
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
    const todayISO = new Date().toISOString().slice(0, 10);
    const newEntry = createWorkoutLogEntry({
      dateISO: todayISO,
      exerciseId,
      weightKg,
      reps,
      sets,
      rir,
      notes: 'Serie registrada desde Mi Rutina',
    });
    setWorkoutLogs((prev) => [...prev, newEntry]);
  };

  const activeDef = EXERCISE_CATALOG[activeExerciseId];
  const repPct = Math.round(livePose.repProgress * 100);

  const navItems: {
    id: WorkspaceTab;
    label: string;
    mobileLabel: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'technique',
      label: 'Técnica',
      mobileLabel: 'Técnica',
      icon: <Dumbbell className="w-4 h-4" />,
    },
    {
      id: 'routine',
      label: `Rutina (${routine.days.length}d)`,
      mobileLabel: 'Rutina',
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      id: 'progress',
      label: `Progreso (${workoutLogs.length})`,
      mobileLabel: 'Progreso',
      icon: <TrendingUp className="w-4 h-4" />,
    },
    {
      id: 'coach',
      label: 'Guía',
      mobileLabel: 'Guía',
      icon: <ShieldCheck className="w-4 h-4" />,
    },
  ];

  return (
    <div
      className="min-h-[100dvh] lg:h-screen w-full max-w-full overflow-x-clip flex flex-col bg-[#090D16] text-slate-100 lg:overflow-hidden"
      data-exercise={activeExerciseId}
      data-phase={livePose.phaseName}
    >
      {/* TOP BAR CONTRACT: Strictly 3 zones separated by gap-6/gap-8 */}
      <header className="sticky top-0 lg:static z-30 h-[52px] sm:h-auto w-full max-w-full flex items-center justify-between gap-3 sm:gap-8 px-3.5 sm:px-6 py-2 sm:py-3 bg-[#090D16]/95 lg:bg-[#090D16] backdrop-blur-md lg:backdrop-blur-none border-b border-slate-800 shrink-0">
        {/* Zone 1: Wordmark */}
        <a
          href="#studio"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('technique');
            setIsCinemaMode(false);
          }}
          className="text-xl font-display font-bold tracking-wider text-white whitespace-nowrap shrink-0"
        >
          KINESIS 3D
        </a>

        {/* Zone 2: Desktop Navigation Tabs */}
        <nav
          aria-label="Navegación principal"
          className="hidden lg:flex items-center gap-7 text-xs font-medium text-slate-300"
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveTab(item.id);
                setIsCinemaMode(false);
              }}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === item.id && !isCinemaMode
                  ? 'text-amber-400 border-b-2 border-amber-400 font-semibold'
                  : 'text-slate-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: Primary CTA */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => setIsDesignerOpen(true)}
            className="min-h-[40px] sm:min-h-0 px-3.5 sm:px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-500 rounded-lg hover:bg-amber-400 active:scale-[0.98] transition-all whitespace-nowrap shrink-0"
          >
            Crear Rutina
          </button>
        </div>
      </header>

      {/* MAIN SPLIT STUDIO WORKSPACE */}
      <main
        className={`flex-1 w-full max-w-full min-w-0 overflow-x-clip flex flex-col lg:flex-row lg:min-h-0 lg:overflow-hidden ${
          !isCinemaMode ? 'pb-[calc(64px+env(safe-area-inset-bottom))] lg:pb-0' : ''
        }`}
      >
        {/* LEFT / TOP STAGE: Dedicated Unobstructed 3D Biomechanical Viewport */}
        <section
          aria-label="Visor biomecánico 3D"
          className={`${
            isCinemaMode
              ? 'fixed inset-0 z-40 lg:static lg:z-auto flex'
              : activeTab === 'technique'
              ? 'flex'
              : 'hidden lg:flex'
          } w-full max-w-full min-w-0 overflow-x-clip lg:flex-1 flex-col bg-[#090D16] lg:h-full`}
        >
          {/* Compact Single-Row Active Exercise & Phase Strip (Never overlaps 3D athlete) */}
          <div className="flex items-center justify-between gap-2.5 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-[#0B111E] border-b border-slate-800/90 shrink-0">
            <div className="min-w-0 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <h1 className="text-base sm:text-lg font-display font-bold tracking-tight text-white truncate max-w-[205px] sm:max-w-none">
                {activeDef.name}
              </h1>
              <span aria-hidden="true" className="text-slate-600 hidden sm:inline">
                ·
              </span>
              <span className="text-xs font-medium text-amber-400 whitespace-nowrap">
                {livePose.phaseName}
              </span>
              <span aria-hidden="true" className="text-slate-600">
                ·
              </span>
              <span className="text-xs font-mono text-slate-400 whitespace-nowrap">
                {repPct}%
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsCinemaMode((v) => !v)}
              aria-label={
                isCinemaMode
                  ? 'Salir de pantalla completa 3D'
                  : 'Expandir visor 3D a pantalla completa'
              }
              className="flex items-center gap-1.5 min-h-[38px] sm:min-h-0 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#0F172A] border border-slate-800 text-slate-300 hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              {isCinemaMode ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Salir</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ampliar</span>
                </>
              )}
            </button>
          </div>

          {/* 3D WebGL Canvas Container (100% unobstructed from head to platform) */}
          <div
            className={`relative w-full select-none ${
              isCinemaMode
                ? 'flex-1 min-h-0'
                : 'h-[270px] sm:h-[360px] lg:flex-1 lg:h-auto lg:min-h-0'
            }`}
          >
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
          </div>

          {/* Live Phase Execution Cue Strip (Cleanly below canvas, zero 3D occlusion) */}
          <div className="px-3.5 sm:px-4 py-2 bg-[#0B111E] border-t border-slate-800/80 text-xs text-slate-300 shrink-0 leading-snug">
            <span className="font-semibold text-amber-400 mr-1.5">
              {livePose.phaseName}:
            </span>
            <span>{livePose.phaseCue}</span>
          </div>

          {/* Slim Playback, Camera & Biomechanical Layer Controls Bar */}
          <div
            role="region"
            aria-label="Controles de animación y cámara 3D"
            className={`px-3 sm:px-4 py-2.5 bg-[#0F172A] border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5 shrink-0 ${
              isCinemaMode ? 'pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:pb-2.5' : ''
            }`}
          >
            {/* Play/Pause, Scrubber & Speed */}
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
                aria-label={
                  isPlaying && manualRepProgress === null
                    ? 'Pausar animación 3D'
                    : 'Reproducir animación 3D'
                }
                className="w-11 h-11 sm:w-9 sm:h-9 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center hover:bg-amber-400 active:scale-95 transition-all shrink-0"
              >
                {isPlaying && manualRepProgress === null ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </button>

              <div className="flex-1 min-w-[90px] py-2">
                <label htmlFor="rep-phase-scrubber" className="sr-only">
                  Progreso de la repetición
                </label>
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
                  className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-0.5 bg-[#090D16] p-0.5 rounded-lg border border-slate-800 shrink-0">
                {[0.5, 1, 1.5].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => {
                      setPlaybackSpeed(spd);
                      setManualRepProgress(null);
                      setIsPlaying(true);
                    }}
                    className={`min-h-[38px] sm:min-h-0 px-2 sm:px-1.5 py-1 rounded text-[11px] font-mono transition-colors ${
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

            {/* Camera Angle Presets & Layer Toggles (Wraps cleanly without horizontal scroll) */}
            <div className="w-full lg:w-auto flex flex-wrap items-center gap-2 min-w-0">
              <div className="flex items-center gap-0.5 bg-[#090D16] p-0.5 rounded-lg border border-slate-800 max-w-full">
                <Camera className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5 shrink-0 hidden sm:block" />
                {(
                  [
                    { id: 'isometric', label: '45°' },
                    { id: 'lateral', label: 'Perfil' },
                    { id: 'frontal', label: 'Frontal' },
                    { id: 'overhead', label: 'Arriba' },
                  ] as const
                ).map((cam) => (
                  <button
                    key={cam.id}
                    type="button"
                    onClick={() => {
                      setCameraPreset(cam.id);
                      setCameraTriggerCount((c) => c + 1);
                    }}
                    className={`min-h-[38px] sm:min-h-0 px-2 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      cameraPreset === cam.id
                        ? 'bg-amber-500 text-slate-950 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cam.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowMuscleMap((v) => !v)}
                  aria-pressed={showMuscleMap}
                  className={`flex items-center gap-1 min-h-[38px] sm:min-h-0 px-2.5 sm:px-2 py-1 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
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
                  aria-pressed={showForceVectors}
                  className={`flex items-center gap-1 min-h-[38px] sm:min-h-0 px-2.5 sm:px-2 py-1 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
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
        </section>

        {/* RIGHT SIDE WORKSPACE PANEL (Integrated Side-by-Side on Desktop, Dedicated Full View on Mobile) */}
        {!isCinemaMode && (
          <aside
            aria-label="Panel de entrenamiento, rutina y progreso"
            className="w-full max-w-full min-w-0 overflow-x-clip lg:w-[440px] xl:w-[490px] bg-[#0F172A] lg:border-l border-slate-800 lg:h-full lg:overflow-y-auto p-3.5 sm:p-5 shrink-0"
          >
            {activeTab === 'technique' && (
              <TechniqueLabPanel
                activeExerciseId={activeExerciseId}
                livePose={livePose}
                onSelectExercise3D={handleSelectExercise}
              />
            )}
            {activeTab === 'routine' && (
              <RoutinePanel
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
                onOpenProfileModal={() => setIsDesignerOpen(true)}
              />
            )}
            {activeTab === 'progress' && (
              <ProgressPanel
                logs={workoutLogs}
                activeExerciseId={activeExerciseId}
                userGoal={routine.profile.goal}
                onAddLog={handleAddWorkoutLog}
                onDeleteLog={handleDeleteWorkoutLog}
                onInspectExercise3D={(exId) => handleSelectExercise(exId)}
              />
            )}
            {activeTab === 'coach' && (
              <CoachPanel
                activeExerciseId={activeExerciseId}
                routine={routine}
                onInspectExercise3D={(exId) => handleSelectExercise(exId)}
              />
            )}
          </aside>
        )}
      </main>

      {/* MOBILE FIXED THUMB-ZONE BOTTOM NAVIGATION BAR (<= 15% sticky cap with top bar) */}
      {!isCinemaMode && (
        <nav
          role="tablist"
          aria-label="Navegación móvil"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0B111E]/95 backdrop-blur-md border-t border-slate-800 pb-[env(safe-area-inset-bottom)]"
        >
          <div className="grid grid-cols-4 h-[60px]">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-label={item.label}
                  onClick={() => {
                    setActiveTab(item.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`flex flex-col items-center justify-center gap-1 min-h-[44px] px-1 text-[11px] font-medium transition-colors ${
                    isActive
                      ? 'text-amber-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-8 h-6 rounded-md transition-colors ${
                      isActive ? 'bg-amber-500/15' : ''
                    }`}
                  >
                    {item.icon}
                  </span>
                  <span className="whitespace-nowrap truncate max-w-full">
                    {item.mobileLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* ROUTINE & BIOMETRIC PROFILE DESIGNER MODAL */}
      <RoutineDesignerModal
        isOpen={isDesignerOpen}
        initialProfile={routine.profile}
        onClose={() => setIsDesignerOpen(false)}
        onGenerateRoutine={handleGenerateRoutine}
      />
    </div>
  );
}
