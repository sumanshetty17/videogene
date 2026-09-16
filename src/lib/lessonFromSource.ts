import { filmFromPrompt } from "@/lib/films";
import type { Lesson } from "@/lib/storyboard";

export function lessonFromSource(source: string, extract = ""): Lesson {
  return filmFromPrompt(source, extract);
}
