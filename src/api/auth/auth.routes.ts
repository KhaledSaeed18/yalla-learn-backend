import { Router } from "express";
import AuthController from "./auth.controller";
import { signinLimiter, signupLimiter } from "./auth.rateLimiting";

export default class AuthRouter {
  private router: Router;
  private authController: AuthController;

  constructor() {
    this.router = Router();
    this.authController = new AuthController();
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.post(
      "/signup",
      signupLimiter,
      this.authController.signup
    );
    this.router.post(
      "/signin",
      signinLimiter,
      this.authController.signin
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
