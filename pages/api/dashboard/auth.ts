import { NextApiRequest, NextApiResponse } from 'next';
import { DashboardAuth } from '@/lib/dashboard-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  
  switch (req.method) {
    case 'POST':
      return await login(req, res);
      
    case 'DELETE':
      return await logout(req, res);
      
    case 'GET':
      return await verifySession(req, res);
      
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function login(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Authenticate user
    const user = DashboardAuth.authenticate(email, password);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Create session
    const sessionToken = DashboardAuth.createSession(user.id);
    
    // Set cookie (optional)
    res.setHeader('Set-Cookie', `dashboard-session=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=86400; Path=/dashboard`);
    
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions
      },
      sessionToken,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000)
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function logout(req: NextApiRequest, res: NextApiResponse) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    
    if (token) {
      DashboardAuth.revokeSession(token);
    }
    
    // Clear cookie
    res.setHeader('Set-Cookie', 'dashboard-session=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/dashboard');
    
    res.status(200).json({ message: 'Logout successful' });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
}

async function verifySession(req: NextApiRequest, res: NextApiResponse) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No session token provided' });
    }
    
    const user = DashboardAuth.verifySession(token);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    
    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
        lastLogin: user.lastLogin
      },
      sessionInfo: {
        activeSessions: DashboardAuth.getActiveSessions().length,
        currentSession: token.substring(0, 8) + '...'
      }
    });
    
  } catch (error) {
    console.error('Session verification error:', error);
    res.status(500).json({ error: 'Session verification failed' });
  }
}