import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  PlusCircle,
  Award,
  AlertCircle,
  Trash2,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import {
  EXERCISE_CATALOG,
  type ExerciseId,
  type TrainingGoal,
} from '../utils/routineEngine';
import {
  calculateEntryVolumeKg,
  calculateEstimated1RM,
  calculateOverallProgress,
  getSmartCoachRecommendation,
  summarizeExerciseProgress,
  validateWorkoutLogInput,
  type WorkoutLogEntry,
} from '../utils/progressEngine';

export interface ProgressPanelProps {
  logs: WorkoutLogEntry[];
  activeExerciseId: ExerciseId;
  userGoal: TrainingGoal;
  onAddLog: (entry: {
    dateISO: string;
    exerciseId: ExerciseId;
    weightKg: number;
    reps: number;
    sets: number;
    rir: number;
    notes: string;
  }) => void;
  onDeleteLog: (id: string) => void;
  onInspectExercise3D: (exerciseId: ExerciseId) => void;
}

function getTodayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export const ProgressPanel: React.FC<ProgressPanelProps> = ({
  logs,
  activeExerciseId,
  userGoal,
  onAddLog,
  onDeleteLog,
  onInspectExercise3D,
}) => {
  const [selectedExercise, setSelectedExercise] = useState<ExerciseId>(activeExerciseId);
  const [weightInput, setWeightInput] = useState<string>('95');
  const [repsInput, setRepsInput] = useState<string>('8');
  const [setsInput, setSetsInput] = useState<string>('4');
  const [rirInput, setRirInput] = useState<number>(1);
  const [dateInput, setDateInput] = useState<string>(() => getTodayISO());
  const [notesInput, setNotesInput] = useState<string>('');
  const [historyFilter, setHistoryFilter] = useState<ExerciseId | 'ALL'>('ALL');
  const [justSavedMsg, setJustSavedMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<'weightKg' | 'reps' | 'sets', string>>
  >({});

  useEffect(() => {
    setSelectedExercise(activeExerciseId);
  }, [activeExerciseId]);

  const overall = calculateOverallProgress(logs);
  const exerciseSummary = summarizeExerciseProgress(logs, selectedExercise);
  const coachAdvice = getSmartCoachRecommendation(exerciseSummary, userGoal);

  const previewWeight = Number(weightInput) || 0;
  const previewReps = Number(repsInput) || 0;
  const previewSets = Number(setsInput) || 0;
  const preview1RM = calculateEstimated1RM(previewWeight, previewReps);
  const previewVolume = calculateEntryVolumeKg(previewWeight, previewReps, previewSets);

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateWorkoutLogInput({
      weightKg: weightInput,
      reps: repsInput,
      sets: setsInput,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    const exName = EXERCISE_CATALOG[selectedExercise].name;
    onAddLog({
      dateISO: dateInput || getTodayISO(),
      exerciseId: selectedExercise,
      weightKg: Number(weightInput),
      reps: Number(repsInput),
      sets: Number(setsInput),
      rir: rirInput,
      notes:
        notesInput.trim() ||
        `Ejecución controlada (${EXERCISE_CATALOG[selectedExercise].tempo})`,
    });
    setNotesInput('');
    setJustSavedMsg(
      `${exName}: ${setsInput}×${repsInput} con ${weightInput} kg registrado.`
    );
    window.setTimeout(() => setJustSavedMsg(null), 3500);
  };

  const filteredHistory = [...logs]
    .filter((l) => (historyFilter === 'ALL' ? true : l.exerciseId === historyFilter))
    .sort((a, b) => b.dateISO.localeCompare(a.dateISO));

  const chartHistory = exerciseSummary.history;
  const max1RM = Math.max(...chartHistory.map((h) => h.estimated1RM), 100);
  const min1RM = Math.max(0, Math.min(...chartHistory.map((h) => h.weightKg), 40) - 10);
  const range1RM = Math.max(20, max1RM - min1RM);

  const sessionVolumes = overall.volumeByDate.slice(-7);
  const maxSessionVol = Math.max(...sessionVolumes.map((v) => v.volumeKg), 4000);

  return (
    <div className="space-y-4">
      {/* 1. Overall Progress Summary (2 clean KPIs) */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 rounded-xl bg-[#090D16] border border-slate-800">
          <span className="text-[11px] text-slate-400 block">Volumen total</span>
          <span className="text-base font-mono font-bold text-white mt-0.5 block">
            {overall.totalVolumeLiftedKg.toLocaleString('es-ES')} kg
          </span>
          <span className="text-[11px] text-slate-400">
            {overall.totalLogsCount} registros · {overall.totalSetsLogged} series
          </span>
        </div>

        <div className="p-3 rounded-xl bg-[#090D16] border border-slate-800">
          <span className="text-[11px] text-slate-400 block">Progreso 1RM</span>
          <span className="text-base font-mono font-bold text-emerald-400 mt-0.5 block">
            +{overall.averageImprovementPct}%
          </span>
          <span className="text-[11px] text-slate-400">
            {overall.personalRecordsCount} récords batidos
          </span>
        </div>
      </div>

      {/* 2. Log Performance Form */}
      <form
        onSubmit={handleLogSubmit}
        noValidate
        className="p-4 rounded-xl bg-[#090D16] border border-slate-800 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>Registrar serie</span>
          </h3>
          <div className="font-mono text-xs text-slate-400">
            1RM <strong className="text-amber-400">{preview1RM} kg</strong> · Vol{' '}
            <strong className="text-sky-400">{previewVolume} kg</strong>
          </div>
        </div>

        <div>
          <label
            htmlFor="log-exercise-select"
            className="block text-xs font-medium text-slate-300 mb-1"
          >
            Ejercicio
          </label>
          <select
            id="log-exercise-select"
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value as ExerciseId)}
            className="w-full max-w-full min-w-0 min-h-[44px] sm:min-h-0 rounded-lg bg-[#0F172A] border border-slate-700 px-3 py-2 text-base sm:text-xs text-white focus:outline-none focus:border-amber-500"
          >
            {Object.values(EXERCISE_CATALOG).map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          <div className="min-w-0">
            <label
              htmlFor="log-weight-input"
              className="block text-xs font-medium text-slate-300 mb-1"
            >
              Peso (kg)
            </label>
            <input
              id="log-weight-input"
              type="number"
              step="0.5"
              min={1}
              max={500}
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              className="w-full min-w-0 min-h-[44px] sm:min-h-0 rounded-lg bg-[#0F172A] border border-slate-700 px-2.5 py-2 text-base sm:text-xs font-mono text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="min-w-0">
            <label
              htmlFor="log-reps-input"
              className="block text-xs font-medium text-slate-300 mb-1"
            >
              Reps
            </label>
            <input
              id="log-reps-input"
              type="number"
              min={1}
              max={100}
              value={repsInput}
              onChange={(e) => setRepsInput(e.target.value)}
              className="w-full min-w-0 min-h-[44px] sm:min-h-0 rounded-lg bg-[#0F172A] border border-slate-700 px-2.5 py-2 text-base sm:text-xs font-mono text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="min-w-0">
            <label
              htmlFor="log-sets-input"
              className="block text-xs font-medium text-slate-300 mb-1"
            >
              Series
            </label>
            <input
              id="log-sets-input"
              type="number"
              min={1}
              max={30}
              value={setsInput}
              onChange={(e) => setSetsInput(e.target.value)}
              className="w-full min-w-0 min-h-[44px] sm:min-h-0 rounded-lg bg-[#0F172A] border border-slate-700 px-2.5 py-2 text-base sm:text-xs font-mono text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="min-w-0">
            <label
              htmlFor="log-date-input"
              className="block text-xs font-medium text-slate-300 mb-1"
            >
              Fecha
            </label>
            <input
              id="log-date-input"
              type="date"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="w-full min-w-0 max-w-full min-h-[44px] sm:min-h-0 rounded-lg bg-[#0F172A] border border-slate-700 px-2.5 py-2 text-base sm:text-xs font-mono text-white focus:outline-none focus:border-amber-500"
            />
          </div>
          <div className="min-w-0">
            <label
              htmlFor="log-rir-select"
              className="block text-xs font-medium text-slate-300 mb-1"
            >
              RIR
            </label>
            <select
              id="log-rir-select"
              value={rirInput}
              onChange={(e) => setRirInput(Number(e.target.value))}
              className="w-full min-w-0 max-w-full min-h-[44px] sm:min-h-0 rounded-lg bg-[#0F172A] border border-slate-700 px-2.5 py-2 text-base sm:text-xs font-mono text-amber-400 focus:outline-none focus:border-amber-500"
            >
              <option value={0}>RIR 0 (Al fallo)</option>
              <option value={1}>RIR 1 (Óptimo)</option>
              <option value={2}>RIR 2 (Control)</option>
              <option value={3}>RIR 3</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="log-notes-input" className="sr-only">
            Nota opcional
          </label>
          <input
            id="log-notes-input"
            type="text"
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            placeholder="Nota (opcional)"
            className="w-full min-w-0 min-h-[44px] sm:min-h-0 rounded-lg bg-[#0F172A] border border-slate-700 px-3 py-2 text-base sm:text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>

        {(errors.weightKg || errors.reps || errors.sets) && (
          <div
            className="p-2.5 rounded-lg bg-red-950/60 border border-red-800 text-xs text-red-300 flex items-center gap-2"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errors.weightKg || errors.reps || errors.sets}</span>
          </div>
        )}

        {justSavedMsg && (
          <div
            className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-700 text-xs text-emerald-300 flex items-center gap-2"
            role="status"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{justSavedMsg}</span>
          </div>
        )}

        <button
          type="submit"
          className="w-full min-h-[48px] sm:min-h-0 py-2.5 px-4 rounded-lg text-sm sm:text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-[0.98] transition-all"
        >
          Guardar
        </button>
      </form>

      {/* 3. Smart Coach Progression */}
      <div className="p-3.5 rounded-xl bg-[#131D31] border border-amber-500/40 space-y-2">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400 shrink-0" />
            <h3 className="text-sm font-semibold text-white">
              {coachAdvice.headline}
            </h3>
          </div>
          <span className="text-xs font-mono text-amber-400">
            Objetivo: {coachAdvice.nextTargetWeightKg} kg × {coachAdvice.nextTargetReps}
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {coachAdvice.recommendation}
        </p>
        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
          <span>Calentamiento:</span>
          <span className="font-mono text-slate-200">
            {Math.round(coachAdvice.nextTargetWeightKg * 0.5)}kg×8 ·{' '}
            {Math.round(coachAdvice.nextTargetWeightKg * 0.7)}kg×4 ·{' '}
            {Math.round(coachAdvice.nextTargetWeightKg * 0.85)}kg×2
          </span>
        </div>
      </div>

      {/* 4. Progression Charts */}
      <div className="space-y-3.5">
        {/* Chart A: Exercise 1RM Trajectory */}
        <div className="p-4 rounded-xl bg-[#090D16] border border-slate-800 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-xs text-slate-400 block">
                Evolución 1RM · {exerciseSummary.exerciseName}
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-base font-mono font-bold text-white">
                  {exerciseSummary.best1RM} kg
                </span>
                <span className="text-xs font-mono text-emerald-400">
                  ({exerciseSummary.improvementPct >= 0 ? '+' : ''}
                  {exerciseSummary.improvementPct}%)
                </span>
              </div>
            </div>
            <TrendingUp className="w-4 h-4 text-amber-400 shrink-0" />
          </div>

          {chartHistory.length > 0 ? (
            <svg
              viewBox="0 0 320 135"
              className="w-full h-36 overflow-hidden"
              role="img"
              aria-label={`Gráfico de progreso de 1RM para ${exerciseSummary.exerciseName}`}
            >
              {[0, 0.5, 1].map((t, idx) => {
                const y = 18 + t * 88;
                const val = Math.round(max1RM - t * range1RM);
                return (
                  <g key={idx}>
                    <line
                      x1={32}
                      y1={y}
                      x2={308}
                      y2={y}
                      stroke="#1E293B"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                    <text
                      x={26}
                      y={y + 3}
                      textAnchor="end"
                      className="fill-slate-500 text-[9px] font-mono"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {chartHistory.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2.5"
                  points={chartHistory
                    .map((entry, idx) => {
                      const x = 44 + (idx / Math.max(1, chartHistory.length - 1)) * 252;
                      const y =
                        106 - ((entry.estimated1RM - min1RM) / range1RM) * 88;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                />
              )}

              {chartHistory.length > 1 && (
                <polyline
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="1.75"
                  strokeDasharray="4 2"
                  points={chartHistory
                    .map((entry, idx) => {
                      const x = 44 + (idx / Math.max(1, chartHistory.length - 1)) * 252;
                      const y = 106 - ((entry.weightKg - min1RM) / range1RM) * 88;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                />
              )}

              {chartHistory.map((entry, idx) => {
                const x =
                  chartHistory.length === 1
                    ? 170
                    : 44 + (idx / (chartHistory.length - 1)) * 252;
                const y1RM = 106 - ((entry.estimated1RM - min1RM) / range1RM) * 88;
                const [, m, d] = entry.dateISO.split('-');
                return (
                  <g key={entry.id}>
                    <circle
                      cx={x}
                      cy={y1RM}
                      r={4}
                      className="fill-amber-400 stroke-slate-950"
                      strokeWidth="1.5"
                    />
                    <text
                      x={x}
                      y={y1RM - 7}
                      textAnchor="middle"
                      className="fill-amber-300 text-[9px] font-mono"
                    >
                      {entry.estimated1RM}
                    </text>
                    <text
                      x={x}
                      y={124}
                      textAnchor="middle"
                      className="fill-slate-400 text-[9px] font-mono"
                    >
                      {d}/{m}
                    </text>
                  </g>
                );
              })}
            </svg>
          ) : (
            <div className="h-28 flex items-center justify-center text-xs text-slate-500">
              Sin registros aún para este ejercicio.
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
            <span>Ámbar: 1RM</span>
            <span>Azul: Peso usado</span>
          </div>
        </div>

        {/* Chart B: Session Volume */}
        <div className="p-4 rounded-xl bg-[#090D16] border border-slate-800 space-y-2">
          <div>
            <span className="text-xs text-slate-400 block">Volumen por sesión</span>
            <span className="text-base font-mono font-bold text-sky-400 mt-0.5 block">
              {sessionVolumes.length > 0
                ? `${sessionVolumes[sessionVolumes.length - 1].volumeKg.toLocaleString('es-ES')} kg última sesión`
                : '0 kg'}
            </span>
          </div>

          <svg
            viewBox="0 0 320 135"
            className="w-full h-36 overflow-hidden"
            role="img"
            aria-label="Gráfico de barras de volumen total levantado por sesión"
          >
            {sessionVolumes.map((sv, idx) => {
              const barWidth = 22;
              const gap =
                sessionVolumes.length > 1
                  ? (260 - sessionVolumes.length * barWidth) /
                    (sessionVolumes.length - 1)
                  : 0;
              const x = sessionVolumes.length === 1 ? 149 : 30 + idx * (barWidth + gap);
              const barH = Math.max(8, (sv.volumeKg / maxSessionVol) * 84);
              const y = 106 - barH;
              return (
                <g key={sv.dateISO}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barH}
                    rx={3}
                    className="fill-sky-500/80 hover:fill-amber-400 transition-colors"
                  />
                  <text
                    x={x + barWidth / 2}
                    y={y - 5}
                    textAnchor="middle"
                    className="fill-slate-300 text-[8.5px] font-mono"
                  >
                    {(sv.volumeKg / 1000).toFixed(1)}t
                  </text>
                  <text
                    x={x + barWidth / 2}
                    y={124}
                    textAnchor="middle"
                    className="fill-slate-400 text-[9px] font-mono"
                  >
                    {sv.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* 5. Workout Log History */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-white">
            Historial ({filteredHistory.length})
          </h3>
          <select
            aria-label="Filtrar historial por ejercicio"
            value={historyFilter}
            onChange={(e) =>
              setHistoryFilter(e.target.value as ExerciseId | 'ALL')
            }
            className="min-w-0 max-w-full min-h-[42px] sm:min-h-0 rounded-lg bg-[#090D16] border border-slate-800 px-2.5 py-1.5 text-base sm:text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="ALL">Todos ({logs.length})</option>
            {Object.values(EXERCISE_CATALOG).map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 lg:max-h-80 lg:overflow-y-auto lg:pr-1">
          {filteredHistory.map((item) => {
            const def = EXERCISE_CATALOG[item.exerciseId];
            return (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-[#090D16] border border-slate-800 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                    <span>{item.dateISO}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-400 font-semibold">
                      1RM {item.estimated1RM} kg
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-white truncate mt-0.5">
                    {def.name}
                  </div>
                  <div className="text-xs font-mono text-slate-300 mt-0.5">
                    {item.sets}×{item.reps} ·{' '}
                    <strong className="text-amber-400">{item.weightKg} kg</strong>
                  </div>
                  {item.notes && (
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {item.notes}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onInspectExercise3D(item.exerciseId)}
                    aria-label={`Ver técnica 3D de ${def.name}`}
                    className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteLog(item.id)}
                    aria-label={`Eliminar registro de ${def.name} del ${item.dateISO}`}
                    className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
