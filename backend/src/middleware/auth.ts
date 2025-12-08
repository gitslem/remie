import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, UserRole } from '@prisma/client';
import { AppError } from './errorHandler';

const prisma = new PrismaClient();

interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new AppError('Authentication token required', 401));
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload;

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user) {
      return next(new AppError('User no longer exists', 401));
    }

    if (user.status !== 'ACTIVE') {
      return next(new AppError('Account is not active', 403));
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new AppError('Invalid token', 401));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new AppError('Token expired', 401));
    }
    next(error);
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};
