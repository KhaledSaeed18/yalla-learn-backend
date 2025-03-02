import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken } from "../../utils/generateTokens";
import { Request } from "express";

export class AuthService {
  private prisma: PrismaClient;
  private saltRounds = parseInt(process.env.SALT_ROUNDS || '10');

  constructor() {
    this.prisma = new PrismaClient();
  }

  // Helper method to extract device info from request
  private extractDeviceInfo(req: Request): {
    ipAddress: string | null;
    userAgent: string | null;
    device: string | null;
    location: string | null;
  } {
    // Get Request IP address
    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      null;

    // Get user agent (Device info)
    const userAgent = req.headers['user-agent'] || null;

    // Device type detection
    let device = 'Unknown';
    if (userAgent) {
      if (/Mobile|Android|iPhone|iPad|iPod/i.test(userAgent)) {
        device = 'Mobile';
      } else if (/Tablet|iPad/i.test(userAgent)) {
        device = 'Tablet';
      } else {
        device = 'Desktop';
      }
    }

    // TODO: Implement location detection (get location from IP address)
    const location = null;

    return { ipAddress, userAgent, device, location };
  }

  // Function to record login attempt
  private async recordLoginAttempt(userId: string, req: Request, successful: boolean) {
    const { ipAddress, userAgent, device, location } = this.extractDeviceInfo(req);

    await this.prisma.loginHistory.create({
      data: {
        userId,
        ipAddress,
        userAgent,
        device,
        location,
        successful,
        loginTime: new Date()
      }
    });
  }

  // Signup method
  public async signup(firstName: string, lastName: string, email: string, password: string) {
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    const hashedPassword = await bcrypt.hash(password, this.saltRounds);

    const newUser = await this.prisma.user.create({
      data: { firstName, lastName, email, password: hashedPassword },
    });

    return {
      status: "success",
      statusCode: 201,
      message: "User registered successfully",
      data: {
        user: {
          id: newUser.id,
          firstName,
          lastName,
          email
        },
      },
    };
  }

  // Signin method with login history
  public async signin(email: string, password: string, req: Request) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      const existingEmail = await this.prisma.user.findFirst({
        where: { email },
        select: { id: true }
      });

      // Record failed login attempt for the existing email
      if (existingEmail) {
        await this.recordLoginAttempt(existingEmail.id, req, false);
      }

      throw new Error("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await this.recordLoginAttempt(user.id, req, false);
      throw new Error("Invalid email or password");
    }

    // Record successful login attempt for the user
    await this.recordLoginAttempt(user.id, req, true);

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    return {
      status: "success",
      statusCode: 200,
      message: "User signed in successfully",
      data: {
        user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email },
        accessToken,
        refreshToken,
      },
    };
  }

  // Get login history for a user
  public async getLoginHistory(userId: string, limit: number = 10) {
    const loginHistory = await this.prisma.loginHistory.findMany({
      where: { userId: userId },
      orderBy: { loginTime: 'desc' },
      take: limit,
    });

    return loginHistory;
  }
}