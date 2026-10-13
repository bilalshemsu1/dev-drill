import fs from 'fs';

const filePath = 'public/neutralino.js';
let content = fs.readFileSync(filePath, 'utf8');

// Replace the destructive document.body.innerText="" and document.write error handler
const target = 'document.body.innerText="",document.write("<code>NE_CL_IVCTOKN</code>: Neutralinojs application cannot connect with the framework core using <code>NL_TOKEN</code>.")';
const replacement = 'console.warn("NE_CL_IVCTOKN: Neutralino server not detected. Running in browser/web mode.")';

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully patched public/neutralino.js');
} else {
    console.log('Target string not found in public/neutralino.js');
}
