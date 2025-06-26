![npm](https://img.shields.io/npm/v/playwright-testgen-from-gherkin-js)
![downloads](https://img.shields.io/npm/dm/playwright-testgen-from-gherkin-js)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://playwright.dev/docs/api/class-playwright)
[![Automation Level](https://img.shields.io/badge/automation-100%25-success)](https://playwright.dev/docs/api/class-playwright)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.x-green.svg)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# 🎭 playwright-testgen-from-gherkin-js

Generate Playwright tests and Page Objects from `.feature` files written in Gherkin syntax.

## ✨ Features

- Converts Gherkin steps into `.stepMap.json` with inferred selectors and actions
- Generates Playwright Page Objects with `getLocatorChain()` and fallback selectors
- Auto-generates spec files with clean scenario methods
- CLI and programmatic support
- Domain-aware selector naming (e.g., `cardNumberField`, `otpField`, `menuToggle`)
---

## 📦 Installation

Option 1: Clone for local development

```
git clone git@github.com:amiya-pattnaik/playwright-testgen-from-gherkin-js.git
cd playwright-testgen-from-gherkin-js
npm install
```

Option 2: Install from NPM

```bash
npm install -g playwright-testgen-from-gherkin-js
```
---
## 🧭 Directory Structure

```
your-repo/
├── features/                     # Sample Gherkin .feature files
├── stepMaps/                     # Generated JSON output
├── tests/
│   ├── specs/                    # Generated Playwright test files
│   └── pageobjects/              # Generated Page Object classes
├── src/
│   ├── generateStepMap.js        # core logic to generate .stepMap.json
│   ├── generateTestsFromMap.js   # core logic to generate pageobjects and tests
│   ├── config.js
│   ├── utils.js
│   └── cli.js
├── selector-aliases.json         # optional
├── package.json
├── README.md
└── testgen.js
```

## 🚀 CLI Usage
```bash
🔹 Option A: # One-time setup

npm install -g
npm install -g tsx          # Required for CLI to run with node shebang
chmod +x testgen.js         # Make CLI executable (Mac/Linux)
npm link                    # If fails, try: sudo npm link

⚠️ Now run from anywhere

# Step 1: Generate stepMap.json from the .feature files
testgen steps --all
testgen steps --file login.feature

# Step 2: Generate test code (Page Objects and Mocha Specs) from stepMap.json
testgen tests --all
testgen tests --file login.stepMap.json
testgen tests --file login.stepMap.json --dry-run

# Step 3: Execute tests and generate Allure report
testgen run --report        # ⬅️ Runs tests and generate allure report
testgen run --report-only   # ⬅️ Generate report without rerunning testsbash

🔹 Option B: Local development (without global install)

# Step 1: Generate stepMap.json from the .feature files
npm run dev:steps:all                 
npm run dev:steps:file --file features/login.feature

# Step 2: Generate Page Objects and Mocha Specs from stepMap.json
npm run dev:tests:all       # All stepMaps → PO + specs
npm run dev:tests:file --file login.stepMap.json
pm run dev:tests:file --file login.stepMap.json --dry-run

# Step 3: Execute tests and generate Allure reoprt
npm run test:run                        # Only runs tests
npm run testgen:run -- --report         # ⬅️ Runs tests and generate allure report
npm run testgen:run -- --report-only    # ⬅️ Generate report without rerunning testsbash
```
---

## 📜 Programmatic API Usage

You can use `playwright-testgen-from-gherkin` package both as a CLI tool and as a Node.js module in custom scripts. In your project working directory like any other NPM modules install this package as `npm install playwright-testgen-from-gherkin`

```bash
Example: generate-tests.js

const { generateStepMaps, generateTestSpecs } = require('playwright-testgen-from-gherkin-js');

// Step 1: parse .feature file and Generate stepMap JSON files from .feature files
generateStepMaps({
  featuresPath: './features',      // path to your .feature files. Make sure features folder exist and has .feature files
  outputPath: './stepMaps',        // where to write stepMap JSONs
  watch: false,
  force: true
});

// Step 2: generate test + page object
generateTestSpecs({
  stepMapDir: './stepMaps',        // location of generated stepMaps
  outputDir: './test',             // base directory to create pageobjects/ and specs/
  dryRun: false,
  watch: false
});
```
## 📁 Folder Structure

```
features/           → .feature files (input)
stepMaps/           → auto-generated .stepMap.json
tests/
  ├── pageobjects/  → generated Page Object classes
  └── specs/        → test specs referencing scenario methods
```
---

## ⚙️ Available Commands & Flags

#### `testgen steps`
| Flag         | Description                              |
|--------------|------------------------------------------|
| `--all`      | Parse all feature files                  |
| `--file`     | Parse specific feature file(s)           |
| `--watch`    | Watch for changes                        |
| `--verbose`  | Print detailed logs                      |
|`--dry-run`   | Show files that would be created         |
| `--force`    | Overwrite existing stepMap files         |

#### `testgen tests`
| Flag         | Description                              |
|--------------|------------------------------------------|
| `--all`      | Generate tests for all step maps         |
| `--file`     | Generate tests for specific step maps    |
| `--watch`    | Watch and regenerate on change           |
| `--verbose`  | Print detailed logs                      |
| `--dry-run`  | Show files that would be created         |
| `--force`    | Overwrite existing test files            |

#### `testgen run`
| Flag           | Description                                      |
|----------------|--------------------------------------------------|
| `--report`     | Generate Allure report after test run            |
| `--report-only`| Generate only Allure report (skip running tests) |
---

## 📁 Minimal Example

### `features/login.feature`
```gherkin
Feature: Login
  Scenario: Successful login
    Given I open the login page
    When I enter "admin" into the username field
    And I enter "adminpass" into the password field
    And I click the login button
    Then I should see the dashboard
```

### Generated: `stepMaps/login.stepMap.json`
```json
{
  "Successful login": [
    {
      "action": "setValue",
      "selectorName": "userNameField",
      "selector": "[data-testid=\"userNameField\"]",
      "fallbackSelector": "#username, input[name=\"username\"]",
      "note": "admin"
    },
    {
      "action": "setValue",
      "selectorName": "passwordField",
      "selector": "[data-testid=\"passwordField\"]",
      "fallbackSelector": "#password, input[type=\"password\"]",
      "note": "adminpass"
    },
    {
      "action": "click",
      "selectorName": "loginButton",
      "selector": "[data-testid=\"loginButton\"]",
      "fallbackSelector": "#login, button[type=\"submit\"]",
      "note": ""
    },
    {
      "action": "assertVisible",
      "selectorName": "dashboard",
      "selector": "[data-testid=\"dashboard\"]",
      "fallbackSelector": "",
      "note": ""
    }
  ]
}
```

> Note: Additionally, ensure that you update the relevant selector for the DOM element of your application under test after generating your JSON file. This will serve as your foundation, and your page objects and test spec files will be constructed based on this data.

### Generated: `test/pageobjects/page.js`
```js
require('dotenv').config();

class Page {
  constructor(page) {
    this.page = page;
  }

  open(pathSegment) {
    const baseUrl = process.env.BASE_URL || 'https://the-internet.herokuapp.com';
    return this.page.goto(`${baseUrl}/${pathSegment}`);
  }

  getLocatorChain(selectors = []) {
    if (!Array.isArray(selectors) || selectors.length === 0) {
      throw new Error('⚠️ No selectors provided to getLocatorChain');
    }

    const locators = selectors.map(sel => this.page.locator(sel));
    const chained = locators.slice(1).reduce((acc, loc) => acc.or(loc), locators[0]);

    chained.first().waitFor({ state: 'visible', timeout: 2000 }).then(() => {
      console.log(`✅ Matched one of selectors: ${selectors.join(' | ')}`);
    }).catch(() => {
      console.warn(`❌ None of the selectors resolved: ${selectors.join(' | ')}`);
    });

    return chained;
  }
}

module.exports = Page;
```

### Generated: `test/pageobjects/login.page.js`
```js
const Page = require('./page');
class LoginPage extends Page {
  constructor(page) {
    super(page);
  }
  get loginButton() {
    return this.getLocatorChain(['button:has-text("Login")']);
  }
  get userNameField() {
    return this.getLocatorChain(['#username', 'input[name="username" ]', 'input[id="username"]', 'input[type="email"]']);
  }
  get passwordField() {
    return this.getLocatorChain(['#password', 'input[type="password" ]']);
  }
  get welcomeBanner() {
    return this.getLocatorChain(['#welcome-message', '.welcome']);
  }
  async mySuccessfulLogin() {
    // ⚠️ Unsupported action: unknown
    await this.userNameField.fill('');
    await this.passwordField.fill('');
    await this.loginButton.click();
    await expect(this.welcomeBanner).toBeVisible();
  }
}
module.exports = LoginPage;
```

### Generated: `test/specs/login.spec.js`
```js
const { test, expect } = require('@playwright/test');
const LoginPage = require('../pageobjects/login.page');

test.describe('login feature tests', () => {
  test('mySuccessfulLogin', async ({ page }) => {
    const pageObj = new LoginPage(page);
    await pageObj.open('login');
    // ⚠️ Unsupported action: unknown
    await pageObj.userNameField.fill('adminuser');
    await pageObj.passwordField.fill('adminpassword');
    await pageObj.loginButton.click();
    await expect(pageObj.welcomeBanner).toBeVisible();
    // Or use full scenario:
    // await pageObj.mySuccessfulLogin();
  });
});
```
> Note: It is recommended to examine the generated code and implement any required adjustments to meet your needs, such as invoking methods from test spec files to the page class, incorporating reusable methods, renaming selector name, method name (if any) and managing your test data etc.

---

## ✅ Features Implemented

### 🔁 1. **Two-Step Test Generation Flow**

- **Step 1**: Parse `.feature` files and generate scenario-wise `stepMap.json`.
- **Step 2**: Use `stepMap.json` to auto-generate:
  - Playwright Page Object classes.
  - Playwright test spec files.


### 🧠 2. **AI/NLP-Driven Selector Name Inference**

- Uses the `compromise` NLP library to generate meaningful selector, method names based on verbs/nouns in step text.
- Example:  
  `"When user clicks login"` → `selectorName: "clicklogin"`

### 🧠 3. **Logical Selector + Fallback Selector with priority**

- Applies regex-based matching to map common UI elements to logical names:
  - e.g., `username` → `userNameField`
  - `login` → `loginButton`

- Logical names are mapped to selector and fallbackSelector:
  ```json
  {
    "selector": "[data-testid=\"loginButton\"]",
    "fallbackSelector": "#login, button[type=\"submit\"]",
  }
  ```
 >The `fallbackSelector` is a palce holder for containing more than one alternative selector. At the run time if the primary selector (i.e. "selector": "[data-testid=\"loginButton\"]") fails to locate the element, pick one of the alternative selctor mentioned in the `fallbackSelector`. If it finds the right selector it will log `✅ Matched one of selectors`. If none of the alternative selector found, then it will warn `❌ None of the selectors resolved.

### 🔄 4. **User-Defined Selector Aliases (Optional)**

- Optional file: `selector-aliases.json`. When implemented it overrides the default primary selector ("selector": "#login-username",) of the generated .stepMap.json. If you don't need the selector-aliases.json then either you rename it or delete it from the root.
```json
{
  "userNameField": "#login-username",
  "loginButton": "#login-btn"
}
```
`Priority Order:`

  1. Selector aliases (selector-aliases.json), if exists it will take the first priority over the regex-based default `selector` generated by tool.
  2. Fallback selector

## 🧠 **Supported Actions Example**

Supports a wide range of actions: `setValue`, `click`, `selectDropdown`, `uploadFile`, `hover`, `clearText`, s`crollTo`, `assertVisible`, `assertText`, `assertEnabled`, `assertDisabled`, `assertTitle`, `assertUrlContains`, etc.

| Action    | Description |
| -------- | ------- |
| setValue         | Sets input value    |
| click           | Clicks on the element     |
| hover           | Hovers over an element   |
| doubleClick     | Performs a double-click    |
| selectDropdown  | Selects dropdown option by visible text    |
| uploadFile      | Uploads a file     |
| scrollTo        | Scrolls element into view    |
| assertVisible   | Validates visibility of element    |
| assertText      | Checks element text    |
| clearText       | Clears input field     |
| assertEnabled   | Validates element is enabled    |
| assertDisabled  | Validates element is disabled    |
| assertTitle     | Validates page title    |
| assertUrlContains | Checks partial match on URL     |
| waitForVisible    | Waits until element is visible    |

>Please be advised that any unrecognized actions have been commented out in the generated code for your review. Should you wish to include any additional actions, kindly refer to the source code (src\\) and incorporate the necessary actions, which is quite straightforward. You may utilize any WebdriverIO commands as needed.

---

## 🧰 Troubleshooting

**Error:** `command not found: testgen`  
✅ Run `npm link` again inside the project root.

**Error:** `env: tsx: No such file or directory`  
✅ Install `tsx` globally: `npm install -g tsx`

**Error:** `ENOENT: no such file or directory, open 'package.json'`  
✅ You’re running `npm run` outside the project — run from root.

---


## 📢 Releases and Feedback
Check out the [Releases](https://github.com/amiya-pattnaik/playwright-testgen-from-gherkin-js/issues/releases) tab for version history and improvements.

Want to discuss features or share feedback? Use [GitHub Discussions](https://github.com/amiya-pattnaik/playwright-testgen-from-gherkin-js/issues/discussions) or open an issue.

## 🧑 Author
**Amiya Pattanaik**

For issues, enhancements or feature requests, [open an issue](https://github.com/amiya-pattnaik/playwright-testgen-from-gherkin-js/issues).
