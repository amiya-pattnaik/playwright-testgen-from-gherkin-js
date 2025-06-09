// CLI for Playwright testgen

const { Command } = require('commander');
const { processSteps } = require('./generateStepsMap');
const { processTests } = require('./generateTestsFromMap');
const { execSync } = require('child_process');

const program = new Command();

program.name('testgen').description('Generate Playwright test scaffolding from Gherkin specs');

program
  .command('steps')
  .description('Generate stepMap JSON files from feature files')
  .option('--all', 'Parse all .feature files')
  .option('--file <files...>', 'Parse specific .feature file(s)')
  .option('--verbose', 'Print detailed processing info')
  .option('--force', 'Overwrite existing files without warning')
  .option('--watch', 'Watch for file changes and regenerate')
  .action((opts) => processSteps(opts));

program
  .command('tests')
  .description('Generate Page Objects and Playwright test specs from stepMap JSON files')
  .option('--all', 'Generate tests for all step map files')
  .option('--file <files...>', 'Generate tests for specific step map file(s)')
  .option('--force', 'Overwrite existing files without warning')
  .option('--watch', 'Watch for changes and regenerate')
  .option('--verbose', 'Print detailed logs')
  .option('--dry-run', 'Show files that would be created')
  .action((opts) => processTests(opts));

program
  .command('run')
  .description('Execute Playwright tests and optionally generate Allure report')
  .option('--report', 'Generate Allure report after tests')
  .option('--report-only', 'Only generate Allure report (no test execution)')
  .action((opts) => {
    if (opts.reportOnly) {
      console.log('📊 Generating Allure report (report-only mode)...');
      try {
        execSync('npm run allure:generate', { stdio: 'inherit' });
        execSync('npm run allure:open', { stdio: 'inherit' });
      } catch (err) {
        console.error('❌ Failed to generate Allure report:', err.message || err);
      }
      return;
    }

    let testFailed = false;
    try {
      console.log('🚀 Running Playwright tests...');
      execSync('npx playwright test', { stdio: 'inherit' }); // ✅ Playwright CLI
    } catch (err) {
      testFailed = true;
      console.error('⚠️ Some tests failed.');
    }

    if (opts.report) {
      try {
        console.log('📊 Generating Allure report...');
        execSync('npm run allure:generate', { stdio: 'inherit' });
        execSync('npm run allure:open', { stdio: 'inherit' });
      } catch (err) {
        console.error('❌ Failed to generate Allure report:', err.message || err);
      }
    }

    if (testFailed) {
      process.exit(1);
    }
  });

module.exports = program;
