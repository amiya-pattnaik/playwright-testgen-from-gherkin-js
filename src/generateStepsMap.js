const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const { Parser, AstBuilder, GherkinClassicTokenMatcher } = require('@cucumber/gherkin');
const { IdGenerator } = require('@cucumber/messages');

const { featureDir, stepMapDir, selectorAliases, selectorFallbacks } = require('./config');
const { generateShortName, extractQuotedText } = require('./utils');

const parser = new Parser(new AstBuilder(IdGenerator.uuid()), new GherkinClassicTokenMatcher());

const validTagMap = {
  click: ['button', 'a', 'input[type="submit"]', 'input[type="button"]'],
  setValue: ['input', 'textarea', 'input[type="text"]', 'input[type="email"]', 'input[type="number"]', 'input[type="tel"]'],
  selectDropdown: ['select', '[role="combobox"]', '.dropdown'],
  uploadFile: ['input[type="file"]'],
  clearText: ['input', 'textarea'],
  scrollTo: ['div', 'section', 'main'],
  hover: ['button', 'a', 'img', '[role="button"]'],
  waitForVisible: ['*'],
  assertVisible: ['*'],
  assertText: ['*'],
  assertEnabled: ['*'],
  assertDisabled: ['*'],
  assertTitle: ['title'],
  assertUrlContains: ['*']
};

function isSelectorValidForAction(selector, action) {
  const validTags = validTagMap[action] || ['*'];
  if (validTags.includes('*')) return true;
  return validTags.some(tag => selector.includes(tag));
}

function toLogicalSelectorName(stepText) {
  const patterns = [
    { regex: /username|user name|email/i, name: 'userNameField' },
    { regex: /password/i, name: 'passwordField' },
    { regex: /login|submit/i, name: 'loginButton' },
    { regex: /dropdown.*country|country.*dropdown/i, name: 'countryDropdown' },
    { regex: /checkbox/i, name: 'termsCheckbox' },
    { regex: /link/i, name: 'link' },
    { regex: /title/i, name: 'pageTitle' },
    { regex: /url/i, name: 'currentUrl' },
    { regex: /welcome message/i, name: 'welcomeBanner' },
    { regex: /profile picture/i, name: 'avatar' },
    { regex: /search/i, name: 'searchBox' },
    { regex: /logout/i, name: 'logoutButton' },
    { regex: /add to cart|cart/i, name: 'addToCartButton' },
    { regex: /checkout/i, name: 'checkoutButton' },
    { regex: /menu|hamburger/i, name: 'menuToggle' },
    { regex: /language/i, name: 'languageSelector' },
    { regex: /payment method/i, name: 'paymentMethodDropdown' },
    { regex: /card number/i, name: 'cardNumberField' },
    { regex: /cvv/i, name: 'cvvField' },
    { regex: /expiry date/i, name: 'expiryDateField' },
    { regex: /mobile number|phone/i, name: 'mobileNumberField' },
    { regex: /otp/i, name: 'otpField' },
    { regex: /account number|iban/i, name: 'accountNumberField' },
    { regex: /transaction id|txn id/i, name: 'transactionIdField' },
    { regex: /policy number/i, name: 'policyNumberField' },
    { regex: /claim id/i, name: 'claimIdField' },
    { regex: /medical record|mrn/i, name: 'medicalRecordNumber' },
    { regex: /patient name/i, name: 'patientNameField' },
    { regex: /doctor name/i, name: 'doctorNameField' },
    { regex: /appointment date/i, name: 'appointmentDatePicker' },
    { regex: /shipping address/i, name: 'shippingAddressField' }
  ];
  const found = patterns.find(p => p.regex.test(stepText));
  return found ? found.name : generateShortName(stepText);
}

