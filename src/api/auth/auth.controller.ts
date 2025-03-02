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
      const userId = (req as any).user.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const loginHistory = await this.authService.getLoginHistory(userId, limit);

      res.status(200).json({
        status: "success",
        statusCode: 200,
        data: {
          loginHistory
        }
      });
    } catch (err) {
      next(errorHandler(500, (err as Error).message || "Failed to fetch login history"));
    }
  }
}