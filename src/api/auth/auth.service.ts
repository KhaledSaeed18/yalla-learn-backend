import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken } from "../../utils/generateTokens";

export class AuthService {
  private prisma: PrismaClient;
  private saltRounds = parseInt(process.env.SALT_ROUNDS || '10');

  constructor() {
    this.prisma = new PrismaClient();
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

  // Signin method
  public async signin(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

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
}
