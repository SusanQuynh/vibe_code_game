// Manual deploy to GitHub Pages (no Actions): build with base /vibe_code_game/
// then push the contents of dist/ to the gh-pages branch. Run: npm run deploy
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const run = (cmd, opts = {}) => execSync(cmd, { stdio: 'inherit', ...opts });
const out = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim();

const remote = out('git remote get-url origin');
const sha = out('git rev-parse --short HEAD');

run('npm run build', { env: { ...process.env, GITHUB_ACTIONS: 'true' } });  // GITHUB_ACTIONS enables base '/vibe_code_game/'
fs.writeFileSync('dist/.nojekyll', '');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gh-pages-'));
fs.cpSync('dist', tmp, { recursive: true });
const git = (c) => run(`git ${c}`, { cwd: tmp });
git('init -q -b gh-pages');
git('add -A');
git(`-c user.name="deploy" -c user.email="deploy@users.noreply.github.com" commit -q -m "deploy ${sha}"`);
git(`push -f ${JSON.stringify(remote)} gh-pages:gh-pages`);
fs.rmSync(tmp, { recursive: true, force: true });
console.log('\nPushed to the gh-pages branch (from commit ' + sha + ').');
