import { prisma } from './prisma';
import { v4 as uuidv4 } from 'uuid';

export interface SessionData {
  id: string;
  sessionId: string;
  userId?: string;
  deviceId: string;
  userAgent?: string;
  ipAddress?: string;
  isActive: boolean;
  createdAt: Date;
  lastActive: Date;
  expiresAt: Date;
}

export class SessionManager {
  static async createSession(
    deviceId: string,
    userAgent?: string,
    ipAddress?: string,
    userId?: string
  ): Promise<SessionData> {
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const session = await prisma.session.create({
      data: {
        sessionId,
        userId,
        deviceId,
        userAgent,
        ipAddress,
        isActive: true,
        expiresAt,
      },
    });

    return session;
  }

  static async getSession(sessionId: string): Promise<SessionData | null> {
    const session = await prisma.session.findUnique({
      where: { sessionId },
    });

    if (!session || !session.isActive || session.expiresAt < new Date()) {
      return null;
    }

    return session;
  }

  static async updateLastActive(sessionId: string): Promise<void> {
    await prisma.session.update({
      where: { sessionId },
      data: { lastActive: new Date() },
    });
  }

  static async deactivateSession(sessionId: string): Promise<void> {
    await prisma.session.update({
      where: { sessionId },
      data: { isActive: false },
    });
  }

  static async cleanupExpiredSessions(): Promise<void> {
    await prisma.session.updateMany({
      where: {
        expiresAt: { lt: new Date() },
        isActive: true,
      },
      data: { isActive: false },
    });
  }

  static async getChatHistory(sessionId: string, limit: number = 50) {
    return prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'asc' },
      take: limit,
    });
  }
}