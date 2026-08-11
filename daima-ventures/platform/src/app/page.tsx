import Image from "next/image";
import Link from "next/link";

const products = [
  {
    icon: "\u{1F33E}",
    title: "Harvest Advance Loans",
    badge: "Available Now",
    badgeClass: "available",
    description:
      "Avoid distress sales and capture full market value for your produce. Get immediate cash flow while your crops are stored for better prices.",
    terms: [
      "Interest Rate: 16.9% per annum",
      "Loan Size: UGX 5M - 200M",
      "Term: 3-6 months",
      "Collateral: Stored produce",
    ],
  },
  {
    icon: "\u{1F3E2}\u{FE0F}",
    title: "Asset Acquisition & Development",
    badge: "Coming Soon",
    badgeClass: "coming-soon",
    description:
      "Build cooperative capacity through strategic investments in land, buildings, processing equipment, and other development assets.",
    terms: [
      "Interest Rate: 18% per annum",
      "Loan Size: UGX 5M - 500M",
      "Term: 6 months - 4 years",
      "Customized repayment plans",
    ],
  },
  {
    icon: "\u{1F68C}",
    title: "Agricultural Value Chain Loans",
    badge: "Coming Soon",
    badgeClass: "coming-soon",
    description:
      "Comprehensive financing across the full agricultural production cycle - from land preparation to marketing your final products.",
    terms: [
      "Interest Rate: 15% per annum",
      "Loan Size: UGX 20M - 500M",
      "Term: 6 months - 4 years",
      "Seasonal grace periods available",
    ],
  },
];

const footerSections = [
  {
    title: "Contact Us",
    items: [
      "Kampala Headquarters",
      "+256-700331750 (Suuna)",
      "info@daimaventures.org",
    ],
  },
  {
    title: "Our Mission",
    items: [
      "Building sustainable agricultural value chains by providing timely financing solutions to cooperatives and farmer groups across Uganda.",
    ],
  },
  {
    title: "Regulatory Information",
    items: [
      "Daima Ventures is a registered financial services provider soon to be licensed by the Uganda Microfinance Regulatory Authority (UMRA).",
    ],
  },
];

export default function Home() {
  return (
    <main>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="logo">
            <Image
              src="/images/logo-default.png"
              alt="Daima Ventures"
              width={180}
              height={60}
              priority
              style={{ height: 60, width: "auto" }}
            />
          </Link>
          <nav>
            <ul className="hidden list-none gap-8 font-medium md:flex">
              <li>
                <a href="#home" className="text-[#333] transition-colors hover:text-[#6b8dc4]">
                  Home
                </a>
              </li>
              <li>
                <a href="#products" className="text-[#333] transition-colors hover:text-[#6b8dc4]">
                  Products
                </a>
              </li>
              <li>
                <Link href="/apply" className="text-[#333] transition-colors hover:text-[#6b8dc4]">
                  Apply Now
                </Link>
              </li>
              <li>
                <a href="#contact" className="text-[#333] transition-colors hover:text-[#6b8dc4]">
                  Contact
                </a>
              </li>
              <li>
                <Link
                  href="/login"
                  className="rounded-full border border-[#6b8dc4] px-4 py-1.5 text-[#2d4d78] transition-all hover:bg-[#2d4d78] hover:text-white"
                >
                  Sign In
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section id="home" className="relative overflow-hidden px-4 py-24 text-center text-white">
        <div className="mx-auto max-w-6xl">
          <h1
            className="mb-4 text-5xl font-bold md:text-6xl"
            style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.3)" }}
          >
            Empowering Agricultural Communities
          </h1>
          <p
            className="mx-auto mb-8 max-w-3xl text-xl text-white/95 md:text-2xl"
            style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.3)" }}
          >
            Transform your farming business with tailored financial solutions
            designed for Uganda&apos;s smallholder farmers and cooperatives.
            Access capital when you need it most.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/apply" className="btn">
              Apply for Financing
            </Link>
            <a href="#products" className="btn btn-secondary">
              Explore Products
            </a>
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="bg-white px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="section-title">Our Financial Products</h2>
          <div className="grid gap-8 pb-12 md:grid-cols-3">
            {products.map((p) => (
              <div key={p.title} className="product-card">
                <div className="mb-4 flex items-center">
                  <span className="mr-4 text-3xl" aria-hidden>
                    {p.icon}
                  </span>
                  <h3 className="text-lg font-bold text-[#2d4d78]">{p.title}</h3>
                  <span className={`status-badge ${p.badgeClass} ml-auto`}>
                    {p.badge}
                  </span>
                </div>
                <p className="mb-6 text-[#666]">{p.description}</p>
                <div className="product-terms">
                  <h4 className="mb-2 font-bold text-[#2d4d78]">Key Terms:</h4>
                  <div className="terms-list">
                    {p.terms.map((t) => (
                      <div key={t}>
                        <span className="mr-1 text-[#6b8dc4]">&#8226;</span>
                        {t}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link href="/apply" className="btn">
              Apply for Financing
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-[#2d4d78] px-4 py-12 text-center text-white">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 grid gap-8 md:grid-cols-3">
            {footerSections.map((s) => (
              <div key={s.title} className="footer-section">
                <h3 className="mb-4 text-lg font-bold">{s.title}</h3>
                {s.items.map((i) => (
                  <p key={i} className="mb-1 text-sm">
                    {i}
                  </p>
                ))}
              </div>
            ))}
          </div>
          <div className="border-t border-[#4a6fa0] pt-8">
            <p className="text-sm">
              &copy; 2026 Daima Ventures. All rights reserved. Transforming
              agricultural finance. Empowering rural communities.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
