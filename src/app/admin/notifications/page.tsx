"use client"


import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, Calendar, FileText, Gavel, Users, X, Filter, Search, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAll, setDetails, uploadData } from '@/lib/utils/firebase/general';

interface Notification {
    id: string;
    type: 'case_update' | 'hearing_scheduled' | 'document_filed' | 'legislative_update' | 'system_alert' | 'deadline_reminder';
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    timestamp: string;
    read: boolean;
    userId?: string;
    actionRequired: boolean;
    relatedEntityId?: string;
    relatedEntityType?: 'case' | 'hearing' | 'document' | 'user';
    metadata?: {
        caseNumber?: string;
        hearingDate?: string;
        documentType?: string;
        deadline?: string;
    };
}

interface NotificationSettings {
    emailNotifications: boolean;
    pushNotifications: boolean;
    caseUpdates: boolean;
    hearingReminders: boolean;
    documentAlerts: boolean;
    legislativeUpdates: boolean;
    systemAlerts: boolean;
    reminderTiming: '1hour' | '1day' | '1week';
}

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterPriority, setFilterPriority] = useState<string>('all');
    const [showUnreadOnly, setShowUnreadOnly] = useState(false);
    const [settings, setSettings] = useState<NotificationSettings>({
        emailNotifications: true,
        pushNotifications: true,
        caseUpdates: true,
        hearingReminders: true,
        documentAlerts: true,
        legislativeUpdates: true,
        systemAlerts: true,
        reminderTiming: '1day'
    });

    // Load notifications on component mount
    useEffect(() => {
        loadNotifications();
    }, []);

    // Filter notifications when search/filter criteria change
    useEffect(() => {
        filterNotifications();
    }, [notifications, searchTerm, filterType, filterPriority, showUnreadOnly]);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            // In a real app, you'd fetch from your notifications collection
            const mockNotifications: Notification[] = [
                {
                    id: '1',
                    type: 'case_update',
                    title: 'Case Status Updated',
                    message: 'Case #CIV-2024-001 status changed to "Active"',
                    priority: 'medium',
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    read: false,
                    actionRequired: false,
                    relatedEntityId: 'CIV-2024-001',
                    relatedEntityType: 'case',
                    metadata: { caseNumber: 'CIV-2024-001' }
                },
                {
                    id: '2',
                    type: 'hearing_scheduled',
                    title: 'New Hearing Scheduled',
                    message: 'Hearing scheduled for Case #CRIM-2024-005 on March 15, 2024',
                    priority: 'high',
                    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                    read: false,
                    actionRequired: true,
                    relatedEntityId: 'CRIM-2024-005',
                    relatedEntityType: 'hearing',
                    metadata: { caseNumber: 'CRIM-2024-005', hearingDate: '2024-03-15' }
                },
                {
                    id: '3',
                    type: 'legislative_update',
                    title: 'New Criminal Procedure Amendment',
                    message: 'Amendment to Criminal Procedure Code affects evidence submission timelines',
                    priority: 'urgent',
                    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
                    read: true,
                    actionRequired: true,
                    metadata: { deadline: '2024-04-01' }
                },
                {
                    id: '4',
                    type: 'document_filed',
                    title: 'New Document Filed',
                    message: 'Motion to Dismiss filed in Case #CIV-2024-003',
                    priority: 'medium',
                    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
                    read: true,
                    actionRequired: false,
                    relatedEntityId: 'CIV-2024-003',
                    relatedEntityType: 'document',
                    metadata: { caseNumber: 'CIV-2024-003', documentType: 'Motion' }
                },
                {
                    id: '5',
                    type: 'deadline_reminder',
                    title: 'Deadline Approaching',
                    message: 'Case #FAM-2024-002 ruling deadline is tomorrow',
                    priority: 'urgent',
                    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                    read: false,
                    actionRequired: true,
                    relatedEntityId: 'FAM-2024-002',
                    relatedEntityType: 'case',
                    metadata: { caseNumber: 'FAM-2024-002', deadline: '2024-03-02' }
                },
                {
                    id: '6',
                    type: 'system_alert',
                    title: 'System Maintenance',
                    message: 'Scheduled maintenance on Saturday from 2:00 AM to 4:00 AM',
                    priority: 'low',
                    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
                    read: false,
                    actionRequired: false
                }
            ];

            setNotifications(mockNotifications);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterNotifications = () => {
        let filtered = notifications;

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(n =>
                n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                n.message.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by type
        if (filterType !== 'all') {
            filtered = filtered.filter(n => n.type === filterType);
        }

        // Filter by priority
        if (filterPriority !== 'all') {
            filtered = filtered.filter(n => n.priority === filterPriority);
        }

        // Filter by read status
        if (showUnreadOnly) {
            filtered = filtered.filter(n => !n.read);
        }

        setFilteredNotifications(filtered);
    };

    const markAsRead = async (notificationId: string) => {
        const updatedNotifications = notifications.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
        );
        setNotifications(updatedNotifications);

        // In a real app, you'd update this in Firebase
        // await setDetails({ read: true }, 'notifications', notificationId);
    };

    const markAllAsRead = async () => {
        const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
        setNotifications(updatedNotifications);
    };

    const deleteNotification = async (notificationId: string) => {
        const updatedNotifications = notifications.filter(n => n.id !== notificationId);
        setNotifications(updatedNotifications);
    };

    const getNotificationIcon = (type: Notification['type']) => {
        switch (type) {
            case 'case_update':
                return <Gavel className="h-4 w-4" />;
            case 'hearing_scheduled':
                return <Calendar className="h-4 w-4" />;
            case 'document_filed':
                return <FileText className="h-4 w-4" />;
            case 'legislative_update':
                return <Info className="h-4 w-4" />;
            case 'system_alert':
                return <AlertTriangle className="h-4 w-4" />;
            case 'deadline_reminder':
                return <Bell className="h-4 w-4" />;
            default:
                return <Bell className="h-4 w-4" />;
        }
    };

    const getPriorityColor = (priority: Notification['priority']) => {
        switch (priority) {
            case 'urgent':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'high':
                return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'low':
                return 'bg-green-100 text-green-800 border-green-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 60) {
            return `${diffInMinutes} minutes ago`;
        } else if (diffInMinutes < 24 * 60) {
            return `${Math.floor(diffInMinutes / 60)} hours ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;
    const actionRequiredCount = notifications.filter(n => n.actionRequired && !n.read).length;

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-20 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                    <Bell className="h-8 w-8 text-blue-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                        <p className="text-gray-600">
                            {unreadCount} unread notifications
                            {actionRequiredCount > 0 && `, ${actionRequiredCount} requiring action`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <Button
                        variant="outline"
                        onClick={markAllAsRead}
                        disabled={unreadCount === 0}
                    >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark All Read
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="all" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">
                        All ({notifications.length})
                    </TabsTrigger>
                    <TabsTrigger value="unread">
                        Unread ({unreadCount})
                    </TabsTrigger>
                    <TabsTrigger value="action">
                        Action Required ({actionRequiredCount})
                    </TabsTrigger>
                    <TabsTrigger value="settings">
                        Settings
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                    <NotificationFilters
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        filterType={filterType}
                        setFilterType={setFilterType}
                        filterPriority={filterPriority}
                        setFilterPriority={setFilterPriority}
                        showUnreadOnly={showUnreadOnly}
                        setShowUnreadOnly={setShowUnreadOnly}
                    />
                    <NotificationsList
                        notifications={filteredNotifications}
                        onMarkAsRead={markAsRead}
                        onDelete={deleteNotification}
                        getNotificationIcon={getNotificationIcon}
                        getPriorityColor={getPriorityColor}
                        formatTimestamp={formatTimestamp}
                    />
                </TabsContent>

                <TabsContent value="unread" className="space-y-4">
                    <NotificationsList
                        notifications={filteredNotifications.filter(n => !n.read)}
                        onMarkAsRead={markAsRead}
                        onDelete={deleteNotification}
                        getNotificationIcon={getNotificationIcon}
                        getPriorityColor={getPriorityColor}
                        formatTimestamp={formatTimestamp}
                    />
                </TabsContent>

                <TabsContent value="action" className="space-y-4">
                    <NotificationsList
                        notifications={filteredNotifications.filter(n => n.actionRequired && !n.read)}
                        onMarkAsRead={markAsRead}
                        onDelete={deleteNotification}
                        getNotificationIcon={getNotificationIcon}
                        getPriorityColor={getPriorityColor}
                        formatTimestamp={formatTimestamp}
                    />
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                    <NotificationSettings settings={settings} setSettings={setSettings} />
                </TabsContent>
            </Tabs>
        </div>
    );
};

const NotificationFilters = ({
    searchTerm, setSearchTerm, filterType, setFilterType,
    filterPriority, setFilterPriority, showUnreadOnly, setShowUnreadOnly
}) => {
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search notifications..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="case_update">Case Updates</SelectItem>
                            <SelectItem value="hearing_scheduled">Hearing Scheduled</SelectItem>
                            <SelectItem value="document_filed">Document Filed</SelectItem>
                            <SelectItem value="legislative_update">Legislative Updates</SelectItem>
                            <SelectItem value="system_alert">System Alerts</SelectItem>
                            <SelectItem value="deadline_reminder">Deadline Reminders</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Priorities</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                    </Select>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="unread-only"
                            checked={showUnreadOnly}
                            onCheckedChange={setShowUnreadOnly}
                        />
                        <Label htmlFor="unread-only" className="text-sm">Unread only</Label>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const NotificationsList = ({
    notifications, onMarkAsRead, onDelete, getNotificationIcon,
    getPriorityColor, formatTimestamp
}) => {
    if (notifications.length === 0) {
        return (
            <Card>
                <CardContent className="text-center py-12">
                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                    <p className="text-gray-500">You're all caught up! No notifications to display.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            {notifications.map((notification) => (
                <Card
                    key={notification.id}
                    className={`transition-all duration-200 hover:shadow-md ${!notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
                        }`}
                >
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                                <div className={`p-2 rounded-full ${getPriorityColor(notification.priority)}`}>
                                    {getNotificationIcon(notification.type)}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <h3 className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                            {notification.title}
                                        </h3>
                                        {!notification.read && (
                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        )}
                                        {notification.actionRequired && (
                                            <Badge variant="destructive" className="text-xs">
                                                Action Required
                                            </Badge>
                                        )}
                                    </div>

                                    <p className="text-gray-600 text-sm mb-2">{notification.message}</p>

                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                        <span>{formatTimestamp(notification.timestamp)}</span>
                                        <Badge variant="outline" className="capitalize">
                                            {notification.type.replace('_', ' ')}
                                        </Badge>
                                        <Badge className={getPriorityColor(notification.priority)}>
                                            {notification.priority}
                                        </Badge>
                                        {notification.metadata?.caseNumber && (
                                            <span>Case: {notification.metadata.caseNumber}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                {!notification.read && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onMarkAsRead(notification.id)}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onDelete(notification.id)}
                                    className="text-red-600 hover:text-red-800"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

const NotificationSettings = ({ settings, setSettings }) => {
    const updateSetting = (key: keyof NotificationSettings, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const saveSettings = async () => {
        try {
            // In a real app, you'd save to user preferences in Firebase
            // await setDetails(settings, 'user_preferences', currentUserId);
            console.log('Settings saved:', settings);
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                        Configure how and when you receive notifications
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="email-notifications" className="text-base font-medium">
                                    Email Notifications
                                </Label>
                                <p className="text-sm text-gray-600">Receive notifications via email</p>
                            </div>
                            <Switch
                                id="email-notifications"
                                checked={settings.emailNotifications}
                                onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                            />
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="push-notifications" className="text-base font-medium">
                                    Push Notifications
                                </Label>
                                <p className="text-sm text-gray-600">Receive browser push notifications</p>
                            </div>
                            <Switch
                                id="push-notifications"
                                checked={settings.pushNotifications}
                                onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
                            />
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <h4 className="font-medium">Notification Types</h4>

                        {[
                            { key: 'caseUpdates', label: 'Case Updates', description: 'Status changes, assignments, rulings' },
                            { key: 'hearingReminders', label: 'Hearing Reminders', description: 'Upcoming hearings and schedule changes' },
                            { key: 'documentAlerts', label: 'Document Alerts', description: 'New filings, approvals, rejections' },
                            { key: 'legislativeUpdates', label: 'Legislative Updates', description: 'New laws and amendments' },
                            { key: 'systemAlerts', label: 'System Alerts', description: 'Maintenance, outages, updates' }
                        ].map(({ key, label, description }) => (
                            <div key={key} className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor={key} className="text-base font-medium">{label}</Label>
                                    <p className="text-sm text-gray-600">{description}</p>
                                </div>
                                <Switch
                                    id={key}
                                    checked={settings[key as keyof NotificationSettings] as boolean}
                                    onCheckedChange={(checked) => updateSetting(key as keyof NotificationSettings, checked)}
                                />
                            </div>
                        ))}
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <h4 className="font-medium">Reminder Timing</h4>
                        <Select
                            value={settings.reminderTiming}
                            onValueChange={(value) => updateSetting('reminderTiming', value)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1hour">1 hour before</SelectItem>
                                <SelectItem value="1day">1 day before</SelectItem>
                                <SelectItem value="1week">1 week before</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={saveSettings}>
                            Save Settings
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Notification Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{notifications.length}</div>
                            <div className="text-sm text-gray-600">Total</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{unreadCount}</div>
                            <div className="text-sm text-gray-600">Unread</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">{actionRequiredCount}</div>
                            <div className="text-sm text-gray-600">Action Required</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {notifications.filter(n => n.priority === 'urgent').length}
                            </div>
                            <div className="text-sm text-gray-600">Urgent</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default NotificationsPage;