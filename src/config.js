const fs = require('fs');
const path = require('path');

const rootDir = __dirname.includes('src') ? path.resolve(__dirname, '..') : __dirname;

const featureDir = path.join(rootDir, 'features');
const stepMapDir = path.join(rootDir, 'stepMaps');
const testOutputDir = path.join(rootDir, 'tests');

const pageObjectDir = path.join(testOutputDir, 'pageobjects');
const specDir = path.join(testOutputDir, 'specs');

const aliasPath = path.join(rootDir, 'selector-aliases.json');
const selectorAliases = fs.existsSync(aliasPath)
  ? JSON.parse(fs.readFileSync(aliasPath, 'utf-8'))
  : {};

const selectorFallbacks = {
  userNameField: ['#username', 'input[name="username"]', 'input[id="username"]', 'input[type="email"]'],
  passwordField: ['#password', 'input[type="password"]'],
  loginButton: ['button:has-text("Login")'],
  countryDropdown: ['#country', 'select[name="country"]'],
  termsCheckbox: ['#terms', 'input[type="checkbox"]'],
  link: ['a'],
  pageTitle: ['h1', 'title'],
  currentUrl: ['window.location.href'],
  welcomeBanner: ['#welcome-message', '.welcome'],
  avatar: ['img.profile-picture'],
  iTheHomepage: ['main.home', '[data-testid="homepage"]'],
  theUpdateButton: ['#update', 'button.update'],
  theSaveButton: ['#save', 'button.save'],
  completeTheForm: ['#form-complete', '.form-success']
};

module.exports = {
  featureDir,
  stepMapDir,
  testOutputDir,
  pageObjectDir,
  specDir,
  selectorAliases,
  selectorFallbacks
};
