const nlp = require('compromise');

function generateShortName(text) {
  const quoted = text.match(/"(.*?)"/)?.[1];
  if (quoted) {
    return quoted
      .toLowerCase()
      .replace(/[^a-z0-9]/gi, ' ')
      .replace(/\s+(.)/g, (_, c) => c.toUpperCase())
      .replace(/\s/g, '')
      .replace(/^./, str => str.toLowerCase());
  }
  const doc = nlp(text).not('should|be|is|are|the|and|a|to|i|for|have|has|with|of|in|on');
  const terms = doc.nouns().out('array');
  const base = terms.slice(0, 3).join(' ') || text;
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]/gi, ' ')
    .replace(/\s+(.)/g, (_, c) => c.toUpperCase())
    .replace(/\s/g, '')
    .replace(/^./, str => str.toLowerCase());
}

function extractQuotedText(text) {
  const match = text.match(/"(.*?)"/);
  return match ? match[1] : '';
}

// Combines selectors with .or(...) chain
function buildLocatorChain(selectors) {
  if (!selectors || selectors.length === 0) return null;
  return selectors.map(s => `page.locator('${s}')`).reduce((acc, cur) => `${acc}.or(${cur})`);
}

// Playwright-compatible action line
function buildActionLine(locator, action, note) {
  switch (action) {
    case 'click': return `await ${locator}.click();`;
    case 'setText':
    case 'setValue': return `await ${locator}.fill('${note}');`;
    case 'clearText': return `await ${locator}.fill('');`;
    case 'selectDropdown': return `await ${locator}.selectOption({ label: '${note}' });`;
    case 'uploadFile': return `await ${locator}.setInputFiles('${note}');`;
    case 'hover': return `await ${locator}.hover();`;
    case 'scrollTo': return `await ${locator}.scrollIntoViewIfNeeded();`;
    case 'waitForVisible': return `await ${locator}.waitFor({ state: 'visible' });`;
    case 'assertVisible': return `await expect(${locator}).toBeVisible();`;
    case 'assertText': return `await expect(${locator}).toHaveText('${note}');`;
    case 'assertEnabled': return `await expect(${locator}).toBeEnabled();`;
    case 'assertDisabled': return `await expect(${locator}).toBeDisabled();`;
    case 'assertTitle': return `await expect(page).toHaveTitle('${note}');`;
    case 'assertUrlContains': return `await expect(page).toHaveURL(/${note}/);`;
    default: return `// ⚠️ Unsupported action: ${action}`;
  }
}

module.exports = {
  generateShortName,
  extractQuotedText,
  buildLocatorChain,
  buildActionLine
};
