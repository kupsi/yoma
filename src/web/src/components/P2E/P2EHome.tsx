import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback } from "react";
import { HomeSearchInputLarge } from "~/components/Home/HomeSearchInputLarge";
import { OpportunityPublicSmallComponent } from "~/components/Opportunity/OpportunityPublicSmall";
import { ScrollableContainer } from "~/components/Carousel";
import P2EWordmark from "~/components/P2E/P2EWordmark";
import type { OpportunitySearchResultsInfo } from "~/api/models/opportunity";

const NAVY = "#102a54";
const NAVY_DARK = "#0a1d3b";
const GOLD = "#c8a14a";
const CREAM = "#f6efe1";
const CREAM_DEEP = "#ebe1c8";

export const LEARNING_OPPORTUNITIES_LINK = "/opportunities?types=Learning";

const CATEGORIES = [
  "Digital Skills",
  "Programming",
  "English",
  "Data & AI",
  "Entrepreneurship",
  "Green Skills",
  "Design",
  "Cloud",
];

const PILLARS = [
  {
    emoji: "📚",
    title: "Learn",
    body: "Take free verified courses from trusted partners worldwide — digital skills, programming, English, entrepreneurship and more.",
    accent: NAVY,
  },
  {
    emoji: "🛡️",
    title: "Verify",
    body: "When you complete a course, the partner verifies it and the credential lands on your passport.",
    accent: GOLD,
  },
  {
    emoji: "🌍",
    title: "Carry it anywhere",
    body: "Your YoID passport keeps every stamp with you — share it with employers, schools or other platforms.",
    accent: NAVY_DARK,
  },
];

const STEPS = [
  {
    n: "01",
    title: "Open your passport",
    body: "Create a free YoID — one identity that follows you across every learning partner.",
  },
  {
    n: "02",
    title: "Collect stamps",
    body: "Complete skilling opportunities from Coursera, freeCodeCamp, Atingi, Google, Microsoft Learn and more.",
  },
  {
    n: "03",
    title: "Earn as you grow",
    body: "Every verified credential is a stamp. Stamps unlock rewards, opportunities and recognition.",
  },
];

const PARTNERS = [
  "Coursera",
  "edX",
  "freeCodeCamp",
  "Khan Academy",
  "Atingi",
  "Google",
  "Microsoft Learn",
  "Duolingo",
];

type Props = {
  featuredOpportunities: OpportunitySearchResultsInfo | null;
};

