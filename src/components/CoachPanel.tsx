import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, Eye } from 'lucide-react';
import {
  EXERCISE_CATALOG,
  type ExerciseId,
  type GeneratedRoutine,
} from '../utils/routineEngine';
import { PERSONAL_TRAINER_MASTER_ADVICES } from '../utils/progressEngine';

export interface CoachPanelProps {
  activeExerciseId: ExerciseId;
  routine: GeneratedRoutine;
  onInspectExercise3D: (exerciseId: ExerciseId) => void;
}

export const CoachPanel: React.FC<CoachPanelProps> = ({
  activeExerciseId,
  routine,
  onInspectExercise3D,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('Todos');
  const activeDef = EXERCISE_CATALOG[activeExerciseId];

  const categories = [
    { id: 'Todos', label: 'Todos' },
    { id: 'Sobrecarga Progresiva', label: 'Progresión' },
    { id: 'Prevención de Errores', label: 'Técnica' },
    { id: 'Calentamiento y Activación', label: 'Calentamiento' },
    { id: 'Recuperación y Volumen', label: 'Recuperación' },
  ];

  const filteredAdvices =
    categoryFilter === 'Todos'
      ? PERSONAL_TRAINER_MASTER_ADVICES
      : PERSONAL_TRAINER_MASTER_ADVICES.filter((a) => a.category === categoryFilter);

  return (
    <div className="space-y-4">
      {/* Plan Summary */}
      <div className="p-3.5 rounded-xl bg-[#131D31] border border-amber-500/40 space-y-1.5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <h3 className="text-sm font-semibold text-white">Tu plan actual</h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Objetivo <strong className="text-amber-400 capitalize">{routine.profile.goal}</strong> ·{' '}
          {routine.profile.daysPerWeek} días/semana · Nivel {routine.profile.level}. Prioriza
          técnica estricta y deja 1–2 reps en recámara (RIR 1–2) en los básicos.
        </p>
      </div>

      {/* Active Exercise Spotlight */}
      <div className="p-3.5 rounded-xl bg-[#090D16] border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-semibold text-white">
            Foco: {activeDef.name}
          </h4>
          <button
            type="button"
            onClick={() => onInspectExercise3D(activeDef.id)}
            className="flex items-center gap-1 min-h-[44px] sm:min-h-0 px-3 sm:px-2.5 py-2 sm:py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-amber-400 hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ver 3D</span>
          </button>
        </div>

        <div className="divide-y divide-slate-800/80 border-t border-slate-800/80">
          {activeDef.commonMistakes.map((err, i) => (
            <div key={i} className="py-2.5 space-y-1">
              <div className="flex items-start gap-1.5 text-xs font-semibold text-red-400">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{err.mistake}</span>
              </div>
              <p className="text-xs text-slate-300 pl-5">
                <strong className="text-emerald-400">Solución:</strong>{' '}
                {err.correction}
              </p>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-800 space-y-1">
          <span className="text-[11px] font-medium text-slate-400 block">
            Puntos clave
          </span>
          {activeDef.safetyChecklist.map((chk, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>{chk}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Key Principles */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white">Consejos clave</h3>

        <div className="flex items-center gap-1.5 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`min-h-[40px] sm:min-h-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                categoryFilter === cat.id
                  ? 'bg-amber-500 text-slate-950 font-semibold'
                  : 'bg-[#090D16] text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="space-y-2.5">
          {filteredAdvices.map((adv) => (
            <div
              key={adv.id}
              className="p-3.5 rounded-xl bg-[#090D16] border border-slate-800 space-y-1.5"
            >
              <h4 className="text-sm font-semibold text-white">{adv.title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{adv.principle}</p>
              <p className="text-xs text-emerald-400 leading-relaxed">
                <strong>Haz esto:</strong> {adv.actionableTip}
              </p>
              <p className="text-xs text-red-400 leading-relaxed">
                <strong>Evita:</strong> {adv.mistakeToAvoid}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
