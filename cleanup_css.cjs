
const fs = require('fs');
const path = 'C:/Users/Usuario/Desktop/oferta/ofertas-app/src/index.css';

try {
    const content = fs.readFileSync(path, 'utf8');
    const lines = content.split(/\r?\n/);

    // 1-based line numbers from view_file:
    // Remove 2306 to 2534 inclusive.
    // 0-based indices: 2305 to 2533.

    // Verify
    // Line 2306 (index 2305) should start with "/* =="
    // Line 2534 (index 2533) should be "}"
    // Line 2535 (index 2534) should start with "/* =="

    const idxStart = 2305;
    const idxEnd = 2533;

    const lineStart = lines[idxStart];
    const lineEnd = lines[idxEnd];
    const lineNext = lines[idxEnd + 1];

    console.log(`Index ${idxStart}: ${lineStart}`);
    console.log(`Index ${idxEnd}: ${lineEnd}`);
    console.log(`Index ${idxEnd + 1}: ${lineNext}`);

    if ((lineStart && lineStart.includes("/* ===")) &&
        (lineEnd && lineEnd.trim() === "}") &&
        (lineNext && lineNext.includes("/* ==="))) {

        console.log("Markers matched. Splicing...");

        // Keep 0 to idxStart (exclusive of idxStart) -> slice(0, 2305) -> indices 0..2304
        const part1 = lines.slice(0, idxStart);
        // Keep from idxEnd + 1 to end -> slice(2534) -> indices 2534..end
        const part2 = lines.slice(idxEnd + 1);

        const newContent = part1.concat(part2).join('\n');
        fs.writeFileSync(path, newContent, 'utf8');
        console.log("Success.");
    } else {
        console.log("Markers mismatch.");
    }

} catch (err) {
    console.error(err);
}
