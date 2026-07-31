import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const workspaceRoot = path.resolve(__dirname, '..');
const packageJson = JSON.parse(
  readFileSync(path.join(workspaceRoot, 'package.json'), 'utf8'),
) as { scripts: Record<string, string> };

describe('development scripts', () => {
  it('runs the Expo Android command through npm on the current platform', () => {
    const npmExecPath = process.env.npm_execpath;

    expect(npmExecPath).toBeDefined();
    expect(() => execFileSync(
      process.execPath,
      [npmExecPath!, 'run', 'android', '--', '--help'],
      {
        cwd: workspaceRoot,
        stdio: 'pipe',
      },
    )).not.toThrow();
  });

  it('starts the configured AVD through the SDK executable on PATH', () => {
    expect(packageJson.scripts.emulator).toBe('emulator -avd Medium_Phone');
  });
});
