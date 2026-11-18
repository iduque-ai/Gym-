export type ExperienceLevel = 'principiante' | 'intermedio' | 'avanzado';
export type TrainingGoal = 'hipertrofia' | 'fuerza' | 'definicion' | 'recomposicion';
export type EquipmentAccess = 'gimnasio_completo' | 'mancuernas_barra' | 'peso_corporal';

export type ExerciseId =
  | 'back_squat'
  | 'bench_press'
  | 'romanian_deadlift'
  | 'overhead_press'
  | 'pull_up'
  | 'barbell_row'
  | 'bicep_curl'
  | 'bulgarian_split_squat';

export type MuscleGroup =
  | 'cuadriceps'
  | 'gluteos'
  | 'isquiosurales'
  | 'pectoral'
  | 'dorsal'
  | 'deltoides'
  | 'biceps'
  | 'triceps'
  | 'core';

export type CameraPresetId = 'isometric' | 'lateral' | 'frontal' | 'overhead';

export interface UserProfile {
  weightKg: number;
  heightCm: number;
  age: number;
  level: ExperienceLevel;
  goal: TrainingGoal;
  daysPerWeek: number;
  equipment: EquipmentAccess;
}

export interface ProfileValidationResult {
  valid: boolean;
  errors: Partial<Record<'weightKg' | 'heightCm' | 'age' | 'daysPerWeek', string>>;
}

export interface ExerciseDefinition {
  id: ExerciseId;
  name: string;
  category: 'Empuje' | 'Tracción' | 'Pierna / Cadera' | 'Pierna / Rodilla';
  equipmentLabel: string;
  requiredEquipment: EquipmentAccess[];
  primaryMuscles: MuscleGroup[];
  secondaryMuscles: MuscleGroup[];
  tempo: string;
  cycleDurationSec: number;
  bodyweightRatioIntermedio: number;
  phases: {
    eccentric: {
      title: string;
      cue: string;
      angleTarget: string;
    };
    isometric: {
      title: string;
      cue: string;
      angleTarget: string;
    };
    concentric: {
      title: string;
      cue: string;
      angleTarget: string;
    };
  };
  commonMistakes: {
    mistake: string;
    correction: string;
  }[];
  safetyChecklist: string[];
  forceVectorDescription: string;
  defaultCamera: CameraPresetId;
}

export interface RoutineExerciseItem {
  id: string;
  exerciseId: ExerciseId;
  sets: number;
  reps: string;
  targetLoadKg: number;
  restSeconds: number;
  rir: number;
  completedSets: boolean[];
  notes: string;
}

export interface RoutineDay {
  dayNumber: number;
  title: string;
  focusLabel: string;
  estimatedDurationMin: number;
  exercises: RoutineExerciseItem[];
}

export interface GeneratedRoutine {
  title: string;
  subtitle: string;
  splitName: string;
  profile: UserProfile;
  days: RoutineDay[];
  weeklyMetrics: {
    totalSets: number;
    completedSets: number;
    estimatedWeeklyVolumeKg: number;
    estimatedKcalPerSession: number;
    muscleDistribution: Record<MuscleGroup, number>;
  };
}

export interface BiomechanicalPose {
  /** Normalized progress within a single repetition (0 = start, 0.5 = transition/bottom, 1 = end) */
  repProgress: number;
  /** Depth/Contraction factor 0 (starting extension) to 1 (peak flexion/depth) */
  depthFactor: number;
  phaseName: 'Excéntrica' | 'Isométrica' | 'Concéntrica';
  phaseCue: string;
  /** Joint angles in degrees for HUD telemetry */
  jointAnglesDeg: {
    knee: number;
    hip: number;
    elbow: number;
    shoulder: number;
    spineInclination: number;
  };
  /** Joint rotations in radians for 3D rig bones */
  rigRadians: {
    pelvisY: number;
    pelvisZ: number;
    torsoPitch: number;
    leftHipPitch: number;
    rightHipPitch: number;
    leftHipRoll: number;
    rightHipRoll: number;
    leftKneePitch: number;
    rightKneePitch: number;
    leftAnklePitch: number;
    rightAnklePitch: number;
    leftShoulderPitch: number;
    rightShoulderPitch: number;
    leftShoulderRoll: number;
    rightShoulderRoll: number;
    leftElbowPitch: number;
    rightElbowPitch: number;
    headPitch: number;
    implementY: number;
    implementZ: number;
    implementPitch: number;
    athleteLyingOnBench: boolean;
  };
  /** Instantaneous muscle tension (0 to 1) per muscle group */
  muscleTension: Record<MuscleGroup, number>;
  /** Force vector magnitude 0..1 and origin height */
  forceVector: {
    magnitude: number;
    originY: number;
    originZ: number;
    directionY: number;
  };
}

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  cuadriceps: 'Cuádriceps',
  gluteos: 'Glúteo Mayor',
  isquiosurales: 'Isquiosurales',
  pectoral: 'Pectoral Mayor',
  dorsal: 'Dorsal Ancho',
  deltoides: 'Deltoides',
  biceps: 'Bíceps Braquial',
  triceps: 'Tríceps Braquial',
  core: 'Core y Erectores',
};

