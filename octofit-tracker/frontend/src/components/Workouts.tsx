import { CapabilityCard } from './CapabilityCard.js';

import { getJson } from '../api/client.js';

type Workout = { title: string; focus?: string; minutes?: number; difficulty?: string; reason?: string };

const loadWorkouts = () =>
  getJson<{ suggestions: Workout[] }>('/api/workouts/suggestions/mona%40example.com').then(({ suggestions }) => suggestions);

export default function Workouts() {
  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      emptyMessage="No workout suggestions yet."
      load={loadWorkouts}
      renderItem={(workout) => (
        <>
          {workout.title}
          {workout.focus && ` · ${workout.focus}`}
          {workout.minutes !== undefined && ` · ${workout.minutes} minutes`}
          {workout.difficulty && ` · ${workout.difficulty}`}
          {workout.reason && <p>{workout.reason}</p>}
        </>
      )}
    />
  );
}
