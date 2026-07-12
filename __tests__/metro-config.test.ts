import path from 'node:path';
import { execFileSync } from 'node:child_process';

describe('Metro config', () => {
  it('keeps watched and module paths inside the standalone workspace', () => {
    const workspaceRoot = path.resolve(__dirname, '..');
    const config = JSON.parse(execFileSync(
      process.execPath,
      ['-e', `const config = require(${JSON.stringify(path.join(workspaceRoot, 'metro.config.js'))}); console.log(JSON.stringify(config));`],
      { encoding: 'utf8' },
    ));
    const configuredPaths = [
      config.projectRoot,
      ...(config.watchFolders ?? []),
      ...(config.resolver.nodeModulesPaths ?? []),
    ];

    expect(configuredPaths.every((configuredPath: string) =>
      path.relative(workspaceRoot, configuredPath) === ''
      || !path.relative(workspaceRoot, configuredPath).startsWith('..'),
    )).toBe(true);
  });
});
