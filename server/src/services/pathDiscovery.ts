import { prisma } from '../lib/prisma'

export async function getPathsForUser(userId: string) {
  const paths = await prisma.$queryRaw`
    SELECT * FROM two_hop_paths_view
    WHERE requester_id = ${userId}
    ORDER BY avg_warmth DESC
  `
  return paths
}