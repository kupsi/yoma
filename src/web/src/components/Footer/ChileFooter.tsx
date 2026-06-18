import Link from "next/link";
import {
  FaInstagram,
  FaXTwitter,
  FaLinkedin,
  FaYoutube,
  FaFacebook,
} from "react-icons/fa6";
import ChileWordmark from "~/components/Chile/ChileWordmark";

const PLATFORM_LINKS = [
  { label: "Explorar oportunidades", href: "/opportunities" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Últimas historias", href: "/news" },
  { label: "Iniciar sesión", href: "/login" },
];

const SUPPORT_LINKS = [
  { label: "Sobre Chile Joven", href: "/" },
  { label: "Contacto", href: "/" },
  { label: "Política de privacidad", href: "/privacy" },
  { label: "Términos de uso", href: "/terms" },
];

const SOCIALS = [
  { Icon: FaInstagram, href: "https://www.instagram.com/" },
  { Icon: FaXTwitter, href: "https://twitter.com/" },
  { Icon: FaLinkedin, href: "https://www.linkedin.com/" },
  { Icon: FaYoutube, href: "https://www.youtube.com/" },
  { Icon: FaFacebook, href: "https://www.facebook.com/" },
];

const ChileFooter = () => {
  return (
    <footer className="w-full" style={{ backgroundColor: "#0033a0" }}>
      {/* accent bar (flag colours) */}
      <div className="flex h-1.5 w-full">
        <div className="flex-1" style={{ backgroundColor: "#da291c" }} />
        <div className="flex-1" style={{ backgroundColor: "#ffffff" }} />
        <div className="flex-1" style={{ backgroundColor: "#0033a0" }} />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-6 py-12 md:grid-cols-4">
        {/* brand */}
        <div className="flex flex-col gap-4">
          <span className="inline-block w-fit rounded-lg bg-white px-3 py-2">
            <ChileWordmark height={26} onLight />
          </span>
          <p className="text-sm leading-relaxed text-white/70">
            La plataforma que conecta a jóvenes de Chile con oportunidades de
            aprendizaje, capacitación y empleo verificadas.
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
            Plataforma
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
            Información
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

        {/* newsletter / cta */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold tracking-widest text-white/50 uppercase">
            Comienza hoy
          </p>
          <p className="text-sm text-white/70">
            Crea tu cuenta gratuita y empieza a sumar habilidades para tu futuro.
          </p>
          <Link
            href="/opportunities"
            className="mt-1 inline-block w-fit rounded-full px-5 py-2.5 text-sm font-bold text-white"
            style={{ backgroundColor: "#da291c" }}
          >
            Crear cuenta gratis
          </Link>
        </div>
      </div>

      {/* bottom bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-5 text-xs text-white/50 md:flex-row">
          <span>
            © {new Date().getFullYear()} Chile Joven — Demo agregador construido
            sobre la plataforma Yoma.
          </span>
          <span>Hecho con la plataforma Yoma · Para fines de demostración</span>
        </div>
      </div>
    </footer>
  );
};

export default ChileFooter;
