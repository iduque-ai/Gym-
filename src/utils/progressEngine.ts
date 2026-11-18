import {
  EXERCISE_CATALOG,
  type ExerciseId,
  type TrainingGoal,
} from './routineEngine';

export interface WorkoutLogEntry {
  id: string;
  dateISO: string; // YYYY-MM-DD
  exerciseId: ExerciseId;
  weightKg: number;
  reps: number;
  sets: number;
  rir: number;
  estimated1RM: number;
  totalVolumeKg: number;
  notes?: string;
}

export interface LogValidationResult {
  valid: boolean;
  errors: Partial<Record<'weightKg' | 'reps' | 'sets', string>>;
}

export interface ExerciseProgressSummary {
  exerciseId: ExerciseId;
  exerciseName: string;
  entriesCount: number;
  latestWeightKg: number;
  bestWeightKg: number;
  latest1RM: number;
  best1RM: number;
  first1RM: number;
  improvementPct: number;
  totalExerciseVolumeKg: number;
  history: WorkoutLogEntry[];
}

export interface OverallProgressMetrics {
  totalLogsCount: number;
  totalSetsLogged: number;
  totalRepsLogged: number;
  totalVolumeLiftedKg: number;
  personalRecordsCount: number;
  averageImprovementPct: number;
  volumeByDate: { dateISO: string; label: string; volumeKg: number; sets: number }[];
}

export interface PersonalTrainerAdvice {
  id: string;
  category: 'Sobrecarga Progresiva' | 'Prevención de Errores' | 'Calentamiento y Activación' | 'Recuperación y Volumen';
  title: string;
  principle: string;
  actionableTip: string;
  mistakeToAvoid: string;
}

/**
 * Epley 1RM formula: weight * (1 + reps / 30), rounded to 1 decimal place.
 */
export function calculateEstimated1RM(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return Number(weightKg.toFixed(1));
  return Number((weightKg * (1 + reps / 30)).toFixed(1));
}

export function calculateEntryVolumeKg(weightKg: number, reps: number, sets: number): number {
  if (weightKg <= 0 || reps <= 0 || sets <= 0) return 0;
  return Math.round(weightKg * reps * sets);
}

