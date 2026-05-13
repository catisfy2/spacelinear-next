/** Average seconds per card for rough session time estimates (UI only). */
export const AVG_SECONDS_PER_REVIEW_CARD = 45;

export function formatEstimatedMinutes(topicCount: number): string {
  if (topicCount <= 0) return '~0 min';
  const minutes = Math.max(1, Math.round((topicCount * AVG_SECONDS_PER_REVIEW_CARD) / 60));
  return `~${minutes} min`;
}
