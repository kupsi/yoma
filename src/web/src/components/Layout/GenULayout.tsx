import Head from "next/head";
import type { ReactElement } from "react";
import { GenUFooter } from "../Footer/GenUFooter";
import { Feedback } from "../Feedback";

export type LayoutProps = ({
  children,
}: {
  children: ReactElement;
}) => ReactElement;

const GenULayout: LayoutProps = ({ children }) => {
  return (
    <>
      <Head>
        <title>Generation Unlimited | Youth Opportunities Platform</title>
        <meta name="viewport" content="initial-scale=1, width=device-width" />
        <meta
          name="description"
          content="Generation Unlimited connects young people to learning, work, and civic engagement opportunities. Free, verified, and built for every young person."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="bg-gray-light flex min-h-screen justify-center">
        <Feedback />
        {children}
      </main>
      <GenUFooter />
    </>
  );
};

export default GenULayout;