const P2EHome = ({ featuredOpportunities }: Props) => {
  const router = useRouter();

  const onSearchInputSubmit = useCallback(
    (query: string) => {
      if (query.length <= 2) return;
      void router.push(
        `/opportunities?types=Learning&query=${encodeURIComponent(query)}`,
        undefined,
        { scroll: false },
      );
    },
    [router],
  );

  return (
    <>
      <Head>
        <title>Passport 2 Earning | Your global skilling passport</title>
      </Head>

      <div className="relative right-0 left-0 flex w-screen flex-col overflow-x-hidden">
        {/* ── DEMO BANNER ──────────────────────────────────────────── */}
        <div
          className="w-full py-2 text-center text-xs font-semibold text-white"
          style={{ backgroundColor: GOLD }}
        >
          <span style={{ color: NAVY_DARK }}>
            🚧 P2E aggregator prototype — built on the Yoma platform for
            evaluation only.
          </span>
        </div>

        {/* ── HERO ─────────────────────────────────────────────────── */}
        <div className="w-full" style={{ backgroundColor: NAVY }}>
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-10 px-6 py-16 lg:flex-row lg:py-24">
            <div className="flex flex-1 flex-col gap-6 text-center lg:text-left">
              <div className="flex justify-center lg:justify-start">
                <span className="inline-block rounded-lg bg-white px-4 py-2.5">
                  <P2EWordmark height={40} onLight />
                </span>
              </div>

              <h1 className="font-nunito text-4xl leading-tight font-black tracking-tight uppercase text-white md:text-5xl lg:text-6xl">
                Your skilling
                <br />
                <span style={{ color: GOLD }}>passport.</span>
              </h1>

              <p className="text-lg font-medium text-white/90">
                Stamp it with verified credentials from trusted learning
                partners around the world.
                <br />
                <span className="text-base text-white/75">
                  One identity. Many partners. Skills you can prove.
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
                  href={LEARNING_OPPORTUNITIES_LINK}
                  className="inline-block rounded-full px-6 py-3 text-sm font-bold transition-colors"
                  style={{ backgroundColor: GOLD, color: NAVY_DARK }}
                >
                  Browse skilling opportunities
                </Link>
                <Link
                  href="/yoid"
                  className="inline-block rounded-full border-2 border-white/40 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
                >
                  Your YoID passport
                </Link>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/70">
                <span>✓ Verified credentials</span>
                <span>✓ Portable across partners</span>
                <span>✓ Free forever</span>
              </div>
            </div>

            {/* RIGHT — passport visual */}
            <div className="flex flex-1 justify-center">
              <div
                className="relative flex h-72 w-56 flex-col items-center justify-between rounded-2xl p-5 shadow-2xl md:h-96 md:w-72"
                style={{ backgroundColor: NAVY_DARK, color: "#fff" }}
              >
                <div className="text-center">
                  <p className="text-[10px] tracking-widest text-white/50 uppercase">
                    Skilling passport
                  </p>
                  <p
                    className="font-nunito mt-1 text-2xl font-black tracking-tight"
                    style={{ color: GOLD }}
                  >
                    P2E
                  </p>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div
                    className="flex h-20 w-20 items-center justify-center rounded-full border-2"
                    style={{ borderColor: GOLD, color: GOLD }}
                  >
                    <span className="font-serif text-xl font-black">YoID</span>
                  </div>
                  <span className="text-[10px] tracking-widest text-white/40 uppercase">
                    Holder ID
                  </span>
                </div>

                <div className="flex w-full justify-around opacity-80">
                  <div
                    className="flex h-10 w-10 rotate-[-12deg] items-center justify-center rounded-full border-2 text-[8px] font-black"
                    style={{ borderColor: GOLD, color: GOLD }}
                  >
                    ✓ COURSE
                  </div>
                  <div
                    className="flex h-10 w-10 rotate-[8deg] items-center justify-center rounded-full border-2 text-[8px] font-black"
                    style={{ borderColor: GOLD, color: GOLD }}
                  >
                    ✓ SKILL
                  </div>
                </div>

                <div className="text-center text-[9px] text-white/40">
                  ●●●●●●●●●●●●●●●●●●●●●●●●
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── PILLARS ──────────────────────────────────────────────── */}
        <div className="w-full" style={{ backgroundColor: CREAM }}>
          <div className="mx-auto max-w-7xl px-6 py-16">
            <h2
              className="font-nunito mb-10 text-center text-3xl font-black md:text-4xl"
              style={{ color: NAVY }}
            >
              How your passport grows
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {PILLARS.map((p) => (
                <div
                  key={p.title}
                  className="rounded-2xl bg-white p-6 shadow-md"
                  style={{ borderTop: `4px solid ${p.accent}` }}
                >
                  <div className="text-3xl">{p.emoji}</div>
                  <h3
                    className="font-nunito mt-3 text-xl font-black"
                    style={{ color: NAVY }}
                  >
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-700">
                    {p.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CATEGORY CHIPS ───────────────────────────────────────── */}
        <div className="w-full bg-white">
          <div className="mx-auto max-w-7xl px-6 py-14">
            <h2
              className="font-nunito mb-2 text-2xl font-black md:text-3xl"
              style={{ color: NAVY }}
            >
              Stamp by category
            </h2>
            <p className="mb-6 text-sm text-gray-600">
              Pick a skill area and find verified courses from global partners.
            </p>
            <div className="flex flex-wrap gap-2.5">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat}
                  href={`/opportunities?types=Learning&query=${encodeURIComponent(cat)}`}
                  className="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
                  style={{
                    backgroundColor: CREAM_DEEP,
                    color: NAVY_DARK,
                  }}
                >
                  {cat}
                </Link>
              ))}
            </div>
            <div className="mt-8">
              <Link
                href={LEARNING_OPPORTUNITIES_LINK}
                className="inline-block rounded-full px-5 py-2.5 text-sm font-bold"
                style={{ backgroundColor: NAVY, color: "#fff" }}
              >
                Browse all skilling
              </Link>
            </div>
          </div>
        </div>

        {/* ── FEATURED OPPORTUNITIES CAROUSEL ──────────────────────── */}
        {featuredOpportunities?.items &&
          featuredOpportunities.items.length > 0 && (
            <div className="w-full" style={{ backgroundColor: CREAM }}>
              <div className="mx-auto max-w-7xl px-6 py-14">
                <h2
                  className="font-nunito mb-2 text-2xl font-black md:text-3xl"
                  style={{ color: NAVY }}
                >
                  Featured skilling
                </h2>
                <p className="mb-6 text-sm text-gray-700">
                  Hand-picked courses from trusted partners — start collecting
                  stamps.
                </p>
                <ScrollableContainer>
                  {featuredOpportunities.items.map((opp) => (
                    <OpportunityPublicSmallComponent key={opp.id} data={opp} />
                  ))}
                </ScrollableContainer>
                <div className="mt-6 text-center">
                  <Link
                    href={LEARNING_OPPORTUNITIES_LINK}
                    className="inline-block rounded-full px-5 py-2.5 text-sm font-bold"
                    style={{ backgroundColor: GOLD, color: NAVY_DARK }}
                  >
                    See all featured
                  </Link>
                </div>
              </div>
            </div>
          )}

        {/* ── STEPS / HOW IT WORKS ─────────────────────────────────── */}
        <div className="w-full bg-white">
          <div className="mx-auto max-w-7xl px-6 py-14">
            <h2
              className="font-nunito mb-10 text-center text-3xl font-black md:text-4xl"
              style={{ color: NAVY }}
            >
              Three steps to your first stamp
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {STEPS.map((s) => (
                <div key={s.n} className="flex flex-col gap-3">
                  <div
                    className="font-nunito text-5xl font-black opacity-30"
                    style={{ color: GOLD }}
                  >
                    {s.n}
                  </div>
                  <h3
                    className="font-nunito text-xl font-black"
                    style={{ color: NAVY }}
                  >
                    {s.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-700">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── PARTNERS ─────────────────────────────────────────────── */}
        <div className="w-full" style={{ backgroundColor: NAVY_DARK }}>
          <div className="mx-auto max-w-7xl px-6 py-14 text-center">
            <p className="text-xs tracking-widest text-white/40 uppercase">
              Skilling partners
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
              {PARTNERS.map((p) => (
                <span
                  key={p}
                  className="font-nunito text-base font-bold text-white/70 md:text-lg"
                >
                  {p}
                </span>
              ))}
            </div>
            <p className="mt-6 text-xs text-white/50">
              Demo content — any organisation can plug into P2E via the Yoma
              API.
            </p>
          </div>
        </div>

        {/* ── FINAL CTA ────────────────────────────────────────────── */}
        <div className="w-full" style={{ backgroundColor: GOLD }}>
          <div className="mx-auto max-w-5xl px-6 py-16 text-center">
            <P2EWordmark height={36} onLight />
            <p
              className="mx-auto mt-5 max-w-2xl text-base"
              style={{ color: NAVY_DARK }}
            >
              Start your passport in minutes. Every course you complete becomes
              a verified stamp you carry for life.
            </p>
            <div className="mt-7 flex justify-center gap-3">
              <Link
                href={LEARNING_OPPORTUNITIES_LINK}
                className="rounded-full px-6 py-3 text-sm font-bold text-white"
                style={{ backgroundColor: NAVY }}
              >
                Browse skilling
              </Link>
              <Link
                href="/yoid"
                className="rounded-full border-2 px-6 py-3 text-sm font-bold"
                style={{ borderColor: NAVY_DARK, color: NAVY_DARK }}
              >
                Open my passport
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default P2EHome;
