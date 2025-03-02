import { Router } from "express";
import AuthController from "./auth.controller";
import { loginHistoryLimiter, signinLimiter, signupLimiter } from "./auth.rateLimiting";
import { validateSignin, validateSignup } from "./auth.validation";
import { authorize } from "../../middlewares/authorization.middleware";

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
      validateSignup,
      this.authController.signup
    );

    // Signin route
    this.router.post(
      "/signin",
      signinLimiter,
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
  }

  // Returns the router object
  public getRouter(): Router {
    return this.router;
  }
}
