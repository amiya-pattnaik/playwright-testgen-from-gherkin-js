const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const { generateShortName, buildActionLine, buildLocatorChain } = require('./utils');
const { stepMapDir, pageObjectDir, specDir } = require('./config');

function ensureBasePageClass(outputDir) {
  const baseClassPath = path.join(outputDir, 'page.js');

  if (!fs.existsSync(baseClassPath)) {
    const content = `require('dotenv').config();

class Page {
  constructor(page) {
    this.page = page;
  }

  open(pathSegment) {
    const baseUrl = process.env.BASE_URL || 'https://the-internet.herokuapp.com';
    return this.page.goto(\`\${baseUrl}/\${pathSegment}\`);
  }

  getLocatorChain(selectors = []) {
    if (!Array.isArray(selectors) || selectors.length === 0) {
      throw new Error('⚠️ No selectors provided to getLocatorChain');
    }

    const locators = selectors.map(sel => this.page.locator(sel));
    const chained = locators.slice(1).reduce((acc, loc) => acc.or(loc), locators[0]);

    chained.first().waitFor({ state: 'visible', timeout: 2000 }).then(() => {
      console.log(\`✅ Matched one of selectors: \${selectors.join(' | ')}\`);
    }).catch(() => {
      console.warn(\`❌ None of the selectors resolved: \${selectors.join(' | ')}\`);
    });

    return chained;
  }
}

module.exports = Page;`;

    fs.mkdirSync(path.dirname(baseClassPath), { recursive: true });
    fs.writeFileSync(baseClassPath, content, 'utf-8');
    console.log('✅ Created base Page class for Playwright');
  }
}

function extractPathSegment(stepMap, fallback) {
  for (const steps of Object.values(stepMap)) {
    for (const step of steps) {
      if (/navigate|go to|open/i.test(step.note || '')) {
        const doc = require('compromise')(step.note);
        const nouns = doc.nouns().out('array');
        if (nouns.length > 0) {
          return nouns[0].toLowerCase().replace(/\s+/g, '-');
        }
      }
    }
  }
  return fallback.toLowerCase().replace(/\s+/g, '-');
}

function generateCodeFromStepMap(file, stepMap, opts) {
  const baseName = path.basename(file, '.stepMap.json');
  const pageClassName = `${baseName.charAt(0).toUpperCase()}${baseName.slice(1)}Page`;
  const usedSelectors = new Map();
  const scenarioMethods = [];

  for (const steps of Object.values(stepMap)) {
    for (const step of steps) {
      const methodName = step.selectorName;
      if (!usedSelectors.has(methodName)) {
        const selectors = [step.selector, ...(Array.isArray(step.fallbackSelector) ? step.fallbackSelector : [])]
          .filter((v, i, a) => a.indexOf(v) === i);
        usedSelectors.set(methodName, { methodName, selectors });
      }
    }
  }

  const defaultPath = extractPathSegment(stepMap, baseName);

  const pageLines = [
    `const Page = require('./page');`,
    `class ${pageClassName} extends Page {`,
    `  constructor(page) {`,
    `    super(page);`,
    `  }`
  ];

  for (const { methodName, selectors } of usedSelectors.values()) {
    const quoted = selectors.map(s => `'${s}'`).join(', ');
    pageLines.push(`  get ${methodName}() {`);
    pageLines.push(`    return this.getLocatorChain([${quoted}]);`);
    pageLines.push('  }');
  }

  for (const [scenarioName, steps] of Object.entries(stepMap)) {
    const scenarioMethodName = generateShortName(scenarioName);
    scenarioMethods.push(scenarioMethodName);
    pageLines.push(`  async ${scenarioMethodName}() {`);
    for (const step of steps) {
      const methodName = step.selectorName;
      const actionLine = buildActionLine(`this.${methodName}`, step.action, step.note);
      if (actionLine) pageLines.push(`    ${actionLine}`);
    }
    pageLines.push('  }');
  }

  // <-- your new open(pathSegment = ...) logic -->
  pageLines.push(`  open(pathSegment = '${defaultPath}') {`);
  pageLines.push(`    return super.open(pathSegment);`);
  pageLines.push('  }');

  pageLines.push('}');
  pageLines.push(`module.exports = ${pageClassName};`);

  const testLines = [
    `const { test, expect } = require('@playwright/test');`,
    `const ${pageClassName} = require('../pageobjects/${baseName}.page');`,
    ``,
    `test.describe('${baseName.replace(/-/g, ' ')} feature tests', () => {`
  ];

  for (const [scenarioName, steps] of Object.entries(stepMap)) {
    const scenarioMethodName = generateShortName(scenarioName);
    testLines.push(`  test('${scenarioMethodName}', async ({ page }) => {`);
    testLines.push(`    const pageObj = new ${pageClassName}(page);`);
    testLines.push(`    await pageObj.open();`);
    for (const step of steps) {
      const methodName = step.selectorName;
      const actionLine = buildActionLine(`pageObj.${methodName}`, step.action, step.note);
      if (actionLine) testLines.push(`    ${actionLine}`);
    }
    testLines.push('  });');
  }

  testLines.push('});');

  const pageFilePath = path.join(opts.pageObjectDir, `${baseName}.page.js`);
  const specFilePath = path.join(opts.specDir, `${baseName}.spec.js`);

  if (!opts.force && fs.existsSync(pageFilePath) && fs.existsSync(specFilePath)) {
    console.warn(`⚠️ Skipping ${baseName} (already exists)`);
    return;
  }

  if (!opts.dryRun) {
    fs.writeFileSync(pageFilePath, pageLines.join('\n'), 'utf-8');
    fs.writeFileSync(specFilePath, testLines.join('\n'), 'utf-8');
    console.log(`✅ Generated: ${baseName}.page.js + ${baseName}.spec.js`);
  } else {
    console.log(`[dry-run] Would write: ${pageFilePath}`);
    console.log(`[dry-run] Would write: ${specFilePath}`);
  }
}

