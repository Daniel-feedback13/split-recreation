import type { TeamConfig } from "@/shared/model/socket";

export function createDefaultTeam(index: number): TeamConfig {
  return {
    id: `team-${index + 1}`,
    name: `Team ${index + 1}`,
    score: 0,
    memberIds: [],
  };
}

export function normalizeTeams(count: number, previousTeams: TeamConfig[]): TeamConfig[] {
  const nextTeams = Array.from({ length: count }, (_, index) => {
    const existing = previousTeams[index];

    return existing
      ? {
          ...existing,
          id: existing.id || `team-${index + 1}`,
          name: existing.name || `Team ${index + 1}`,
          score: existing.score ?? 0,
          memberIds: existing.memberIds ?? [],
        }
      : createDefaultTeam(index);
  });

  const seenParticipants = new Set<string>();

  return nextTeams.map((team, index) => ({
    ...team,
    name: team.name || `Team ${index + 1}`,
    score: team.score ?? 0,
    memberIds: team.memberIds.filter((memberId) => {
      if (seenParticipants.has(memberId)) return false;
      seenParticipants.add(memberId);

      return true;
    }),
  }));
}
