/**
 * Higgsfield — video and stills for the site's art.
 *
 * Run:  npm run higgsfield -- "<prompt>" [--model <id>] [--out <file>]
 *         video (default model, Seedance 2.5):  [--seconds 5] [--resolution 1080p] [--ratio 16:9]
 *         stills:  --model flux-pro/kontext/max/text-to-image [--ratio 16:9]
 *                  --model /v1/text2image/soul [--size 2048x1152] [--batch 1|4]
 *       npm run higgsfield -- --jobs art/brief.json
 *         runs every job in the file (see JOBS below) and saves each result.
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
import { access, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { config, higgsfield } from "@higgsfield/client/v2";

const MODEL = "bytedance/seedance-2.5/text-to-video";

/**
 * A job file is a JSON array of these. Each is one call to the API and one
 * file on disk; the model decides whether it is a clip or a still, and a
 * Soul `batch` of 4 saves four files with `-1`..`-4` before the extension.
 */
interface Job {
  name: string;
  prompt: string;
  model?: string;
  out: string;
  seconds?: number;
  resolution?: string;
  ratio?: string;
  size?: string;
  batch?: 1 | 4;
  seed?: number;
}

const isStill = (model: string) => /text-to-image|text2image|image-to-image/.test(model);
const isSoul = (model: string) => /text2image\/soul/.test(model);

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
function parseArgs(argv: readonly string[]): Job & { jobs?: string } {
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
  const batch = Number(flags.get("batch") ?? 1);
  if (batch !== 1 && batch !== 4) {
    throw new Error("--batch must be 1 or 4.");
  }
  return {
    name: "cli",
    prompt: words.length > 0 ? words.join(" ") : DEFAULT_PROMPT,
    model: flags.get("model") ?? MODEL,
    seconds,
    resolution: flags.get("resolution") ?? "1080p",
    ratio: flags.get("ratio") ?? "16:9",
    size: flags.get("size") ?? "2048x1152",
    batch,
    seed: flags.has("seed") ? Number(flags.get("seed")) : undefined,
    out: flags.get("out") ?? "",
    jobs: flags.get("jobs"),
  };
}

/** The request body each model wants; the API rejects fields it does not know. */
function inputFor(job: Job): Record<string, unknown> {
  const model = job.model ?? MODEL;
  const seed = job.seed !== undefined ? { seed: job.seed } : {};
  if (isSoul(model)) {
    // enhance_prompt off: the rewriter re-introduces colour and cliché, which
    // is the single most likely way the art system stops being one family.
    return { prompt: job.prompt, width_and_height: job.size ?? "2048x1152", quality: "1080p", batch_size: job.batch ?? 1, enhance_prompt: false, ...seed };
  }
  if (isStill(model)) {
    return { prompt: job.prompt, aspect_ratio: job.ratio ?? "16:9", ...seed };
  }
  return { prompt: job.prompt, duration: job.seconds ?? 5, resolution: job.resolution ?? "1080p", aspect_ratio: job.ratio ?? "16:9", ...seed };
}

async function download(url: string, out: string): Promise<void> {
  // Written through a temp file and renamed, so an interrupted download
  // cannot leave a half-file at a name that looks finished.
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`downloading ${url} failed: HTTP ${res.status}`);
  }
  await mkdir(dirname(out), { recursive: true });
  const tmp = `${out}.part`;
  await writeFile(tmp, Buffer.from(await res.arrayBuffer()));
  await rename(tmp, out);
  console.log(`Saved to ${out}`);
}

async function run(job: Job): Promise<void> {
  const model = job.model ?? MODEL;
  console.log(`[${job.name}] ${model} …`);

  const result = await higgsfield.subscribe(model, {
    input: inputFor(job),
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
    throw new Error(`[${job.name}] ${reason} (request_id ${result.request_id})`);
  }

  // A `completed` status with nothing in it is still not a success — say so
  // rather than printing "undefined".
  const urls = isStill(model) ? (result.images ?? []).map((i) => i.url) : result.video?.url ? [result.video.url] : [];
  if (urls.length === 0) {
    throw new Error(`[${job.name}] completed but returned nothing (request_id ${result.request_id})`);
  }
  urls.forEach((u) => console.log(`URL: ${u}`));

  if (!job.out) return;
  await record(job, urls.length);
  if (urls.length === 1) {
    await download(urls[0], job.out);
    return;
  }
  const dot = job.out.lastIndexOf(".");
  const [stem, ext] = dot > 0 ? [job.out.slice(0, dot), job.out.slice(dot)] : [job.out, ""];
  for (let i = 0; i < urls.length; i += 1) {
    await download(urls[i], `${stem}-${i + 1}${ext}`);
  }
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

  if (args.jobs) {
    const jobs = JSON.parse(await readFile(args.jobs, "utf8")) as Job[];
    if (!Array.isArray(jobs) || jobs.length === 0) {
      throw new Error(`${args.jobs} holds no jobs.`);
    }
    // One at a time, deliberately: a failure names the job it was on, and a
    // partial run leaves every finished file on disk to skip next time.
    const failures: string[] = [];
    for (const job of jobs) {
      if (job.out && (await exists(job.out))) {
        console.log(`[${job.name}] ${job.out} exists, skipping`);
        continue;
      }
      try {
        await run(job);
      } catch (err) {
        failures.push(err instanceof Error ? err.message : String(err));
        console.error(failures[failures.length - 1]);
      }
    }
    if (failures.length) {
      throw new Error(`${failures.length} of ${jobs.length} jobs failed.`);
    }
    return;
  }

  await run(args);
}

/**
 * public/art/manifest.json — what was generated, with what, so any asset can
 * be re-rolled or made at another ratio later. Appended, never rewritten:
 * the history of a family is part of the family.
 */
async function record(job: Job, count: number): Promise<void> {
  const path = "public/art/manifest.json";
  const entries: unknown[] = (await exists(path)) ? JSON.parse(await readFile(path, "utf8")) : [];
  entries.push({ name: job.name, model: job.model ?? MODEL, out: job.out, count, input: inputFor(job), at: new Date().toISOString() });
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(entries, null, 2) + "\n");
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exitCode = 1;
});
