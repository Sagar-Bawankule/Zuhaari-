/**
 * Scoring — round result calculation.
 *
 * Extensible structure: cumulative match points, penalties,
 * and multi-round scoring can be added here later.
 */
import { TOTAL_HANDS, type TeamId } from '@shared/constants';
import type { CuttDecision, CompletedHand, RoundResult } from '@shared/types/index';

/**
 * Calculate the round result after all 9 hands are complete.
 */
export function calculateRoundResult(
  completedHands: CompletedHand[],
  cuttDecision: CuttDecision,
  teamHandsWon: Record<TeamId, number>,
): RoundResult {
  if (completedHands.length !== TOTAL_HANDS) {
    throw new Error(`Expected ${TOTAL_HANDS} completed hands, got ${completedHands.length}`);
  }

  const declaringTeam = cuttDecision.declaringTeam;
  const declaringTeamWins = teamHandsWon[declaringTeam];
  const cuttTargetMet = declaringTeamWins >= cuttDecision.target;

  // If declaring team met target, they win. Otherwise, opposing team wins.
  let winningTeam: TeamId;
  if (cuttTargetMet) {
    winningTeam = declaringTeam;
  } else {
    // Find the other team
    const teams = Object.keys(teamHandsWon) as TeamId[];
    winningTeam = teams.find(t => t !== declaringTeam)!;
  }

  return {
    winningTeam,
    teamHandsWon,
    cuttDecision,
    cuttTargetMet,
    completedHands,
  };
}