export const EXERCISE_CATALOG: Record<ExerciseId, ExerciseDefinition> = {
  back_squat: {
    id: 'back_squat',
    name: 'Sentadilla Trasera con Barra',
    category: 'Pierna / Rodilla',
    equipmentLabel: 'Rack Olímpico y Barra',
    requiredEquipment: ['gimnasio_completo', 'mancuernas_barra'],
    primaryMuscles: ['cuadriceps', 'gluteos'],
    secondaryMuscles: ['core', 'isquiosurales'],
    tempo: '3-1-1-0',
    cycleDurationSec: 4.5,
    bodyweightRatioIntermedio: 1.15,
    phases: {
      eccentric: {
        title: 'Descenso Controlado (Excéntrica)',
        cue: 'Inicia flexionando cadera y rodillas simultáneamente manteniendo la barra sobre el mediopié.',
        angleTarget: 'Rodilla 175° → 85° · Cadera 170° → 80°',
      },
      isometric: {
        title: 'Paralelo / Inversión (Isométrica)',
        cue: 'Rompe el paralelo con presión intraabdominal activa (bracing 360°) sin perder lordosis neutra.',
        angleTarget: 'Rodilla 85° · Cadera 78° · Tronco 32°',
      },
      concentric: {
        title: 'Empuje Ascendente (Concéntrica)',
        cue: 'Empuja el suelo separando los pies lateralmente mientras pecho y cadera suben al mismo ritmo.',
        angleTarget: 'Extensión completa a 175° sin hiperextender',
      },
    },
    commonMistakes: [
      {
        mistake: 'Valgo dinámico de rodilla (colapso medial al subir)',
        correction: 'Activa rotadores externos de cadera alineando la rótula con el segundo y tercer dedo del pie.',
      },
      {
        mistake: 'Guiño glúteo (retroversión pélvica excesiva en el fondo)',
        correction: 'Limita la profundidad al rango donde tu pelvis conserva neutralidad lumbar y abre ligeramente el ángulo de los pies.',
      },
      {
        mistake: 'Desplazamiento del peso hacia la punta de los pies',
        correction: 'Mantén el vector vertical de la barra exactamente sobre el centro del mediopié (trípode plantar).',
      },
    ],
    safetyChecklist: [
      'Barra apoyada sobre el trapecio superior (barra alta) o deltoides posterior (barra baja)',
      'Codos alineados bajo la barra traccionando hacia abajo para compactar el dorsal',
      'Trípode plantar firme: talón, base del primer metatarsiano y quinto metatarsiano',
    ],
    forceVectorDescription: 'Vector vertical de reacción del suelo (GRF) alineado desde el mediopié hasta la barra olímpica.',
    defaultCamera: 'isometric',
  },
  bench_press: {
    id: 'bench_press',
    name: 'Press de Banca Olímpico',
    category: 'Empuje',
    equipmentLabel: 'Banco Plano, Rack y Barra',
    requiredEquipment: ['gimnasio_completo', 'mancuernas_barra'],
    primaryMuscles: ['pectoral', 'triceps'],
    secondaryMuscles: ['deltoides', 'core'],
    tempo: '2-1-1-0',
    cycleDurationSec: 4.0,
    bodyweightRatioIntermedio: 0.9,
    phases: {
      eccentric: {
        title: 'Descenso en J Invertida (Excéntrica)',
        cue: 'Baja la barra hacia el esternón inferior con los codos a 45°–60° respecto al torso.',
        angleTarget: 'Codo 172° → 82° · Abducción Hombro 55°',
      },
      isometric: {
        title: 'Pausa Esternal (Isométrica)',
        cue: 'Toca suavemente el esternón sin rebotar, manteniendo retracción y depresión escapular firme.',
        angleTarget: 'Codo 82° · Antebrazo perpendicular al suelo',
      },
      concentric: {
        title: 'Empuje Diagonal (Concéntrica)',
        cue: 'Aplica leg drive contra el suelo y empuja la barra ligeramente hacia atrás sobre la línea de los hombros.',
        angleTarget: 'Bloqueo articular a 172° sobre la vertical escapular',
      },
    },
    commonMistakes: [
      {
        mistake: 'Codos abiertos a 90° (en forma de T)',
        correction: 'Cierra el ángulo humeral a 45°–60° creando torque externo ("doblar la barra") para proteger el manguito rotador.',
      },
      {
        mistake: 'Pérdida de retracción escapular al bloquear arriba',
        correction: 'Empuja el cuerpo contra el banco en lugar de protrair los hombros hacia el techo.',
      },
    ],
    safetyChecklist: [
      'Cinco puntos de contacto: cabeza, escápulas retraídas, glúteos en banco y ambos pies clavados al suelo',
      'Muñecas neutras en línea recta con los antebrazos para evitar hiperextensión carpal',
      'Trayectoria curva en J: del esternón inferior hacia la vertical de la articulación glenohumeral',
    ],
    forceVectorDescription: 'Trayectoria ascendente oblicua desde la apófisis xifoides hasta la vertical del hombro.',
    defaultCamera: 'isometric',
  },
  romanian_deadlift: {
    id: 'romanian_deadlift',
    name: 'Peso Muerto Rumano (RDL)',
    category: 'Pierna / Cadera',
    equipmentLabel: 'Barra Olímpica con Discos',
    requiredEquipment: ['gimnasio_completo', 'mancuernas_barra'],
    primaryMuscles: ['isquiosurales', 'gluteos'],
    secondaryMuscles: ['core', 'dorsal'],
    tempo: '3-1-1-0',
    cycleDurationSec: 4.4,
    bodyweightRatioIntermedio: 1.05,
    phases: {
      eccentric: {
        title: 'Bisagra de Cadera (Excéntrica)',
        cue: 'Proyecta la cadera horizontalmente hacia atrás rozando los muslos con la barra y rodillas en semiflexión fija.',
        angleTarget: 'Cadera 175° → 75° · Rodilla fija a 158°',
      },
      isometric: {
        title: 'Máximo Estiramiento Isquiosural (Isométrica)',
        cue: 'Detén el descenso justo cuando la cadera deje de viajar hacia atrás (mitad de la tibia) sin redondear lumbares.',
        angleTarget: 'Torso a 72° · Columna 100% neutra',
      },
      concentric: {
        title: 'Extensión de Cadera (Concéntrica)',
        cue: 'Empuja el suelo y contrae glúteos para proyectar la pelvis hacia adelante hasta la vertical.',
        angleTarget: 'Cadera a 175° sin hiperextender columna lumbar',
      },
    },
    commonMistakes: [
      {
        mistake: 'Alejar la barra de las piernas durante el descenso',
        correction: 'Activa el dorsal ancho como si sujetaras naranjas bajo las axilas para pegar la barra a los muslos.',
      },
      {
        mistake: 'Bajar más allá de la movilidad de cadera flexionando la zona lumbar',
        correction: 'Finaliza la excéntrica en el instante exacto en que la pelvis deja de rotar sobre el fémur.',
      },
    ],
    safetyChecklist: [
      'Rodillas desbloqueadas a ~15°–20° de flexión constante durante todo el recorrido',
      'Cuello alineado con el raquis torácico (mirada al suelo 2 metros delante)',
      'Barra deslizándose en contacto continuo con muslos y espinillas superiores',
    ],
    forceVectorDescription: 'Momento extensor puro en la articulación coxofemoral con brazo de palanca horizontal.',
    defaultCamera: 'lateral',
  },
  overhead_press: {
    id: 'overhead_press',
    name: 'Press Militar Estricto de Pie',
    category: 'Empuje',
    equipmentLabel: 'Barra Olímpica y Rack',
    requiredEquipment: ['gimnasio_completo', 'mancuernas_barra'],
    primaryMuscles: ['deltoides', 'triceps'],
    secondaryMuscles: ['core', 'pectoral'],
    tempo: '2-0-1-1',
    cycleDurationSec: 3.8,
    bodyweightRatioIntermedio: 0.55,
    phases: {
      eccentric: {
        title: 'Retorno a Clavículas (Excéntrica)',
        cue: 'Desciende la barra de forma controlada hasta la repisa clavicular adelantando ligeramente los codos.',
        angleTarget: 'Hombro 175° → 45° · Codo 172° → 65°',
      },
      isometric: {
        title: 'Posición de Rack Frontal (Isométrica)',
        cue: 'Contrae glúteos, cuádriceps y abdomen al 100% para crear una columna rígida antes de empujar.',
        angleTarget: 'Antebrazos verticales vistos de frente y perfil',
      },
      concentric: {
        title: 'Empuje Vertical Overhead (Concéntrica)',
        cue: 'Retrae ligeramente el mentón al pasar la barra y mete la cabeza bajo la barra al bloquear.',
        angleTarget: 'Alineación vertical: Barra · Hombro · Cadera · Mediopié',
      },
    },
    commonMistakes: [
      {
        mistake: 'Hiperextensión lumbar para convertirlo en press inclinado',
        correction: 'Aprieta los glúteos con fuerza y mantén las costillas bajas ancladas hacia la pelvis.',
      },
      {
        mistake: 'Empujar la barra hacia adelante rodeando la cara',
        correction: 'Aparta ligeramente la barbilla hacia atrás para que la barra suba en línea recta vertical.',
      },
    ],
    safetyChecklist: [
      'Agarre ligeramente superior al ancho biacromial con pulgares rodeando la barra',
      'Codos ligeramente por delante de la barra en la posición inicial',
      'Elevación escapular activa al final del bloqueo para estabilizar el espacio subacromial',
    ],
    forceVectorDescription: 'Línea de plomada vertical directa desde las manos hasta la bóveda plantar.',
    defaultCamera: 'isometric',
  },
  pull_up: {
    id: 'pull_up',
    name: 'Dominadas Pronas Estrictas',
    category: 'Tracción',
    equipmentLabel: 'Barra de Dominadas en Rack',
    requiredEquipment: ['gimnasio_completo', 'mancuernas_barra', 'peso_corporal'],
    primaryMuscles: ['dorsal', 'biceps'],
    secondaryMuscles: ['core', 'deltoides'],
    tempo: '2-1-1-1',
    cycleDurationSec: 4.0,
    bodyweightRatioIntermedio: 1.0,
    phases: {
      eccentric: {
        title: 'Descenso Escapular Controlado (Excéntrica)',
        cue: 'Extiende los codos en 2–3 segundos manteniendo tensión en el dorsal hasta la suspensión activa.',
        angleTarget: 'Codo 55° → 172° · Hombro en flexión controlada',
      },
      isometric: {
        title: 'Pausa Clavicular Superior (Isométrica)',
        cue: 'Acerca la parte alta del pecho a la barra llevando los codos hacia las costillas posteriores.',
        angleTarget: 'Codo 55° · Depresión y retracción escapular',
      },
      concentric: {
        title: 'Tracción Vertical (Concéntrica)',
        cue: 'Inicia deprimiendo las escápulas y tracciona pensando en clavar los codos hacia los bolsillos traseros.',
        angleTarget: 'Mentón supera la barra con pecho proyectado',
      },
    },
    commonMistakes: [
      {
        mistake: 'Balanceo de piernas (kipping involuntario) y hombros encogidos arriba',
        correction: 'Mantén piernas en hollow body (glúteos y abdomen tensos) y deprime escápulas antes de flexionar codos.',
      },
      {
        mistake: 'Rango parcial sin estirar los brazos abajo',
        correction: 'Completa la extensión de codos en cada repetición conservando estabilidad glenohumeral.',
      },
    ],
    safetyChecklist: [
      'Agarre prono a 1.3–1.5 veces el ancho de los hombros',
      'Depresión escapular activa al iniciar cada repetición',
      'Posición hollow suave de tronco y piernas para evitar balanceo pendular',
    ],
    forceVectorDescription: 'Vector de tracción descendente sobre el húmero hacia la cresta ilíaca.',
    defaultCamera: 'isometric',
  },
  barbell_row: {
    id: 'barbell_row',
    name: 'Remo con Barra (Pendlay / 45°)',
    category: 'Tracción',
    equipmentLabel: 'Barra Olímpica con Discos',
    requiredEquipment: ['gimnasio_completo', 'mancuernas_barra'],
    primaryMuscles: ['dorsal', 'deltoides'],
    secondaryMuscles: ['biceps', 'core', 'isquiosurales'],
    tempo: '2-1-1-0',
    cycleDurationSec: 3.6,
    bodyweightRatioIntermedio: 0.75,
    phases: {
      eccentric: {
        title: 'Extensión Protraída (Excéntrica)',
        cue: 'Deja que las escápulas se abran de forma controlada al bajar la barra sin alterar el ángulo del torso.',
        angleTarget: 'Codo 68° → 170° · Torso fijo a 55°',
      },
      isometric: {
        title: 'Contracción Umbilical (Isométrica)',
        cue: 'Sostén la barra 1 segundo contra el abdomen superior juntando las escápulas con fuerza.',
        angleTarget: 'Codo 68° · Retracción escapular máxima',
      },
      concentric: {
        title: 'Tracción hacia Cadera/Abdomen (Concéntrica)',
        cue: 'Tracciona con los codos pegados a 45° llevando la barra hacia el ombligo sin impulsar con la espalda baja.',
        angleTarget: 'Húmero supera la línea posterior del tronco',
      },
    },
    commonMistakes: [
      {
        mistake: 'Incorporar el tronco en cada repetición usando inercia lumbar',
        correction: 'Bloquea la bisagra de cadera isométricamente; solo deben moverse escápulas, hombros y codos.',
      },
      {
        mistake: 'Traccionar hacia el cuello encogiendo el trapecio superior',
        correction: 'Dirige la barra en arco hacia el abdomen bajo / cresta ilíaca para reclutar fibras del dorsal ancho.',
      },
    ],
    safetyChecklist: [
      'Isquiosurales y glúteos en tensión isométrica soportando el peso del tronco inclinado',
      'Columna lumbar y dorsal en línea recta sin flexión intervertebral',
      'Antebrazos alineados con la línea de tiro durante toda la fase concéntrica',
    ],
    forceVectorDescription: 'Tracción posterior perpendicular al eje longitudinal del tronco inclinado.',
    defaultCamera: 'lateral',
  },
  bicep_curl: {
    id: 'bicep_curl',
    name: 'Curl de Bíceps Estricto con Mancuernas',
    category: 'Tracción',
    equipmentLabel: 'Par de Mancuernas Hexagonales',
    requiredEquipment: ['gimnasio_completo', 'mancuernas_barra'],
    primaryMuscles: ['biceps'],
    secondaryMuscles: ['core', 'deltoides'],
    tempo: '3-1-1-0',
    cycleDurationSec: 3.4,
    bodyweightRatioIntermedio: 0.35,
    phases: {
      eccentric: {
        title: 'Descenso Excéntrico Lento (Excéntrica)',
        cue: 'Baja las mancuernas en 3 segundos resistiendo la gravedad sin dejar que los codos viajen hacia atrás.',
        angleTarget: 'Codo 42° → 168° · Hombro fijo a 0°',
      },
      isometric: {
        title: 'Pico de Supinación (Isométrica)',
        cue: 'Gira el meñique hacia afuera y arriba en el punto de máxima flexión sin adelantar el codo.',
        angleTarget: 'Codo 42° · Supinación completa de antebrazo',
      },
      concentric: {
        title: 'Flexión Supinada (Concéntrica)',
        cue: 'Flexiona el codo manteniendo el húmero perpendicular al suelo y las escápulas estables.',
        angleTarget: 'Recorrido limpio de 168° a 42°',
      },
    },
    commonMistakes: [
      {
        mistake: 'Balanceo lumbar para lanzar las mancuernas desde abajo',
        correction: 'Activa glúteos y abdomen; si necesitas balancear el torso, reduce la carga un 15%.',
      },
      {
        mistake: 'Adelantar excesivamente el codo arriba descansando el peso sobre el hueso',
        correction: 'Mantén el codo anclado junto a las costillas para sostener la tensión continua en el bíceps.',
      },
    ],
    safetyChecklist: [
      'Hombros deprimidos y escápulas retraídas contra la parrilla costal',
      'Muñecas firmes en ligera flexión o neutralidad, nunca vencidas hacia atrás',
      'Supinación progresiva desde el inicio del ascenso',
    ],
    forceVectorDescription: 'Torque flexor puro sobre la articulación humeroulnar.',
    defaultCamera: 'frontal',
  },
  bulgarian_split_squat: {
    id: 'bulgarian_split_squat',
    name: 'Sentadilla Búlgara Unilateral',
    category: 'Pierna / Rodilla',
    equipmentLabel: 'Banco de Apoyo y Mancuernas',
    requiredEquipment: ['gimnasio_completo', 'mancuernas_barra', 'peso_corporal'],
    primaryMuscles: ['gluteos', 'cuadriceps'],
    secondaryMuscles: ['isquiosurales', 'core'],
    tempo: '3-1-1-0',
    cycleDurationSec: 4.2,
    bodyweightRatioIntermedio: 0.45,
    phases: {
      eccentric: {
        title: 'Descenso Unilateral en Diagonal (Excéntrica)',
        cue: 'Baja la cadera ligeramente hacia atrás y abajo cargando el 85% del peso sobre la pierna delantera.',
        angleTarget: 'Rodilla delantera 172° → 85° · Torso 20°',
      },
      isometric: {
        title: 'Pausa Profunda Unilateral (Isométrica)',
        cue: 'Detén el descenso a 2 cm del suelo con la pelvis nivelada horizontalmente.',
        angleTarget: 'Rodilla 85° · Cadera delantera en máxima flexión',
      },
      concentric: {
        title: 'Impulso Unilateral (Concéntrica)',
        cue: 'Empuja el suelo con toda la planta del pie delantero sin empujar con el empeine trasero.',
        angleTarget: 'Extensión completa de cadera y rodilla delantera',
      },
    },
    commonMistakes: [
      {
        mistake: 'Apoyar demasiado peso en el pie trasero sobre el banco',
        correction: 'Usa el empeine trasero únicamente como punto de equilibrio; el trabajo recae en la pierna frontal.',
      },
      {
        mistake: 'Caída pélvica contralateral (Trendelenburg) o valgo de rodilla',
        correction: 'Activa el glúteo medio manteniendo ambas espinas ilíacas a la misma altura.',
      },
    ],
    safetyChecklist: [
      'Empeine trasero apoyado cómodamente en el borde del banco acolchado',
      'Separación transversal de pies al ancho de caderas (como en raíles de tren, no en cuerda floja)',
      'Ligera inclinación anterior del torso (15°–20°) para alinear fibras del glúteo mayor',
    ],
    forceVectorDescription: 'Vector unilateral concentrado sobre la extremidad inferior adelantada.',
    defaultCamera: 'isometric',
  },
};

