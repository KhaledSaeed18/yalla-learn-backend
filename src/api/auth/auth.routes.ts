import { Router } from "express";
import AuthController from "./auth.controller";
import { loginHistoryLimiter, signinLimiter, signupLimiter } from "./auth.rateLimiting";
import { validateSignin, validateSignup } from "./auth.validation";
import { authorize } from "../../middlewares/authorization.middleware";
import { sanitizeRequestBody } from '../../middlewares/sanitizeBody.middleware';

export default class AuthRouter {
  private router: Router;
  private authController: AuthController;

  constructor() {
    this.router = Router();
    this.authController = new AuthController();
    this.initRoutes();
  }

  private initRoutes(): void {
    // Signup route
    this.router.post(
      "/signup",
      signupLimiter,
      sanitizeRequestBody,
      validateSignup,
      this.authController.signup
    );

    // Signin route
    this.router.post(
      "/signin",
      signinLimiter,
      sanitizeRequestBody,
      validateSignin,
      this.authController.signin
    );

    // Get user login history route
    this.router.get(
      "/login-history",
      loginHistoryLimiter,
      authorize,
      this.authController.getLoginHistory
    );

    // Refresh token route
    this.router.post(
      "/refresh-token",
      authorize,
      this.authController.refreshAccessToken
    );
  }

  // Returns the router object
  public getRouter(): Router {
    return this.router;
  }
}
