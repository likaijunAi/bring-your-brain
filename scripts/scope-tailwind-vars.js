const fs = require('fs');
const path = require('path');

const cssPath = path.resolve(__dirname, '../styles/content.css');
let css = fs.readFileSync(cssPath, 'utf8');

const scopedVarSelector = `:where([class^="byb-"], [class*=" byb-"]),\n:where([class^="byb-"], [class*=" byb-"]) *,\n:where([class^="byb-"], [class*=" byb-"])::before,\n:where([class^="byb-"], [class*=" byb-"])::after,\n:where([class^="byb-"], [class*=" byb-"]) *::before,\n:where([class^="byb-"], [class*=" byb-"]) *::after`;

css = css.replace(/^\*, ::before, ::after \{/m, `${scopedVarSelector} {`);
css = css.replace(/^::backdrop \{/m, `:where([class^="byb-"], [class*=" byb-"])::backdrop {`);

fs.writeFileSync(cssPath, css);
console.log('[scope-tailwind-vars] Scoped Tailwind variable reset selectors to BYB classes.');
