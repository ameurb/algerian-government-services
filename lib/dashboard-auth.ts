// Simple authentication for dashboard access
// In production, integrate with NextAuth.js or your preferred auth system

import { NextApiRequest, NextApiResponse } from 'next';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'viewer' | 'editor';
  permissions: string[];
  lastLogin: string;
}

// Demo admin users (in production, store in database)
const adminUsers: AdminUser[] = [
  {
    id: '1',
    email: 'admin@api.findapply.com',
    name: 'System Administrator',
    role: 'admin',
    permissions: ['*'], // All permissions
    lastLogin: new Date().toISOString()
  },
  {
    id: '2', 
    email: 'viewer@api.findapply.com',
    name: 'Dashboard Viewer',
    role: 'viewer',
    permissions: ['dashboard:view', 'stats:read'],
    lastLogin: new Date(Date.now() - 60000).toISOString()
  }
];

// Simple session management (in production, use proper session store)
const activeSessions = new Map<string, { userId: string; expiresAt: number }>();

export class DashboardAuth {
  
  // Simple authentication check
  static authenticate(email: string, password: string): AdminUser | null {
    // In production, hash and verify passwords properly
    const demoCredentials = {
      'admin@api.findapply.com': 'admin123',
      'viewer@api.findapply.com': 'viewer123'
    };
    
    if (demoCredentials[email as keyof typeof demoCredentials] === password) {
      const user = adminUsers.find(u => u.email === email);
      if (user) {
        user.lastLogin = new Date().toISOString();
        return user;
      }
    }
    
    return null;
  }
  
  // Create session token
  static createSession(userId: string): string {
    const sessionToken = this.generateToken();
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    
    activeSessions.set(sessionToken, { userId, expiresAt });
    return sessionToken;
  }
  
  // Verify session token
  static verifySession(token: string): AdminUser | null {
    const session = activeSessions.get(token);
    
    if (!session || session.expiresAt < Date.now()) {
      if (session) activeSessions.delete(token);
      return null;
    }
    
    const user = adminUsers.find(u => u.id === session.userId);
    return user || null;
  }
  
  // Check user permissions
  static hasPermission(user: AdminUser, permission: string): boolean {
    if (user.permissions.includes('*')) return true;
    return user.permissions.includes(permission);
  }
  
  // Generate random token
  private static generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
  
  // Revoke session
  static revokeSession(token: string): boolean {
    return activeSessions.delete(token);
  }
  
  // Get all active sessions
  static getActiveSessions(): Array<{ token: string; userId: string; expiresAt: number }> {
    const now = Date.now();
    const sessions: Array<{ token: string; userId: string; expiresAt: number }> = [];
    
    activeSessions.forEach((session, token) => {
      if (session.expiresAt > now) {
        sessions.push({ token, ...session });
      } else {
        activeSessions.delete(token);
      }
    });
    
    return sessions;
  }
}

// Middleware for protecting dashboard routes
export function requireAuth(handler: Function) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const user = DashboardAuth.verifySession(token);
      
      if (!user) {
        return res.status(401).json({ error: 'Invalid or expired session' });
      }
      
      // Add user to request object
      (req as any).user = user;
      
      return handler(req, res);
      
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(500).json({ error: 'Authentication failed' });
    }
  };
}

// Middleware for checking specific permissions
export function requirePermission(permission: string) {
  return (handler: Function) => {
    return requireAuth(async (req: NextApiRequest, res: NextApiResponse) => {
      const user = (req as any).user as AdminUser;
      
      if (!DashboardAuth.hasPermission(user, permission)) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: permission,
          userPermissions: user.permissions
        });
      }
      
      return handler(req, res);
    });
  };
}