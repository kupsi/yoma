import { type ReactNode } from "react";
import Footer from "~/components/Footer/ChileFooter";

type Props = {
  children: ReactNode;
};

const ChileLayout = ({ children }: Props) => {
  return (
    <div className="flex grow flex-col">
      <main className="bg-white">{children}</main>
      <Footer />
    </div>
  );
};

export default ChileLayout;
