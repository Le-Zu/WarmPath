import { basePrisma } from '../src/lib/prisma';

/**
 * Maintenance script to ensure every account has LinkedIn and Handshake links.
 * Generates "fake" ones if they are missing.
 */
async function populateSocials() {
    console.log('--- [Maintenance] Starting Socials Profile Population ---');
    try {
        const users = await basePrisma.users.findMany({
            where: { is_active: true }
        });

        console.log(`Found ${users.length} active users to process.`);

        let updatedCount = 0;
        for (const user of users) {
            let needsUpdate = false;
            const data: any = {};

            if (!user.linkedin_url) {
                const firstName = user.first_name || 'User';
                const lastName = user.last_name || user.user_id.slice(0, 4);
                const nameSlug = `${firstName.toLowerCase()}-${lastName.toLowerCase()}`.replace(/\s+/g, '-');
                data.linkedin_url = `https://www.linkedin.com/in/${nameSlug}-${user.user_id.slice(0, 8)}/`;
                needsUpdate = true;
            }

            if (!(user as any).handshake_url) {
                const firstName = user.first_name || 'User';
                const lastName = user.last_name || user.user_id.slice(0, 4);
                const nameSlug = `${firstName.toLowerCase()}-${lastName.toLowerCase()}`.replace(/\s+/g, '-');
                // Reference: https://app.joinhandshake.com/profiles/lenin-zuna
                data.handshake_url = `https://app.joinhandshake.com/profiles/${nameSlug}-${user.user_id.slice(0, 6)}`;
                needsUpdate = true;
            }

            if (needsUpdate) {
                await basePrisma.users.update({
                    where: { user_id: user.user_id },
                    data
                });
                console.log(`Updated user ${user.email}: ${data.linkedin_url || 'N/A'} | ${data.handshake_url || 'N/A'}`);
                updatedCount++;
            }
        }

        console.log(`\n--- [Maintenance] Success: Updated ${updatedCount} users. ---`);
    } catch (error) {
        console.error('--- [Maintenance] Socials Population FAILED ---', error);
    } finally {
        await basePrisma.$disconnect();
        process.exit(0);
    }
}

populateSocials();
