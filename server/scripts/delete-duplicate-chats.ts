import { basePrisma as prisma } from '../src/lib/prisma';

async function deleteDuplicateChats() {
    console.log("Starting duplicate chat cleanup...");

    try {
        // 1. Fetch all conversations with participants and message counts
        const conversations = await prisma.conversations.findMany({
            include: {
                participants: true,
                _count: {
                    select: { messages: true }
                }
            }
        });

        // 2. Group conversations by participant set
        const groups = new Map<string, typeof conversations>();
        for (const conv of conversations) {
            const participantIds = conv.participants.map(p => p.user_id).sort().join('-');
            if (!groups.has(participantIds)) {
                groups.set(participantIds, []);
            }
            groups.get(participantIds)!.push(conv);
        }

        // 3. Process each group
        for (const [key, convs] of groups.entries()) {
            if (convs.length > 1) {
                console.log(`Found ${convs.length} duplicate chats for participants [${key}]`);
                
                // Sort: most messages first, then newest first
                convs.sort((a, b) => {
                    if (b._count.messages !== a._count.messages) {
                        return b._count.messages - a._count.messages;
                    }
                    return b.created_at.getTime() - a.created_at.getTime();
                });

                const keep = convs[0];
                const duplicates = convs.slice(1);

                console.log(`  KEEPING: ${keep.conversation_id} (${keep._count.messages} messages)`);

                for (const dup of duplicates) {
                    console.log(`  DELETING: ${dup.conversation_id} (${dup._count.messages} messages)`);
                    
                    // Permanent deletion of duplicates and their relations
                    await prisma.$transaction([
                        prisma.messages.deleteMany({ where: { conversation_id: dup.conversation_id } }),
                        prisma.conversationParticipants.deleteMany({ where: { conversation_id: dup.conversation_id } }),
                        prisma.conversations.delete({ where: { conversation_id: dup.conversation_id } })
                    ]);
                }
            }
        }

        console.log("Cleanup complete.");
    } catch (error) {
        console.error("Error during cleanup:", error);
    }
}

deleteDuplicateChats()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
