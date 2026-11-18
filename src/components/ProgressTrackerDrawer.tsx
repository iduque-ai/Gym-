import React, { useState } from 'react';
import {
  X,
  TrendingUp,
  PlusCircle,
  Award,
  AlertCircle,
  Trash2,
  Eye,
  ShieldCheck,
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
  PERSONAL_TRAINER_MASTER_ADVICES,
  summarizeExerciseProgress,
  validateWorkoutLogInput,
  type WorkoutLogEntry,
} from '../utils/progressEngine';

export interface ProgressTrackerDrawerProps {
  isOpen: boolean;
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
  onClose: () => void;
}

export const ProgressTrackerDrawer: React.FC<ProgressTrackerDrawerProps> = ({
  isOpen,
  logs,
  activeExerciseId,
  userGoal,
  onAddLog,
  onDeleteLog,
  onInspectExercise3D,
  onClose,
}) => {
  const [selectedExercise, setSelectedExercise] = useState<ExerciseId>(activeExerciseId);
  const [weightInput, setWeightInput] = useState<string>('95');
  const [repsInput, setRepsInput] = useState<string>('8');
  const [setsInput, setSetsInput] = useState<string>('4');
  const [rirInput, setRirInput] = useState<number>(1);
  const [dateInput, setDateInput] = useState<string>('2026-11-18');
  const [notesInput, setNotesInput] = useState<string>('');
  const [historyFilter, setHistoryFilter] = useState<ExerciseId | 'ALL'>('ALL');
  const [errors, setErrors] = useState<
    Partial<Record<'weightKg' | 'reps' | 'sets', string>>
  >({});

  React.useEffect(() => {
    setSelectedExercise(activeExerciseId);
  }, [activeExerciseId]);

  if (!isOpen) return null;

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
    onAddLog({
      dateISO: dateInput || '2026-11-18',
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
  };

  // Filtered chronological history (newest first for the table)
  const filteredHistory = [...logs]
    .filter((l) => (historyFilter === 'ALL' ? true : l.exerciseId === historyFilter))
    .sort((a, b) => b.dateISO.localeCompare(a.dateISO));

  // SVG Chart 1 geometry for selected exercise 1RM & working weight history
  const chartHistory = exerciseSummary.history;
  const max1RM = Math.max(...chartHistory.map((h) => h.estimated1RM), 100);
  const min1RM = Math.max(0, Math.min(...chartHistory.map((h) => h.weightKg), 40) - 10);
  const range1RM = Math.max(20, max1RM - min1RM);

  // SVG Chart 2 geometry for overall session volume
  const sessionVolumes = overall.volumeByDate.slice(-8);
  const maxSessionVol = Math.max(...sessionVolumes.map((v) => v.volumeKg), 4000);

  return (
    <div
      className="fixed inset-0 z-30 flex justify-end bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-progress-title"
    >
      <div className="w-full max-w-3xl h-full bg-[#0F172A] border-l border-slate-800 flex flex-col text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-800">
          <div>
            <p className="text-xs font-medium text-amber-400">
              Telemetría de Fuerza, Volumen Histórico y Entrenador Personal
            </p>
            <h2
              id="drawer-progress-title"
              className="text-2xl font-display font-bold tracking-tight text-white mt-0.5"
            >
              Seguimiento de Progreso y Analítica de Cargas
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar seguimiento de progreso"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* 1. Overall User Progress KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-[#090D16] border border-slate-800">
              <span className="text-xs text-slate-400 block">Volumen Total Histórico</span>
              <span className="text-lg font-mono font-bold text-white mt-0.5 block">
                {overall.totalVolumeLiftedKg.toLocaleString('es-ES')} kg
              </span>
              <span className="text-[11px] text-slate-400">
                {overall.totalLogsCount} registros totales
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#090D16] border border-slate-800">
              <span className="text-xs text-slate-400 block">Series / Reps Totales</span>
              <span className="text-lg font-mono font-bold text-amber-400 mt-0.5 block">
                {overall.totalSetsLogged} series
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {overall.totalRepsLogged} repeticiones
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#090D16] border border-slate-800">
              <span className="text-xs text-slate-400 block">Progreso Medio 1RM</span>
              <span className="text-lg font-mono font-bold text-emerald-400 mt-0.5 block">
                +{overall.averageImprovementPct}%
              </span>
              <span className="text-[11px] text-slate-400">Sobrecarga verificada</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#090D16] border border-slate-800">
              <span className="text-xs text-slate-400 block">Récords Superados</span>
              <span className="text-lg font-mono font-bold text-sky-400 mt-0.5 block">
                {overall.personalRecordsCount} PRs
              </span>
              <span className="text-[11px] text-slate-400">Fórmula Epley 1RM</span>
            </div>
          </div>

          {/* 2. Log New Set/Exercise Performance Form */}
          <form
            onSubmit={handleLogSubmit}
            noValidate
            className="p-5 rounded-xl bg-[#090D16] border border-slate-800 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-amber-400" />
                  <span>Registrar Peso, Repeticiones y Series</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Introduce los datos de tu serie efectiva para calcular tu 1RM estimado y actualizar las curvas de progreso.
                </p>
              </div>
              <div className="text-right font-mono text-xs text-slate-300">
                <span>1RM Est: </span>
                <strong className="text-amber-400">{preview1RM} kg</strong>
                <span className="mx-1.5 text-slate-600">·</span>
                <span>Vol: </span>
                <strong className="text-sky-400">{previewVolume} kg</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-5">
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
                  className="w-full rounded-lg bg-[#0F172A] border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {Object.values(EXERCISE_CATALOG).map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
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
                  className="w-full rounded-lg bg-[#0F172A] border border-slate-700 px-2.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  placeholder="95"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="log-reps-input"
                  className="block text-xs font-medium text-slate-300 mb-1"
                >
                  Repeticiones
                </label>
                <input
                  id="log-reps-input"
                  type="number"
                  min={1}
                  max={100}
                  value={repsInput}
                  onChange={(e) => setRepsInput(e.target.value)}
                  className="w-full rounded-lg bg-[#0F172A] border border-slate-700 px-2.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  placeholder="8"
                />
              </div>

              <div className="sm:col-span-1">
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
                  className="w-full rounded-lg bg-[#0F172A] border border-slate-700 px-2 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                  placeholder="4"
                />
              </div>

              <div className="sm:col-span-2">
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
                  className="w-full rounded-lg bg-[#0F172A] border border-slate-700 px-2 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Validation errors */}
            {(errors.weightKg || errors.reps || errors.sets) && (
              <div
                className="p-2.5 rounded-lg bg-red-950/60 border border-red-800 text-xs text-red-300 flex items-center gap-2"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errors.weightKg || errors.reps || errors.sets}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                <label htmlFor="log-notes-input" className="sr-only">
                  Notas técnicas de la serie
                </label>
                <input
                  id="log-notes-input"
                  type="text"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Nota técnica opcional (ej. Pausa 1s abajo, RIR 1 sin valgo de rodilla)"
                  className="flex-1 rounded-lg bg-[#0F172A] border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
                <div className="flex items-center gap-1.5 shrink-0">
                  <label htmlFor="log-rir-select" className="text-xs text-slate-400">
                    RIR:
                  </label>
                  <select
                    id="log-rir-select"
                    value={rirInput}
                    onChange={(e) => setRirInput(Number(e.target.value))}
                    className="rounded-lg bg-[#0F172A] border border-slate-700 px-2 py-2 text-xs font-mono text-amber-400"
                  >
                    <option value={0}>RIR 0 (Fallo)</option>
                    <option value={1}>RIR 1 (Óptimo)</option>
                    <option value={2}>RIR 2 (Control)</option>
                    <option value={3}>RIR 3</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors whitespace-nowrap"
              >
                Guardar Registro
              </button>
            </div>
          </form>

          {/* 3. Smart Personal Trainer Prescription & Warm-up Ramp for Selected Exercise */}
          <div className="p-4 rounded-xl bg-[#131D31] border border-amber-500/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400 shrink-0" />
                <h3 className="text-sm font-semibold text-white">
                  Entrenador Personal: {coachAdvice.headline}
                </h3>
              </div>
              <span className="text-xs font-mono text-amber-400">
                Próximo Objetivo: {coachAdvice.nextTargetWeightKg} kg × {coachAdvice.nextTargetReps} reps
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {coachAdvice.recommendation}
            </p>
            {/* Dynamic Warm-up Ramp Calculator */}
            <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <span>Series de Aproximación Recomendadas (Sin Fatiga):</span>
              <div className="flex items-center gap-3 font-mono text-slate-200">
                <span>
                  1ª: {Math.round(coachAdvice.nextTargetWeightKg * 0.5)}kg × 8
                </span>
                <span>·</span>
                <span>
                  2ª: {Math.round(coachAdvice.nextTargetWeightKg * 0.7)}kg × 4
                </span>
                <span>·</span>
                <span>
                  3ª: {Math.round(coachAdvice.nextTargetWeightKg * 0.85)}kg × 2
                </span>
              </div>
            </div>
          </div>

          {/* 4. Visual Progression Charts (1RM Trajectory & Session Volume) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Chart A: Exercise 1RM & Working Weight Evolution */}
            <div className="p-4 rounded-xl bg-[#090D16] border border-slate-800 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs text-slate-400 block">
                    Curva de Fuerza · {exerciseSummary.exerciseName}
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-lg font-mono font-bold text-white">
                      1RM: {exerciseSummary.best1RM} kg
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
                  className="w-full h-36 overflow-visible"
                  role="img"
                  aria-label={`Gráfico de progreso de 1RM para ${exerciseSummary.exerciseName}`}
                >
                  {/* Horizontal Grid Lines */}
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

                  {/* Line Path for 1RM */}
                  {chartHistory.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth="2.5"
                      points={chartHistory
                        .map((entry, idx) => {
                          const x =
                            44 +
                            (idx / Math.max(1, chartHistory.length - 1)) * 252;
                          const y =
                            106 -
                            ((entry.estimated1RM - min1RM) / range1RM) * 88;
                          return `${x},${y}`;
                        })
                        .join(' ')}
                    />
                  )}

                  {/* Line Path for Working Weight */}
                  {chartHistory.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="#38BDF8"
                      strokeWidth="1.75"
                      strokeDasharray="4 2"
                      points={chartHistory
                        .map((entry, idx) => {
                          const x =
                            44 +
                            (idx / Math.max(1, chartHistory.length - 1)) * 252;
                          const y =
                            106 - ((entry.weightKg - min1RM) / range1RM) * 88;
                          return `${x},${y}`;
                        })
                        .join(' ')}
                    />
                  )}

                  {/* Data Nodes */}
                  {chartHistory.map((entry, idx) => {
                    const x =
                      chartHistory.length === 1
                        ? 170
                        : 44 + (idx / (chartHistory.length - 1)) * 252;
                    const y1RM =
                      106 - ((entry.estimated1RM - min1RM) / range1RM) * 88;
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
                <div className="h-36 flex items-center justify-center text-xs text-slate-500">
                  Sin registros aún para este ejercicio. Añade tu primera serie arriba.
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                <span>Línea Ámbar: 1RM Estimado (kg)</span>
                <span>Línea Azul: Peso de Trabajo (kg)</span>
              </div>
            </div>

            {/* Chart B: Overall Session Tonnage Evolution */}
            <div className="p-4 rounded-xl bg-[#090D16] border border-slate-800 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs text-slate-400 block">
                    Progreso General · Tonelaje por Sesión
                  </span>
                  <span className="text-lg font-mono font-bold text-sky-400 mt-0.5 block">
                    {sessionVolumes.length > 0
                      ? `${sessionVolumes[sessionVolumes.length - 1].volumeKg.toLocaleString('es-ES')} kg última sesión`
                      : '0 kg'}
                  </span>
                </div>
              </div>

              <svg
                viewBox="0 0 320 135"
                className="w-full h-36 overflow-visible"
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
                  const x = 30 + idx * (barWidth + gap);
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

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                <span>Volumen = Σ (Series × Reps × Peso)</span>
                <span>Unidad: Toneladas (1t = 1.000 kg)</span>
              </div>
            </div>
          </div>

          {/* 5. Historical Workout Log Table */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-white">
                Historial de Métricas Registradas ({filteredHistory.length})
              </h3>
              <div className="flex items-center gap-2">
                <label htmlFor="history-filter-select" className="text-xs text-slate-400">
                  Filtrar:
                </label>
                <select
                  id="history-filter-select"
                  value={historyFilter}
                  onChange={(e) =>
                    setHistoryFilter(e.target.value as ExerciseId | 'ALL')
                  }
                  className="rounded-lg bg-[#090D16] border border-slate-800 px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="ALL">Todos los Ejercicios ({logs.length})</option>
                  {Object.values(EXERCISE_CATALOG).map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-xl bg-[#090D16] border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                      <th className="py-2.5 px-3 font-medium">Fecha</th>
                      <th className="py-2.5 px-3 font-medium">Ejercicio</th>
                      <th className="py-2.5 px-3 font-medium">Series × Reps × Peso</th>
                      <th className="py-2.5 px-3 font-medium">Volumen</th>
                      <th className="py-2.5 px-3 font-medium">1RM Est.</th>
                      <th className="py-2.5 px-3 font-medium text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {filteredHistory.map((item) => {
                      const def = EXERCISE_CATALOG[item.exerciseId];
                      return (
                        <tr key={item.id} className="hover:bg-slate-900/40">
                          <td className="py-2.5 px-3 font-mono text-slate-400 whitespace-nowrap">
                            {item.dateISO}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-medium text-white">{def.name}</div>
                            {item.notes && (
                              <div className="text-[11px] text-slate-400 truncate max-w-[210px]">
                                {item.notes}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-200 whitespace-nowrap">
                            {item.sets} × {item.reps} ×{' '}
                            <strong className="text-amber-400">{item.weightKg} kg</strong>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-300 whitespace-nowrap">
                            {item.totalVolumeKg.toLocaleString('es-ES')} kg
                          </td>
                          <td className="py-2.5 px-3 font-mono text-emerald-400 font-semibold whitespace-nowrap">
                            {item.estimated1RM} kg
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  onInspectExercise3D(item.exerciseId);
                                  onClose();
                                }}
                                aria-label={`Ver técnica 3D de ${def.name}`}
                                className="p-1.5 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteLog(item.id)}
                                aria-label={`Eliminar registro de ${def.name} del ${item.dateISO}`}
                                className="p-1.5 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 6. Evidence-Based Personal Trainer Master Principles & Mistake Prevention */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">
                Principios Maestros de tu Entrenador Personal (Ciencia del Entrenamiento y Prevención de Errores)
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PERSONAL_TRAINER_MASTER_ADVICES.map((adv) => (
                <div
                  key={adv.id}
                  className="p-4 rounded-xl bg-[#090D16] border border-slate-800 space-y-2"
                >
                  <div className="text-[11px] font-medium text-amber-400">
                    {adv.category}
                  </div>
                  <h4 className="text-xs font-semibold text-white">{adv.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {adv.principle}
                  </p>
                  <p className="text-xs text-emerald-400/95">
                    <strong>Acción:</strong> {adv.actionableTip}
                  </p>
                  <p className="text-xs text-red-400/90">
                    <strong>Evita este error:</strong> {adv.mistakeToAvoid}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
