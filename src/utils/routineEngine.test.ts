import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateUserProfile,
  generateRoutine,
  calculateBiomechanicalPose,
  calculateRoutineMetrics,
  EXERCISE_CATALOG,
  type UserProfile,
} from './routineEngine';

test('validateUserProfile rejects empty or out-of-range inputs and accepts valid profiles', () => {
  const invalidEmpty = validateUserProfile({
    weightKg: '',
    heightCm: 178,
    age: 28,
    daysPerWeek: 4,
  });
  assert.equal(invalidEmpty.valid, false);
  assert.ok(invalidEmpty.errors.weightKg);

  const invalidOutBounds = validateUserProfile({
    weightKg: 25,
    heightCm: 260,
    age: 10,
    daysPerWeek: 8,
  });
  assert.equal(invalidOutBounds.valid, false);
  assert.ok(invalidOutBounds.errors.weightKg);
  assert.ok(invalidOutBounds.errors.heightCm);
  assert.ok(invalidOutBounds.errors.age);
  assert.ok(invalidOutBounds.errors.daysPerWeek);

  const valid = validateUserProfile({
    weightKg: 78,
    heightCm: 178,
    age: 28,
    daysPerWeek: 4,
  });
  assert.equal(valid.valid, true);
  assert.equal(Object.keys(valid.errors).length, 0);
});

test('generateRoutine creates tailored split matching daysPerWeek, goal, and level', () => {
  const profile: UserProfile = {
    weightKg: 80,
    heightCm: 180,
    age: 29,
    level: 'intermedio',
    goal: 'hipertrofia',
    daysPerWeek: 4,
    equipment: 'gimnasio_completo',
  };

  const routine = generateRoutine(profile);
  assert.equal(routine.days.length, 4);
  assert.ok(routine.weeklyMetrics.totalSets > 40);
  assert.ok(routine.weeklyMetrics.estimatedWeeklyVolumeKg > 10000);
  assert.equal(routine.weeklyMetrics.completedSets, 0);

  // Verify strength goal shifts sets and reps appropriately
  const strengthRoutine = generateRoutine({
    ...profile,
    goal: 'fuerza',
    daysPerWeek: 3,
  });
  assert.equal(strengthRoutine.days.length, 3);
  const firstCompound = strengthRoutine.days[0].exercises[0];
  assert.equal(firstCompound.sets, 5);
  assert.equal(firstCompound.reps, '4-6');
  assert.ok(firstCompound.targetLoadKg > routine.days[0].exercises[0].targetLoadKg);

  // Verify peso_corporal equipment only selects bodyweight-compatible exercises
  const bwRoutine = generateRoutine({
    ...profile,
    equipment: 'peso_corporal',
    daysPerWeek: 2,
  });
  assert.equal(bwRoutine.days.length, 2);
  for (const day of bwRoutine.days) {
    for (const item of day.exercises) {
      const def = EXERCISE_CATALOG[item.exerciseId];
      assert.ok(
        def.requiredEquipment.includes('peso_corporal'),
        `Expected ${item.exerciseId} to support peso_corporal`
      );
    }
  }
});

test('calculateRoutineMetrics updates completedSets accurately when sets are checked', () => {
  const profile: UserProfile = {
    weightKg: 75,
    heightCm: 175,
    age: 26,
    level: 'intermedio',
    goal: 'recomposicion',
    daysPerWeek: 3,
    equipment: 'gimnasio_completo',
  };
  const routine = generateRoutine(profile);
  routine.days[0].exercises[0].completedSets[0] = true;
  routine.days[0].exercises[0].completedSets[1] = true;

  const updatedMetrics = calculateRoutineMetrics(routine.days, profile);
  assert.equal(updatedMetrics.completedSets, 2);
});

test('calculateBiomechanicalPose computes valid joint angles and phases across all 10 3D exercises', () => {
  const exerciseIds = Object.keys(EXERCISE_CATALOG) as Array<keyof typeof EXERCISE_CATALOG>;
  assert.equal(exerciseIds.length, 10);

  const concentricFirstIds = new Set(['pull_up', 'barbell_row', 'bicep_curl']);

  for (const id of exerciseIds) {
    if (concentricFirstIds.has(id)) {
      const startPose = calculateBiomechanicalPose(id, 0.02);
      const peakPose = calculateBiomechanicalPose(id, 0.44);
      const eccentricPose = calculateBiomechanicalPose(id, 0.72);

      assert.equal(startPose.phaseName, 'Concéntrica');
      assert.equal(peakPose.phaseName, 'Isométrica');
      assert.equal(eccentricPose.phaseName, 'Excéntrica');
      assert.ok(peakPose.depthFactor > 0.95);
      const primary = EXERCISE_CATALOG[id].primaryMuscles[0];
      assert.ok(peakPose.muscleTension[primary] >= 0.8);
    } else {
      const startPose = calculateBiomechanicalPose(id, 0.02);
      const bottomPose = calculateBiomechanicalPose(id, 0.50);
      const concentricPose = calculateBiomechanicalPose(id, 0.72);

      assert.equal(startPose.phaseName, 'Excéntrica');
      assert.equal(bottomPose.phaseName, 'Isométrica');
      assert.equal(concentricPose.phaseName, 'Concéntrica');
      assert.ok(bottomPose.depthFactor > 0.95);
      assert.ok(startPose.depthFactor < 0.15);
      const primary = EXERCISE_CATALOG[id].primaryMuscles[0];
      assert.ok(bottomPose.muscleTension[primary] >= 0.8);
    }
  }

  // Squat depth check: knee angle decreases from ~176 deg at top to ~85 deg in bottom isometric hold
  const squatTop = calculateBiomechanicalPose('back_squat', 0.98);
  const squatBottom = calculateBiomechanicalPose('back_squat', 0.50);
  assert.equal(squatTop.jointAnglesDeg.knee, 176);
  assert.ok(squatBottom.jointAnglesDeg.knee <= 86);
});
