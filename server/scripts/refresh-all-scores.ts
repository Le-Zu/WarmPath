import { basePrisma } from '../src/lib/prisma';
import { refreshWarmthScoresForUser } from '../src/services/warmthScorer';

/**
 * Maintenance script to refresh scores for all active users.
 */
async function refreshAllUsers() {
    console.log('--- [Maintenance] Starting Global Warmth Score Refresh ---');
    try {
        const users = await basePrisma.users.findMany({
            where: { is_active: true },
            select: { user_id: true, email: true }
        });

        console.log(`Found ${users.length} active users to process.`);

        for (const user of users) {
            console.log(`\nProcessing user: ${user.email} (${user.user_id})...`);
            await refreshWarmthScoresForUser(user.user_id);
        }

        console.log('\n--- [Maintenance] Global Refresh Complete ---');
    } catch (error) {
        console.error('--- [Maintenance] Global Refresh FAILED ---', error);
    } finally {
        process.exit(0);
    }
}

refreshAllUsers();
