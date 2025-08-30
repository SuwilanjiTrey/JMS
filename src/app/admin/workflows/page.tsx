'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Area, AreaChart,
    RadialBarChart, RadialBar, Legend
} from 'recharts';
import {
    FileText, Clock, CheckCircle, AlertTriangle, Users, Calendar,
    TrendingUp, Activity, Gavel, Scale, FileCheck, Timer,
    PieChart as PieChartIcon, BarChart3, Settings, Play, Pause,
    Edit, Plus, Trash2, Save, X, Bell, Eye, Download
} from 'lucide-react';

export default function WorkflowAutomation() {
    const [timeRange, setTimeRange] = useState('30');
    const [activeWorkflows, setActiveWorkflows] = useState(24);
    const [completedTasks, setCompletedTasks] = useState(156);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [selectedRule, setSelectedRule] = useState(null);
    const [showNewRuleModal, setShowNewRuleModal] = useState(false);
    const [alertMessages, setAlertMessages] = useState([]);

    // Enhanced workflow rules with more detailed state management
    const [workflowRules, setWorkflowRules] = useState([
        {
            id: 1,
            name: 'Auto-assign Criminal Cases',
            description: 'Automatically assign criminal cases to available judges based on specialization',
            status: 'active',
            trigger: 'Case Registration',
            action: 'Judge Assignment',
            lastRun: '2 hours ago',
            success_rate: 94,
            priority: 'high',
            conditions: ['Case Type = Criminal', 'Judge Available = True'],
            actions: ['Assign to Judge', 'Send Notification', 'Update Case Status'],
            schedule: 'Immediate'
        },
        {
            id: 2,
            name: 'Hearing Reminders',
            description: 'Send automated reminders 48 hours before scheduled hearings',
            status: 'active',
            trigger: 'Time-based',
            action: 'Send Notifications',
            lastRun: '1 hour ago',
            success_rate: 98,
            priority: 'medium',
            conditions: ['Hearing Date - 48 hours'],
            actions: ['Send Email', 'Send SMS', 'Update Dashboard'],
            schedule: 'Every 6 hours'
        },
        {
            id: 3,
            name: 'Document Approval Workflow',
            description: 'Route documents through approval chain based on type and case priority',
            status: 'active',
            trigger: 'Document Upload',
            action: 'Route for Approval',
            lastRun: '30 minutes ago',
            success_rate: 87,
            priority: 'high',
            conditions: ['Document Type = Legal', 'Case Priority > Normal'],
            actions: ['Route to Supervisor', 'Log Activity', 'Set Deadline'],
            schedule: 'Immediate'
        },
        {
            id: 4,
            name: 'Case Status Updates',
            description: 'Automatically update case status when hearing outcomes are recorded',
            status: 'paused',
            trigger: 'Hearing Completion',
            action: 'Update Status',
            lastRun: '3 days ago',
            success_rate: 92,
            priority: 'medium',
            conditions: ['Hearing Status = Completed', 'Judgment Recorded = True'],
            actions: ['Update Case Status', 'Generate Report', 'Notify Parties'],
            schedule: 'Immediate'
        }
    ]);

    const [newRule, setNewRule] = useState({
        name: '',
        description: '',
        trigger: '',
        action: '',
        priority: 'medium',
        conditions: [''],
        actions: [''],
        schedule: 'Immediate'
    });

    // Mock data for visualizations (keeping original data)
    const caseWorkflowData = [
        { stage: 'Registration', active: 45, completed: 234, avg_time: 2.5 },
        { stage: 'Assignment', active: 32, completed: 198, avg_time: 1.2 },
        { stage: 'Discovery', active: 28, completed: 167, avg_time: 45.8 },
        { stage: 'Pre-Trial', active: 15, completed: 143, avg_time: 28.3 },
        { stage: 'Trial', active: 8, completed: 89, avg_time: 67.2 },
        { stage: 'Judgment', active: 3, completed: 76, avg_time: 14.7 },
        { stage: 'Appeal', active: 2, completed: 12, avg_time: 89.4 }
    ];

    const hearingWorkflowData = [
        { stage: 'Scheduling', count: 34, percentage: 28 },
        { stage: 'Preparation', count: 28, percentage: 23 },
        { stage: 'In Progress', count: 12, percentage: 10 },
        { stage: 'Completed', count: 47, percentage: 39 }
    ];

    const documentWorkflowData = [
        { name: 'Draft', value: 23, color: '#94a3b8' },
        { name: 'Under Review', value: 45, color: '#fbbf24' },
        { name: 'Approved', value: 67, color: '#10b981' },
        { name: 'Rejected', value: 8, color: '#ef4444' },
        { name: 'Sealed', value: 12, color: '#8b5cf6' }
    ];

    const performanceData = [
        { month: 'Jan', cases_resolved: 45, avg_resolution_time: 62, efficiency: 78 },
        { month: 'Feb', cases_resolved: 52, avg_resolution_time: 58, efficiency: 82 },
        { month: 'Mar', cases_resolved: 48, avg_resolution_time: 65, efficiency: 76 },
        { month: 'Apr', cases_resolved: 61, avg_resolution_time: 55, efficiency: 85 },
        { month: 'May', cases_resolved: 57, avg_resolution_time: 60, efficiency: 80 },
        { month: 'Jun', cases_resolved: 64, avg_resolution_time: 52, efficiency: 88 }
    ];

    const automationMetrics = [
        { name: 'Case Assignment', automated: 92, manual: 8, savings: 156 },
        { name: 'Document Review', automated: 78, manual: 22, savings: 89 },
        { name: 'Hearing Scheduling', automated: 85, manual: 15, savings: 234 },
        { name: 'Status Updates', automated: 96, manual: 4, savings: 445 },
        { name: 'Notifications', automated: 100, manual: 0, savings: 678 }
    ];

    // Enhanced functionality handlers
    const toggleWorkflowStatus = (ruleId) => {
        setWorkflowRules(prevRules =>
            prevRules.map(rule => {
                if (rule.id === ruleId) {
                    const newStatus = rule.status === 'active' ? 'paused' : 'active';
                    addAlert(`Workflow "${rule.name}" ${newStatus === 'active' ? 'activated' : 'paused'}`, 'info');
                    return { ...rule, status: newStatus };
                }
                return rule;
            })
        );
    };

    const deleteRule = (ruleId) => {
        const rule = workflowRules.find(r => r.id === ruleId);
        setWorkflowRules(prevRules => prevRules.filter(rule => rule.id !== ruleId));
        addAlert(`Workflow rule "${rule.name}" deleted`, 'warning');
    };

    const addAlert = (message, type = 'info') => {
        const newAlert = { id: Date.now(), message, type };
        setAlertMessages(prev => [...prev, newAlert]);
        setTimeout(() => {
            setAlertMessages(prev => prev.filter(alert => alert.id !== newAlert.id));
        }, 5000);
    };

    const openConfigModal = (rule) => {
        setSelectedRule({ ...rule });
        setShowConfigModal(true);
    };

    const saveRuleConfig = () => {
        setWorkflowRules(prevRules =>
            prevRules.map(rule =>
                rule.id === selectedRule.id ? selectedRule : rule
            )
        );
        setShowConfigModal(false);
        addAlert(`Rule "${selectedRule.name}" updated successfully`, 'success');
    };

    const createNewRule = () => {
        const newRuleWithId = {
            ...newRule,
            id: Math.max(...workflowRules.map(r => r.id)) + 1,
            status: 'active',
            lastRun: 'Never',
            success_rate: 0
        };
        setWorkflowRules(prev => [...prev, newRuleWithId]);
        setNewRule({
            name: '',
            description: '',
            trigger: '',
            action: '',
            priority: 'medium',
            conditions: [''],
            actions: [''],
            schedule: 'Immediate'
        });
        setShowNewRuleModal(false);
        addAlert(`New rule "${newRuleWithId.name}" created successfully`, 'success');
    };

    const addCondition = () => {
        if (selectedRule) {
            setSelectedRule({
                ...selectedRule,
                conditions: [...selectedRule.conditions, '']
            });
        }
    };

    const addAction = () => {
        if (selectedRule) {
            setSelectedRule({
                ...selectedRule,
                actions: [...selectedRule.actions, '']
            });
        }
    };

    const updateCondition = (index, value) => {
        if (selectedRule) {
            const newConditions = [...selectedRule.conditions];
            newConditions[index] = value;
            setSelectedRule({
                ...selectedRule,
                conditions: newConditions
            });
        }
    };

    const updateAction = (index, value) => {
        if (selectedRule) {
            const newActions = [...selectedRule.actions];
            newActions[index] = value;
            setSelectedRule({
                ...selectedRule,
                actions: newActions
            });
        }
    };

    const removeCondition = (index) => {
        if (selectedRule && selectedRule.conditions.length > 1) {
            const newConditions = selectedRule.conditions.filter((_, i) => i !== index);
            setSelectedRule({
                ...selectedRule,
                conditions: newConditions
            });
        }
    };

    const removeAction = (index) => {
        if (selectedRule && selectedRule.actions.length > 1) {
            const newActions = selectedRule.actions.filter((_, i) => i !== index);
            setSelectedRule({
                ...selectedRule,
                actions: newActions
            });
        }
    };

    const exportReport = () => {
        addAlert('Performance report exported successfully', 'success');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'paused': return 'bg-yellow-100 text-yellow-800';
            case 'error': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high': return 'bg-red-100 text-red-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'low': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    // Configuration Modal Component
    const ConfigModal = () => (
        showConfigModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-zambia-black">Configure Workflow Rule</h2>
                            <Button variant="ghost" onClick={() => setShowConfigModal(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Rule Name</label>
                                    <input
                                        type="text"
                                        value={selectedRule?.name || ''}
                                        onChange={(e) => setSelectedRule({ ...selectedRule, name: e.target.value })}
                                        className="w-full p-2 border rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Priority</label>
                                    <Select
                                        value={selectedRule?.priority || 'medium'}
                                        onValueChange={(value) => setSelectedRule({ ...selectedRule, priority: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="low">Low</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Description</label>
                                <textarea
                                    value={selectedRule?.description || ''}
                                    onChange={(e) => setSelectedRule({ ...selectedRule, description: e.target.value })}
                                    className="w-full p-2 border rounded-md h-20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Trigger</label>
                                    <Select
                                        value={selectedRule?.trigger || ''}
                                        onValueChange={(value) => setSelectedRule({ ...selectedRule, trigger: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Case Registration">Case Registration</SelectItem>
                                            <SelectItem value="Document Upload">Document Upload</SelectItem>
                                            <SelectItem value="Hearing Completion">Hearing Completion</SelectItem>
                                            <SelectItem value="Time-based">Time-based</SelectItem>
                                            <SelectItem value="Status Change">Status Change</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Schedule</label>
                                    <Select
                                        value={selectedRule?.schedule || 'Immediate'}
                                        onValueChange={(value) => setSelectedRule({ ...selectedRule, schedule: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Immediate">Immediate</SelectItem>
                                            <SelectItem value="Every hour">Every hour</SelectItem>
                                            <SelectItem value="Every 6 hours">Every 6 hours</SelectItem>
                                            <SelectItem value="Daily">Daily</SelectItem>
                                            <SelectItem value="Weekly">Weekly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-medium">Conditions</label>
                                    <Button size="sm" onClick={addCondition} variant="outline">
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add Condition
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {selectedRule?.conditions.map((condition, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={condition}
                                                onChange={(e) => updateCondition(index, e.target.value)}
                                                placeholder="Enter condition..."
                                                className="flex-1 p-2 border rounded-md"
                                            />
                                            {selectedRule.conditions.length > 1 && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => removeCondition(index)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-sm font-medium">Actions</label>
                                    <Button size="sm" onClick={addAction} variant="outline">
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add Action
                                    </Button>
                                </div>
                                <div className="space-y-2">
                                    {selectedRule?.actions.map((action, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={action}
                                                onChange={(e) => updateAction(index, e.target.value)}
                                                placeholder="Enter action..."
                                                className="flex-1 p-2 border rounded-md"
                                            />
                                            {selectedRule.actions.length > 1 && (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => removeAction(index)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                            <Button variant="outline" onClick={() => setShowConfigModal(false)}>
                                Cancel
                            </Button>
                            <Button onClick={saveRuleConfig} className="bg-orange-600 hover:bg-orange-700">
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    );

    // New Rule Modal Component
    const NewRuleModal = () => (
        showNewRuleModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-zambia-black">Create New Workflow Rule</h2>
                            <Button variant="ghost" onClick={() => setShowNewRuleModal(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Rule Name</label>
                                <input
                                    type="text"
                                    value={newRule.name}
                                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                                    placeholder="Enter rule name..."
                                    className="w-full p-2 border rounded-md"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Description</label>
                                <textarea
                                    value={newRule.description}
                                    onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                                    placeholder="Describe what this rule does..."
                                    className="w-full p-2 border rounded-md h-20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Trigger</label>
                                    <Select value={newRule.trigger} onValueChange={(value) => setNewRule({ ...newRule, trigger: value })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select trigger" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Case Registration">Case Registration</SelectItem>
                                            <SelectItem value="Document Upload">Document Upload</SelectItem>
                                            <SelectItem value="Hearing Completion">Hearing Completion</SelectItem>
                                            <SelectItem value="Time-based">Time-based</SelectItem>
                                            <SelectItem value="Status Change">Status Change</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Priority</label>
                                    <Select value={newRule.priority} onValueChange={(value) => setNewRule({ ...newRule, priority: value })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="high">High</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="low">Low</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                            <Button variant="outline" onClick={() => setShowNewRuleModal(false)}>
                                Cancel
                            </Button>
                            <Button
                                onClick={createNewRule}
                                className="bg-orange-600 hover:bg-orange-700"
                                disabled={!newRule.name || !newRule.trigger}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Create Rule
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        )
    );

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Alert Messages */}
            {alertMessages.map((alert) => (
                <Alert key={alert.id} className={`
                    ${alert.type === 'success' ? 'border-green-200 bg-green-50' : ''}
                    ${alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50' : ''}
                    ${alert.type === 'error' ? 'border-red-200 bg-red-50' : ''}
                    ${alert.type === 'info' ? 'border-blue-200 bg-blue-50' : ''}
                `}>
                    <Bell className="h-4 w-4" />
                    <AlertDescription>{alert.message}</AlertDescription>
                </Alert>
            ))}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-zambia-black">Workflow Automation</h1>
                    <p className="text-zambia-black/70">Monitor and manage automated judicial workflows</p>
                </div>
                <div className="flex gap-2">
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7">Last 7 days</SelectItem>
                            <SelectItem value="30">Last 30 days</SelectItem>
                            <SelectItem value="90">Last 90 days</SelectItem>
                            <SelectItem value="365">Last year</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={exportReport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export Report
                    </Button>
                    <Button
                        className="bg-orange-600 hover:bg-orange-700"
                        onClick={() => setShowNewRuleModal(true)}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Rule
                    </Button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Workflows</CardTitle>
                        <Activity className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-zambia-black">{activeWorkflows}</div>
                        <p className="text-xs text-muted-foreground">+12% from last month</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
                        <CheckCircle className="h-4 w-4 text-zambia-green" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-zambia-black">{completedTasks}</div>
                        <p className="text-xs text-muted-foreground">+23% from last month</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
                        <Timer className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-zambia-black">3.2 days</div>
                        <p className="text-xs text-muted-foreground">-18% from last month</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Automation Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-zambia-black">87%</div>
                        <p className="text-xs text-muted-foreground">+5% from last month</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="cases">Case Workflows</TabsTrigger>
                    <TabsTrigger value="hearings">Hearings</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                    <TabsTrigger value="automation">Automation Rules</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-orange-600" />
                                    System Performance Trends
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={performanceData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="efficiency" stackId="1" stroke="#f97316" fill="#fed7aa" />
                                        <Area type="monotone" dataKey="cases_resolved" stackId="2" stroke="#10b981" fill="#bbf7d0" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <PieChartIcon className="h-5 w-5 text-zambia-green" />
                                    Automation Coverage
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {automationMetrics.map((metric, index) => (
                                        <div key={metric.name} className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>{metric.name}</span>
                                                <span className="font-medium">{metric.automated}% automated</span>
                                            </div>
                                            <Progress value={metric.automated} className="h-2" />
                                            <div className="text-xs text-gray-600">
                                                Time saved: {metric.savings} hours/month
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Case Workflows Tab */}
                <TabsContent value="cases" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Gavel className="h-5 w-5 text-orange-600" />
                                    Case Processing Pipeline
                                </CardTitle>
                                <CardDescription>Cases in each stage of the workflow</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={350}>
                                    <BarChart data={caseWorkflowData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="stage" angle={-45} textAnchor="end" height={100} />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="active" fill="#f97316" name="Active Cases" />
                                        <Bar dataKey="completed" fill="#10b981" name="Completed Cases" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-blue-600" />
                                    Average Processing Times
                                </CardTitle>
                                <CardDescription>Days per workflow stage</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={350}>
                                    <LineChart data={caseWorkflowData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="stage" angle={-45} textAnchor="end" height={100} />
                                        <YAxis />
                                        <Tooltip formatter={(value) => [`${value} days`, 'Avg Time']} />
                                        <Line
                                            type="monotone"
                                            dataKey="avg_time"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Case Stage Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Workflow Stage Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {caseWorkflowData.slice(0, 4).map((stage, index) => (
                                    <div key={stage.stage} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-semibold text-zambia-black">{stage.stage}</h4>
                                            <Badge variant="outline">{stage.active} active</Badge>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>Completed:</span>
                                                <span className="font-medium">{stage.completed}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Avg Time:</span>
                                                <span className="font-medium">{stage.avg_time} days</span>
                                            </div>
                                            <Progress value={Math.min((stage.completed / 250) * 100, 100)} className="h-2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Hearings Tab */}
                <TabsContent value="hearings" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-zambia-green" />
                                    Hearing Workflow Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={hearingWorkflowData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percentage }) => `${name}: ${percentage}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="count"
                                        >
                                            {hearingWorkflowData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Scale className="h-5 w-5 text-purple-600" />
                                    Hearing Efficiency Metrics
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                                            <div className="text-2xl font-bold text-blue-600">94%</div>
                                            <div className="text-sm text-blue-600">On-time Rate</div>
                                        </div>
                                        <div className="text-center p-4 bg-green-50 rounded-lg">
                                            <div className="text-2xl font-bold text-green-600">2.3 hrs</div>
                                            <div className="text-sm text-green-600">Avg Duration</div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span>Automation Success Rate</span>
                                            <span className="font-medium">91%</span>
                                        </div>
                                        <Progress value={91} className="h-3" />
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span>Resource Utilization</span>
                                            <span className="font-medium">78%</span>
                                        </div>
                                        <Progress value={78} className="h-3" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Hearing Timeline */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Today's Hearing Timeline</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[
                                    { time: '09:00', case: 'CC/001/2024', type: 'Criminal', status: 'completed' },
                                    { time: '11:00', case: 'CV/045/2024', type: 'Civil', status: 'in-progress' },
                                    { time: '14:00', case: 'FM/023/2024', type: 'Family', status: 'scheduled' },
                                    { time: '16:00', case: 'CM/012/2024', type: 'Commercial', status: 'scheduled' }
                                ].map((hearing, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="text-sm font-mono font-medium w-16">{hearing.time}</div>
                                            <div>
                                                <div className="font-semibold">{hearing.case}</div>
                                                <div className="text-sm text-gray-600">{hearing.type} Case</div>
                                            </div>
                                        </div>
                                        <Badge className={
                                            hearing.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                hearing.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-gray-100 text-gray-800'
                                        }>
                                            {hearing.status.replace('-', ' ')}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Documents Tab */}
                <TabsContent value="documents" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-orange-600" />
                                    Document Processing Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={documentWorkflowData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, value }) => `${name}: ${value}`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {documentWorkflowData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileCheck className="h-5 w-5 text-green-600" />
                                    Document Workflow Metrics
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div className="p-3 bg-blue-50 rounded-lg">
                                            <div className="text-xl font-bold text-blue-600">155</div>
                                            <div className="text-xs text-blue-600">Total Documents</div>
                                        </div>
                                        <div className="p-3 bg-yellow-50 rounded-lg">
                                            <div className="text-xl font-bold text-yellow-600">45</div>
                                            <div className="text-xs text-yellow-600">Pending Review</div>
                                        </div>
                                        <div className="p-3 bg-green-50 rounded-lg">
                                            <div className="text-xl font-bold text-green-600">89%</div>
                                            <div className="text-xs text-green-600">Auto-processed</div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>Digital Signature Rate</span>
                                                <span>92%</span>
                                            </div>
                                            <Progress value={92} className="h-2" />
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>Auto-filing Success</span>
                                                <span>87%</span>
                                            </div>
                                            <Progress value={87} className="h-2" />
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>Compliance Check</span>
                                                <span>96%</span>
                                            </div>
                                            <Progress value={96} className="h-2" />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Document Processing Queue */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Document Processing Queue</CardTitle>
                            <CardDescription>Recent document processing activities</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {[
                                    { doc: 'Motion_to_Dismiss_CC001.pdf', status: 'processing', time: '2 min ago', type: 'Motion' },
                                    { doc: 'Evidence_List_CV045.pdf', status: 'approved', time: '5 min ago', type: 'Evidence' },
                                    { doc: 'Judgment_Draft_FM023.pdf', status: 'under_review', time: '12 min ago', type: 'Judgment' },
                                    { doc: 'Settlement_Agreement_CM012.pdf', status: 'rejected', time: '18 min ago', type: 'Agreement' }
                                ].map((doc, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-4 w-4 text-gray-500" />
                                            <div>
                                                <div className="font-medium text-sm">{doc.doc}</div>
                                                <div className="text-xs text-gray-500">{doc.type} • {doc.time}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge className={
                                                doc.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                    doc.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                                        doc.status === 'under_review' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                            }>
                                                {doc.status.replace('_', ' ')}
                                            </Badge>
                                            <Button size="sm" variant="ghost">
                                                <Eye className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Automation Rules Tab */}
                <TabsContent value="automation" className="space-y-6">
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Workflow automation rules help streamline judicial processes. Monitor performance and adjust as needed.
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                        {workflowRules.map((rule) => (
                            <Card key={rule.id} className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <CardTitle className="text-lg">{rule.name}</CardTitle>
                                                <Badge className={getPriorityColor(rule.priority)}>
                                                    {rule.priority}
                                                </Badge>
                                            </div>
                                            <CardDescription className="mt-1">{rule.description}</CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge className={getStatusColor(rule.status)}>
                                                {rule.status}
                                            </Badge>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => toggleWorkflowStatus(rule.id)}
                                                title={rule.status === 'active' ? 'Pause rule' : 'Activate rule'}
                                            >
                                                {rule.status === 'active' ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => openConfigModal(rule)}
                                                title="Configure rule"
                                            >
                                                <Edit className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => deleteRule(rule.id)}
                                                title="Delete rule"
                                                className="hover:bg-red-50 hover:text-red-600"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                                            <div className="text-sm text-gray-600">Trigger</div>
                                            <div className="font-semibold text-xs">{rule.trigger}</div>
                                        </div>
                                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                                            <div className="text-sm text-gray-600">Action</div>
                                            <div className="font-semibold text-xs">{rule.action}</div>
                                        </div>
                                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                                            <div className="text-sm text-gray-600">Last Run</div>
                                            <div className="font-semibold text-xs">{rule.lastRun}</div>
                                        </div>
                                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                                            <div className="text-sm text-gray-600">Success Rate</div>
                                            <div className="font-semibold text-xs">{rule.success_rate}%</div>
                                        </div>
                                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                                            <div className="text-sm text-gray-600">Schedule</div>
                                            <div className="font-semibold text-xs">{rule.schedule}</div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <div className="text-sm font-medium mb-2">Conditions:</div>
                                            <div className="flex flex-wrap gap-1">
                                                {rule.conditions?.map((condition, index) => (
                                                    <Badge key={index} variant="outline" className="text-xs">
                                                        {condition}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-sm font-medium mb-2">Actions:</div>
                                            <div className="flex flex-wrap gap-1">
                                                {rule.actions?.map((action, index) => (
                                                    <Badge key={index} variant="outline" className="text-xs bg-orange-50 text-orange-700">
                                                        {action}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>Performance</span>
                                                <span>{rule.success_rate}%</span>
                                            </div>
                                            <Progress value={rule.success_rate} className="h-2" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Workflow Execution Log */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-blue-600" />
                                Recent Workflow Executions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {[
                                    { rule: 'Auto-assign Criminal Cases', status: 'success', time: '5 min ago', details: 'Case CC/124/2024 assigned to Judge Mwanza' },
                                    { rule: 'Hearing Reminders', status: 'success', time: '1 hour ago', details: 'Reminder sent for CV/045/2024 hearing' },
                                    { rule: 'Document Approval Workflow', status: 'success', time: '2 hours ago', details: 'Motion routed to Senior Registrar' },
                                    { rule: 'Case Status Updates', status: 'failed', time: '3 hours ago', details: 'Error: Missing judgment data for FM/023/2024' },
                                    { rule: 'Auto-assign Criminal Cases', status: 'success', time: '4 hours ago', details: 'Case CC/123/2024 assigned to Judge Banda' }
                                ].map((execution, index) => (
                                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                                        <div className={`w-2 h-2 rounded-full mt-2 ${execution.status === 'success' ? 'bg-green-500' :
                                                execution.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                                            }`} />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <div className="font-medium text-sm">{execution.rule}</div>
                                                <div className="text-xs text-gray-500">{execution.time}</div>
                                            </div>
                                            <div className="text-xs text-gray-600 mt-1">{execution.details}</div>
                                        </div>
                                        <Badge className={
                                            execution.status === 'success' ? 'bg-green-100 text-green-800' :
                                                execution.status === 'failed' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                        }>
                                            {execution.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Configuration Modal */}
            <ConfigModal />

            {/* New Rule Modal */}
            {showNewRuleModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-zambia-black">Create New Workflow Rule</h2>
                                <Button variant="ghost" onClick={() => setShowNewRuleModal(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Rule Name *</label>
                                    <input
                                        type="text"
                                        value={newRule.name}
                                        onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                                        placeholder="Enter rule name..."
                                        className="w-full p-2 border rounded-md"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Description</label>
                                    <textarea
                                        value={newRule.description}
                                        onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                                        placeholder="Describe what this rule does..."
                                        className="w-full p-2 border rounded-md h-20"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Trigger *</label>
                                        <Select value={newRule.trigger} onValueChange={(value) => setNewRule({ ...newRule, trigger: value })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select trigger" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Case Registration">Case Registration</SelectItem>
                                                <SelectItem value="Document Upload">Document Upload</SelectItem>
                                                <SelectItem value="Hearing Completion">Hearing Completion</SelectItem>
                                                <SelectItem value="Time-based">Time-based</SelectItem>
                                                <SelectItem value="Status Change">Status Change</SelectItem>
                                                <SelectItem value="E-Filing Submission">E-Filing Submission</SelectItem>
                                                <SelectItem value="Judge Assignment">Judge Assignment</SelectItem>
                                                <SelectItem value="Payment Received">Payment Received</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Priority</label>
                                        <Select value={newRule.priority} onValueChange={(value) => setNewRule({ ...newRule, priority: value })}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="high">High</SelectItem>
                                                <SelectItem value="medium">Medium</SelectItem>
                                                <SelectItem value="low">Low</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Schedule</label>
                                    <Select value={newRule.schedule} onValueChange={(value) => setNewRule({ ...newRule, schedule: value })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Immediate">Immediate</SelectItem>
                                            <SelectItem value="Every 15 minutes">Every 15 minutes</SelectItem>
                                            <SelectItem value="Every hour">Every hour</SelectItem>
                                            <SelectItem value="Every 6 hours">Every 6 hours</SelectItem>
                                            <SelectItem value="Daily">Daily</SelectItem>
                                            <SelectItem value="Weekly">Weekly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                                <Button variant="outline" onClick={() => setShowNewRuleModal(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={createNewRule}
                                    className="bg-orange-600 hover:bg-orange-700"
                                    disabled={!newRule.name || !newRule.trigger}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Rule
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}