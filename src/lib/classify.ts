export type FilmMode = "lesson" | "story";

const STORY =
  /\b(story|movie|film|tale|legend|adventure|village|demon|dragon|war|battle|attack|knight|kingdom|quest|romance|horror|thriller)\b/i;

export function classifyPrompt(source: string): FilmMode {
  return STORY.test(source) ? "story" : "lesson";
}

export function researchQuery(source: string) {
  return source
    .replace(/^(explain|generate|make|create|teach|show)\s+(me\s+)?(a\s+|an\s+)?/i, "")
    .replace(/\b(video|movie|story|explainer)\b/gi, "")
    .trim()
    .slice(0, 120) || source.slice(0, 80);
}
