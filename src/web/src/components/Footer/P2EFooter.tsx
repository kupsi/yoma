import Link from "next/link";
import {
  FaInstagram,
  FaXTwitter,
  FaLinkedin,
  FaYoutube,
  FaFacebook,
} from "react-icons/fa6";
import P2EWordmark from "~/components/P2E/P2EWordmark";

const PLATFORM_LINKS = [
  { label: "Browse skilling", href: "/opportunities" },
  { label: "Your passport (YoID)", href: "/yoid" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Sign in", href: "/login" },
];

const SUPPORT_LINKS = [
  { label: "About P2E", href: "/" },
  { label: "Contact", href: "/" },
  { label: "Privacy policy", href: "/privacy" },
  { label: "Terms of use", href: "/terms" },
];

const SOCIALS = [
  { Icon: FaInstagram, href: "https://www.instagram.com/" },
  { Icon: FaXTwitter, href: "https://twitter.com/" },
  { Icon: FaLinkedin, href: "https://www.linkedin.com/" },
  { Icon: FaYoutube, href: "https://www.youtube.com/" },
  { Icon: FaFacebook, href: "https://www.facebook.com/" },
];

const P2EFooter = () => {
  return (
    <footer className="w-full" style={{ backgroundColor: "#102a54" }}>
      {/* foil-gold accent bar */}
      <div className="flex h-1.5 w-full">
        <div className="flex-1" style={{ backgroundColor: "#c8a14a" }} />
        <div className="flex-1" style={{ backgroundColor: "#f6efe1" }} />
        <div className="flex-1" style={{ backgroundColor: "#c8a14a" }} />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-12 md:grid-cols-4">
        {/* brand */}
        <div className="flex flex-col gap-4">
          <span className="inline-block w-fit rounded-lg bg-white px-3 py-2">
            <P2EWordmark height={26} onLight />
          </span>
          <p className="text-sm leading-relaxed text-white/70">
            A global skilling passport. Earn verified learning credentials from
            partners worldwide, then carry them with you in your YoID.
          </p>
          <div className="mt-2 flex gap-3">
            {SOCIALS.map(({ Icon, href }, i) => (
              <Link
                key={i}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <Icon size={16} />
              </Link>
            ))}
          </div>
        </div>

        {/* platform */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold tracking-widest text-white/50 uppercase">
            Platform
          </p>
          {PLATFORM_LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-sm text-white/80 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* support */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold tracking-widest text-white/50 uppercase">
            Info
          </p>
          {SUPPORT_LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-sm text-white/80 hover:text-white"
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* cta */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold tracking-widest text-white/50 uppercase">
            Start your passport
          </p>
          <p className="text-sm text-white/70">
            Create a free account and start collecting verified skilling
            credentials.
          </p>
          <Link
            href="/opportunities"
            className="mt-1 inline-block w-fit rounded-full px-5 py-2.5 text-sm font-bold"
            style={{ backgroundColor: "#c8a14a", color: "#0a1d3b" }}
          >
            Create free account
          </Link>
        </div>
      </div>

      {/* bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-white/50 md:flex-row">
          <span>
            © {new Date().getFullYear()} Passport 2 Earning — aggregator demo
            built on the Yoma platform.
          </span>
          <span>Made with the Yoma platform · Demonstration only</span>
        </div>
      </div>
    </footer>
  );
};

export default P2EFooter;
