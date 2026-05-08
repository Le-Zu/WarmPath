import { basePrisma } from '../src/lib/prisma';

/**
 * Maintenance script to ensure every account has a LinkedIn link.
 * If a user doesn't have one, a "fake" one is generated based on their name.
 */
async function populateLinkedIn() {
    console.log('--- [Maintenance] Starting LinkedIn Profile Population ---');
    try {
        const users = await basePrisma.users.findMany({
            where: { is_active: true }
        });

        console.log(`Found ${users.length} active users to process.`);

        let updatedCount = 0;
        for (const user of users) {
            if (!user.linkedin_url) {
                // Generate a "fake" LinkedIn URL based on their name if available,
                // otherwise use their email prefix.
                const firstName = user.first_name || 'User';
                const lastName = user.last_name || user.user_id.slice(0, 4);
                const nameSlug = `${firstName.toLowerCase()}-${lastName.toLowerCase()}`.replace(/\s+/g, '-');
                
                // Using the reference format: https://www.linkedin.com/in/yiming-zhang-7a7841b/
                // We append a random-ish suffix to make it look realistic.
                const fakeLinkedIn = `https://www.linkedin.com/in/${nameSlug}-${user.user_id.slice(0, 8)}/`;
                
                await basePrisma.users.update({
                    where: { user_id: user.user_id },
                    data: { linkedin_url: fakeLinkedIn }
                });
                console.log(`Updated user ${user.email} -> ${fakeLinkedIn}`);
                updatedCount++;
            }
        }

        console.log(`\n--- [Maintenance] Success: Updated ${updatedCount} users. ---`);
    } catch (error) {
        console.error('--- [Maintenance] LinkedIn Population FAILED ---', error);
    } finally {
        // Close Prisma connection before exiting
        await basePrisma.$disconnect();
        process.exit(0);
    }
}

populateLinkedIn();
