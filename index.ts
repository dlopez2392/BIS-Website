/**
 * Higgsfield — Seedance 2.5 text-to-video, for the site's hero backdrop.
 *
 * Run:  npm run higgsfield -- "<prompt>" [--seconds 5] [--resolution 1080p]
 *                             [--ratio 16:9] [--out <file>]
 *   (= tsx --env-file=.env.local index.ts — Node 24 loads the env file natively,
 *    so no dotenv dependency.)
 *
 * With no prompt it renders DEFAULT_PROMPT, which is the hero backdrop brief:
 * see the note above it for why the footage is deliberately colourless.
 *
 * `--out` downloads the result next to you instead of only printing a URL,
 * because the generated URL expires and `public/hero/` is where the file has
 * to end up anyway. Then `python3 scripts/hero-encode.py <file> <version>`
 * tints it and writes the VP9 WebM + H.264 MP4 pair — with a NEW version
 * number: `next.config.ts` caches `/hero/:file*` immutably for a year, so a
 * replaced file at the same name is a stale byte nobody can flush.
 *
 * CREDENTIALS. `HF_CREDENTIALS` is `key-id:key-secret` and lives in
 * `.env.local`, which `.gitignore`'s `.env*` rule already covers. It is read
 * here and handed straight to the SDK; it is never logged, printed or written
 * anywhere. The v2 client refuses to run in a browser for the same reason —
 * this is a server-side script by design.
 */
import { Buffer } from "node:buffer";
import { rename, writeFile } from "node:fs/promises";

import { config, higgsfield } from "@higgsfield/client/v2";

const MODEL = "bytedance/seedance-2.5/text-to-video";

/**
 * The hero backdrop brief.
 *
 * COLOURLESS ON PURPOSE. scripts/hero-encode.py lays the brand ramp
 * (violet -> cyan) over this footage with the W3C `color` blend at encode
 * time, which takes the frame's luminance and replaces its hue. Footage that
 * arrives already coloured fights that and lands muddy; near-monochrome
 * footage takes the brand's own hue exactly. So the prompt asks for
 * silver/graphite, not violet.
 *
 * SLOW AND EDGE-WEIGHTED. Since the product stage now sits on the right and
 * the headline on the left, the backdrop has to stay quiet in the middle of
 * the frame and carry its movement at the edges, or it competes with both.
 */
const DEFAULT_PROMPT = [
  "Abstract flowing silk ribbon of light drifting slowly through black space,",
  "silver and graphite tones, no colour cast, soft volumetric glow,",
  "fine particulate dust catching the light, shallow depth of field,",
  "movement concentrated at the left and right edges of the frame while the",
  "centre stays calm and dark, extremely slow hypnotic drift, seamless loop,",
  "cinematic, shot on anamorphic lens, no text, no logos, no people.",
].join(" ");

/** `--flag value` out of argv; positional words become the prompt. */
function parseArgs(argv: readonly string[]): {
  prompt: string;
  seconds: number;
  resolution: string;
  ratio: string;
  out?: string;
} {
  const flags = new Map<string, string>();
  const words: string[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) {
        throw new Error(`${arg} needs a value.`);
      }
      flags.set(arg.slice(2), next);
      i += 1;
    } else {
      words.push(arg);
    }
  }
  const seconds = Number(flags.get("seconds") ?? 5);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new Error("--seconds must be a positive number.");
  }
  return {
    prompt: words.length > 0 ? words.join(" ") : DEFAULT_PROMPT,
    seconds,
    resolution: flags.get("resolution") ?? "1080p",
    ratio: flags.get("ratio") ?? "16:9",
    out: flags.get("out"),
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const credentials = process.env.HF_CREDENTIALS;
  if (!credentials) {
    // Named, never echoed: the point is to say WHICH variable is missing and
    // where it belongs, without putting a secret on a terminal.
    throw new Error(
      "HF_CREDENTIALS is not set. Add it to .env.local as key-id:key-secret.",
    );
  }
  config({ credentials });

  console.log(`Requesting ${MODEL} — ${args.seconds}s, ${args.resolution}, ${args.ratio} …`);

  const result = await higgsfield.subscribe(MODEL, {
    input: {
      prompt: args.prompt,
      duration: args.seconds,
      resolution: args.resolution,
      aspect_ratio: args.ratio,
    },
    // The SDK polls to completion rather than returning a job to chase.
    withPolling: true,
  });

  // ANYTHING BUT `completed` IS A FAILURE, and it is checked as a whitelist
  // rather than a list of known-bad statuses. `V2RequestStatus` is
  // 'queued' | 'in_progress' | 'completed' | 'failed' | 'nsfw' — note it does
  // NOT include 'canceled', even though the response carries a `cancel_url`
  // and a request can be cancelled. A denylist of failed/canceled/nsfw would
  // therefore let a cancelled run fall through and be reported as success.
  if (result.status !== "completed") {
    const reason =
      result.status === "nsfw"
        ? "the request was moderated"
        : result.status === "failed"
          ? "the request failed"
          : `the request ended as "${result.status}"`;
    throw new Error(`${reason} (request_id ${result.request_id})`);
  }

  // A `completed` status with no video is still not a success — say so rather
  // than printing "undefined".
  const url = result.video?.url;
  if (!url) {
    throw new Error(
      `completed but returned no video (request_id ${result.request_id})`,
    );
  }

  console.log(`Video URL: ${url}`);

  if (args.out) {
    // Written through a temp file and renamed, so an interrupted download
    // cannot leave a half-file at a name that looks finished.
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`downloading the video failed: HTTP ${res.status}`);
    }
    const tmp = `${args.out}.part`;
    await writeFile(tmp, Buffer.from(await res.arrayBuffer()));
    await rename(tmp, args.out);
    console.log(`Saved to ${args.out}`);
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
