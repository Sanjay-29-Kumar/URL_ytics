import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const src = path.join(__dirname, 'public/_redirects');
const dest = path.join(__dirname, 'dist/_redirects');

try {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log('✓ Successfully copied _redirects to dist/ folder');
  } else {
    console.warn('⚠ Source file public/_redirects does not exist');
  }
} catch (error) {
  console.error('✗ Failed to copy _redirects:', error.message);
  process.exit(1);
}
