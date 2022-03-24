import { User } from "@/types/user";

export interface Route {
  path: string;
  role?: User["role"];
}

/**
 * When route is registered there but SSR is not forced on component, it can lead to auth middleware not being run
 * Don't forget to force SSR on corresponding pages by adding getServerSideProps() function, even if empty
 */
const protectedRoutes: Route[] = [{ path: "/dashboard" }];
const guestRoutesOnly: Route[] = [];

export { guestRoutesOnly, protectedRoutes };
