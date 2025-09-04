// app/api/cases/[id]/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCaseHistory, getCaseTimeline, generateCaseHistoryReport } from '@/lib/utils/caseHistory';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { searchParams } = new URL(request.url);
        const format = searchParams.get('format') || 'timeline'; // timeline, full, report
        const caseId = params.id;

        if (!caseId) {
            return NextResponse.json(
                { error: 'Case ID is required' },
                { status: 400 }
            );
        }

        switch (format) {
            case 'timeline':
                const timeline = await getCaseTimeline(caseId);
                return NextResponse.json({
                    success: true,
                    data: timeline,
                    count: timeline.length
                });

            case 'full':
                const history = await getCaseHistory(caseId);
                return NextResponse.json({
                    success: true,
                    data: history,
                    counts: {
                        statusChanges: history.statusHistory.length,
                        timelineEvents: history.timeline.length,
                        total: history.combined.length
                    }
                });

            case 'report':
                const report = await generateCaseHistoryReport(caseId);
                return NextResponse.json({
                    success: true,
                    data: report
                });

            default:
                return NextResponse.json(
                    { error: 'Invalid format. Use: timeline, full, or report' },
                    { status: 400 }
                );
        }

    } catch (error) {
        console.error('Error fetching case history:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch case history',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// POST endpoint to add timeline events
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const caseId = params.id;
        const body = await request.json();

        if (!caseId) {
            return NextResponse.json(
                { error: 'Case ID is required' },
                { status: 400 }
            );
        }

        const { type, title, description, createdBy, metadata, relatedEntityId } = body;

        if (!type || !title || !description || !createdBy) {
            return NextResponse.json(
                { error: 'Missing required fields: type, title, description, createdBy' },
                { status: 400 }
            );
        }

        const { createTimelineEvent } = await import('@/lib/utils/caseHistory');

        const success = await createTimelineEvent(
            caseId,
            type,
            title,
            description,
            createdBy,
            metadata,
            relatedEntityId
        );

        if (success) {
            return NextResponse.json({
                success: true,
                message: 'Timeline event created successfully'
            });
        } else {
            return NextResponse.json(
                { success: false, error: 'Failed to create timeline event' },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('Error creating timeline event:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to create timeline event',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}