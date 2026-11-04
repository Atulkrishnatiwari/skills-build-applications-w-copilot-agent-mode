import { CapabilityCard } from './CapabilityCard.js';

import { getJson } from '../api/client.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

const loadLeaderboard = () => getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard').then(({ leaderboard }) => leaderboard);

export default function Leaderboard() {
  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      emptyMessage="No leaderboard rankings yet."
      load={loadLeaderboard}
      renderItem={(entry) => <>#{entry.rank} {entry.teamName} · {entry.totalPoints} points</>}
    />
  );
}
