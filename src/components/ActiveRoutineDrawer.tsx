import React, { useState } from 'react';
import {
  X,
  Eye,
  Plus,
  Check,
  Sliders,
  Trash2,
} from 'lucide-react';
import {
  EXERCISE_CATALOG,
  MUSCLE_LABELS,
  type ExerciseId,
  type GeneratedRoutine,
  type MuscleGroup,
} from '../utils/routineEngine';

export interface ActiveRoutineDrawerProps {
  isOpen: boolean;
  routine: GeneratedRoutine;
  selectedDayIndex: number;
  activeExerciseId: ExerciseId;
  onSelectDay: (index: number) => void;
  onInspectExercise3D: (exerciseId: ExerciseId) => void;
  onToggleSetComplete: (dayIndex: number, itemId: string, setIndex: number) => void;
  onUpdateLoadKg: (dayIndex: number, itemId: string, newLoadKg: number) => void;
  onAddExerciseToDay: (dayIndex: number, exerciseId: ExerciseId) => void;
  onRemoveExerciseFromDay: (dayIndex: number, itemId: string) => void;
  onQuickLogToHistory: (exerciseId: ExerciseId, weightKg: number, reps: number, sets: number, rir: number) => void;
  onOpenProfileModal: () => void;
  onClose: () => void;
}

