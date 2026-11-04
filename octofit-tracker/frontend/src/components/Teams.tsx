import { CapabilityCard } from './CapabilityCard.js';

import { getJson } from '../api/client.js';

type Team = { name: string; mascot?: string; members: string[] };

const loadTeams = () => getJson<{ teams: Team[] }>('/api/teams').then(({ teams }) => teams);

export default function Teams() {
  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      emptyMessage="No teams yet."
      load={loadTeams}
      renderItem={(team) => <>{team.name}{team.mascot ? ` · ${team.mascot}` : ''} · {team.members.length} members</>}
    />
  );
}
