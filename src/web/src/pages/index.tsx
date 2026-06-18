import { useQuery } from "@tanstack/react-query";
import type { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { env } from "process";
import imageHeroYouth from "public/images/genu/hero-youth.webp";
import imageHeroYouth2 from "public/images/genu/hero-youth-2.webp";
import { type ReactElement, useCallback } from "react";
import type { PlatformMetrics } from "~/api/models/analytics";
import {
  FeedType,
  NewsArticleSearchResults,
  NewsFeed,
} from "~/api/models/newsfeed";
import { getPlatformMetrics } from "~/api/services/analytics";
import { listNewsFeeds, searchNewsArticles } from "~/api/services/newsfeed";
import { searchOpportunities } from "~/api/services/opportunities";
import type { OpportunitySearchResultsInfo } from "~/api/models/opportunity";
import { ScrollableContainer } from "~/components/Carousel";
import ChileWordmark from "~/components/Chile/ChileWordmark";
import { HomeSearchInputLarge } from "~/components/Home/HomeSearchInputLarge";
import ChileLayout from "~/components/Layout/ChileLayout";
import P2ELayout from "~/components/Layout/P2ELayout";
import P2EHome from "~/components/P2E/P2EHome";
import { NewsArticleCard } from "~/components/News/NewsArticleCard";
import { OpportunityPublicSmallComponent } from "~/components/Opportunity/OpportunityPublicSmall";
import { BRAND, PAGE_SIZE_MINIMUM } from "~/lib/constants";

const CHILE_COUNTRY_ID = "a3fdbeb2-4d00-4536-aab1-352848d24637";
const CHILE_OPPORTUNITIES_LINK = `/opportunities?countries=${CHILE_COUNTRY_ID}`;
const LEARNING_TYPE_ID = "25f5a835-c3f7-43ca-9840-d372a1d26694";
import type { NextPageWithLayout } from "./_app";

const BLUE = "#0033a0";
const BLUE_DARK = "#002577";
const RED = "#da291c";
const LIGHT = "#e7edf8";

export const getStaticProps: GetStaticProps = async (context) => {
  if (env.CI) {
    return {
      props: {
        lookups_NewsArticles: null,
        lookup_NewsFeed: null,
        platformMetrics: null,
        chileOpportunities: null,
      },
      revalidate: 300,
    };
  }

  const [
    lookups_NewsArticles,
    newsFeeds,
    platformMetrics,
    chileOpportunities,
  ] = await Promise.all([
    searchNewsArticles(
      {
        feedType: FeedType.Stories,
        startDate: null,
        endDate: null,
        valueContains: null,
        pageNumber: 1,
        pageSize: PAGE_SIZE_MINIMUM,
      },
      context,
    ),
    listNewsFeeds(context),
    getPlatformMetrics(context),
    searchOpportunities(
      {
        // P2E aggregator: filter by Learning type, no country lock-in.
        // Chile aggregator: filter by Chile, all types.
        countries: BRAND === "p2e" ? null : [CHILE_COUNTRY_ID],
        types: BRAND === "p2e" ? [LEARNING_TYPE_ID] : null,
        pageNumber: 1,
        pageSize: 12,
        categories: null,
        languages: null,
        organizations: null,
        engagementTypes: null,
        commitmentInterval: null,
        zltoReward: null,
        valueContains: null,
        publishedStates: ["Active", "NotStarted"],
        mostViewed: null,
        mostCompleted: null,
        featured: null,
      },
      context,
    ),
  ]);

  return {
    props: {
      lookups_NewsArticles,
      lookup_NewsFeed: newsFeeds.find((f) => f.type === "Stories") ?? null,
      platformMetrics,
      chileOpportunities,
    },
    revalidate: 300,
  };
};

const CATEGORIES = [
  "Habilidades Digitales",
  "Programación",
  "Inglés",
  "Emprendimiento",
  "Empleabilidad",
  "Datos e IA",
  "Medio Ambiente",
  "Voluntariado",
];

const PILLARS = [
  {
    emoji: "📚",
    title: "Aprende",
    body: "Accede a cursos en línea gratuitos y obtén certificados verificados — desde habilidades digitales hasta inglés y emprendimiento.",
    accent: BLUE,
  },
  {
    emoji: "🛠️",
    title: "Capacítate",
    body: "Súmate a bootcamps y programas de capacitación de instituciones chilenas reconocidas y prepárate para el mundo laboral.",
    accent: RED,
  },
  {
    emoji: "🚀",
    title: "Crece",
    body: "Construye tu identidad joven (YoID), reúne tus credenciales y conéctate con empleos y oportunidades que reconocen tus habilidades.",
    accent: BLUE_DARK,
  },
];

const STEPS = [
  {
    n: "01",
    title: "Crea tu cuenta gratis",
    body: "Regístrate en minutos con tu identidad joven (YoID) — una sola cuenta para todas las oportunidades.",
  },
  {
    n: "02",
    title: "Explora y completa oportunidades",
    body: "Aprende, capacítate y participa en desafíos de instituciones de confianza en todo Chile.",
  },
  {
    n: "03",
    title: "Gana credenciales y conéctate",
    body: "Obtén certificados verificados y desbloquea oportunidades laborales que reconocen tus habilidades.",
  },
];

const PARTNERS = [
  "SENCE",
  "Talento Digital para Chile",
  "Fundación Kodea",
  "Desafío Latam",
  "Laboratoria",
  "Google Actívate",
  "Duoc UC",
  "INACAP",
];

const Home: NextPageWithLayout<{
  lookups_NewsArticles: NewsArticleSearchResults;
  lookup_NewsFeed: NewsFeed;
  platformMetrics: PlatformMetrics | null;
  chileOpportunities: OpportunitySearchResultsInfo | null;
}> = ({
  lookups_NewsArticles,
  lookup_NewsFeed,
  platformMetrics,
  chileOpportunities,
}) => {
  const router = useRouter();

  const { data: clientNewsArticles } = useQuery({
    queryKey: ["newsArticles", "home"],
    queryFn: async () =>
      await searchNewsArticles({
        feedType: FeedType.Stories,
        startDate: null,
        endDate: null,
        valueContains: null,
        pageNumber: 1,
        pageSize: PAGE_SIZE_MINIMUM,
      }),
    enabled: !lookups_NewsArticles?.items?.length,
    staleTime: 5 * 60 * 1000,
  });
  const { data: clientNewsFeed } = useQuery({
    queryKey: ["newsFeed", "home"],
    queryFn: async () =>
      (await listNewsFeeds()).find((f) => f.type === "Stories"),
    enabled: !lookup_NewsFeed,
    staleTime: 5 * 60 * 1000,
  });
  const { data: clientPlatformMetrics } = useQuery({
    queryKey: ["platformMetrics", "home"],
    queryFn: async () => await getPlatformMetrics(),
    enabled: !platformMetrics,
    staleTime: 5 * 60 * 1000,
  });

  const newsArticles = lookups_NewsArticles?.items?.length
    ? lookups_NewsArticles
    : clientNewsArticles;
  const newsFeed = lookup_NewsFeed ?? clientNewsFeed;
  const metrics = platformMetrics ?? clientPlatformMetrics;

  const onSearchInputSubmit = useCallback(
    (query: string) => {
      if (query.length <= 2) return;
      void router.push(
        `/opportunities?countries=${CHILE_COUNTRY_ID}&query=${encodeURIComponent(query)}`,
        undefined,
        { scroll: false },
      );
    },
    [router],
  );

  // P2E aggregator uses its own English landing — the rest of this file is
  // the Chile Joven landing. The brand is decided at build time so only one
  // branch is reachable per image. The early return sits AFTER all hooks
  // so React's rules-of-hooks invariant holds.
  if (BRAND === "p2e") {
    void newsArticles;
    void newsFeed;
    void metrics;
    void onSearchInputSubmit;
    return <P2EHome featuredOpportunities={chileOpportunities} />;
  }

  return (
    <>
      <Head>
        <title>Chile Joven | Oportunidades para jóvenes</title>
      </Head>

      <div className="relative right-0 left-0 flex w-screen flex-col overflow-x-hidden">
        {/* ── DEMO BANNER ──────────────────────────────────────────── */}
        <div
          className="w-full py-2 text-center text-xs font-semibold text-white"
          style={{ backgroundColor: RED }}
        >
          🚧 Este es un agregador de demostración construido sobre la plataforma
          Yoma — solo para fines de evaluación y prueba.
        </div>

        {/* ── HERO ─────────────────────────────────────────────────── */}
        <div className="w-full" style={{ backgroundColor: BLUE }}>
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-10 px-6 py-16 lg:flex-row lg:py-24">
            {/* LEFT */}
            <div className="flex flex-1 flex-col gap-6 text-center lg:text-left">
              <div className="flex justify-center lg:justify-start">
                <span className="inline-block rounded-lg bg-white px-4 py-2.5">
                  <ChileWordmark height={40} onLight />
                </span>
              </div>

              <h1 className="font-nunito text-4xl leading-tight font-black tracking-tight uppercase text-white md:text-5xl lg:text-6xl">
                Tu futuro
                <br />
                <span style={{ color: "#ffd000" }}>comienza hoy.</span>
              </h1>

              <p className="text-lg font-medium text-white/90">
                Aprende nuevas habilidades. Capacítate. Construye tu camino.
                <br />
                <span className="text-base text-white/75">
                  Una plataforma. Miles de oportunidades. Para los jóvenes de
                  Chile.
                </span>
              </p>

              <div className="flex justify-center lg:justify-start">
                <HomeSearchInputLarge
                  onSearch={onSearchInputSubmit}
                  maxWidth={0}
                />
              </div>

              <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
                <Link
                  href={CHILE_OPPORTUNITIES_LINK}
                  className="rounded-full px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: RED }}
                >
                  Comienza gratis
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/20"
                >
                  ¿Ya tienes cuenta? Inicia sesión
                </Link>
              </div>

              {/* TRUST LINE */}
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-white/80 lg:justify-start">
                <span>
                  ✓ {metrics?.userCountDisplay ?? "950.000"}+ jóvenes registrados
                </span>
                <span>✓ Instituciones chilenas de confianza</span>
                <span>✓ Certificados verificados</span>
              </div>
            </div>

            {/* RIGHT — photo collage */}
            <div className="flex flex-1 justify-center gap-4 lg:gap-6">
              <div className="mt-8 w-[200px] overflow-hidden rounded-2xl shadow-2xl md:w-[240px]">
                <Image
                  src={imageHeroYouth}
                  alt="Jóvenes aprendiendo"
                  sizes="280px"
                  priority
                  style={{ objectFit: "cover", width: "100%", height: "320px" }}
                />
              </div>
              <div className="-mt-8 w-[200px] overflow-hidden rounded-2xl shadow-2xl md:w-[240px]">
                <Image
                  src={imageHeroYouth2}
                  alt="Joven frente al computador"
                  sizes="280px"
                  priority
                  style={{ objectFit: "cover", width: "100%", height: "320px" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ACCENT STRIPE (flag colours) */}
        <div className="flex h-2 w-full">
          <div className="flex-1" style={{ backgroundColor: BLUE }} />
          <div className="flex-[2]" style={{ backgroundColor: "#ffffff" }} />
          <div className="flex-[3]" style={{ backgroundColor: RED }} />
        </div>

        {/* ── ABOUT ────────────────────────────────────────────────── */}
        <div className="w-full bg-white">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2">
              <div className="flex flex-col gap-4">
                <p
                  className="text-xs font-bold tracking-widest uppercase"
                  style={{ color: BLUE }}
                >
                  Sobre Chile Joven
                </p>
                <h2 className="font-nunito text-2xl font-bold text-black md:text-3xl">
                  Un puente entre los jóvenes y su futuro
                </h2>
                <p className="text-sm leading-relaxed text-gray-600">
                  Chile Joven reúne en un solo lugar oportunidades de
                  aprendizaje, capacitación y empleo para personas jóvenes de
                  todo el país, conectándolas con instituciones públicas,
                  privadas y de la sociedad civil.
                </p>
                <p className="text-sm leading-relaxed text-gray-600">
                  Esta plataforma es un{" "}
                  <strong>agregador de demostración</strong> — una prueba de
                  concepto que muestra cómo la plataforma Yoma puede impulsar un
                  portal de oportunidades con marca local, conectando a los
                  jóvenes con rutas verificadas de aprendizaje, impacto y empleo.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Cobertura", value: "Todo Chile" },
                  { label: "Para jóvenes de", value: "15–29" },
                  { label: "Certificados", value: "Verificados" },
                  { label: "Acceso", value: "Gratis" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl p-5 text-center"
                    style={{ backgroundColor: LIGHT }}
                  >
                    <p
                      className="font-nunito text-2xl font-black"
                      style={{ color: BLUE }}
                    >
                      {item.value}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── THREE PILLARS ─────────────────────────────────────────── */}
        <div className="w-full bg-white">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <div className="mb-10 text-center">
              <p
                className="text-xs font-bold tracking-widest uppercase"
                style={{ color: BLUE }}
              >
                La plataforma
              </p>
              <h2 className="font-nunito mt-2 text-2xl font-bold text-black md:text-3xl">
                ¿Qué puedes hacer aquí?
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {PILLARS.map((p) => (
                <div
                  key={p.title}
                  className="flex flex-col items-center gap-4 rounded-2xl border border-gray-100 p-8 text-center shadow-sm"
                >
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-full text-3xl"
                    style={{ backgroundColor: p.accent + "20" }}
                  >
                    {p.emoji}
                  </div>
                  <h3
                    className="font-nunito text-xl font-bold"
                    style={{ color: p.accent }}
                  >
                    {p.title}
                  </h3>
                  <p className="text-sm text-gray-600">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CATEGORIES ───────────────────────────────────────────── */}
        <div className="w-full" style={{ backgroundColor: LIGHT }}>
          <div className="mx-auto max-w-7xl px-6 py-16 text-center">
            <p
              className="text-xs font-bold tracking-widest uppercase"
              style={{ color: BLUE }}
            >
              Explora
            </p>
            <h2 className="font-nunito mt-2 text-2xl font-bold text-black md:text-3xl">
              Explora oportunidades
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Descubre {metrics?.opportunityCountDisplay ?? "360"}+ oportunidades
              en los temas que más te importan.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat}
                  href={`/opportunities?countries=${CHILE_COUNTRY_ID}&query=${encodeURIComponent(cat)}`}
                  className="rounded-full border bg-white px-5 py-2 text-sm font-semibold transition-colors hover:text-white"
                  style={{ borderColor: BLUE, color: BLUE }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      BLUE;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      "#ffffff";
                  }}
                >
                  {cat}
                </Link>
              ))}
            </div>
            <div className="mt-8">
              <Link
                href={CHILE_OPPORTUNITIES_LINK}
                className="inline-block rounded-full px-8 py-3 text-sm font-bold text-white"
                style={{ backgroundColor: BLUE }}
              >
                Ver todas las oportunidades
              </Link>
            </div>
          </div>
        </div>

        {/* ── STATS STRIP ──────────────────────────────────────────── */}
        <div className="w-full" style={{ backgroundColor: BLUE_DARK }}>
          <div className="mx-auto max-w-7xl px-6 py-10">
            <div className="grid grid-cols-2 gap-6 text-center text-white md:grid-cols-4">
              {[
                {
                  value: `${metrics?.userCountDisplay ?? "950.000"}+`,
                  label: "Jóvenes registrados",
                },
                {
                  value: `${metrics?.opportunityCountDisplay ?? "360"}+`,
                  label: "Oportunidades",
                },
                {
                  value: `${metrics?.organizationCountDisplay ?? "50"}+`,
                  label: "Instituciones aliadas",
                },
                { value: "100%", label: "Acceso gratuito" },
              ].map((s) => (
                <div key={s.label} className="flex flex-col gap-1">
                  <span
                    className="font-nunito text-3xl font-black"
                    style={{ color: "#ffd000" }}
                  >
                    {s.value}
                  </span>
                  <span className="text-sm text-white/70">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
        <div className="w-full bg-white">
          <div className="mx-auto max-w-7xl px-6 py-16 text-center">
            <p
              className="text-xs font-bold tracking-widest uppercase"
              style={{ color: BLUE }}
            >
              Simple y rápido
            </p>
            <h2 className="font-nunito mt-2 text-2xl font-bold text-black md:text-3xl">
              Tres pasos para comenzar
            </h2>
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
              {STEPS.map((s, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-4 text-center"
                >
                  <div
                    className="font-nunito flex h-14 w-14 items-center justify-center rounded-full text-xl font-black text-white"
                    style={{ backgroundColor: BLUE }}
                  >
                    {s.n}
                  </div>
                  <h3 className="font-nunito text-lg font-bold text-black">
                    {s.title}
                  </h3>
                  <p className="text-sm text-gray-500">{s.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-10">
              <Link
                href={CHILE_OPPORTUNITIES_LINK}
                className="inline-block rounded-full px-8 py-3 text-sm font-bold text-white"
                style={{ backgroundColor: RED }}
              >
                Crear mi cuenta
              </Link>
            </div>
          </div>
        </div>

        {/* ── REWARDS ──────────────────────────────────────────────── */}
        <div className="w-full" style={{ backgroundColor: "#ffd000" }}>
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 py-12 text-center">
            <span className="text-3xl">🎁</span>
            <h2 className="font-nunito text-2xl font-black text-black md:text-3xl">
              Gana recompensas mientras aprendes
            </h2>
            <p className="max-w-xl text-sm text-black/70">
              Completa oportunidades y gana tokens Zlto — canjeables por
              recargas, datos móviles, vales y mucho más en el marketplace de
              Yoma.
            </p>
            <Link
              href="/marketplace"
              className="mt-2 inline-block rounded-full px-8 py-3 text-sm font-bold text-white"
              style={{ backgroundColor: BLUE }}
            >
              Visitar el marketplace
            </Link>
          </div>
        </div>

        {/* ── CHILE OPPORTUNITIES CAROUSEL ─────────────────────────── */}
        {chileOpportunities?.items && chileOpportunities.items.length > 0 && (
          <div className="w-full bg-white">
            <div className="mx-auto max-w-7xl px-6 py-16">
              <div className="mb-8 flex flex-col items-center gap-2 text-center">
                <p
                  className="text-xs font-bold tracking-widest uppercase"
                  style={{ color: BLUE }}
                >
                  Para ti, en Chile
                </p>
                <h2 className="font-nunito text-2xl font-bold text-black md:text-3xl">
                  Oportunidades destacadas en español
                </h2>
                <p className="max-w-xl text-sm text-gray-500">
                  Cursos, bootcamps y capacitaciones de instituciones chilenas
                  reconocidas — todo en español y al alcance de un clic.
                </p>
              </div>
              <ScrollableContainer className="flex gap-4 overflow-x-auto py-4 xl:gap-6">
                {chileOpportunities.items.map((opp) => (
                  <OpportunityPublicSmallComponent key={opp.id} data={opp} />
                ))}
              </ScrollableContainer>
              <div className="mt-8 text-center">
                <Link
                  href={CHILE_OPPORTUNITIES_LINK}
                  className="inline-block rounded-full px-8 py-3 text-sm font-bold text-white"
                  style={{ backgroundColor: RED }}
                >
                  Ver todas las oportunidades en Chile
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── PARTNERS ─────────────────────────────────────────────── */}
        <div className="w-full bg-gray-50">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <div className="mb-8 flex flex-col items-center gap-2 text-center">
              <p
                className="text-xs font-bold tracking-widest uppercase"
                style={{ color: BLUE }}
              >
                Nuestra red
              </p>
              <h2 className="font-nunito text-2xl font-bold text-black md:text-3xl">
                Oportunidades de instituciones de confianza
              </h2>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {PARTNERS.map((name) => (
                <span
                  key={name}
                  className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── LATEST STORIES ───────────────────────────────────────── */}
        {newsArticles?.items && newsArticles.items.length > 0 && (
          <div className="w-full bg-white">
            <div className="mx-auto max-w-7xl px-6 py-16">
              <div className="mb-8 text-center">
                <p
                  className="text-xs font-bold tracking-widest uppercase"
                  style={{ color: BLUE }}
                >
                  Noticias
                </p>
                <h2 className="font-nunito mt-2 text-2xl font-bold text-black md:text-3xl">
                  Últimas historias
                </h2>
              </div>
              <ScrollableContainer className="flex gap-4 overflow-x-auto py-4 xl:gap-8">
                {newsArticles.items.map((article, i) => (
                  <NewsArticleCard key={i} data={article} />
                ))}
              </ScrollableContainer>
              {newsFeed && (
                <div className="mt-8 text-center">
                  <Link
                    href={newsFeed.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-full px-8 py-3 text-sm font-bold text-white"
                    style={{ backgroundColor: BLUE }}
                  >
                    Leer más historias
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CLOSING BADGE ────────────────────────────────────────── */}
        <div className="w-full" style={{ backgroundColor: LIGHT }}>
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-6 py-12 text-center">
            <ChileWordmark height={36} onLight />
            <p className="text-sm text-gray-600">
              Chile Joven es un agregador de demostración que conecta a los
              jóvenes del país con oportunidades verificadas de aprendizaje,
              capacitación y empleo.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

Home.getLayout = function getLayout(page: ReactElement) {
  if (BRAND === "p2e") return <P2ELayout>{page}</P2ELayout>;
  return <ChileLayout>{page}</ChileLayout>;
};

Home.theme = function getTheme() {
  return BRAND;
};

export default Home;
