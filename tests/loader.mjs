import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

export async function resolve(specifier, context, nextResolve) {
  let targetPath = null;

  if (specifier.startsWith('@/')) {
    targetPath = path.resolve(process.cwd(), 'src', specifier.slice(2));
  } else if (specifier.startsWith('./') || specifier.startsWith('../')) {
    if (context.parentURL) {
      const parentDir = path.dirname(fileURLToPath(context.parentURL));
      targetPath = path.resolve(parentDir, specifier);
    }
  }

  if (targetPath) {
    const candidates = [
      targetPath,
      targetPath + '.ts',
      targetPath + '.tsx',
      targetPath + '.js',
      path.join(targetPath, 'index.ts'),
      path.join(targetPath, 'index.tsx'),
      path.join(targetPath, 'index.js'),
    ];

    for (const cand of candidates) {
      if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
        return nextResolve(pathToFileURL(cand).href, context);
      }
    }
  }

  return nextResolve(specifier, context);
}
