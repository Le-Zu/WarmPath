import { basePrisma as prisma } from '../src/lib/prisma';

async function restoreAvatars() {
    console.log("Restoring avatar visibility with valid DiceBear parameters...");

    try {
        const users = await prisma.users.findMany({
            where: {
                profile_picture_url: {
                    contains: 'api.dicebear.com'
                }
            }
        });

        console.log(`Updating ${users.length} users...`);

        let count = 0;
        for (const user of users) {
            if (!user.profile_picture_url) continue;

            const urlParts = user.profile_picture_url.split('&');
            const baseUrl = urlParts[0]; // has the seed

            // Use ONLY valid parameters for DiceBear v7 avataaars
            // mouth=smile,twinkle
            // eyebrows=default
            // eyes=default
            const newUrl = `${baseUrl}&mouth=smile,twinkle&eyebrows=default&eyes=default&v=3`;

            await prisma.users.update({
                where: { user_id: user.user_id },
                data: { profile_picture_url: newUrl }
            });
            count++;
        }

        console.log(`Successfully restored ${count} avatars.`);

    } catch (error) {
        console.error("Restoration failed:", error);
    }
}

restoreAvatars()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
