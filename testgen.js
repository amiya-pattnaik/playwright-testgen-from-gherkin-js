#!/usr/bin/env node
const program = require('./src/cli');

// Show help if no args provided
if (process.argv.length <= 2) {
  console.log('ℹ️  No command provided. Use one of the following:');
  console.log('   testgen steps --all');
  console.log('   testgen tests --file <stepMap.json>');
  console.log('   testgen run --report');
  console.log('   testgen run --report-only');
  console.log('\n👉 For help: testgen --help');
  process.exit(1);
}

program.parse(process.argv);

// // Make sure this file has executable permission: chmod +x testgen.js