export const ActiveRoutineDrawer: React.FC<ActiveRoutineDrawerProps> = ({
  isOpen,
  routine,
  selectedDayIndex,
  activeExerciseId,
  onSelectDay,
  onInspectExercise3D,
  onToggleSetComplete,
  onUpdateLoadKg,
  onAddExerciseToDay,
  onRemoveExerciseFromDay,
  onQuickLogToHistory,
  onOpenProfileModal,
  onClose,
}) => {
  const [exerciseToAdd, setExerciseToAdd] = useState<ExerciseId>('bulgarian_split_squat');

  if (!isOpen) return null;

  const currentDay = routine.days[selectedDayIndex] || routine.days[0];
  const { weeklyMetrics, profile } = routine;
  const completionPct =
    weeklyMetrics.totalSets > 0
      ? Math.round((weeklyMetrics.completedSets / weeklyMetrics.totalSets) * 100)
      : 0;

  const topMuscles = (Object.entries(weeklyMetrics.muscleDistribution) as [MuscleGroup, number][])
    .filter(([, sets]) => sets > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div
      className="fixed inset-0 z-30 flex justify-end bg-black/65"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-routine-title"
    >
      <div className="w-full max-w-2xl h-full bg-[#0F172A] border-l border-slate-800 flex flex-col text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{profile.weightKg} kg</span>
              <span aria-hidden="true">·</span>
              <span>{profile.heightCm} cm</span>
              <span aria-hidden="true">·</span>
              <span>{profile.age} años</span>
              <span aria-hidden="true">·</span>
              <span className="text-amber-400 capitalize">{profile.goal}</span>
            </div>
            <h2
              id="drawer-routine-title"
              className="text-2xl font-display font-bold tracking-tight text-white mt-0.5"
            >
              {routine.title}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">{routine.subtitle}</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenProfileModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors whitespace-nowrap"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Editar Datos</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar panel de rutina"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Quantitative Weekly Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-lg bg-[#090D16] border border-slate-800">
              <div className="text-xs text-slate-400">Volumen Semanal</div>
              <div className="text-lg font-mono font-semibold text-white mt-0.5">
                {weeklyMetrics.estimatedWeeklyVolumeKg.toLocaleString('es-ES')} kg
              </div>
            </div>
            <div className="p-3.5 rounded-lg bg-[#090D16] border border-slate-800">
              <div className="text-xs text-slate-400">Series Completadas</div>
              <div className="text-lg font-mono font-semibold text-amber-400 mt-0.5">
                {weeklyMetrics.completedSets} / {weeklyMetrics.totalSets} ({completionPct}%)
              </div>
            </div>
            <div className="p-3.5 rounded-lg bg-[#090D16] border border-slate-800">
              <div className="text-xs text-slate-400">Gasto por Sesión</div>
              <div className="text-lg font-mono font-semibold text-white mt-0.5">
                ~{weeklyMetrics.estimatedKcalPerSession} kcal
              </div>
            </div>
            <div className="p-3.5 rounded-lg bg-[#090D16] border border-slate-800">
              <div className="text-xs text-slate-400">Duración Sesión</div>
              <div className="text-lg font-mono font-semibold text-sky-400 mt-0.5">
                {currentDay.estimatedDurationMin} min
              </div>
            </div>
          </div>

          {/* Muscle Volume Distribution */}
          <div className="p-4 rounded-lg bg-[#090D16] border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
              <span>Distribución de Series Efectivas Semanales por Grupo Muscular</span>
              <span className="font-mono">Series / Semana</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {topMuscles.map(([muscle, sets]) => (
                <div key={muscle} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 truncate">{MUSCLE_LABELS[muscle]}</span>
                    <span className="font-mono text-amber-400 font-semibold">{sets}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${Math.min(100, (sets / 20) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Day Selector Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#090D16] rounded-lg border border-slate-800 overflow-x-auto">
            {routine.days.map((day, idx) => (
              <button
                key={day.dayNumber}
                type="button"
                onClick={() => onSelectDay(idx)}
                className={`px-3.5 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  selectedDayIndex === idx
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sesión {day.dayNumber}
              </button>
            ))}
          </div>

          {/* Active Day Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-semibold text-white">{currentDay.title}</h3>
              <p className="text-xs text-slate-400">Enfoque: {currentDay.focusLabel}</p>
            </div>
          </div>

          {/* Exercise List for Selected Day */}
          <div className="space-y-4">
            {currentDay.exercises.map((item, idx) => {
              const def = EXERCISE_CATALOG[item.exerciseId];
              const isSelectedIn3D = activeExerciseId === item.exerciseId;

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-xl border transition-colors ${
                    isSelectedIn3D
                      ? 'bg-[#131D31] border-amber-500/70'
                      : 'bg-[#090D16] border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="font-mono text-amber-400">0{idx + 1}.</span>
                        <span>{def.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{def.equipmentLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">Tempo {def.tempo}</span>
                      </div>
                      <h4 className="text-base font-semibold text-white mt-1">{def.name}</h4>
                      <p className="text-xs text-slate-400 mt-1">{item.notes}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          const parsedReps = parseInt(item.reps.split('-')[0], 10) || 8;
                          onQuickLogToHistory(
                            item.exerciseId,
                            item.targetLoadKg,
                            parsedReps,
                            item.sets,
                            item.rir
                          );
                        }}
                        className="px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 text-emerald-400 hover:bg-slate-700 transition-colors whitespace-nowrap"
                      >
                        + Registrar Progreso
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onInspectExercise3D(item.exerciseId);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors whitespace-nowrap"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Técnica 3D</span>
                      </button>
                      {currentDay.exercises.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onRemoveExerciseFromDay(selectedDayIndex, item.id)}
                          aria-label={`Eliminar ${def.name} de la sesión`}
                          className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Prescription Metrics & Load Editor */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-800/80 text-xs">
                    <div>
                      <span className="text-slate-400 block">Prescripción</span>
                      <span className="font-mono font-semibold text-white">
                        {item.sets} series × {item.reps} reps
                      </span>
                    </div>
                    <div>
                      <label
                        htmlFor={`load-${item.id}`}
                        className="text-slate-400 block"
                      >
                        Carga Objetivo (kg)
                      </label>
                      <input
                        id={`load-${item.id}`}
                        type="number"
                        min={0}
                        max={400}
                        step={2.5}
                        value={item.targetLoadKg}
                        onChange={(e) =>
                          onUpdateLoadKg(
                            selectedDayIndex,
                            item.id,
                            Math.max(0, Number(e.target.value) || 0)
                          )
                        }
                        className="mt-0.5 w-24 rounded bg-slate-900 border border-slate-700 px-2 py-1 font-mono text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 block">Esfuerzo / RIR</span>
                      <span className="font-mono font-semibold text-sky-400">
                        RIR {item.rir} (Descanso {item.restSeconds}s)
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">Registro de Series</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.completedSets.map((done, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => onToggleSetComplete(selectedDayIndex, item.id, sIdx)}
                            aria-label={`Marcar serie ${sIdx + 1} de ${def.name}`}
                            className={`w-7 h-7 rounded-md font-mono text-xs flex items-center justify-center border transition-colors ${
                              done
                                ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-bold'
                                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                            }`}
                          >
                            {done ? <Check className="w-3.5 h-3.5" /> : sIdx + 1}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add Exercise to Current Day */}
          <div className="p-4 rounded-xl bg-[#090D16] border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex-1">
              <label
                htmlFor="select-add-exercise"
                className="block text-xs font-medium text-slate-400 mb-1"
              >
                Añadir Ejercicio con Modelo 3D a esta Sesión
              </label>
              <select
                id="select-add-exercise"
                value={exerciseToAdd}
                onChange={(e) => setExerciseToAdd(e.target.value as ExerciseId)}
                className="w-full rounded-lg bg-[#0F172A] border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                {Object.values(EXERCISE_CATALOG).map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} ({ex.category} · {ex.equipmentLabel})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => onAddExerciseToDay(selectedDayIndex, exerciseToAdd)}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700 transition-colors whitespace-nowrap sm:mt-5"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir a Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
