export default interface SystemAlert {
    id: string;
    type: 'error' | 'warning' | 'info';
    message: string;
    timestamp: string;
}