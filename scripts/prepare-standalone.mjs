import { cp, mkdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const standalone = join(root, '.next', 'standalone');
const copyIntoStandalone = async (source, destination) => {
  try {
    await stat(source);
    await mkdir(destination, { recursive: true });
    await cp(source, destination, { recursive: true });
  } catch (error) {
    if (error && error.code !== 'ENOENT') throw error;
  }
};

await copyIntoStandalone(join(root, 'public'), join(standalone, 'public'));
await copyIntoStandalone(join(root, '.next', 'static'), join(standalone, '.next', 'static'));
