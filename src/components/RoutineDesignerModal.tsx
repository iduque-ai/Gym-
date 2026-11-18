import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';
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

  useEffect(() => {
    if (isOpen) {
      setWeightInput(String(initialProfile.weightKg));
      setHeightInput(String(initialProfile.heightCm));
      setAgeInput(String(initialProfile.age));
      setDaysInput(initialProfile.daysPerWeek);
      setLevel(initialProfile.level);
      setGoal(initialProfile.goal);
      setEquipment(initialProfile.equipment);
      setErrors({});
    }
  }, [isOpen, initialProfile]);

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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-routine-designer-title"
    >
      <div className="w-full max-w-2xl max-h-[92dvh] overflow-y-auto overflow-x-clip rounded-t-2xl sm:rounded-xl bg-[#0F172A] border-t sm:border border-slate-800 px-4 pt-4 sm:p-7 shadow-2xl text-slate-100">
        <div className="sm:hidden w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3" aria-hidden="true" />
        <div className="flex items-center justify-between gap-3 pb-3.5 sm:pb-5 border-b border-slate-800">
          <h2
            id="modal-routine-designer-title"
            className="text-xl sm:text-2xl font-display font-bold tracking-tight text-white"
          >
            Crear rutina personalizada
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar configurador de rutina"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="mt-4 sm:mt-6 space-y-4 sm:space-y-5">
          {/* Biometric Inputs */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
            <div className="min-w-0">
              <label
                htmlFor="input-weight-kg"
                className="block text-[11px] sm:text-xs font-medium text-slate-300 mb-1.5"
              >
                Peso (kg)
              </label>
              <input
                id="input-weight-kg"
                type="number"
                min={35}
                max={220}
                step="0.5"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="w-full min-w-0 min-h-[44px] rounded-lg bg-[#090D16] border border-slate-700 px-3 py-2 text-base sm:text-sm font-mono text-white focus:outline-none focus:border-amber-500"
                placeholder="78"
              />
              {errors.weightKg && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1" role="alert">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.weightKg}</span>
                </p>
              )}
            </div>

            <div className="min-w-0">
              <label
                htmlFor="input-height-cm"
                className="block text-[11px] sm:text-xs font-medium text-slate-300 mb-1.5"
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
                className="w-full min-w-0 min-h-[44px] rounded-lg bg-[#090D16] border border-slate-700 px-3 py-2 text-base sm:text-sm font-mono text-white focus:outline-none focus:border-amber-500"
                placeholder="178"
              />
              {errors.heightCm && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1" role="alert">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.heightCm}</span>
                </p>
              )}
            </div>

            <div className="min-w-0">
              <label
                htmlFor="input-age-years"
                className="block text-[11px] sm:text-xs font-medium text-slate-300 mb-1.5"
              >
                Edad
              </label>
              <input
                id="input-age-years"
                type="number"
                min={14}
                max={95}
                value={ageInput}
                onChange={(e) => setAgeInput(e.target.value)}
                className="w-full min-w-0 min-h-[44px] rounded-lg bg-[#090D16] border border-slate-700 px-3 py-2 text-base sm:text-sm font-mono text-white focus:outline-none focus:border-amber-500"
                placeholder="28"
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
              Objetivo
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              {(
                [
                  {
                    id: 'hipertrofia',
                    label: 'Hipertrofia',
                    desc: '8–12 reps · Volumen',
                  },
                  {
                    id: 'fuerza',
                    label: 'Fuerza',
                    desc: '4–6 reps · Cargas altas',
                  },
                  {
                    id: 'definicion',
                    label: 'Definición',
                    desc: '10–15 reps · Ritmo ágil',
                  },
                  {
                    id: 'recomposicion',
                    label: 'Recomposición',
                    desc: '6–10 reps · Mixto',
                  },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setGoal(item.id)}
                  className={`text-left p-3 rounded-lg border transition-colors ${
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="block text-xs font-medium text-slate-300 mb-2">
                Nivel
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
                    className={`min-h-[42px] sm:min-h-0 py-2 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
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
                Días por semana
              </span>
              <div className="grid grid-cols-5 gap-1 p-1 bg-[#090D16] rounded-lg border border-slate-800">
                {[2, 3, 4, 5, 6].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDaysInput(d)}
                    className={`min-h-[42px] sm:min-h-0 py-2 px-1.5 text-xs font-mono font-medium rounded-md transition-colors whitespace-nowrap ${
                      daysInput === d
                        ? 'bg-amber-500 text-slate-950 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {d}d
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
              Material disponible
            </label>
            <select
              id="select-equipment"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value as EquipmentAccess)}
              className="w-full min-w-0 max-w-full min-h-[44px] rounded-lg bg-[#090D16] border border-slate-700 px-3.5 py-2.5 text-base sm:text-sm text-white focus:outline-none focus:border-amber-500"
            >
              <option value="gimnasio_completo">Gimnasio completo</option>
              <option value="mancuernas_barra">Barra y mancuernas</option>
              <option value="peso_corporal">Peso corporal</option>
            </select>
          </div>

          <div className="sticky bottom-0 -mx-4 px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-[#0F172A]/95 backdrop-blur-md border-t border-slate-800 sm:static sm:mx-0 sm:px-0 sm:pt-4 sm:pb-0 sm:bg-transparent sm:backdrop-blur-none grid grid-cols-2 sm:flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] sm:min-h-0 px-4 py-2.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 sm:bg-transparent hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 min-h-[48px] sm:min-h-0 px-5 py-2.5 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 hover:bg-amber-400 active:scale-[0.98] transition-all whitespace-nowrap"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Generar rutina</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
