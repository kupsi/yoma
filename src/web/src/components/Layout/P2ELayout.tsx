import { type ReactNode } from "react";
import Footer from "~/components/Footer/P2EFooter";

type Props = {
  children: ReactNode;
};

const P2ELayout = ({ children }: Props) => {
  return (
    <div className="flex grow flex-col">
      <main className="bg-white">{children}</main>
      <Footer />
    </div>
  );
};

export default P2ELayout;
