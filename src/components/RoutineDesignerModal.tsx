import React, { useState } from 'react';
import { X, Sliders, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  validateUserProfile,
  type EquipmentAccess,
  type ExperienceLevel,
  type TrainingGoal,
  type UserProfile,
} from '../utils/routineEngine';

export interface RoutineDesignerModalProps {
  isOpen: boolean;
  initialProfile: UserProfile;
  onClose: () => void;
  onGenerateRoutine: (newProfile: UserProfile) => void;
}

export const RoutineDesignerModal: React.FC<RoutineDesignerModalProps> = ({
  isOpen,
  initialProfile,
  onClose,
  onGenerateRoutine,
}) => {
  const [weightInput, setWeightInput] = useState<string>(String(initialProfile.weightKg));
  const [heightInput, setHeightInput] = useState<string>(String(initialProfile.heightCm));
  const [ageInput, setAgeInput] = useState<string>(String(initialProfile.age));
  const [daysInput, setDaysInput] = useState<number>(initialProfile.daysPerWeek);
  const [level, setLevel] = useState<ExperienceLevel>(initialProfile.level);
  const [goal, setGoal] = useState<TrainingGoal>(initialProfile.goal);
  const [equipment, setEquipment] = useState<EquipmentAccess>(initialProfile.equipment);
  const [errors, setErrors] = useState<
    Partial<Record<'weightKg' | 'heightCm' | 'age' | 'daysPerWeek', string>>
  >({});

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateUserProfile({
      weightKg: weightInput,
      heightCm: heightInput,
      age: ageInput,
      daysPerWeek: daysInput,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    onGenerateRoutine({
      weightKg: Number(weightInput.trim()),
      heightCm: Number(heightInput.trim()),
      age: Number(ageInput.trim()),
      daysPerWeek: Number(daysInput),
      level,
      goal,
      equipment,
    });
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-routine-designer-title"
    >
      <div className="w-full max-w-2xl rounded-xl bg-[#0F172A] border border-slate-800 p-6 md:p-8 shadow-2xl text-slate-100">
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <p className="text-xs font-medium text-amber-400">
              Parámetros Biométricos y Periodización
            </p>
            <h2
              id="modal-routine-designer-title"
              className="text-2xl font-display font-bold tracking-tight text-white mt-0.5"
            >
              Configurador de Rutina Biomecánica
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar configurador de rutina"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-6">
          {/* Biometric Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="input-weight-kg"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Peso Corporal (kg)
              </label>
              <input
                id="input-weight-kg"
                type="number"
                min={35}
                max={220}
                step="0.5"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="w-full rounded-lg bg-[#090D16] border border-slate-700 px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-amber-500"
                placeholder="Ej. 78"
              />
              {errors.weightKg && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1" role="alert">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.weightKg}</span>
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="input-height-cm"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Altura (cm)
              </label>
              <input
                id="input-height-cm"
                type="number"
                min={120}
                max={230}
                value={heightInput}
                onChange={(e) => setHeightInput(e.target.value)}
                className="w-full rounded-lg bg-[#090D16] border border-slate-700 px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-amber-500"
                placeholder="Ej. 178"
              />
              {errors.heightCm && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1" role="alert">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.heightCm}</span>
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="input-age-years"
                className="block text-xs font-medium text-slate-300 mb-1.5"
              >
                Edad (años)
              </label>
              <input
                id="input-age-years"
                type="number"
                min={14}
                max={95}
                value={ageInput}
                onChange={(e) => setAgeInput(e.target.value)}
                className="w-full rounded-lg bg-[#090D16] border border-slate-700 px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-amber-500"
                placeholder="Ej. 28"
              />
              {errors.age && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1" role="alert">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.age}</span>
                </p>
              )}
            </div>
          </div>

          {/* Primary Training Goal */}
          <div>
            <span className="block text-xs font-medium text-slate-300 mb-2">
              Objetivo Principal de Entrenamiento
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(
                [
                  {
                    id: 'hipertrofia',
                    label: 'Hipertrofia Muscular',
                    desc: '8–12 reps · RIR 1 · Alto volumen mecánico',
                  },
                  {
                    id: 'fuerza',
                    label: 'Fuerza Máxima Neural',
                    desc: '4–6 reps · RIR 2 · Cargas >82% 1RM',
                  },
                  {
                    id: 'definicion',
                    label: 'Definición y Densidad',
                    desc: '10–15 reps · Descansos 60–90s · Alto gasto',
                  },
                  {
                    id: 'recomposicion',
                    label: 'Recomposición Corporal',
                    desc: '6–10 reps · Progresión mixta fuerza/tensión',
                  },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setGoal(item.id)}
                  className={`text-left p-3.5 rounded-lg border transition-colors ${
                    goal === item.id
                      ? 'bg-amber-500/15 border-amber-500 text-white'
                      : 'bg-[#090D16] border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-sm font-semibold">{item.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Experience Level & Days per Week */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <span className="block text-xs font-medium text-slate-300 mb-2">
                Nivel de Experiencia Técnica
              </span>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#090D16] rounded-lg border border-slate-800">
                {(
                  [
                    { id: 'principiante', label: 'Inicial' },
                    { id: 'intermedio', label: 'Intermedio' },
                    { id: 'avanzado', label: 'Avanzado' },
                  ] as const
                ).map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setLevel(lvl.id)}
                    className={`py-2 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      level === lvl.id
                        ? 'bg-amber-500 text-slate-950 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-slate-300 mb-2">
                Frecuencia Semanal (Días / Semana)
              </span>
              <div className="grid grid-cols-4 gap-1.5 p-1 bg-[#090D16] rounded-lg border border-slate-800">
                {[3, 4, 5, 6].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDaysInput(d)}
                    className={`py-2 px-2 text-xs font-mono font-medium rounded-md transition-colors whitespace-nowrap ${
                      daysInput === d
                        ? 'bg-amber-500 text-slate-950 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {d} Días
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Equipment Selector */}
          <div>
            <label
              htmlFor="select-equipment"
              className="block text-xs font-medium text-slate-300 mb-1.5"
            >
              Equipamiento Disponible
            </label>
            <select
              id="select-equipment"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value as EquipmentAccess)}
              className="w-full rounded-lg bg-[#090D16] border border-slate-700 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
            >
              <option value="gimnasio_completo">
                Gimnasio Completo (Rack Olímpico, Barra, Discos, Banco, Mancuernas)
              </option>
              <option value="mancuernas_barra">
                Home Gym (Barra Olímpica, Banco y Par de Mancuernas)
              </option>
              <option value="peso_corporal">
                Esencial (Barra de Dominadas, Banco y Peso Corporal)
              </option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors whitespace-nowrap"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Generar Rutina Óptima</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