export function validateUserProfile(input: {
  weightKg: number | string;
  heightCm: number | string;
  age: number | string;
  daysPerWeek: number | string;
}): ProfileValidationResult {
  const errors: ProfileValidationResult['errors'] = {};

  const weight = typeof input.weightKg === 'string' ? Number(input.weightKg.trim()) : input.weightKg;
  if (input.weightKg === '' || Number.isNaN(weight) || weight < 35 || weight > 220) {
    errors.weightKg = 'Introduce un peso válido entre 35 kg y 220 kg.';
  }

  const height = typeof input.heightCm === 'string' ? Number(input.heightCm.trim()) : input.heightCm;
  if (input.heightCm === '' || Number.isNaN(height) || height < 120 || height > 230) {
    errors.heightCm = 'Introduce una altura válida entre 120 cm y 230 cm.';
  }

  const age = typeof input.age === 'string' ? Number(input.age.trim()) : input.age;
  if (input.age === '' || Number.isNaN(age) || age < 14 || age > 95) {
    errors.age = 'Introduce una edad válida entre 14 y 95 años.';
  }

  const days = typeof input.daysPerWeek === 'string' ? Number(input.daysPerWeek.trim()) : input.daysPerWeek;
  if (input.daysPerWeek === '' || Number.isNaN(days) || days < 2 || days > 6) {
    errors.daysPerWeek = 'Selecciona entre 2 y 6 días por semana.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

function computeTargetLoadKg(
  exerciseId: ExerciseId,
  profile: UserProfile
): number {
  const def = EXERCISE_CATALOG[exerciseId];
  const levelMult =
    profile.level === 'principiante'
      ? 0.65
      : profile.level === 'intermedio'
      ? 1.0
      : 1.32;

  const goalMult =
    profile.goal === 'fuerza'
      ? 1.12
      : profile.goal === 'hipertrofia'
      ? 0.96
      : profile.goal === 'definicion'
      ? 0.88
      : 0.94;

  const raw = profile.weightKg * def.bodyweightRatioIntermedio * levelMult * goalMult;
  return Math.max(10, Math.round(raw / 2.5) * 2.5);
}

function getGoalPrescription(goal: TrainingGoal, isCompound: boolean): {
  sets: number;
  reps: string;
  restSeconds: number;
  rir: number;
} {
  switch (goal) {
    case 'fuerza':
      return isCompound
        ? { sets: 5, reps: '4-6', restSeconds: 180, rir: 2 }
        : { sets: 4, reps: '6-8', restSeconds: 120, rir: 2 };
    case 'hipertrofia':
      return isCompound
        ? { sets: 4, reps: '8-10', restSeconds: 120, rir: 1 }
        : { sets: 3, reps: '10-12', restSeconds: 90, rir: 1 };
    case 'definicion':
      return isCompound
        ? { sets: 4, reps: '10-12', restSeconds: 90, rir: 2 }
        : { sets: 3, reps: '12-15', restSeconds: 60, rir: 1 };
    case 'recomposicion':
    default:
      return isCompound
        ? { sets: 4, reps: '6-10', restSeconds: 120, rir: 2 }
        : { sets: 3, reps: '10-12', restSeconds: 90, rir: 1 };
  }
}

export function calculateRoutineMetrics(days: RoutineDay[], profile: UserProfile): GeneratedRoutine['weeklyMetrics'] {
  let totalSets = 0;
  let completedSets = 0;
  let estimatedWeeklyVolumeKg = 0;

  const muscleDistribution: Record<MuscleGroup, number> = {
    cuadriceps: 0,
    gluteos: 0,
    isquiosurales: 0,
    pectoral: 0,
    dorsal: 0,
    deltoides: 0,
    biceps: 0,
    triceps: 0,
    core: 0,
  };

  for (const day of days) {
    for (const item of day.exercises) {
      const def = EXERCISE_CATALOG[item.exerciseId];
      totalSets += item.sets;
      completedSets += item.completedSets.filter(Boolean).length;

      const repParts = item.reps.split('-').map((n) => parseInt(n, 10));
      const avgReps = repParts.length === 2 && !Number.isNaN(repParts[1])
        ? (repParts[0] + repParts[1]) / 2
        : repParts[0] || 8;

      estimatedWeeklyVolumeKg += Math.round(item.sets * avgReps * item.targetLoadKg);

      for (const m of def.primaryMuscles) {
        muscleDistribution[m] += item.sets;
      }
      for (const m of def.secondaryMuscles) {
        muscleDistribution[m] += Math.round(item.sets * 0.5);
      }
    }
  }

  const bmrFactor = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age;
  const setsPerSession = days.length > 0 ? totalSets / days.length : 14;
  const estimatedKcalPerSession = Math.round(Math.max(240, (bmrFactor * 0.16) + setsPerSession * 14));

  return {
    totalSets,
    completedSets,
    estimatedWeeklyVolumeKg,
    estimatedKcalPerSession,
    muscleDistribution,
  };
}

export function generateRoutine(profile: UserProfile): GeneratedRoutine {
  const goalLabels: Record<TrainingGoal, string> = {
    hipertrofia: 'Hipertrofia Miofibrilar y Volumen',
    fuerza: 'Fuerza Máxima y Potencia Neural',
    definicion: 'Definición Metabólica y Retención Muscular',
    recomposicion: 'Recomposición Corporal Estructural',
  };

  const rawTemplates: {
    title: string;
    focusLabel: string;
    exerciseIds: ExerciseId[];
  }[] =
    profile.daysPerWeek <= 3
      ? [
          {
            title: 'Día 1 · Full Body A (Dominante Rodilla y Empuje)',
            focusLabel: 'Cuádriceps · Pectoral · Dorsal',
            exerciseIds: ['back_squat', 'bench_press', 'barbell_row', 'bicep_curl'],
          },
          {
            title: 'Día 2 · Full Body B (Dominante Cadera y Vertical)',
            focusLabel: 'Isquiosurales · Deltoides · Dorsal',
            exerciseIds: ['romanian_deadlift', 'overhead_press', 'pull_up', 'bulgarian_split_squat'],
          },
          {
            title: 'Día 3 · Full Body C (Fuerza Global y Unilateral)',
            focusLabel: 'Glúteos · Pectoral · Tracción',
            exerciseIds: ['back_squat', 'bench_press', 'pull_up', 'romanian_deadlift'],
          },
        ]
      : profile.daysPerWeek === 4
      ? [
          {
            title: 'Día 1 · Torso Fuerza y Empuje Horizontal',
            focusLabel: 'Pectoral · Dorsal · Deltoides',
            exerciseIds: ['bench_press', 'barbell_row', 'overhead_press', 'bicep_curl'],
          },
          {
            title: 'Día 2 · Pierna Dominante de Rodilla',
            focusLabel: 'Cuádriceps · Glúteos · Core',
            exerciseIds: ['back_squat', 'bulgarian_split_squat', 'romanian_deadlift'],
          },
          {
            title: 'Día 3 · Torso Tracción y Empuje Vertical',
            focusLabel: 'Dorsal · Deltoides · Bíceps',
            exerciseIds: ['pull_up', 'overhead_press', 'barbell_row', 'bench_press'],
          },
          {
            title: 'Día 4 · Pierna Dominante de Cadera',
            focusLabel: 'Isquiosurales · Glúteos · Cuádriceps',
            exerciseIds: ['romanian_deadlift', 'back_squat', 'bulgarian_split_squat'],
          },
        ]
      : [
          {
            title: 'Día 1 · Empuje (Pectoral, Hombro y Tríceps)',
            focusLabel: 'Pectoral · Deltoides · Tríceps',
            exerciseIds: ['bench_press', 'overhead_press', 'bulgarian_split_squat'],
          },
          {
            title: 'Día 2 · Tracción (Dorsal, Trapecio y Bíceps)',
            focusLabel: 'Dorsal · Bíceps · Core',
            exerciseIds: ['pull_up', 'barbell_row', 'bicep_curl'],
          },
          {
            title: 'Día 3 · Pierna Completa (Rodilla y Cadera)',
            focusLabel: 'Cuádriceps · Isquiosurales · Glúteos',
            exerciseIds: ['back_squat', 'romanian_deadlift', 'bulgarian_split_squat'],
          },
          {
            title: 'Día 4 · Torso Hipertrofia (Empuje + Tracción)',
            focusLabel: 'Pectoral · Dorsal · Deltoides',
            exerciseIds: ['bench_press', 'pull_up', 'overhead_press', 'bicep_curl'],
          },
          {
            title: 'Día 5 · Cadena Posterior y Unilateral',
            focusLabel: 'Glúteos · Isquiosurales · Dorsal',
            exerciseIds: ['romanian_deadlift', 'bulgarian_split_squat', 'barbell_row', 'back_squat'],
          },
          {
            title: 'Día 6 · Especialización Fuerza y Brazos',
            focusLabel: 'Deltoides · Bíceps · Tracción',
            exerciseIds: ['overhead_press', 'pull_up', 'bicep_curl', 'bench_press'],
          },
        ];

  const dayTemplates = rawTemplates.slice(0, profile.daysPerWeek);

  const days: RoutineDay[] = dayTemplates.map((tpl, idx) => {
    const exercises: RoutineExerciseItem[] = tpl.exerciseIds.map((exId, exIdx) => {
      const isCompound = exId !== 'bicep_curl';
      const presc = getGoalPrescription(profile.goal, isCompound);
      const targetLoadKg = computeTargetLoadKg(exId, profile);
      const def = EXERCISE_CATALOG[exId];

      return {
        id: `d${idx + 1}-ex${exIdx + 1}-${exId}`,
        exerciseId: exId,
        sets: presc.sets,
        reps: presc.reps,
        targetLoadKg,
        restSeconds: presc.restSeconds,
        rir: presc.rir,
        completedSets: Array(presc.sets).fill(false),
        notes: def.phases.eccentric.cue,
      };
    });

    const estimatedDurationMin = exercises.reduce(
      (acc, ex) => acc + Math.round((ex.sets * (40 + ex.restSeconds)) / 60),
      10
    );

    return {
      dayNumber: idx + 1,
      title: tpl.title,
      focusLabel: tpl.focusLabel,
      estimatedDurationMin,
      exercises,
    };
  });

  const splitName =
    profile.daysPerWeek <= 3
      ? 'Full Body de Alta Frecuencia'
      : profile.daysPerWeek === 4
      ? 'Torso / Pierna Biomecánico (Upper / Lower)'
      : 'Push / Pull / Legs + Torso / Pierna';

  return {
    title: `Plan ${goalLabels[profile.goal]}`,
    subtitle: `${splitName} · ${profile.daysPerWeek} sesiones/semana · Nivel ${profile.level}`,
    splitName,
    profile,
    days,
    weeklyMetrics: calculateRoutineMetrics(days, profile),
  };
}

/**
 * Smooth asymmetric repetition curve:
 * - 0.00 -> 0.45: Controlled Eccentric phase (0 -> 1 depthFactor)
 * - 0.45 -> 0.58: Isometric bottom/peak pause (depthFactor ~ 1)
 * - 0.58 -> 0.92: Explosive Concentric phase (1 -> 0 depthFactor)
 * - 0.92 -> 1.00: Top lockout stabilization (depthFactor = 0)
 */
export function calculateBiomechanicalPose(
  exerciseId: ExerciseId,
  rawProgress: number
): BiomechanicalPose {
  const p = ((rawProgress % 1) + 1) % 1;
  const def = EXERCISE_CATALOG[exerciseId];

  let depthFactor = 0;
  let phaseName: BiomechanicalPose['phaseName'] = 'Excéntrica';
  let phaseCue = def.phases.eccentric.cue;

  if (p < 0.44) {
    // Smooth cosine ease-in-out for controlled eccentric
    const t = p / 0.44;
    depthFactor = 0.5 - 0.5 * Math.cos(Math.PI * t);
    phaseName = 'Excéntrica';
    phaseCue = def.phases.eccentric.cue;
  } else if (p < 0.57) {
    // Isometric hold at peak stretch/contraction
    const t = (p - 0.44) / 0.13;
    depthFactor = 1.0 - 0.015 * Math.sin(Math.PI * t);
    phaseName = 'Isométrica';
    phaseCue = def.phases.isometric.cue;
  } else if (p < 0.90) {
    // Explosive concentric drive
    const t = (p - 0.57) / 0.33;
    const easeOut = 1 - Math.pow(1 - t, 2.2);
    depthFactor = Math.max(0, 1 - easeOut);
    phaseName = 'Concéntrica';
    phaseCue = def.phases.concentric.cue;
  } else {
    // Lockout stabilization
    depthFactor = 0;
    phaseName = 'Concéntrica';
    phaseCue = def.phases.concentric.cue;
  }

  const d = depthFactor;

  // Base neutral pose
  const rigRadians: BiomechanicalPose['rigRadians'] = {
    pelvisY: 0.95,
    pelvisZ: 0,
    torsoPitch: 0,
    leftHipPitch: 0,
    rightHipPitch: 0,
    leftHipRoll: -0.06,
    rightHipRoll: 0.06,
    leftKneePitch: 0,
    rightKneePitch: 0,
    leftAnklePitch: 0,
    rightAnklePitch: 0,
    leftShoulderPitch: 0,
    rightShoulderPitch: 0,
    leftShoulderRoll: -0.18,
    rightShoulderRoll: 0.18,
    leftElbowPitch: 0,
    rightElbowPitch: 0,
    headPitch: 0,
    implementY: 1.48,
    implementZ: 0,
    implementPitch: 0,
    athleteLyingOnBench: false,
  };

  const jointAnglesDeg = {
    knee: 175,
    hip: 175,
    elbow: 170,
    shoulder: 25,
    spineInclination: 5,
  };

  const forceVector = {
    magnitude: 0.35 + 0.65 * d,
    originY: 0.95,
    originZ: 0,
    directionY: 1,
  };

  if (exerciseId === 'back_squat') {
    // Deep Olympic High-Bar Back Squat
    rigRadians.pelvisY = 0.95 - 0.42 * d;
    rigRadians.pelvisZ = -0.15 * d;
    rigRadians.torsoPitch = 0.52 * d; // Forward lean ~30 deg
    rigRadians.leftHipPitch = -1.48 * d;
    rigRadians.rightHipPitch = -1.48 * d;
    rigRadians.leftHipRoll = -0.12 - 0.14 * d;
    rigRadians.rightHipRoll = 0.12 + 0.14 * d;
    rigRadians.leftKneePitch = 1.62 * d;
    rigRadians.rightKneePitch = 1.62 * d;
    rigRadians.leftAnklePitch = -0.36 * d;
    rigRadians.rightAnklePitch = -0.36 * d;
    // Hands gripping barbell on upper traps
    rigRadians.leftShoulderPitch = -0.35;
    rigRadians.rightShoulderPitch = -0.35;
    rigRadians.leftShoulderRoll = -1.05;
    rigRadians.rightShoulderRoll = 1.05;
    rigRadians.leftElbowPitch = -1.85;
    rigRadians.rightElbowPitch = -1.85;
    rigRadians.headPitch = -0.32 * d;
    // Barbell rests on upper traps and moves vertically over mid-foot
    rigRadians.implementY = 1.48 - 0.44 * d;
    rigRadians.implementZ = 0.01 * d;

    jointAnglesDeg.knee = Math.round(176 - 91 * d);
    jointAnglesDeg.hip = Math.round(174 - 94 * d);
    jointAnglesDeg.elbow = 74;
    jointAnglesDeg.shoulder = 62;
    jointAnglesDeg.spineInclination = Math.round(4 + 28 * d);
    forceVector.originY = rigRadians.implementY;
    forceVector.originZ = rigRadians.implementZ;
  } else if (exerciseId === 'bench_press') {
    // Supine Olympic Bench Press
    rigRadians.athleteLyingOnBench = true;
    rigRadians.pelvisY = 0.50;
    rigRadians.pelvisZ = 0.15;
    // Shoulders abduct ~55 deg and extend down during eccentric, press up in J-curve
    rigRadians.leftShoulderPitch = -1.45 + 0.72 * d;
    rigRadians.rightShoulderPitch = -1.45 + 0.72 * d;
    rigRadians.leftShoulderRoll = -0.92;
    rigRadians.rightShoulderRoll = 0.92;
    rigRadians.leftElbowPitch = -0.15 - 1.38 * d;
    rigRadians.rightElbowPitch = -0.15 - 1.38 * d;
    rigRadians.implementY = 1.12 - 0.34 * d;
    rigRadians.implementZ = -0.30 + 0.07 * d; // Subtle J-curve from shoulder line to lower sternum

    jointAnglesDeg.knee = 92;
    jointAnglesDeg.hip = 168;
    jointAnglesDeg.elbow = Math.round(172 - 90 * d);
    jointAnglesDeg.shoulder = Math.round(85 - 38 * d);
    jointAnglesDeg.spineInclination = 88;
    forceVector.originY = rigRadians.implementY;
    forceVector.originZ = rigRadians.implementZ;
  } else if (exerciseId === 'romanian_deadlift') {
    // Pure Hip Hinge RDL
    rigRadians.pelvisY = 0.94 - 0.08 * d;
    rigRadians.pelvisZ = -0.26 * d; // Hip travels horizontally backward
    rigRadians.torsoPitch = 1.24 * d; // Spine tilts to ~71 deg keeping strict neutrality
    rigRadians.leftHipPitch = -1.32 * d;
    rigRadians.rightHipPitch = -1.32 * d;
    rigRadians.leftKneePitch = 0.24 + 0.08 * d; // Fixed soft knee bend (~15-18 deg)
    rigRadians.rightKneePitch = 0.24 + 0.08 * d;
    // Arms hang straight vertically holding barbell against thighs/shins
    rigRadians.leftShoulderPitch = -1.22 * d;
    rigRadians.rightShoulderPitch = -1.22 * d;
    rigRadians.leftShoulderRoll = -0.12;
    rigRadians.rightShoulderRoll = 0.12;
    rigRadians.leftElbowPitch = -0.06;
    rigRadians.rightElbowPitch = -0.06;
    rigRadians.headPitch = -0.15 * d;
    rigRadians.implementY = 0.84 - 0.38 * d;
    rigRadians.implementZ = 0.15 - 0.03 * d;

    jointAnglesDeg.knee = Math.round(164 - 6 * d);
    jointAnglesDeg.hip = Math.round(175 - 98 * d);
    jointAnglesDeg.elbow = 176;
    jointAnglesDeg.shoulder = Math.round(8 + 52 * d);
    jointAnglesDeg.spineInclination = Math.round(5 + 67 * d);
    forceVector.originY = rigRadians.pelvisY;
    forceVector.originZ = rigRadians.pelvisZ;
  } else if (exerciseId === 'overhead_press') {
    // Standing Strict Military Press (d=0 is clavicle rack, d=1 is full overhead lockout; or invert so d=1 is peak overhead contraction)
    // Note: in our unified phase model, let's make d=1 peak overhead lockout during concentric/isometric or controlled eccentric
    const pressHeight = 1 - d; // At d=0 top lockout, at d=1 bottom clavicle rack (consistent with eccentric lowering -> bottom -> concentric drive up!)
    rigRadians.pelvisY = 0.95;
    rigRadians.torsoPitch = -0.05 * (1 - pressHeight);
    rigRadians.leftShoulderPitch = -1.15 - 1.75 * pressHeight;
    rigRadians.rightShoulderPitch = -1.15 - 1.75 * pressHeight;
    rigRadians.leftShoulderRoll = -0.58 + 0.25 * pressHeight;
    rigRadians.rightShoulderRoll = 0.58 - 0.25 * pressHeight;
    rigRadians.leftElbowPitch = -2.15 * (1 - pressHeight) - 0.12;
    rigRadians.rightElbowPitch = -2.15 * (1 - pressHeight) - 0.12;
    rigRadians.headPitch = -0.12 * (1 - pressHeight);
    rigRadians.implementY = 1.48 + 0.62 * pressHeight;
    rigRadians.implementZ = 0.17 * (1 - pressHeight) + 0.01;

    jointAnglesDeg.knee = 177;
    jointAnglesDeg.hip = 178;
    jointAnglesDeg.elbow = Math.round(62 + 112 * pressHeight);
    jointAnglesDeg.shoulder = Math.round(48 + 126 * pressHeight);
    jointAnglesDeg.spineInclination = 3;
    forceVector.originY = rigRadians.implementY;
    forceVector.originZ = rigRadians.implementZ;
  } else if (exerciseId === 'pull_up') {
    // Strict Pronated Pull-Up on Rack Arch Bar
    const pullHeight = 1 - d; // d=1 is dead hang bottom stretch, d=0 is chin-over-bar peak
    rigRadians.pelvisY = 1.12 + 0.44 * pullHeight;
    rigRadians.pelvisZ = 0.04 * pullHeight;
    rigRadians.torsoPitch = -0.14 * pullHeight; // Slight thoracic extension to meet the bar
    rigRadians.leftHipPitch = -0.16; // Hollow body
    rigRadians.rightHipPitch = -0.16;
    rigRadians.leftKneePitch = 0.35;
    rigRadians.rightKneePitch = 0.35;
    rigRadians.leftShoulderPitch = -2.92 + 1.45 * pullHeight;
    rigRadians.rightShoulderPitch = -2.92 + 1.45 * pullHeight;
    rigRadians.leftShoulderRoll = -0.65 - 0.35 * pullHeight;
    rigRadians.rightShoulderRoll = 0.65 + 0.35 * pullHeight;
    rigRadians.leftElbowPitch = -0.12 - 1.92 * pullHeight;
    rigRadians.rightElbowPitch = -0.12 - 1.92 * pullHeight;
    rigRadians.implementY = 2.22;

    jointAnglesDeg.knee = 158;
    jointAnglesDeg.hip = 168;
    jointAnglesDeg.elbow = Math.round(172 - 116 * pullHeight);
    jointAnglesDeg.shoulder = Math.round(168 - 95 * pullHeight);
    jointAnglesDeg.spineInclination = Math.round(10 * pullHeight);
    forceVector.originY = rigRadians.pelvisY + 0.45;
    forceVector.originZ = 0;
    forceVector.directionY = -1;
  } else if (exerciseId === 'barbell_row') {
    // Bent-over Barbell Row
    const rowPull = 1 - d; // d=1 is bottom protraction stretch, d=0 is peak umbilical contraction
    rigRadians.pelvisY = 0.90;
    rigRadians.pelvisZ = -0.22;
    rigRadians.torsoPitch = 1.05; // Fixed 60-deg hinged torso
    rigRadians.leftHipPitch = -1.12;
    rigRadians.rightHipPitch = -1.12;
    rigRadians.leftKneePitch = 0.42;
    rigRadians.rightKneePitch = 0.42;
    rigRadians.leftShoulderPitch = -1.05 + 0.95 * rowPull;
    rigRadians.rightShoulderPitch = -1.05 + 0.95 * rowPull;
    rigRadians.leftShoulderRoll = -0.28 - 0.15 * rowPull;
    rigRadians.rightShoulderRoll = 0.28 + 0.15 * rowPull;
    rigRadians.leftElbowPitch = -0.15 - 1.65 * rowPull;
    rigRadians.rightElbowPitch = -0.15 - 1.65 * rowPull;
    rigRadians.implementY = 0.56 + 0.34 * rowPull;
    rigRadians.implementZ = 0.22 - 0.14 * rowPull;

    jointAnglesDeg.knee = 152;
    jointAnglesDeg.hip = 108;
    jointAnglesDeg.elbow = Math.round(170 - 102 * rowPull);
    jointAnglesDeg.shoulder = Math.round(62 - 48 * rowPull);
    jointAnglesDeg.spineInclination = 58;
    forceVector.originY = rigRadians.implementY;
    forceVector.originZ = rigRadians.implementZ;
  } else if (exerciseId === 'bicep_curl') {
    // Strict Standing Dumbbell Bicep Curl
    const curlFlex = 1 - d; // d=1 bottom extension, d=0 peak supinated contraction
    rigRadians.pelvisY = 0.95;
    rigRadians.leftShoulderPitch = -0.10 * curlFlex;
    rigRadians.rightShoulderPitch = -0.10 * curlFlex;
    rigRadians.leftShoulderRoll = -0.14;
    rigRadians.rightShoulderRoll = 0.14;
    rigRadians.leftElbowPitch = -0.18 - 2.05 * curlFlex;
    rigRadians.rightElbowPitch = -0.18 - 2.05 * curlFlex;
    rigRadians.implementY = 0.85 + 0.52 * curlFlex;
    rigRadians.implementZ = 0.10 + 0.22 * Math.sin(Math.PI * curlFlex);

    jointAnglesDeg.knee = 176;
    jointAnglesDeg.hip = 177;
    jointAnglesDeg.elbow = Math.round(168 - 126 * curlFlex);
    jointAnglesDeg.shoulder = Math.round(5 + 8 * curlFlex);
    jointAnglesDeg.spineInclination = 2;
    forceVector.originY = 1.15;
    forceVector.originZ = 0.2;
  } else if (exerciseId === 'bulgarian_split_squat') {
    // Unilateral Bulgarian Split Squat (Left leg forward working leg, Right leg elevated on rear bench)
    rigRadians.pelvisY = 0.92 - 0.34 * d;
    rigRadians.pelvisZ = 0.16 - 0.06 * d;
    rigRadians.torsoPitch = 0.28 + 0.14 * d; // 18-24 deg glute-biased forward torso lean
    // Front working leg (Left)
    rigRadians.leftHipPitch = -0.62 - 0.88 * d;
    rigRadians.leftKneePitch = 0.58 + 1.05 * d;
    rigRadians.leftAnklePitch = -0.25 * d;
    // Rear elevated leg (Right)
    rigRadians.rightHipPitch = 0.45 + 0.12 * d;
    rigRadians.rightKneePitch = 0.65 + 0.92 * d;
    // Dumbbells held at sides
    rigRadians.leftShoulderPitch = -0.28 * d;
    rigRadians.rightShoulderPitch = -0.28 * d;
    rigRadians.leftShoulderRoll = -0.16;
    rigRadians.rightShoulderRoll = 0.16;
    rigRadians.leftElbowPitch = -0.12;
    rigRadians.rightElbowPitch = -0.12;
    rigRadians.implementY = 0.78 - 0.34 * d;
    rigRadians.implementZ = 0.14;

    jointAnglesDeg.knee = Math.round(170 - 85 * d);
    jointAnglesDeg.hip = Math.round(162 - 78 * d);
    jointAnglesDeg.elbow = 172;
    jointAnglesDeg.shoulder = 14;
    jointAnglesDeg.spineInclination = Math.round(16 + 8 * d);
    forceVector.originY = rigRadians.pelvisY;
    forceVector.originZ = 0.32;
  }

  // Compute instantaneous muscle tension per muscle group (peaks at d = 1)
  const activeFactor = 0.35 + 0.65 * Math.sin((Math.PI / 2) * Math.min(1, Math.max(0, d)));
  const muscleTension: Record<MuscleGroup, number> = {
    cuadriceps: 0.08,
    gluteos: 0.08,
    isquiosurales: 0.08,
    pectoral: 0.08,
    dorsal: 0.08,
    deltoides: 0.08,
    biceps: 0.08,
    triceps: 0.08,
    core: 0.22,
  };

  for (const m of def.primaryMuscles) {
    muscleTension[m] = Math.min(1, 0.45 + 0.55 * activeFactor);
  }
  for (const m of def.secondaryMuscles) {
    muscleTension[m] = Math.min(0.75, 0.28 + 0.42 * activeFactor);
  }

  return {
    repProgress: p,
    depthFactor: d,
    phaseName,
    phaseCue,
    jointAnglesDeg,
    rigRadians,
    muscleTension,
    forceVector,
  };
}
