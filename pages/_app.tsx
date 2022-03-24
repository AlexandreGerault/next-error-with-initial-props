import "../styles/globals.css";
import type { AppContext, AppProps } from "next/app";
import App from "next/app";
import { ServerAuthGuard } from "@/services/AuthGuard";
import { guestRoutesOnly, protectedRoutes } from "@/config/routes";

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

MyApp.getInitialProps = async (context: AppContext) => {
  const { ctx } = context;
  const req = ctx.req;
  const pathname = ctx.pathname;
  const res = ctx.res;

  if (!req || !pathname || !res) {
    return {};
  }

  const props = { ...(await App.getInitialProps(context)) };

  const authenticator = new ServerAuthGuard(
    async () => {
      throw { response: { status: 401 } };
    },
    protectedRoutes,
    guestRoutesOnly,
    res
  );
  await authenticator.authenticateUser(pathname, req.headers.cookie);

  return props;
};

export default MyApp;
