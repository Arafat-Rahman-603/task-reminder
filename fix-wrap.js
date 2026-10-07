const fs = require('fs');
const path = './src/app/dashboard/routines/RoutineClient.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetStr = '<p className="text-xs text-on-surface-variant/80 mt-0.5">';
const replacement = '<p className="text-xs text-on-surface-variant/80 mt-0.5 whitespace-nowrap">';

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacement);
    fs.writeFileSync(path, content, 'utf8');
    console.log('Added whitespace-nowrap to RoutineClient.tsx');
} else {
    console.log('Target string not found');
}
