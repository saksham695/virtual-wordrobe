// The whole check in one command: engine tests, tagging/detection evals when fixtures exist, and the
// styling bench held to its recorded floor. A styling change that scores worse fails here before it ships.
// Run: pnpm check
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
const run = (cmd, args) => spawnSync(cmd, args, { encoding: 'utf8', stdio: 'pipe', shell: true });
let failed = 0;
const step = (name, ok, detail = '') => { console.log(`${ok ? '  ok  ' : '  FAIL'} ${name}${detail ? ' — ' + detail : ''}`); if (!ok) failed++; };

console.log('\nENGINE');
const t = run('pnpm', ['-F', 'engine', 'test', '--', '--run']);
step('engine tests', t.status === 0, (t.stdout || t.stderr || '').trim().split('\n').pop());

console.log('\nEVALS');
for (const [name, dir, script] of [['tagging', 'knowledge/eval/tagging', 'scripts/eval-tagging.mjs'], ['detection', 'knowledge/eval/detection', 'scripts/eval-detect.mjs']]) {
  if (!fs.existsSync(dir)) { console.log(`  skip  ${name} — no fixtures at ${dir}`); continue; }
  const r = run('node', [script]); step(name, r.status === 0, (r.stdout || r.stderr || '').trim().split('\n').pop());
}

console.log('\nBENCH');
if (!fs.existsSync('bench/FLOOR.json')) console.log('  skip  bench — bench/FLOOR.json not set yet (T15)');
else { const b = run('pnpm', ['-F', 'engine', 'bench:score']); step('bench vs floor', b.status === 0, (b.stdout || b.stderr || '').trim().split('\n').pop()); }

console.log(failed ? `\n${failed} check(s) failed` : '\nall checks pass');
process.exit(failed ? 1 : 0);
