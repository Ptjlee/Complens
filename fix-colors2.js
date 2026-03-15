const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let initialContent = content;

            // Replacements
            // 0.8+ is primary text
            content = content.replace(/['"`]rgba\(255,255,255,0\.(?:8|9)\d*['"`]/g, "'var(--color-pl-text-primary)'");
            // 0.6-0.7 is secondary text
            content = content.replace(/['"`]rgba\(255,255,255,0\.(?:55|6|7)\d*['"`]/g, "'var(--color-pl-text-secondary)'");
            // 0.15 - 0.5 is tertiary text
            content = content.replace(/['"`]rgba\(255,255,255,0\.(?:15|2|3|4|5)\d*['"`]/g, "'var(--color-pl-text-tertiary)'");
            
            // 0.05-0.08 is Hover Background
            content = content.replace(/['"`]rgba\(255,255,255,0\.0(?:5|6|7|8)['"`]/g, "'var(--theme-pl-action-hover)'");
            // 0.01-0.04 is Ghost/Subtle Background
            content = content.replace(/['"`]rgba\(255,255,255,0\.0(?:1|2|3|4)['"`]/g, "'var(--theme-pl-action-ghost)'");
            
            // 0.1 is Border
            content = content.replace(/['"`]rgba\(255,255,255,0\.1\d*['"`]/g, "'var(--color-pl-border)'");
            
            // inline fills and strokes in SVGs
            content = content.replace(/fill="rgba\(255,255,255,0\.\d+\)"/g, 'fill="var(--color-pl-text-secondary)"');
            content = content.replace(/stroke="rgba\(255,255,255,0\.\d+\)"/g, 'stroke="var(--color-pl-border)"');

            if (content !== initialContent) {
                fs.writeFileSync(fullPath, content);
                console.log("Updated", fullPath);
            }
        }
    }
}

try {
    processDir(path.join(__dirname, 'apps/web/src/app/(dashboard)'));
    processDir(path.join(__dirname, 'apps/web/src/components'));
    console.log("Done replacing colors");
} catch (e) {
    console.error(e);
}
