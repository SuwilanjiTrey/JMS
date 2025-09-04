// components/ProcessStageManager.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, Clock, AlertCircle } from 'lucide-react';
import type { CaseProcessStageType } from '@/models';

interface ProcessStageManagerProps {
    caseId: string;
    currentStages: { stage: CaseProcessStageType; date: Date }[];
    onStageComplete: (stage: CaseProcessStageType, notes?: string) => void;
}

const STAGES: { type: CaseProcessStageType; label: string; description: string }[] = [
    { type: 'filed', label: 'Case Filed', description: 'Initial filing of the case' },
    { type: 'summons', label: 'Summons', description: 'Summons issued to parties' },
    { type: 'takes_off', label: 'Case Takes Off', description: 'Case proceedings begin' },
    { type: 'recording', label: 'Recording', description: 'Manual recording completed' },
    { type: 'adjournment', label: 'Adjournment', description: 'Case adjourned' },
    { type: 'ruling', label: 'Ruling', description: 'Final ruling issued' },
    { type: 'appeal', label: 'Appeal', description: 'Case appealed to higher court' },
];

export default function ProcessStageManager({
    caseId,
    currentStages,
    onStageComplete
}: ProcessStageManagerProps) {
    const [completingStage, setCompletingStage] = useState<CaseProcessStageType | null>(null);

    const getStageStatus = (stageType: CaseProcessStageType) => {
        const completedStage = currentStages.find(s => s.stage === stageType);
        if (completedStage) {
            return { status: 'completed', date: completedStage.date };
        }

        // Check if previous stages are completed
        const stageIndex = STAGES.findIndex(s => s.type === stageType);
        if (stageIndex > 0) {
            const previousStage = STAGES[stageIndex - 1];
            const isPreviousCompleted = currentStages.some(s => s.stage === previousStage.type);
            if (!isPreviousCompleted) {
                return { status: 'blocked', date: null };
            }
        }

        return { status: 'pending', date: null };
    };

    const calculateProgress = () => {
        const completedCount = currentStages.length;
        return (completedCount / STAGES.length) * 100;
    };

    const handleCompleteStage = async (stageType: CaseProcessStageType) => {
        setCompletingStage(stageType);
        try {
            await onStageComplete(stageType);
        } finally {
            setCompletingStage(null);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    Case Process Stages
                    <Badge variant="outline" className="ml-2">
                        {currentStages.length} of {STAGES.length} completed
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Progress value={calculateProgress()} className="mb-6" />

                <div className="space-y-4">
                    {STAGES.map((stage, index) => {
                        const { status, date } = getStageStatus(stage.type);

                        return (
                            <div key={stage.type} className="flex items-start gap-4 p-3 border rounded-lg">
                                <div className="flex-shrink-0">
                                    {status === 'completed' ? (
                                        <CheckCircle className="w-6 h-6 text-green-500" />
                                    ) : status === 'blocked' ? (
                                        <AlertCircle className="w-6 h-6 text-gray-300" />
                                    ) : (
                                        <Circle className="w-6 h-6 text-gray-300" />
                                    )}
                                </div>

                                <div className="flex-1">
                                    <h4 className="font-medium">{stage.label}</h4>
                                    <p className="text-sm text-gray-500">{stage.description}</p>
                                    {date && (
                                        <p className="text-xs text-gray-400 mt-1">
                                            Completed on {date.toLocaleDateString()}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    {status === 'pending' ? (
                                        <Button
                                            size="sm"
                                            onClick={() => handleCompleteStage(stage.type)}
                                            disabled={completingStage === stage.type}
                                        >
                                            {completingStage === stage.type ? (
                                                <Clock className="w-4 h-4 animate-spin mr-1" />
                                            ) : null}
                                            Mark Complete
                                        </Button>
                                    ) : status === 'completed' ? (
                                        <Badge variant="outline" className="bg-green-50 text-green-700">
                                            Completed
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="bg-gray-100 text-gray-500">
                                            Blocked
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}