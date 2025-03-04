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
  }

  // Signup controller
  async signup(req: Request, res: Response, next: NextFunction) {
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
        return next(errorHandler(409, "User with this email already exists"));
      }
      next(errorHandler(500, (err as Error).message || "Signup failed, Please try again"));
    }
  }

  // Signin controller 
  async signin(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      const result = await this.authService.signin(email, password, req);

      res.status(200).json(result);
    } catch (err) {
      if ((err as Error).message === "Invalid email or password") {
        return next(errorHandler(401, "Invalid email or password"));
      }
      next(errorHandler(500, (err as Error).message || "Signin failed, Please try again"));
    }
  }

  // Get login history controller
  async getLoginHistory(req: Request, res: Response, next: NextFunction) {
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

  async refreshAccessToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken || refreshToken === "" || refreshToken === undefined) {
        return next(errorHandler(400, "Refresh Token is required"));
      }
      const result = await this.authService.refreshAccessToken(refreshToken);
      res.status(200).json({
        status: "success",
        statusCode: 200,
        message: "Access Token Refreshed Successfully",
        data: result
      });
    } catch (err) {
      next(errorHandler(500, (err as Error).message || "Failed to refresh access token"));
    }
  }
}