function inferActionAndSelector(stepText) {
  const text = stepText.toLowerCase();
  const selectorName = toLogicalSelectorName(stepText);
  let action = 'unknown';
  let note = '';

  if (/enters?|types?|provides?|inputs?|fills?\s*(in|the|with)?|sets?/.test(text)) {
    action = 'setValue';
    note = extractQuotedText(stepText);
  } else if (/clicks|click|presses|taps/.test(text)) {
    action = 'click';
  } else if (/hovers/.test(text)) {
    action = 'hover';
  } else if (/uploads/.test(text)) {
    action = 'uploadFile';
    note = extractQuotedText(stepText);
  } else if (/selects|chooses/.test(text)) {
    action = 'selectDropdown';
    note = extractQuotedText(stepText);
  } else if (/scrolls? to/.test(text)) {
    action = 'scrollTo';
  } else if (/clears?/.test(text)) {
    action = 'clearText';
  } else if (/waits? for.*visible/.test(text)) {
    action = 'waitForVisible';
  } else if (/should see|sees/.test(text)) {
    action = 'assertVisible';
  } else if (/should have text/.test(text)) {
    action = 'assertText';
    note = extractQuotedText(stepText);
  } else if (/should be enabled/.test(text)) {
    action = 'assertEnabled';
  } else if (/should be disabled/.test(text)) {
    action = 'assertDisabled';
  } else if (/title should be/.test(text)) {
    action = 'assertTitle';
    note = extractQuotedText(stepText);
  } else if (/url should contain/.test(text)) {
    action = 'assertUrlContains';
    note = extractQuotedText(stepText);
  }

  const selector = selectorAliases[selectorName] || `[data-testid="${selectorName}"]`;
  const fallbackSelector = selectorFallbacks[selectorName] || [];

  return {
    action,
    selectorName,
    selector,
    fallbackSelector,
    note
  };
}


function generateStepMap(featurePath, opts = {}) {
  const content = fs.readFileSync(featurePath, 'utf-8');
  const gherkinDocument = parser.parse(content);
  const feature = gherkinDocument.feature;
  if (!feature) return;

  const featureName = path.basename(featurePath, '.feature');
  const stepMap = {};

  for (const child of feature.children || []) {
    if (!child.scenario) continue;
    const scenario = child.scenario;
    stepMap[scenario.name] = [];
    for (const step of scenario.steps || []) {
      const entry = inferActionAndSelector(step.text);
      stepMap[scenario.name].push(entry);
    }
  }

  const outPath = path.join(opts.outputPath || stepMapDir, `${featureName}.stepMap.json`);
  if (!opts.force && fs.existsSync(outPath)) {
    console.warn(`⚠️ Skipping ${featureName} (already exists)`);
    return;
  }

  const formatted = JSON.stringify(stepMap, null, 2).replace(/"fallbackSelector": \[(.*?)\]/gs, (match, contents) => {
    const inline = contents.split(',').map(s => s.trim()).join(', ');
    return `"fallbackSelector": [ ${inline} ]`;
  });

  fs.writeFileSync(outPath, formatted, 'utf-8');
  console.log(`✅ Generated step map: ${featureName}.stepMap.json`);
}

function processSteps(opts) {
  if (!fs.existsSync(stepMapDir)) fs.mkdirSync(stepMapDir, { recursive: true });

  const files = opts.all
    ? fs.readdirSync(featureDir).filter(f => f.endsWith('.feature'))
    : opts.file || [];

  if (!files.length) {
    console.error('❌ Please provide --all or --file <file>');
    process.exit(1);
  }

  files.forEach(file => {
    const fullPath = path.join(featureDir, file);
    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️ File not found: ${file}`);
    } else {
      generateStepMap(fullPath, {
        outputPath: opts.outputPath || path.join(process.cwd(), 'stepMaps'),
        force: opts.force
      });

    }
  });

  if (opts.watch) {
    chokidar.watch(featureDir, { ignoreInitial: true }).on('all', (event, filepath) => {
      if (filepath.endsWith('.feature')) {
        console.log(`🔁 Detected change: ${event} - ${filepath}`);
        generateStepMap(filepath, { force: true });
      }
    });
    console.log('👀 Watching for feature changes...');
  }
}

function generateStepMaps({
  featuresPath = path.join(process.cwd(), 'features'),
  outputPath = path.join(process.cwd(), 'stepMaps'),
  force = true,
  watch = false
}) {
  if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath, { recursive: true });

  const files = fs.readdirSync(featuresPath).filter(f => f.endsWith('.feature'));

  for (const file of files) {
    const fullPath = path.join(featuresPath, file);
    generateStepMap(fullPath, { outputPath, force });
  }

  if (watch) {
    chokidar.watch(featuresPath, { ignoreInitial: true }).on('all', (event, filepath) => {
      if (filepath.endsWith('.feature')) {
        console.log(`🔁 Detected change: ${event} - ${filepath}`);
        generateStepMap(filepath, { outputPath, force: true });
      }
    });
    console.log('👀 Watching for feature changes...');
  }
}


module.exports = {
  processSteps,
  generateStepMaps
};
