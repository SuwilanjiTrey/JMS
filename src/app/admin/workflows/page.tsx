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
    PieChart as PieChartIcon, BarChart3, Settings, Play, Pause
} from 'lucide-react';

export default function WorkflowAutomation() {
    const [timeRange, setTimeRange] = useState('30');
    const [activeWorkflows, setActiveWorkflows] = useState(24);
    const [completedTasks, setCompletedTasks] = useState(156);

    // Mock data for visualizations
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

    const workflowRules = [
        {
            id: 1,
            name: 'Auto-assign Criminal Cases',
            description: 'Automatically assign criminal cases to available judges based on specialization',
            status: 'active',
            trigger: 'Case Registration',
            action: 'Judge Assignment',
            lastRun: '2 hours ago',
            success_rate: 94
        },
        {
            id: 2,
            name: 'Hearing Reminders',
            description: 'Send automated reminders 48 hours before scheduled hearings',
            status: 'active',
            trigger: 'Time-based',
            action: 'Send Notifications',
            lastRun: '1 hour ago',
            success_rate: 98
        },
        {
            id: 3,
            name: 'Document Approval Workflow',
            description: 'Route documents through approval chain based on type and case priority',
            status: 'active',
            trigger: 'Document Upload',
            action: 'Route for Approval',
            lastRun: '30 minutes ago',
            success_rate: 87
        },
        {
            id: 4,
            name: 'Case Status Updates',
            description: 'Automatically update case status when hearing outcomes are recorded',
            status: 'paused',
            trigger: 'Hearing Completion',
            action: 'Update Status',
            lastRun: '3 days ago',
            success_rate: 92
        }
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'paused': return 'bg-yellow-100 text-yellow-800';
            case 'error': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    return (
        <div className="container mx-auto p-6 space-y-6">
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
                    <Button className="bg-orange-600 hover:bg-orange-700">
                        <Settings className="w-4 h-4 mr-2" />
                        Configure Rules
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
                                        <div>
                                            <CardTitle className="text-lg">{rule.name}</CardTitle>
                                            <CardDescription className="mt-1">{rule.description}</CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge className={getStatusColor(rule.status)}>
                                                {rule.status}
                                            </Badge>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    // Toggle workflow status
                                                    const newStatus = rule.status === 'active' ? 'paused' : 'active';
                                                    // Update rule status logic here
                                                }}
                                            >
                                                {rule.status === 'active' ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                                            <div className="text-sm text-gray-600">Trigger</div>
                                            <div className="font-semibold">{rule.trigger}</div>
                                        </div>
                                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                                            <div className="text-sm text-gray-600">Action</div>
                                            <div className="font-semibold">{rule.action}</div>
                                        </div>
                                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                                            <div className="text-sm text-gray-600">Last Run</div>
                                            <div className="font-semibold">{rule.lastRun}</div>
                                        </div>
                                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                                            <div className="text-sm text-gray-600">Success Rate</div>
                                            <div className="font-semibold">{rule.success_rate}%</div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Performance</span>
                                            <span>{rule.success_rate}%</span>
                                        </div>
                                        <Progress value={rule.success_rate} className="h-2" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}