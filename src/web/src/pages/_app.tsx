import {
  QueryClient,
  QueryClientProvider,
  HydrationBoundary,
  type DehydratedState,
} from "@tanstack/react-query";
import { Provider } from "jotai";
import type { NextPage } from "next";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import type { AppProps } from "next/app";
import { Nunito, Noto_Sans, Open_Sans } from "next/font/google";
import { useRouter } from "next/router";
import type { ReactElement, ReactNode } from "react";
import { useState } from "react";
import { ToastContainer } from "react-toastify";
import { Navbar } from "~/components/NavBar/Navbar";
import { Global } from "~/components/Global";
import ConfirmationModalContextProvider from "~/context/modalConfirmationContext";
import { config } from "~/lib/react-query-config";
import "~/styles/globals.css";
import "~/styles/FileUpload.css";
import { BRAND, THEME_PURPLE } from "~/lib/constants";
import { GoogleAnalytics } from "~/components/GoogleAnalytics";
import Router from "next/router";
import NProgress from "nprogress";
import "nprogress/nprogress.css";

// configure fonts for tailwindcss
const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const notoSans = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-noto-sans",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

//#region Configure NProgress
NProgress.configure({ showSpinner: false });
Router.events.on("routeChangeStart", () => NProgress.start());
Router.events.on("routeChangeComplete", () => NProgress.done());
Router.events.on("routeChangeError", () => NProgress.done());
//#endregion Configure NProgress

export type NextPageWithLayout<P = object, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
  theme?: (page: ReactElement<{ theme: string }>) => string;
};

type AppPropsWithLayout<P> = AppProps<P> & {
  Component: NextPageWithLayout<P>;
};

const MyApp = ({
  Component,
  pageProps,
}: AppPropsWithLayout<{
  session: Session;
  dehydratedState?: DehydratedState;
}>) => {
  // see https://flaviocopes.com/nextjs-refresh-state-navigation/
  // when the state of a component is not refreshed when navigating between pages
  const router = useRouter();

  // This ensures that data is not shared
  // between different users and requests
  const [queryClient] = useState(() => new QueryClient(config));

  const component = <Component {...pageProps} key={router.asPath} />;

  // Use the layout defined at the page level, if available
  const getLayout = Component.getLayout ?? ((page) => page);

  // Brand picked at build time via NEXT_PUBLIC_BRAND (see constants.ts).
  // Forced site-wide so the navbar/footer stay branded on every route,
  // including logged-in and admin pages.
  const theme = BRAND;
  void THEME_PURPLE;

  return (
    <Provider>
      <SessionProvider session={pageProps.session}>
        <ThemeProvider enableSystem={false} forcedTheme={theme}>
          <QueryClientProvider client={queryClient}>
            <HydrationBoundary state={pageProps.dehydratedState ?? null}>
              <div
                id="mainContent"
                className={`${openSans.variable} ${nunito.variable} ${notoSans.variable} font-sans`}
              >
                <ConfirmationModalContextProvider>
                  <Global />
                  <Navbar theme={theme} />
                  {getLayout(component)}
                  <ToastContainer theme="colored" closeOnClick={true} />
                  <GoogleAnalytics />
                </ConfirmationModalContextProvider>
              </div>
            </HydrationBoundary>
          </QueryClientProvider>
        </ThemeProvider>
      </SessionProvider>
    </Provider>
  );
};

export default MyApp;
