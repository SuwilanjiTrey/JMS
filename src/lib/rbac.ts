import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
// Adjust your next-auth import/implementation as needed
export async function requireRole(_req: NextRequest, roles: string[]) {
    const session = await getServerSession();
    if (!session?.user) throw new Response('Unauthorized', { status: 401 });
    const userRole = (session.user as any)?.role ?? 'guest';
    if (!roles.includes(userRole)) throw new Response('Forbidden', { status: 403 });
    return session;
}