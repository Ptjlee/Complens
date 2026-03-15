const fs = require('fs');
const path = require('path');

function processDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let initialContent = content;

            // Skipping the PDF generators because they don't have access to browser CSS variables
            if (fullPath.includes('ReportDocument') || fullPath.includes('PortalDocument') || fullPath.includes('PdfOptionsModal')) {
                continue;
            }

            // Replacing the hardcoded standard blue and purple with the brand variables
            content = content.replace(/#3b82f6/gi, 'var(--color-pl-brand)');
            content = content.replace(/#a78bfa/gi, 'var(--color-pl-accent)');

            // Also checking if they were set as rgb explicitly like rgba(59,130,246)
            // But let's only do standard hex since we fixed most RGBA manually or via PayGapChartGrid

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
    console.log("Done replacing brand HEX colors");
} catch (e) {
    console.error(e);
}
