import { basePrisma } from '../src/lib/prisma';

async function addHandshakeColumn() {
    console.log('--- [Maintenance] Adding handshake_url column via raw SQL ---');
    try {
        await basePrisma.$executeRawUnsafe(`
            ALTER TABLE users ADD COLUMN IF NOT EXISTS handshake_url VARCHAR(500);
        `);
        console.log('--- [Maintenance] Successfully added handshake_url column ---');
    } catch (error) {
        console.error('--- [Maintenance] FAILED to add column ---', error);
    } finally {
        await basePrisma.$disconnect();
        process.exit(0);
    }
}

addHandshakeColumn();
