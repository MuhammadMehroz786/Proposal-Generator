import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/stats - Get user statistics
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get proposal counts
    const totalProposals = await prisma.proposal.count({
      where: { userId: session.user.id },
    });

    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const lastMonth = new Date(currentMonth);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const currentMonthProposals = await prisma.proposal.count({
      where: {
        userId: session.user.id,
        createdAt: { gte: currentMonth },
      },
    });

    const lastMonthProposals = await prisma.proposal.count({
      where: {
        userId: session.user.id,
        createdAt: { gte: lastMonth, lt: currentMonth },
      },
    });

    const proposalChange = lastMonthProposals > 0
      ? ((currentMonthProposals - lastMonthProposals) / lastMonthProposals) * 100
      : 0;

    // Get AI token usage
    const totalTokens = await prisma.aIUsage.aggregate({
      where: { userId: session.user.id },
      _sum: { tokensUsed: true },
    });

    const currentMonthTokens = await prisma.aIUsage.aggregate({
      where: {
        userId: session.user.id,
        createdAt: { gte: currentMonth },
      },
      _sum: { tokensUsed: true },
    });

    const lastMonthTokens = await prisma.aIUsage.aggregate({
      where: {
        userId: session.user.id,
        createdAt: { gte: lastMonth, lt: currentMonth },
      },
      _sum: { tokensUsed: true },
    });

    const tokenChange = (lastMonthTokens._sum.tokensUsed || 0) > 0
      ? (((currentMonthTokens._sum.tokensUsed || 0) - (lastMonthTokens._sum.tokensUsed || 0)) / (lastMonthTokens._sum.tokensUsed || 1)) * 100
      : 0;

    // Get conversion rate (completed/total)
    const completedProposals = await prisma.proposal.count({
      where: {
        userId: session.user.id,
        status: { in: ['COMPLETED', 'SENT'] },
      },
    });

    const conversionRate = totalProposals > 0
      ? (completedProposals / totalProposals) * 100
      : 0;

    return NextResponse.json({
      totalProposals,
      proposalChange: proposalChange.toFixed(1),
      totalTokens: (totalTokens._sum.tokensUsed || 0) / 1000, // Convert to K
      tokenChange: tokenChange.toFixed(1),
      conversionRate: conversionRate.toFixed(0),
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
