import Anthropic from "@anthropic-ai/sdk";
import type { RecentActivity } from "./db/coach";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT =
  "You are a personal fitness coach. Be honest, specific, and encouraging. Keep feedback under 200 words.";

/** Format pace as "M:SS" string from seconds per km. */
function formatPace(secPerKm: number): string {
  const mins = Math.floor(secPerKm / 60);
  const secs = Math.round(secPerKm % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

function buildUserPrompt(activity: RecentActivity): string {
  const { runs, workouts } = activity;
  const lines: string[] = [];

  // Runs section
  lines.push(`RUNS (${runs.length} total):`);
  if (runs.length === 0) {
    lines.push("  None");
  } else {
    for (const run of runs) {
      const date = run.startedAt.toISOString().slice(0, 10);
      const km = (run.distanceMeters / 1000).toFixed(2);
      const mins = Math.round(run.durationSeconds / 60);
      const pace = formatPace(run.avgPaceSecPerKm);
      const elevation =
        run.elevationGain != null ? `, +${run.elevationGain}m elev` : "";
      lines.push(`- ${date}: ${km} km in ${mins} min, pace ${pace}/km${elevation}`);
    }
  }

  lines.push("");

  // Workouts section
  lines.push(`WORKOUTS (${workouts.length} total):`);
  if (workouts.length === 0) {
    lines.push("  None");
  } else {
    for (const workout of workouts) {
      const date = workout.date.toISOString().slice(0, 10);
      for (const exercise of workout.exercises) {
        const setStr = exercise.sets
          .map((s) => `${s.reps}×${s.weight}${s.weightUnit}`)
          .join(", ");
        lines.push(`- ${date}: ${exercise.name} — ${setStr}`);
      }
    }
  }

  lines.push("");
  lines.push(
    "Here is my training from the last 30 days. Give me: 1) What's going well 2) What's missing 3) One specific focus for next week."
  );

  return lines.join("\n");
}

export async function getCoachingFeedback(
  activity: RecentActivity
): Promise<string> {
  const userPrompt = buildUserPrompt(activity);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const block = message.content[0];
  if (block.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  return block.text;
}
