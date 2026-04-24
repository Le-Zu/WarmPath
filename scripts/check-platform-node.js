import { readFileSync } from 'fs';
import { join } from 'path';

const VERCEL_URL = 'https://vercel.com/docs/functions/runtimes/node-js/node-js-versions';
const RENDER_URL = 'https://render.com/docs/node-version';

async function fetchVersions(url) {
    try {
        const response = await fetch(url);
        const text = await response.text();
        // Look for patterns like "Node.js 22", "Node.js 24", "Node 20", etc.
        const matches = text.match(/(?:Node\.js|Node)\s+(\d+)/gi) || [];
        const versions = [...new Set(matches.map(m => parseInt(m.match(/\d+/)[0])))];
        // Filter for Even numbers (LTS)
        return versions.filter(v => v % 2 === 0);
    } catch (error) {
        console.error(`[Error] Failed to fetch ${url}:`, error.message);
        return [];
    }
}

async function checkPlatforms() {
    console.log('🔍 Checking latest LTS Node.js versions on Vercel and Render...');

    const [vercelVersions, renderVersions] = await Promise.all([
        fetchVersions(VERCEL_URL),
        fetchVersions(RENDER_URL)
    ]);

    const maxVercel = Math.max(...vercelVersions, 0);
    const maxRender = Math.max(...renderVersions, 0);
    const commonMax = Math.min(maxVercel, maxRender);

    console.log(`✅ Vercel Max LTS: Node ${maxVercel || 'Unknown'}`);
    console.log(`✅ Render Max LTS: Node ${maxRender || 'Unknown'}`);

    // Read current project engine
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));
    const currentEngine = parseInt(pkg.engines.node.match(/\d+/)[0]);

    console.log(`\n📈 Project Current: Node ${currentEngine}`);
    console.log(`🎯 Recommended Max: Node ${commonMax}`);

    if (commonMax > currentEngine) {
        console.log(`\n🚀 UPDATE AVAILABLE! Both platforms now support Node ${commonMax}.`);
        console.log(`👉 Run: npm run upgrade:node --version=${commonMax}`);
    } else if (commonMax < currentEngine) {
        console.log(`\n⚠️  WARNING: Your project uses Node ${currentEngine}, but one platform only supports up to Node ${commonMax}.`);
        console.log(`👉 Consider downgrading to avoid build failures.`);
    } else {
        console.log('\n✨ You are using the latest LTS version supported by both platforms.');
    }
}

checkPlatforms();
