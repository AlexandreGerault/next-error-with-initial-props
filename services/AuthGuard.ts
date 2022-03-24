import { ServerResponse } from "http";

import { Route } from "@/config/routes";
import { User } from "@/types/user";

type fetchUserFunction = (
  cookie: string
) => Promise<{ status: number; data?: User | Record<string, never> }>;

export abstract class AuthGuard {
  public LOGIN_URL = "/";
  public AUTH_URL = "/dashboard";

  abstract redirectToLogin(): void;
  abstract redirectToAuthenticatedPage(): void;

  constructor(
    private _fetchUser: fetchUserFunction,
    private protectedRoutes: Route[],
    private guestRoutes: Route[]
  ) {}

  async authenticateUser(pathname: string, cookies: string | undefined) {
    const isProtectedRoute = this.isProtectedRoute(pathname);
    const isGuestRoute = this.isGuestRoute(pathname);

    try {
      if (!cookies && isProtectedRoute) {
        this.redirectToLogin();
        return { user: false };
      }

      const userResponse = await this._fetchUser(cookies ?? "");

      // Abort if request was not successful.
      if (userResponse.status !== 200) {
        if (isProtectedRoute) {
          this.redirectToLogin();
        }

        return { user: false };
      }

      const { data: user } = userResponse;

      const route = this.protectedRoutes.find((route) =>
        pathname.startsWith(route.path)
      );
      // Redirect to login if user is not authenticated and tries to access protected route.
      if (!user) {
        this.redirectToLogin();
        return { user: false };
      }
      // If user is authenticated and he requests login or register, redirect to dashboard.
      else if (user && isGuestRoute) {
        this.redirectToAuthenticatedPage();
      }
      // If user is authenticated and he requests a page necessiting a role he does not have, we redirect
      else if (user && route && !this.canAccess(route, user.role)) {
        this.redirectToAuthenticatedPage();
      }

      // Return the currently authenticated user
      return { user };
    } catch (error: any) {
      /**
       * If the authentication fails (e.g. invalid session)
       * the API will send a 401 response. If we're on a
       * protected route, redirect to the login page.
       */
      if (error.response && error.response?.status === 401) {
        if (pathname === this.LOGIN_URL) {
          return { user: false };
        }

        if (!isGuestRoute) {
          this.redirectToLogin();
        }
      }

      return { user: false };
    }
  }

  private isProtectedRoute(pathname: string) {
    return !!this.protectedRoutes.find((route) =>
      pathname.startsWith(route.path)
    );
  }

  private canAccess(route: Route, role: string) {
    if (route?.role) {
      return route.role === role;
    }

    return true;
  }

  private isGuestRoute(pathname: string) {
    return !!this.guestRoutes.find((route) => pathname.startsWith(route.path));
  }
}

export class ServerAuthGuard extends AuthGuard {
  constructor(
    _fetchUser: fetchUserFunction,
    protectedRoutes: Route[],
    guestRoutes: Route[],
    private _response: ServerResponse
  ) {
    super(_fetchUser, protectedRoutes, guestRoutes);
  }

  redirectToLogin() {
    this._response.setHeader("Location", this.LOGIN_URL);
    this._response.writeHead(302);
    this._response.end();
  }

  redirectToAuthenticatedPage() {
    this._response.setHeader("Location", this.AUTH_URL);
    this._response.writeHead(302);
    this._response.end();
  }
}

export class ClientAuthGuard extends AuthGuard {
  public response: Response = new Response();

  constructor(
    _fetchUser: fetchUserFunction,
    protectedRoutes: Route[],
    guestRoutes: Route[]
  ) {
    super(_fetchUser, protectedRoutes, guestRoutes);
  }

  redirectToLogin() {
    this.response = Response.redirect(this.LOGIN_URL);
  }

  redirectToAuthenticatedPage() {
    this.response = Response.redirect(this.AUTH_URL);
  }
}