function processTests(opts) {
  const resolvedPageObjectDir = opts.pageObjectDir || pageObjectDir;
  const resolvedSpecDir = opts.specDir || specDir;

  if (!fs.existsSync(resolvedPageObjectDir)) fs.mkdirSync(resolvedPageObjectDir, { recursive: true });
  if (!fs.existsSync(resolvedSpecDir)) fs.mkdirSync(resolvedSpecDir, { recursive: true });

  ensureBasePageClass(resolvedPageObjectDir);

  const files = opts.all
    ? fs.readdirSync(stepMapDir).filter(f => f.endsWith('.stepMap.json'))
    : opts.file || [];

  if (!files.length) {
    console.error('❌ Please provide --all or --file <file>');
    process.exit(1);
  }

  files.forEach(file => {
    const fullPath = path.join(stepMapDir, file);
    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️ Step map not found: ${file}`);
      return;
    }
    const stepMap = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
    generateCodeFromStepMap(file, stepMap, {
      ...opts,
      pageObjectDir: resolvedPageObjectDir,
      specDir: resolvedSpecDir
    });
  });

  if (opts.watch) {
    chokidar.watch(stepMapDir, { ignoreInitial: true }).on('all', (event, filepath) => {
      if (filepath.endsWith('.stepMap.json')) {
        console.log(`🔁 Detected change: ${event} - ${filepath}`);
        processTests({ ...opts, file: [path.basename(filepath)] });
      }
    });
    console.log('👀 Watching for step map changes...');
  }
}

function generateTestSpecs({
  stepMapDir: userDir,
  outputDir = path.join(process.cwd(), 'tests'),
  dryRun = false,
  watch = false
}) {
  const targetDir = userDir || path.join(process.cwd(), 'stepMaps');
  const resolvedPageObjectDir = path.resolve(outputDir, 'pageobjects');
  const resolvedSpecDir = path.resolve(outputDir, 'specs');

  if (!fs.existsSync(resolvedPageObjectDir)) fs.mkdirSync(resolvedPageObjectDir, { recursive: true });
  if (!fs.existsSync(resolvedSpecDir)) fs.mkdirSync(resolvedSpecDir, { recursive: true });

  ensureBasePageClass(resolvedPageObjectDir);

  const files = fs.readdirSync(targetDir).filter(f => f.endsWith('.stepMap.json'));

  for (const file of files) {
    const fullPath = path.join(targetDir, file);
    const stepMap = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
    generateCodeFromStepMap(file, stepMap, {
      dryRun,
      pageObjectDir: resolvedPageObjectDir,
      specDir: resolvedSpecDir,
      force: true
    });
  }

  if (watch) {
    chokidar.watch(targetDir, { ignoreInitial: true }).on('all', (event, filepath) => {
      if (filepath.endsWith('.stepMap.json')) {
        const stepMap = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
        generateCodeFromStepMap(path.basename(filepath), stepMap, {
          dryRun,
          pageObjectDir: resolvedPageObjectDir,
          specDir: resolvedSpecDir,
          force: true
        });
      }
    });
    console.log('👀 Watching for step map changes...');
  }
}

module.exports = {
  processTests,
  generateTestSpecs
};
