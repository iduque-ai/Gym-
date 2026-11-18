import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Compass,
  Play,
  Layers,
} from 'lucide-react';
import {
  EXERCISE_CATALOG,
  MUSCLE_LABELS,
  type BiomechanicalPose,
  type CameraPresetId,
  type ExerciseId,
} from '../utils/routineEngine';

export interface TechniqueLabPanelProps {
  activeExerciseId: ExerciseId;
  livePose: BiomechanicalPose;
  onSelectExercise3D: (
    exerciseId: ExerciseId,
    cameraPreset?: CameraPresetId,
    inspectPhaseProgress?: number | null
  ) => void;
}

export const TechniqueLabPanel: React.FC<TechniqueLabPanelProps> = ({
  activeExerciseId,
  livePose,
  onSelectExercise3D,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos');
  const [subTab, setSubTab] = useState<'tecnica' | 'catalogo'>('tecnica');

  const activeDef = EXERCISE_CATALOG[activeExerciseId];
  const allExercises = Object.values(EXERCISE_CATALOG);
  const filteredExercises =
    categoryFilter === 'Todos'
      ? allExercises
      : categoryFilter === 'Pierna'
        ? allExercises.filter((ex) => ex.category.startsWith('Pierna'))
        : allExercises.filter((ex) => ex.category === categoryFilter);

  const isConcentricFirst =
    activeExerciseId === 'pull_up' ||
    activeExerciseId === 'barbell_row' ||
    activeExerciseId === 'bicep_curl';

  const phaseRows = isConcentricFirst
    ? ([
        {
          key: 'concentric',
          data: activeDef.phases.concentric,
          progress: 0.22,
          badge: '01. Subida',
        },
        {
          key: 'isometric',
          data: activeDef.phases.isometric,
          progress: 0.44,
          badge: '02. Pausa',
        },
        {
          key: 'eccentric',
          data: activeDef.phases.eccentric,
          progress: 0.72,
          badge: '03. Bajada',
        },
      ] as const)
    : ([
        {
          key: 'eccentric',
          data: activeDef.phases.eccentric,
          progress: 0.24,
          badge: '01. Bajada',
        },
        {
          key: 'isometric',
          data: activeDef.phases.isometric,
          progress: 0.50,
          badge: '02. Pausa',
        },
        {
          key: 'concentric',
          data: activeDef.phases.concentric,
          progress: 0.72,
          badge: '03. Subida',
        },
      ] as const);

  return (
    <div className="space-y-4">
      {/* Sub-navigation */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#090D16] rounded-lg border border-slate-800">
        <button
          type="button"
          onClick={() => setSubTab('tecnica')}
          className={`min-h-[44px] sm:min-h-0 py-2 px-2.5 rounded-md text-xs font-medium transition-colors truncate ${
            subTab === 'tecnica'
              ? 'bg-amber-500 text-slate-950 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Técnica
        </button>
        <button
          type="button"
          onClick={() => setSubTab('catalogo')}
          className={`min-h-[44px] sm:min-h-0 py-2 px-2.5 rounded-md text-xs font-medium transition-colors truncate ${
            subTab === 'catalogo'
              ? 'bg-amber-500 text-slate-950 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Ejercicios ({allExercises.length})
        </button>
      </div>

      {subTab === 'tecnica' ? (
        <>
          {/* Exercise selector + muscle focus */}
          <div className="p-3.5 rounded-xl bg-[#090D16] border border-slate-800 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="lab-exercise-select"
                className="text-xs font-medium text-slate-400 flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Ejercicio</span>
              </label>
              <span className="text-xs font-mono text-slate-400">
                Tempo {activeDef.tempo}
              </span>
            </div>
            <select
              id="lab-exercise-select"
              value={activeExerciseId}
              onChange={(e) =>
                onSelectExercise3D(e.target.value as ExerciseId, undefined, null)
              }
              className="w-full max-w-full min-w-0 min-h-[44px] sm:min-h-0 rounded-lg bg-[#0F172A] border border-slate-700 px-3 py-2 text-base sm:text-sm font-medium text-white focus:outline-none focus:border-amber-500"
            >
              {allExercises.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.name} · {ex.equipmentLabel}
                </option>
              ))}
            </select>

            <p className="text-xs text-slate-400 pt-0.5 truncate">
              Músculos:{' '}
              <span className="text-slate-200">
                {activeDef.primaryMuscles.map((m) => MUSCLE_LABELS[m]).join(', ')}
              </span>
            </p>
          </div>

          {/* Slim Live Angles Bar */}
          <div className="px-3 py-2 rounded-lg bg-[#090D16] border border-slate-800 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
            <span className="text-slate-400">
              Rodilla <strong className="font-mono text-white">{livePose.jointAnglesDeg.knee}°</strong>
            </span>
            <span className="text-slate-400">
              Cadera <strong className="font-mono text-white">{livePose.jointAnglesDeg.hip}°</strong>
            </span>
            <span className="text-slate-400">
              Codo <strong className="font-mono text-white">{livePose.jointAnglesDeg.elbow}°</strong>
            </span>
            <span className="text-slate-400">
              Tronco <strong className="font-mono text-sky-400">{livePose.jointAnglesDeg.spineInclination}°</strong>
            </span>
          </div>

          {/* Interactive 3 Phases Breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Fases</h3>
              <button
                type="button"
                onClick={() =>
                  onSelectExercise3D(activeDef.id, activeDef.defaultCamera, null)
                }
                className="flex items-center gap-1 min-h-[36px] sm:min-h-0 px-2 py-1 text-xs font-medium text-amber-400 hover:text-amber-300"
              >
                <Play className="w-3 h-3" />
                <span>Reproducir</span>
              </button>
            </div>

            {phaseRows.map((ph) => {
              const isCurrentPhase =
                (ph.key === 'eccentric' && livePose.phaseName === 'Excéntrica') ||
                (ph.key === 'isometric' && livePose.phaseName === 'Isométrica') ||
                (ph.key === 'concentric' && livePose.phaseName === 'Concéntrica');
              return (
                <div
                  key={ph.key}
                  className={`p-3 rounded-xl border transition-colors ${
                    isCurrentPhase
                      ? 'bg-[#131D31] border-amber-500/70'
                      : 'bg-[#090D16] border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 text-xs">
                        <span className="text-amber-400 font-semibold">{ph.badge}</span>
                        <span aria-hidden="true" className="text-slate-600">
                          ·
                        </span>
                        <span className="font-mono text-sky-400">
                          {ph.data.angleTarget}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-white">
                        {ph.data.title}
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {ph.data.cue}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onSelectExercise3D(
                          activeDef.id,
                          activeDef.defaultCamera,
                          ph.progress
                        )
                      }
                      aria-label={`Ver ${ph.badge} de ${activeDef.name} en 3D`}
                      className="flex items-center gap-1 min-h-[44px] sm:min-h-0 px-3 sm:px-2.5 py-2 sm:py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 hover:bg-amber-500 hover:text-slate-950 transition-colors whitespace-nowrap shrink-0"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>Ver</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Common Mistakes */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white">Errores frecuentes</h3>
            <div className="rounded-xl bg-[#090D16] border border-slate-800 divide-y divide-slate-800/80">
              {activeDef.commonMistakes.map((err, i) => (
                <div key={i} className="p-3 space-y-1">
                  <div className="flex items-start gap-2 text-xs font-semibold text-red-400">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{err.mistake}</span>
                  </div>
                  <p className="text-xs text-slate-300 pl-6 leading-relaxed">
                    <strong className="text-emerald-400">Corrección:</strong>{' '}
                    {err.correction}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Key Checklist */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-white">Puntos clave</h3>
            <div className="p-3 rounded-xl bg-[#090D16] border border-slate-800 space-y-1.5">
              {activeDef.safetyChecklist.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Exercise Catalog */
        <div className="space-y-3.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {['Todos', 'Pierna', 'Empuje', 'Tracción'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`min-h-[40px] sm:min-h-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  categoryFilter === cat
                    ? 'bg-amber-500 text-slate-950 font-semibold'
                    : 'bg-[#090D16] text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {filteredExercises.map((ex, i) => {
              const isCurrent = ex.id === activeExerciseId;
              return (
                <div
                  key={ex.id}
                  className={`p-3.5 rounded-xl border transition-colors ${
                    isCurrent
                      ? 'bg-[#131D31] border-amber-500'
                      : 'bg-[#090D16] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 flex-wrap">
                      <span className="font-mono text-amber-400">
                        {String(i + 1).padStart(2, '0')}.
                      </span>
                      <span>{ex.equipmentLabel}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-white">{ex.name}</h4>
                    <p className="text-xs text-slate-400">
                      {ex.primaryMuscles.map((m) => MUSCLE_LABELS[m]).join(', ')}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectExercise3D(ex.id, ex.defaultCamera, null);
                      }}
                      className={`flex-1 min-h-[44px] sm:min-h-0 py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                        isCurrent
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-white hover:bg-amber-500 hover:text-slate-950'
                      }`}
                    >
                      {isCurrent ? 'En 3D' : 'Ver 3D'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectExercise3D(ex.id, ex.defaultCamera, null);
                        setSubTab('tecnica');
                      }}
                      className="min-h-[44px] sm:min-h-0 py-2 px-3 rounded-lg text-xs font-medium bg-[#0F172A] border border-slate-700 text-slate-300 hover:text-white transition-colors whitespace-nowrap"
                    >
                      Técnica
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
