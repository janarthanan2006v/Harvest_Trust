import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { loginSchema } from '../validators/auth.validator.js';

const JWT_SECRET = process.env.JWT_SECRET || 'harvesttrust_secret_token_sih_2026';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials or inactive user.',
        },
        requestId: req.requestId,
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials.',
        },
        requestId: req.requestId,
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Save login audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        entityType: 'User',
        entityId: user.id,
        action: 'LOGIN',
      },
    });

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      requestId: req.requestId,
    });
  } catch (error) {
    next(error);
  }
}