export function validateWorkoutLogInput(input: {
  weightKg: number | string;
  reps: number | string;
  sets: number | string;
}): LogValidationResult {
  const errors: LogValidationResult['errors'] = {};

  const w = typeof input.weightKg === 'string' ? Number(input.weightKg.trim()) : input.weightKg;
  if (input.weightKg === '' || Number.isNaN(w) || w <= 0 || w > 500) {
    errors.weightKg = 'Introduce un peso válido entre 1 kg y 500 kg.';
  }

  const r = typeof input.reps === 'string' ? Number(input.reps.trim()) : input.reps;
  if (input.reps === '' || Number.isNaN(r) || !Number.isInteger(r) || r < 1 || r > 100) {
    errors.reps = 'Introduce repeticiones enteras entre 1 y 100.';
  }

  const s = typeof input.sets === 'string' ? Number(input.sets.trim()) : input.sets;
  if (input.sets === '' || Number.isNaN(s) || !Number.isInteger(s) || s < 1 || s > 30) {
    errors.sets = 'Introduce un número de series entre 1 y 30.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function createWorkoutLogEntry(params: {
  id?: string;
  dateISO: string;
  exerciseId: ExerciseId;
  weightKg: number;
  reps: number;
  sets: number;
  rir?: number;
  notes?: string;
}): WorkoutLogEntry {
  const estimated1RM = calculateEstimated1RM(params.weightKg, params.reps);
  const totalVolumeKg = calculateEntryVolumeKg(params.weightKg, params.reps, params.sets);

  return {
    id: params.id || `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    dateISO: params.dateISO,
    exerciseId: params.exerciseId,
    weightKg: params.weightKg,
    reps: params.reps,
    sets: params.sets,
    rir: params.rir ?? 1,
    estimated1RM,
    totalVolumeKg,
    notes: params.notes,
  };
}

/**
 * Generates deterministic seed workout logs across the past 5 weeks so the user can
 * immediately inspect historical progression charts and add new records on top.
 */
export function getInitialSeedWorkoutLogs(): WorkoutLogEntry[] {
  const seedRaw: Array<{
    dateISO: string;
    exerciseId: ExerciseId;
    weightKg: number;
    reps: number;
    sets: number;
    rir: number;
    notes: string;
  }> = [
    // Week 1
    {
      dateISO: '2026-10-14',
      exerciseId: 'back_squat',
      weightKg: 80,
      reps: 8,
      sets: 4,
      rir: 2,
      notes: 'Profundidad paralela controlada, foco en trípode plantar.',
    },
    {
      dateISO: '2026-10-14',
      exerciseId: 'bench_press',
      weightKg: 65,
      reps: 8,
      sets: 4,
      rir: 2,
      notes: 'Pausa de 1s en esternón, retracción escapular sólida.',
    },
    {
      dateISO: '2026-10-16',
      exerciseId: 'romanian_deadlift',
      weightKg: 75,
      reps: 10,
      sets: 4,
      rir: 2,
      notes: 'Bisagra de cadera limpia, barra pegada a muslos.',
    },
    {
      dateISO: '2026-10-16',
      exerciseId: 'overhead_press',
      weightKg: 40,
      reps: 8,
      sets: 4,
      rir: 2,
      notes: 'Glúteos y abdomen contraídos para evitar hiperextensión.',
    },
    // Week 2
    {
      dateISO: '2026-10-21',
      exerciseId: 'back_squat',
      weightKg: 85,
      reps: 8,
      sets: 4,
      rir: 2,
      notes: '+5 kg. Excelente velocidad concéntrica.',
    },
    {
      dateISO: '2026-10-21',
      exerciseId: 'bench_press',
      weightKg: 67.5,
      reps: 8,
      sets: 4,
      rir: 1,
      notes: 'Codos a 50°, trayectoria en J invertida.',
    },
    {
      dateISO: '2026-10-23',
      exerciseId: 'barbell_row',
      weightKg: 60,
      reps: 10,
      sets: 4,
      rir: 1,
      notes: 'Torso estable a 55°, tracción hacia abdomen.',
    },
    {
      dateISO: '2026-10-23',
      exerciseId: 'pull_up',
      weightKg: 78,
      reps: 8,
      sets: 4,
      rir: 1,
      notes: 'Rango completo desde depresión escapular.',
    },
    // Week 3
    {
      dateISO: '2026-10-28',
      exerciseId: 'back_squat',
      weightKg: 87.5,
      reps: 8,
      sets: 4,
      rir: 1,
      notes: 'Bracing 360° firme en la pausa inferior.',
    },
    {
      dateISO: '2026-10-28',
      exerciseId: 'bench_press',
      weightKg: 70,
      reps: 8,
      sets: 4,
      rir: 1,
      notes: 'Leg drive consistente sin levantar glúteos.',
    },
    {
      dateISO: '2026-10-30',
      exerciseId: 'romanian_deadlift',
      weightKg: 82.5,
      reps: 9,
      sets: 4,
      rir: 1,
      notes: 'Máxima tensión en isquiosurales a mitad de tibia.',
    },
    {
      dateISO: '2026-10-30',
      exerciseId: 'bicep_curl',
      weightKg: 16,
      reps: 10,
      sets: 3,
      rir: 1,
      notes: 'Húmero vertical sin balanceo lumbar.',
    },
    // Week 4
    {
      dateISO: '2026-11-05',
      exerciseId: 'back_squat',
      weightKg: 90,
      reps: 8,
      sets: 4,
      rir: 1,
      notes: 'Nuevo récord de trabajo con técnica impecable.',
    },
    {
      dateISO: '2026-11-05',
      exerciseId: 'bench_press',
      weightKg: 72.5,
      reps: 8,
      sets: 4,
      rir: 1,
      notes: 'Estabilidad total de muñeca y hombro.',
    },
    {
      dateISO: '2026-11-07',
      exerciseId: 'overhead_press',
      weightKg: 45,
      reps: 8,
      sets: 4,
      rir: 1,
      notes: 'Bloqueo vertical sobre mediopié.',
    },
    {
      dateISO: '2026-11-07',
      exerciseId: 'bulgarian_split_squat',
      weightKg: 24,
      reps: 10,
      sets: 3,
      rir: 1,
      notes: 'Rodilla alineada con segundo dedo del pie.',
    },
    // Week 5 (Recent)
    {
      dateISO: '2026-11-14',
      exerciseId: 'back_squat',
      weightKg: 92.5,
      reps: 8,
      sets: 4,
      rir: 1,
      notes: 'PR de Sentadilla Trasera 92.5 kg × 8 reps.',
    },
    {
      dateISO: '2026-11-14',
      exerciseId: 'bench_press',
      weightKg: 75,
      reps: 7,
      sets: 4,
      rir: 1,
      notes: 'PR de Press de Banca 75 kg × 7 reps.',
    },
  ];

  return seedRaw.map((item, index) =>
    createWorkoutLogEntry({
      id: `seed-log-${index + 1}`,
      ...item,
    })
  );
}

export function summarizeExerciseProgress(
  logs: WorkoutLogEntry[],
  exerciseId: ExerciseId
): ExerciseProgressSummary {
  const def = EXERCISE_CATALOG[exerciseId];
  const filtered = logs
    .filter((l) => l.exerciseId === exerciseId)
    .sort((a, b) => a.dateISO.localeCompare(b.dateISO));

  if (filtered.length === 0) {
    return {
      exerciseId,
      exerciseName: def.name,
      entriesCount: 0,
      latestWeightKg: 0,
      bestWeightKg: 0,
      latest1RM: 0,
      best1RM: 0,
      first1RM: 0,
      improvementPct: 0,
      totalExerciseVolumeKg: 0,
      history: [],
    };
  }

  const first = filtered[0];
  const latest = filtered[filtered.length - 1];
  let bestWeightKg = 0;
  let best1RM = 0;
  let totalExerciseVolumeKg = 0;

  for (const entry of filtered) {
    if (entry.weightKg > bestWeightKg) bestWeightKg = entry.weightKg;
    if (entry.estimated1RM > best1RM) best1RM = entry.estimated1RM;
    totalExerciseVolumeKg += entry.totalVolumeKg;
  }

  const improvementPct =
    first.estimated1RM > 0
      ? Number((((latest.estimated1RM - first.estimated1RM) / first.estimated1RM) * 100).toFixed(1))
      : 0;

  return {
    exerciseId,
    exerciseName: def.name,
    entriesCount: filtered.length,
    latestWeightKg: latest.weightKg,
    bestWeightKg,
    latest1RM: latest.estimated1RM,
    best1RM,
    first1RM: first.estimated1RM,
    improvementPct,
    totalExerciseVolumeKg,
    history: filtered,
  };
}

export function calculateOverallProgress(logs: WorkoutLogEntry[]): OverallProgressMetrics {
  let totalSetsLogged = 0;
  let totalRepsLogged = 0;
  let totalVolumeLiftedKg = 0;

  const dateMap = new Map<string, { volumeKg: number; sets: number }>();
  const best1RMPerExercise = new Map<ExerciseId, number>();
  let personalRecordsCount = 0;

  // Sort chronologically
  const chronological = [...logs].sort((a, b) => a.dateISO.localeCompare(b.dateISO));

  for (const entry of chronological) {
    totalSetsLogged += entry.sets;
    totalRepsLogged += entry.sets * entry.reps;
    totalVolumeLiftedKg += entry.totalVolumeKg;

    const prevDate = dateMap.get(entry.dateISO) || { volumeKg: 0, sets: 0 };
    dateMap.set(entry.dateISO, {
      volumeKg: prevDate.volumeKg + entry.totalVolumeKg,
      sets: prevDate.sets + entry.sets,
    });

    const prevBest = best1RMPerExercise.get(entry.exerciseId) || 0;
    if (entry.estimated1RM > prevBest) {
      best1RMPerExercise.set(entry.exerciseId, entry.estimated1RM);
      if (prevBest > 0) {
        personalRecordsCount += 1;
      }
    }
  }

  const exerciseIds = Object.keys(EXERCISE_CATALOG) as ExerciseId[];
  let sumImprovement = 0;
  let countedExercises = 0;
  for (const exId of exerciseIds) {
    const summary = summarizeExerciseProgress(chronological, exId);
    if (summary.entriesCount >= 2) {
      sumImprovement += summary.improvementPct;
      countedExercises += 1;
    }
  }

  const averageImprovementPct =
    countedExercises > 0 ? Number((sumImprovement / countedExercises).toFixed(1)) : 0;

  const volumeByDate = Array.from(dateMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([dateISO, data]) => {
      const [, month, day] = dateISO.split('-');
      return {
        dateISO,
        label: `${day}/${month}`,
        volumeKg: data.volumeKg,
        sets: data.sets,
      };
    });

  return {
    totalLogsCount: logs.length,
    totalSetsLogged,
    totalRepsLogged,
    totalVolumeLiftedKg,
    personalRecordsCount,
    averageImprovementPct,
    volumeByDate,
  };
}

/**
 * Generates personalized coaching feedback for an exercise based on recent logs and user goal,
 * plus universal evidence-based personal trainer principles.
 */
export function getSmartCoachRecommendation(
  summary: ExerciseProgressSummary,
  goal: TrainingGoal
): {
  headline: string;
  recommendation: string;
  nextTargetWeightKg: number;
  nextTargetReps: string;
} {
  const def = EXERCISE_CATALOG[summary.exerciseId];
  if (summary.entriesCount === 0) {
    return {
      headline: `Sin registros en ${def.name}`,
      recommendation:
        'Haz 2 series ligeras de aproximación y registra tu primera serie dejando 2 repeticiones en recámara (RIR 2).',
      nextTargetWeightKg: 40,
      nextTargetReps: goal === 'fuerza' ? '5' : '8-10',
    };
  }

  const latest = summary.history[summary.history.length - 1];
  const canIncreaseLoad = latest.reps >= (goal === 'fuerza' ? 5 : 8) && latest.rir >= 1;
  const increment =
    summary.exerciseId === 'bicep_curl' || summary.exerciseId === 'overhead_press' ? 1.25 : 2.5;
  const nextTargetWeightKg = canIncreaseLoad
    ? Number((latest.weightKg + increment).toFixed(2))
    : latest.weightKg;

  if (canIncreaseLoad) {
    return {
      headline: `Sube a ${nextTargetWeightKg} kg (+${increment} kg)`,
      recommendation: `Completaste ${latest.sets}×${latest.reps} con ${latest.weightKg} kg con buena técnica. En tu próxima sesión sube a ${nextTargetWeightKg} kg manteniendo el control.`,
      nextTargetWeightKg,
      nextTargetReps: goal === 'fuerza' ? '4-6' : '8-10',
    };
  }

  return {
    headline: `Suma repeticiones con ${latest.weightKg} kg`,
    recommendation: `Mantén ${latest.weightKg} kg e intenta lograr 1 repetición más por serie antes de subir peso.`,
    nextTargetWeightKg: latest.weightKg,
    nextTargetReps: `${latest.reps + 1}`,
  };
}

export const PERSONAL_TRAINER_MASTER_ADVICES: PersonalTrainerAdvice[] = [
  {
    id: 'double-progression',
    category: 'Sobrecarga Progresiva',
    title: 'Primero repeticiones, después kilos',
    principle:
      'Si tu objetivo es 4×8–10, no subas peso hasta completar todas las series a 10 reps limpias.',
    actionableTip:
      'Al llegar al tope del rango, añade +2,5 kg en básicos (+1,25 kg en hombros o brazos) y vuelve a 8 reps.',
    mistakeToAvoid:
      'Subir kilos cada semana recortando la profundidad o rebotando la barra.',
  },
  {
    id: 'bracing-360',
    category: 'Prevención de Errores',
    title: 'Bloqueo abdominal 360°',
    principle:
      'Tu espalda baja necesita presión uniforme en todo el abdomen y costillas, no meter el ombligo hacia adentro.',
    actionableTip:
      'Toma aire hacia la tripa y los costados antes de bajar y mantenlo hasta pasar la parte difícil.',
    mistakeToAvoid:
      'Soltar todo el aire en el punto más bajo de la sentadilla o el peso muerto.',
  },
  {
    id: 'warmup-ramp',
    category: 'Calentamiento y Activación',
    title: 'Calienta en rampa sin fatigarte',
    principle:
      'El calentamiento prepara tus articulaciones y sistema nervioso; no debe cansarte antes de las series reales.',
    actionableTip:
      'Haz 3 aproximaciones rápidas: 50%×8, 70%×4 y 85%×2 antes de cargar el peso del día.',
    mistakeToAvoid:
      'Hacer series largas al fallo durante el calentamiento.',
  },
  {
    id: 'rir-autoregulation',
    category: 'Recuperación y Volumen',
    title: 'Deja 1–2 repeticiones en recámara (RIR)',
    principle:
      'Entrenar cerca del fallo logra casi el mismo estímulo muscular con la mitad de fatiga y menos riesgo de lesión.',
    actionableTip:
      'Corta la serie cuando la barra frene claramente y sientas que te quedan 1 o 2 reps limpias.',
    mistakeToAvoid:
      'Ir al fallo absoluto en la primera serie y hundir el rendimiento del resto.',
  },
  {
    id: 'scapular-control',
    category: 'Prevención de Errores',
    title: 'Controla las escápulas',
    principle:
      'Un hombro estable depende de cómo colocas tus omóplatos en cada empuje y tirón.',
    actionableTip:
      'En press de banca junta y baja los hombros; en remos y dominadas abre arriba y junta al tirar.',
    mistakeToAvoid:
      'Encoger los hombros hacia las orejas cuando pesa la barra.',
  },
  {
    id: 'plantar-tripod',
    category: 'Prevención de Errores',
    title: 'Pie firme en tres puntos',
    principle:
      'Si el arco del pie cede hacia dentro, la rodilla también colapsa hacia dentro al empujar.',
    actionableTip:
      'Apoya talón, dedo gordo y meñique en el suelo como un trípode estable en sentadillas y peso muerto.',
    mistakeToAvoid:
      'Entrenar pierna pesada con zapatillas de cámara blanda e inestable.',
  },
];
