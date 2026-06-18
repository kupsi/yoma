import Image from "next/image";
import Link from "next/link";
import logoGenU from "public/images/genu/logo-genu.webp";
import logoUnicef from "public/images/genu/logo-unicef.png";
import { FaFacebook, FaInstagram, FaLinkedin, FaYoutube } from "react-icons/fa";

export const GenUFooter: React.FC = () => (
  <footer style={{ backgroundColor: "#003087" }} className="w-full text-white">
    {/* ACCENT BAR */}
    <div className="flex h-1 w-full">
      <div className="flex-1" style={{ backgroundColor: "#E8342A" }} />
      <div className="flex-1" style={{ backgroundColor: "#F5821F" }} />
      <div className="flex-1" style={{ backgroundColor: "#FCC72C" }} />
      <div className="flex-1" style={{ backgroundColor: "#00aeef" }} />
    </div>

    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-4">

        {/* COL 1 — Brand */}
        <div className="flex flex-col gap-4">
          <Image src={logoGenU} alt="Generation Unlimited" height={44} style={{ height: 44, width: "auto" }} />
          <p className="text-sm text-white/70">A UNICEF-led global partnership</p>
          <Image src={logoUnicef} alt="UNICEF" height={28} style={{ height: 28, width: "auto" }} />
        </div>

        {/* COL 2 — Platform */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white/50">Platform</h4>
          {[
            { label: "Opportunities", href: "/opportunities" },
            { label: "Marketplace", href: "/marketplace" },
            { label: "About Yoma", href: "/about" },
            { label: "Partners", href: "/organisations" },
          ].map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-white/80 hover:text-white hover:underline">
              {l.label}
            </Link>
          ))}
        </div>

        {/* COL 3 — Support */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white/50">Support</h4>
          {[
            { label: "Help Centre", href: "mailto:help@yoma.world" },
            { label: "Contact Us", href: "mailto:help@yoma.world" },
            { label: "Privacy Policy", href: "/terms" },
            { label: "Terms of Use", href: "/terms" },
          ].map((l) => (
            <Link key={l.label} href={l.href} className="text-sm text-white/80 hover:text-white hover:underline">
              {l.label}
            </Link>
          ))}
        </div>

        {/* COL 4 — Social */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white/50">Follow Us</h4>
          <div className="flex gap-4">
            {[
              { Icon: FaInstagram, href: "https://www.instagram.com/generationunlimited/", label: "Instagram" },
              { Icon: FaYoutube, href: "https://www.youtube.com/@Yoma.World.2019", label: "YouTube" },
              { Icon: FaLinkedin, href: "https://www.linkedin.com/company/generationunlimited/", label: "LinkedIn" },
              { Icon: FaFacebook, href: "https://www.facebook.com/GenerationUnlimited/", label: "Facebook" },
            ].map(({ Icon, href, label }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                aria-label={label} className="text-white/70 hover:text-white transition-colors">
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/50 md:flex-row">
        <span>© 2026 Generation Unlimited / UNICEF. All Rights Reserved.</span>
        <span>Powered by <span className="text-white/80 font-semibold">Yoma</span></span>
      </div>
    </div>
  </footer>
);
