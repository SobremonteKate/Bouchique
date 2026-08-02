/* =========================================================================
   BOUCHIQUE — local OG-image smoke test
   Renders the same ImageResponse the /api/og function returns, writes the
   PNG to the OS temp dir, and validates signature + dimensions without
   deploying. Artifacts never ship because they land outside public/.
   Usage:  node scripts/test-og.js
   ========================================================================= */

import { mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { buildOgResponse } from "../api/og.js";

const PNG_SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

async function render(name, msg, out, wish) {
  const res = await buildOgResponse(name, msg, wish);
  const bytes = new Uint8Array(await res.arrayBuffer());
  const sigOk = PNG_SIG.every((b, i) => bytes[i] === b);
  const width = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
  const height = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
  // write outside public/ so the artifacts never ship in the build
  const dir = path.join(os.tmpdir(), "bouchique-og-test");
  mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, out), bytes);
  console.log(
    `${out}: png=${sigOk} ${width}x${height} ${(bytes.length / 1024).toFixed(1)} kB (name="${name}" wish="${wish || "—"}")`
  );
  if (!sigOk || width !== 1200 || height !== 630) process.exitCode = 1;
}

await render("Maya", "happy girlfriends day my love", "og-test.png");
await render("Grandma 💖", "", "og-test-long.png");
await render("Leo", "Happy Birthday, sunshine! 🎂", "og-test-birthday.png", "Birthday");
await render("Nina", "Sweet dreams, gorgeous. 🌙", "og-test-goodnight.png", "Goodnight");
await render("Ava", "Missing you a little extra today. 🥺", "og-test-missyou.png", "Miss you");
