import React, { useState } from 'react';
import {
  Eye,
  Plus,
  Check,
  Sliders,
  Trash2,
  BookmarkCheck,
} from 'lucide-react';
import {
  EXERCISE_CATALOG,
  type ExerciseId,
  type GeneratedRoutine,
} from '../utils/routineEngine';

export interface RoutinePanelProps {
  routine: GeneratedRoutine;
  selectedDayIndex: number;
  activeExerciseId: ExerciseId;
  onSelectDay: (index: number) => void;
  onInspectExercise3D: (exerciseId: ExerciseId) => void;
  onToggleSetComplete: (dayIndex: number, itemId: string, setIndex: number) => void;
  onUpdateLoadKg: (dayIndex: number, itemId: string, newLoadKg: number) => void;
  onAddExerciseToDay: (dayIndex: number, exerciseId: ExerciseId) => void;
  onRemoveExerciseFromDay: (dayIndex: number, itemId: string) => void;
  onQuickLogToHistory: (
    exerciseId: ExerciseId,
    weightKg: number,
    reps: number,
    sets: number,
    rir: number
  ) => void;
  onOpenProfileModal: () => void;
}

export const RoutinePanel: React.FC<RoutinePanelProps> = ({
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
}) => {
  const [exerciseToAdd, setExerciseToAdd] = useState<ExerciseId>('bulgarian_split_squat');
  const [savedItemId, setSavedItemId] = useState<string | null>(null);

  const currentDay = routine.days[selectedDayIndex] || routine.days[0];
  const { weeklyMetrics, profile } = routine;
  const completionPct =
    weeklyMetrics.totalSets > 0
      ? Math.round((weeklyMetrics.completedSets / weeklyMetrics.totalSets) * 100)
      : 0;

  const equipmentLabels = {
    gimnasio_completo: 'Gimnasio',
    mancuernas_barra: 'Barra y mancuernas',
    peso_corporal: 'Peso corporal',
  } as const;

  return (
    <div className="space-y-4">
      {/* Compact Plan Summary */}
      <div className="p-3.5 rounded-xl bg-[#090D16] border border-slate-800 space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-slate-400">
              <span className="text-amber-400 capitalize font-medium">{profile.goal}</span>
              <span aria-hidden="true">·</span>
              <span>{equipmentLabels[profile.equipment]}</span>
              <span aria-hidden="true">·</span>
              <span>{profile.daysPerWeek} días/sem</span>
            </div>
            <h2 className="text-base sm:text-lg font-display font-bold text-white mt-0.5">
              {routine.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onOpenProfileModal}
            className="flex items-center gap-1.5 min-h-[44px] sm:min-h-0 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Editar</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
          <span className="text-slate-300">
            Completado:{' '}
            <strong className="font-mono text-amber-400">
              {weeklyMetrics.completedSets}/{weeklyMetrics.totalSets} ({completionPct}%)
            </strong>
          </span>
          <span className="font-mono text-slate-400">
            {currentDay.estimatedDurationMin} min ·{' '}
            {weeklyMetrics.estimatedWeeklyVolumeKg.toLocaleString('es-ES')} kg/sem
          </span>
        </div>
      </div>

      {/* Day Selector */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#090D16] rounded-lg border border-slate-800">
        {routine.days.map((day, idx) => (
          <button
            key={day.dayNumber}
            type="button"
            onClick={() => onSelectDay(idx)}
            className={`min-h-[42px] sm:min-h-0 flex-1 min-w-[76px] px-2.5 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              selectedDayIndex === idx
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sesión {day.dayNumber}
          </button>
        ))}
      </div>

      {/* Selected Day Header */}
      <div>
        <h3 className="text-base font-semibold text-white">{currentDay.title}</h3>
        <p className="text-xs text-slate-400">{currentDay.focusLabel}</p>
      </div>

      {/* Exercise Cards */}
      <div className="space-y-3">
        {currentDay.exercises.map((item, idx) => {
          const def = EXERCISE_CATALOG[item.exerciseId];
          const isSelectedIn3D = activeExerciseId === item.exerciseId;
          const isJustSaved = savedItemId === item.id;

          return (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border transition-colors ${
                isSelectedIn3D
                  ? 'bg-[#131D31] border-amber-500/75'
                  : 'bg-[#090D16] border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 flex-wrap">
                    <span className="font-mono text-amber-400">
                      {String(idx + 1).padStart(2, '0')}.
                    </span>
                    <span>{def.equipmentLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono">Tempo {def.tempo}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-white mt-0.5">{def.name}</h4>
                </div>

                {currentDay.exercises.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveExerciseFromDay(selectedDayIndex, item.id)}
                    aria-label={`Eliminar ${def.name} de la sesión`}
                    className="min-w-[40px] min-h-[40px] sm:min-w-0 sm:min-h-0 flex items-center justify-center p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Target & Weight */}
              <div className="grid grid-cols-2 gap-3 mt-2.5 pt-2.5 border-t border-slate-800/80 text-xs items-end">
                <div>
                  <span className="text-slate-400 block">Series y reps</span>
                  <span className="font-mono font-semibold text-white mt-1 block">
                    {item.sets} × {item.reps} · RIR {item.rir}
                  </span>
                </div>
                <div>
                  <label htmlFor={`load-${item.id}`} className="text-slate-400 block">
                    Peso (kg)
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
                    className="mt-1 w-full sm:w-28 min-h-[42px] sm:min-h-0 rounded bg-slate-900 border border-slate-700 px-2.5 py-1.5 font-mono text-base sm:text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Checkable Sets & Actions */}
              <div className="mt-3 flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400 mr-0.5">Series:</span>
                  {item.completedSets.map((done, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() =>
                        onToggleSetComplete(selectedDayIndex, item.id, sIdx)
                      }
                      aria-label={`Marcar serie ${sIdx + 1} de ${def.name}`}
                      className={`w-10 h-10 sm:w-7 sm:h-7 rounded-lg sm:rounded-md font-mono text-xs flex items-center justify-center border transition-colors ${
                        done
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-bold'
                          : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {done ? <Check className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> : sIdx + 1}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
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
                      setSavedItemId(item.id);
                      window.setTimeout(() => {
                        setSavedItemId((cur) => (cur === item.id ? null : cur));
                      }, 2500);
                    }}
                    className={`flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-0 px-3 sm:px-2.5 py-2 sm:py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      isJustSaved
                        ? 'bg-emerald-500/20 border border-emerald-500/60 text-emerald-300'
                        : 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
                    }`}
                  >
                    <BookmarkCheck className="w-3.5 h-3.5" />
                    <span>{isJustSaved ? 'Guardado' : 'Guardar'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onInspectExercise3D(item.exerciseId)}
                    className={`flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-0 px-3 sm:px-2.5 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      isSelectedIn3D
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-amber-500/90 text-slate-950 hover:bg-amber-400'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isSelectedIn3D ? 'En 3D' : 'Ver 3D'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Exercise */}
      <div className="p-3.5 rounded-xl bg-[#090D16] border border-slate-800 space-y-2">
        <label
          htmlFor="select-add-exercise"
          className="block text-xs font-medium text-slate-400"
        >
          Añadir ejercicio
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            id="select-add-exercise"
            value={exerciseToAdd}
            onChange={(e) => setExerciseToAdd(e.target.value as ExerciseId)}
            className="flex-1 min-w-0 max-w-full min-h-[44px] sm:min-h-0 rounded-lg bg-[#0F172A] border border-slate-700 px-3 py-2 text-base sm:text-xs text-white focus:outline-none focus:border-amber-500"
          >
            {Object.values(EXERCISE_CATALOG).map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} ({ex.equipmentLabel})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => onAddExerciseToDay(selectedDayIndex, exerciseToAdd)}
            className="flex items-center justify-center gap-1.5 min-h-[44px] sm:min-h-0 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir</span>
          </button>
        </div>
      </div>
    </div>
  );
};
