import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { errorHandler } from "../../utils/errorHandler";

export default class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
    this.signup = this.signup.bind(this);
    this.signin = this.signin.bind(this);
    this.getLoginHistory = this.getLoginHistory.bind(this);
    this.refreshAccessToken = this.refreshAccessToken.bind(this);
    this.verifyEmail = this.verifyEmail.bind(this);
    this.resendVerificationCode = this.resendVerificationCode.bind(this);
    this.forgotPassword = this.forgotPassword.bind(this);
    this.resetPassword = this.resetPassword.bind(this);
  }

  // Signup controller
  async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { firstName, lastName, email, password } = req.body;

      const result = await this.authService.signup(
        firstName,
        lastName,
        email,
        password,
      );

      res.status(201).json(result);
    } catch (err) {
      if ((err as Error).message === "User with this email already exists") {
        next(errorHandler(409, "User with this email already exists"));
        return;
      }
      next(errorHandler(500, (err as Error).message || "Signup failed, Please try again"));
    }
  }

  // Signin controller 
  async signin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      const result = await this.authService.signin(email, password, req);

      res.status(200).json(result);
    } catch (err) {
      if ((err as Error).message === "Invalid email or password") {
        next(errorHandler(401, "Invalid email or password"));
        return;
      }
      if ((err as Error).message === "Account not verified. Please verify your email address.") {
        next(errorHandler(403, "Account not verified. Please verify your email address."));
        return;
      }
      next(errorHandler(500, (err as Error).message || "Signin failed, Please try again"));
    }
  }

  // Get login history controller
  async getLoginHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id as string;

      const loginHistory = await this.authService.getLoginHistory(userId);

      res.status(200).json({
        status: "success",
        statusCode: 200,
        message: "Login history fetched successfully",
        data: {
          loginHistory
        }
      });
    } catch (err) {
      next(errorHandler(500, (err as Error).message || "Failed to fetch login history"));
    }
  }

  // Refresh access token controller
  async refreshAccessToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken || refreshToken === "" || refreshToken === undefined) {
        next(errorHandler(400, "Refresh Token is required"));
        return;
      }

      const result = await this.authService.refreshAccessToken(refreshToken);

      res.status(200).json({
        status: "success",
        statusCode: 200,
        message: "Access Token Refreshed Successfully",
        data: {
          accessToken: result,
        }
      });
    } catch (err) {
      next(errorHandler(500, (err as Error).message || "Failed to refresh access token"));
    }
  }

  // Verify email controller
  async verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        next(errorHandler(400, "Email and verification code are required"));
        return;
      }

      const result = await this.authService.verifyEmail(email, code);

      res.status(200).json(result);
    } catch (err) {
      const message = (err as Error).message;
      if (message === "User not found") {
        next(errorHandler(404, "User not found"));
        return;
      }
      if (message === "Email already verified") {
        next(errorHandler(400, "Email already verified"));
        return;
      }
      if (message === "Invalid verification code") {
        next(errorHandler(400, "Invalid verification code"));
        return;
      }
      if (message === "Verification code has expired") {
        next(errorHandler(400, "Verification code has expired"));
        return;
      }
      next(errorHandler(500, "Email verification failed"));
    }
  }

  // Resend verification code controller
  async resendVerificationCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        next(errorHandler(400, "Email is required"));
        return;
      }

      const result = await this.authService.resendVerificationCode(email);

      res.status(200).json(result);
    } catch (err) {
      const message = (err as Error).message;
      if (message === "User not found") {
        next(errorHandler(404, "User not found"));
        return;
      }
      if (message === "Email already verified") {
        next(errorHandler(400, "Email already verified"));
        return;
      }
      next(errorHandler(500, "Failed to resend verification code"));
    }
  }

  // Forgot password controller
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        next(errorHandler(400, "Email is required"));
        return;
      }

      const result = await this.authService.forgotPassword(email);

      res.status(200).json(result);
    } catch (err) {
      const message = (err as Error).message;
      if (message === "User not found") {
        next(errorHandler(404, "User not found"));
        return;
      }
      next(errorHandler(500, "Failed to process forgot password request"));
    }
  }

  // Reset password controller
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, code, newPassword } = req.body;

      if (!email || !code || !newPassword) {
        next(errorHandler(400, "Email, reset code, and new password are required"));
        return;
      }

      const result = await this.authService.resetPassword(email, code, newPassword);

      res.status(200).json(result);
    } catch (err) {
      const message = (err as Error).message;
      if (message === "User not found") {
        next(errorHandler(404, "User not found"));
        return;
      }
      if (message === "Reset token not found or expired") {
        next(errorHandler(400, "No active reset request found"));
        return;
      }
      if (message === "Invalid reset code") {
        next(errorHandler(400, "Invalid reset code"));
        return;
      }
      if (message === "Reset code has expired") {
        next(errorHandler(400, "Reset code has expired"));
        return;
      }
      next(errorHandler(500, "Password reset failed"));
    }
  }
}