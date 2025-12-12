import { All, Controller, Req, Res, Inject } from '@nestjs/common';
import { Request, Response } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { BETTER_AUTH } from '@boost/common';

/**
 * BetterAuth Controller
 * Proxies all /api/auth/* requests to Better-Auth
 * Handles sign-up, sign-in, sign-out, session management, and organization operations
 */
@Controller('api/auth')
export class BetterAuthController {
  private handler: ReturnType<typeof toNodeHandler>;

  constructor(@Inject(BETTER_AUTH) private auth: any) {
    this.handler = toNodeHandler(auth);
  }

  @All('*')
  async handleAuth(@Req() req: Request, @Res() res: Response) {
    // Better-Auth handles all auth routes
    return this.handler(req, res);
  }
}
