import Image from "next/image";
import Link from "next/link";
import ApplicationForm from "@/components/ApplicationForm";

export default function ApplyPage() {
  return (
    <main>
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
                <Link href="/" className="text-[#333] transition-colors hover:text-[#6b8dc4]">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/#products" className="text-[#333] transition-colors hover:text-[#6b8dc4]">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-[#333] transition-colors hover:text-[#6b8dc4]">
                  Sign In
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <section className="px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="section-title">Apply for Financing</h2>
          <ApplicationForm />
        </div>
      </section>

      <footer className="bg-[#2d4d78] px-4 py-12 text-center text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm">
            &copy; 2026 Daima Ventures. All rights reserved. Transforming
            agricultural finance. Empowering rural communities.
          </p>
        </div>
      </footer>
    </main>
  );
}
