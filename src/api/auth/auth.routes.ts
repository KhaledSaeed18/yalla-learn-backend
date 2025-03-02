import { Router } from "express";
import AuthController from "./auth.controller";

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
      this.authController.signup
    );
    this.router.post(
      "/signin",
      this.authController.signin
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}
