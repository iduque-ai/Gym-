import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateEstimated1RM,
  calculateEntryVolumeKg,
  validateWorkoutLogInput,
  createWorkoutLogEntry,
  getInitialSeedWorkoutLogs,
  summarizeExerciseProgress,
  calculateOverallProgress,
  getSmartCoachRecommendation,
} from './progressEngine';

test('calculateEstimated1RM and calculateEntryVolumeKg compute exact Epley 1RM and tonnage', () => {
  // 100 kg x 10 reps => 100 * (1 + 10/30) = 133.3 kg
  assert.equal(calculateEstimated1RM(100, 10), 133.3);
  assert.equal(calculateEstimated1RM(100, 1), 100);
  assert.equal(calculateEntryVolumeKg(80, 8, 4), 2560);
});

test('validateWorkoutLogInput rejects invalid or empty values and accepts valid metrics', () => {
  const invalid = validateWorkoutLogInput({
    weightKg: '',
    reps: 0,
    sets: -2,
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.weightKg);
  assert.ok(invalid.errors.reps);
  assert.ok(invalid.errors.sets);

  const valid = validateWorkoutLogInput({
    weightKg: '92.5',
    reps: '8',
    sets: '4',
  });
  assert.equal(valid.valid, true);
});

test('summarizeExerciseProgress and calculateOverallProgress aggregate historical metrics and PRs', () => {
  const logs = getInitialSeedWorkoutLogs();
  assert.ok(logs.length >= 16);

  const squatSummary = summarizeExerciseProgress(logs, 'back_squat');
  assert.equal(squatSummary.entriesCount, 5);
  assert.equal(squatSummary.latestWeightKg, 92.5);
  assert.equal(squatSummary.bestWeightKg, 92.5);
  assert.ok(squatSummary.improvementPct > 10);

  // Add a new PR entry and verify metrics update
  const newEntry = createWorkoutLogEntry({
    dateISO: '2026-11-18',
    exerciseId: 'back_squat',
    weightKg: 97.5,
    reps: 8,
    sets: 4,
    rir: 1,
    notes: 'Nuevo PR verificado',
  });
  const updatedLogs = [...logs, newEntry];
  const updatedSquat = summarizeExerciseProgress(updatedLogs, 'back_squat');
  assert.equal(updatedSquat.entriesCount, 6);
  assert.equal(updatedSquat.bestWeightKg, 97.5);

  const overall = calculateOverallProgress(updatedLogs);
  assert.equal(overall.totalLogsCount, logs.length + 1);
  assert.ok(overall.totalVolumeLiftedKg > 30000);
  assert.ok(overall.personalRecordsCount >= 5);

  const coach = getSmartCoachRecommendation(updatedSquat, 'hipertrofia');
  assert.equal(coach.nextTargetWeightKg, 100);
});
