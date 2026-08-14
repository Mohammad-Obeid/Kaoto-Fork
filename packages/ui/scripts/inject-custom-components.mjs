import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

const COMPONENTS_FILE = resolve(__dirname, '../custom-components/components.json');
const COMPONENTS_PATTERN = /camel-catalog-aggregate-components-/;

function resolveCatalogRoot() {
  try {
    return dirname(require.resolve('@kaoto/camel-catalog/index.json'));
  } catch (error) {
    throw new Error(
      `Could not find '@kaoto/camel-catalog'. Run yarn install first.\n\n${error}`,
    );
  }
}

function collectComponentCatalogFiles(dir, files = []) {
  if (!existsSync(dir)) {
    return files;
  }

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      collectComponentCatalogFiles(fullPath, files);
      continue;
    }

    if (COMPONENTS_PATTERN.test(entry) && entry.endsWith('.json')) {
      files.push(fullPath);
    }
  }

  return files;
}

function inject() {
  if (!existsSync(COMPONENTS_FILE)) {
    throw new Error(`Missing custom components file: ${COMPONENTS_FILE}`);
  }

  const customComponents = JSON.parse(readFileSync(COMPONENTS_FILE, 'utf8'));
  const customKeys = Object.keys(customComponents);

  if (customKeys.length === 0) {
    console.warn('No custom components found to inject.');
    return;
  }

  const catalogRoot = resolveCatalogRoot();
  const catalogFiles = collectComponentCatalogFiles(catalogRoot);

  if (catalogFiles.length === 0) {
    throw new Error(`No component catalog files found under ${catalogRoot}`);
  }

  let updated = 0;

  for (const file of catalogFiles) {
    const catalog = JSON.parse(readFileSync(file, 'utf8'));
    let changed = false;

    for (const key of customKeys) {
      const before = JSON.stringify(catalog[key]);
      const after = JSON.stringify(customComponents[key]);
      if (before !== after) {
        catalog[key] = customComponents[key];
        changed = true;
      }
    }

    if (changed) {
      writeFileSync(file, `${JSON.stringify(catalog)}\n`);
      updated += 1;
    }
  }

  console.info(
    `Injected ${customKeys.length} custom component(s) into ${updated}/${catalogFiles.length} catalog file(s).`,
  );
  console.info(`Components: ${customKeys.join(', ')}`);
}

inject();
