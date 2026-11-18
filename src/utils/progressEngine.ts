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
      headline: `Establece tu Línea Base en ${def.name}`,
      recommendation:
        'Realiza 2 series de aproximación al 50% y 75% antes de tu primera serie efectiva. Prioriza el tempo controlado y detén la serie dejando 2 repeticiones en recámara (RIR 2).',
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
      headline: `Listo para Sobrecarga Progresiva (+${increment} kg)`,
      recommendation: `Completaste ${latest.sets}×${latest.reps} con ${latest.weightKg} kg (RIR ${latest.rir}). Según el principio de Doble Progresión, incrementa la carga a ${nextTargetWeightKg} kg en tu próxima sesión manteniendo el tempo ${def.tempo} sin recortar el rango articular.`,
      nextTargetWeightKg,
      nextTargetReps: goal === 'fuerza' ? '4-6' : '8-10',
    };
  }

  return {
    headline: `Consolida Repeticiones con ${latest.weightKg} kg`,
    recommendation: `Mantén la carga actual de ${latest.weightKg} kg en la siguiente sesión e intenta añadir +1 repetición por serie con pausas isométricas limpias antes de subir peso.`,
    nextTargetWeightKg: latest.weightKg,
    nextTargetReps: `${latest.reps + 1}`,
  };
}

export const PERSONAL_TRAINER_MASTER_ADVICES: PersonalTrainerAdvice[] = [
  {
    id: 'double-progression',
    category: 'Sobrecarga Progresiva',
    title: 'Regla de la Doble Progresión (Primero Reps, Luego Kilos)',
    principle:
      'Si tu rango prescrito es de 8 a 10 repeticiones con 4 series, no subas el peso hasta completar las 4 series de 10 repeticiones con técnica estricta y RIR ≥ 1.',
    actionableTip:
      'Cuando alcances el tope del rango (4×10), añade +2.5 kg en ejercicios multiarticulares (+1.25 kg en press militar o brazos) y vuelve a empezar en 4×8.',
    mistakeToAvoid:
      'Subir peso cada semana a costa de acortar la profundidad en sentadilla o rebotar la barra en el pecho.',
  },
  {
    id: 'bracing-360',
    category: 'Prevención de Errores',
    title: 'Presión Intraabdominal 360° (Bracing vs. Meter el Ombligo)',
    principle:
      'La estabilidad espinal bajo cargas axiales depende de crear un cilindro rígido presurizado con el diafragma, transverso abdominal, oblicuos y cuadrado lumbar.',
    actionableTip:
      'Antes de iniciar la fase excéntrica, inhala hacia el abdomen y costillas laterales como si fueras a expandir un cinturón en 360°, y mantén el aire hasta superar el punto de estancamiento.',
    mistakeToAvoid:
      'Hundir el abdomen hacia adentro o exhalar todo el aire en el fondo de la sentadilla o peso muerto, perdiendo rigidez lumbar.',
  },
  {
    id: 'warmup-ramp',
    category: 'Calentamiento y Activación',
    title: 'Series de Aproximación Neural sin Fatiga (Protocolo Rampa)',
    principle:
      'Calentar no es fatigarse con 20 repeticiones; es potenciar el sistema nervioso (PAP) y lubricar la cápsula articular acercándose progresivamente al peso de trabajo.',
    actionableTip:
      'Ejecuta: Serie 1 al 50% × 8 reps · Serie 2 al 70% × 4 reps · Serie 3 al 85% × 2 reps · Serie 4 al 92% × 1 rep. Descansa 90s y comienza tus series efectivas.',
    mistakeToAvoid:
      'Llegar cerca del fallo muscular en las series de calentamiento, vaciando el glucógeno y reduciendo el rendimiento en las series reales.',
  },
  {
    id: 'rir-autoregulation',
    category: 'Recuperación y Volumen',
    title: 'Autorregulación por RIR (Repeticiones en Recámara 1–2)',
    principle:
      'La literatura biomecánica demuestra que entrenar a RIR 1–2 en básicos genera el 98% del estímulo hipertrófico del fallo muscular pero reduce la fatiga neuromuscular a la mitad.',
    actionableTip:
      'Termina tus series de Sentadilla, Peso Muerto Rumano y Press de Banca cuando la velocidad concéntrica disminuya notablemente pero aún pudieras hacer 1 o 2 repeticiones limpias.',
    mistakeToAvoid:
      'Ir al fallo técnico absoluto en la primera serie del día, obligándote a bajar el peso un 20% en las series siguientes.',
  },
  {
    id: 'scapular-control',
    category: 'Prevención de Errores',
    title: 'Disociación Escapulohumeral en Empujes y Tracciones',
    principle:
      'El hombro es la articulación más móvil del cuerpo; requiere que la escápula actúe como plataforma estable en presses y como motor dinámico en tracciones.',
    actionableTip:
      'En Press de Banca: retrae y deprime escápulas todo el tiempo. En Remos y Dominadas: permite que la escápula se estire controlada en la excéntrica y retráela al iniciar la concéntrica.',
    mistakeToAvoid:
      'Encoger los trapecios hacia las orejas cuando el peso cuesta, pinzando el tendón del supraespinoso.',
  },
  {
    id: 'plantar-tripod',
    category: 'Prevención de Errores',
    title: 'Trípode Plantar y Torque Externo de Cadera',
    principle:
      'La alineación de la rodilla nace en el pie y en la cadera. Si el arco plantar colapsa hacia adentro (pronación), la tibia rota internamente provocando valgo de rodilla.',
    actionableTip:
      'Clava tres puntos en el suelo (talón, base del dedo gordo y base del meñique) e intenta "atornillar" los pies contra el suelo hacia afuera sin moverlos.',
    mistakeToAvoid:
      'Usar zapatillas de running con suela blanda de aire/gel para hacer sentadilla o peso muerto, creando una base inestable.',
  },
];
