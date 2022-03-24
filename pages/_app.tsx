import "../styles/globals.css";
import type { AppContext, AppProps } from "next/app";
import App from "next/app";

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

  try {
    throw { error: "Welcome" };
  } catch (error) {
    console.log("Catched error", { error });
  }

  return props;
};

export default MyApp;
