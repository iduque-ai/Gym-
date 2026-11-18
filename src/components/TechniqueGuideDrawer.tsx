import React, { useState } from 'react';
import { X, Eye, CheckCircle2, AlertTriangle, Compass } from 'lucide-react';
import {
  EXERCISE_CATALOG,
  MUSCLE_LABELS,
  type CameraPresetId,
  type ExerciseDefinition,
  type ExerciseId,
} from '../utils/routineEngine';
import { PERSONAL_TRAINER_MASTER_ADVICES } from '../utils/progressEngine';

export interface TechniqueGuideDrawerProps {
  isOpen: boolean;
  initialTab: 'guide' | 'catalog';
  activeExerciseId: ExerciseId;
  onSelectExercise3D: (
    exerciseId: ExerciseId,
    cameraPreset?: CameraPresetId,
    inspectPhaseProgress?: number | null
  ) => void;
  onClose: () => void;
}

export const TechniqueGuideDrawer: React.FC<TechniqueGuideDrawerProps> = ({
  isOpen,
  initialTab,
  activeExerciseId,
  onSelectExercise3D,
  onClose,
}) => {
  const [tab, setTab] = useState<'guide' | 'catalog'>(initialTab);
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos');

  React.useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  if (!isOpen) return null;

  const activeDef: ExerciseDefinition = EXERCISE_CATALOG[activeExerciseId];
  const allExercises = Object.values(EXERCISE_CATALOG);
  const filteredExercises =
    categoryFilter === 'Todos'
      ? allExercises
      : allExercises.filter((ex) => ex.category === categoryFilter);

  return (
    <div
      className="fixed inset-0 z-30 flex justify-end bg-black/65"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-technique-title"
    >
      <div className="w-full max-w-2xl h-full bg-[#0F172A] border-l border-slate-800 flex flex-col text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-slate-800">
          <div>
            <p className="text-xs font-medium text-amber-400">
              Análisis Cinemático y Prevención de Lesiones
            </p>
            <h2
              id="drawer-technique-title"
              className="text-2xl font-display font-bold tracking-tight text-white mt-0.5"
            >
              {tab === 'guide'
                ? `Biomecánica: ${activeDef.name}`
                : 'Catálogo de Modelos 3D Articulados'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar guía biomecánica"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switch Tabs */}
        <div className="px-6 pt-4">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#090D16] rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setTab('guide')}
              className={`py-2 px-3 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                tab === 'guide'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Desglose Técnico del Ejercicio Actual
            </button>
            <button
              type="button"
              onClick={() => setTab('catalog')}
              className={`py-2 px-3 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                tab === 'catalog'
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Catálogo Completo ({allExercises.length} Modelos 3D)
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {tab === 'guide' ? (
            <>
              {/* Metadata Summary */}
              <div className="p-4 rounded-xl bg-[#090D16] border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                  <span>{activeDef.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeDef.equipmentLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-amber-400">Tempo {activeDef.tempo}</span>
                </div>
                <p className="text-xs text-slate-300">
                  <strong className="text-white">Vector de Fuerza:</strong>{' '}
                  {activeDef.forceVectorDescription}
                </p>
                <div className="pt-2 flex flex-wrap gap-4 text-xs">
                  <div>
                    <span className="text-slate-400">Músculos Primarios (Rojo/Ámbar): </span>
                    <span className="text-amber-400 font-medium">
                      {activeDef.primaryMuscles.map((m) => MUSCLE_LABELS[m]).join(', ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Sinergistas (Azul): </span>
                    <span className="text-sky-400 font-medium">
                      {activeDef.secondaryMuscles.map((m) => MUSCLE_LABELS[m]).join(', ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3 Phases Breakdown with Direct 3D Phase Jump Buttons */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-white">
                  Fases Cinemáticas de la Repetición
                </h3>
                {(
                  [
                    {
                      key: 'eccentric',
                      data: activeDef.phases.eccentric,
                      progress: 0.25,
                      badge: '01. Fase Excéntrica',
                    },
                    {
                      key: 'isometric',
                      data: activeDef.phases.isometric,
                      progress: 0.50,
                      badge: '02. Transición Isométrica',
                    },
                    {
                      key: 'concentric',
                      data: activeDef.phases.concentric,
                      progress: 0.72,
                      badge: '03. Fase Concéntrica',
                    },
                  ] as const
                ).map((ph) => (
                  <div
                    key={ph.key}
                    className="p-4 rounded-xl bg-[#090D16] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
                        <span>{ph.badge}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-sky-400">{ph.data.angleTarget}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-white">{ph.data.title}</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">{ph.data.cue}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectExercise3D(activeDef.id, activeDef.defaultCamera, ph.progress);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 hover:bg-amber-500 hover:text-slate-950 transition-colors whitespace-nowrap shrink-0"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      <span>Inspeccionar Pose 3D</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Postural Safety Checklist */}
              <div className="space-y-2.5">
                <h3 className="text-sm font-semibold text-white">
                  Puntos de Control Postural Obligatorios
                </h3>
                <div className="p-4 rounded-xl bg-[#090D16] border border-slate-800 space-y-2.5">
                  {activeDef.safetyChecklist.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Common Mistakes vs Biomechanical Corrections */}
              <div className="space-y-2.5">
                <h3 className="text-sm font-semibold text-white">
                  Errores Frecuentes y Corrección Biomecánica
                </h3>
                <div className="space-y-3">
                  {activeDef.commonMistakes.map((err, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl bg-[#090D16] border border-slate-800 space-y-2"
                    >
                      <div className="flex items-start gap-2 text-xs font-semibold text-red-400">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>Error: {err.mistake}</span>
                      </div>
                      <p className="text-xs text-slate-300 pl-6">
                        <strong className="text-emerald-400">Corrección:</strong> {err.correction}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Universal Personal Trainer Science & Mistake Prevention */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800">
                <h3 className="text-sm font-semibold text-white">
                  Consejos Maestros de Entrenador Personal (Evidencia Científica)
                </h3>
                <div className="space-y-2.5">
                  {PERSONAL_TRAINER_MASTER_ADVICES.map((adv) => (
                    <div
                      key={adv.id}
                      className="p-3.5 rounded-xl bg-[#090D16] border border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-amber-400">{adv.title}</span>
                        <span className="text-slate-400">{adv.category}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{adv.principle}</p>
                      <p className="text-xs text-emerald-400">
                        <strong>Protocolo:</strong> {adv.actionableTip}
                      </p>
                      <p className="text-xs text-red-400">
                        <strong>Error a evitar:</strong> {adv.mistakeToAvoid}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Category Filter Bar */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {['Todos', 'Pierna / Rodilla', 'Pierna / Cadera', 'Empuje', 'Tracción'].map(
                  (cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                        categoryFilter === cat
                          ? 'bg-amber-500 text-slate-950 font-semibold'
                          : 'bg-[#090D16] text-slate-400 border border-slate-800 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  )
                )}
              </div>

              {/* 8 3D Exercises Grid */}
              <div className="grid grid-cols-1 gap-3.5">
                {filteredExercises.map((ex, i) => {
                  const isCurrent = ex.id === activeExerciseId;
                  return (
                    <div
                      key={ex.id}
                      className={`p-4 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isCurrent
                          ? 'bg-[#131D31] border-amber-500'
                          : 'bg-[#090D16] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <span className="font-mono text-amber-400">0{i + 1}.</span>
                          <span>{ex.category}</span>
                          <span aria-hidden="true">·</span>
                          <span>{ex.equipmentLabel}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">Tempo {ex.tempo}</span>
                        </div>
                        <h4 className="text-base font-semibold text-white">{ex.name}</h4>
                        <p className="text-xs text-slate-400">
                          Primarios:{' '}
                          <span className="text-slate-200">
                            {ex.primaryMuscles.map((m) => MUSCLE_LABELS[m]).join(', ')}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectExercise3D(ex.id, ex.defaultCamera, null);
                            setTab('guide');
                          }}
                          className="px-3 py-2 rounded-lg text-xs font-medium bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors whitespace-nowrap"
                        >
                          Ficha Técnica
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectExercise3D(ex.id, ex.defaultCamera, null);
                            onClose();
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors whitespace-nowrap"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Cargar en 3D</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
