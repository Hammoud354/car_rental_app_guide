import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { AnimatedLogo } from "@/components/AnimatedLogo";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Button } from "@/components/ui/button";
import { Menu, X, LogIn, ArrowRight } from "lucide-react";

export default function PublicHeader() {
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isHome = location === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLink = "px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100/70 rounded-lg transition-colors";

  return (
    <nav
      style={{ animation: "slideDown 0.5s ease-out both" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || menuOpen
          ? "bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-100"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        <Link href="/" className="flex-shrink-0">
          <AnimatedLogo size="md" showSubtext />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-0.5">
          <a href={isHome ? "#features" : "/#features"} className={navLink}>Features</a>
          <a href={isHome ? "#pricing" : "/#pricing"} className={navLink}>Pricing</a>
          <Link href="/demo" className={navLink}>Demo</Link>
          <Link href="/blog" className={navLink}>Blog</Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSelector compact />
          <Link href="/signin">
            <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm shadow-md shadow-emerald-700/20 px-4">
              <LogIn className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Sign In</span>
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm" className="hidden sm:flex bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 font-medium px-4 text-sm">
              Get Started
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white/98 backdrop-blur-xl px-4 py-3 space-y-0.5">
          <a
            href={isHome ? "#features" : "/#features"}
            onClick={() => setMenuOpen(false)}
            className="block w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Features
          </a>
          <a
            href={isHome ? "#pricing" : "/#pricing"}
            onClick={() => setMenuOpen(false)}
            className="block w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Pricing
          </a>
          <Link href="/demo" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">Demo</Link>
          <Link href="/blog" onClick={() => setMenuOpen(false)} className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">Blog</Link>
          <div className="pt-3 pb-1 flex gap-2">
            <Link href="/signin" className="flex-1" onClick={() => setMenuOpen(false)}>
              <Button size="sm" className="w-full bg-emerald-700 hover:bg-emerald-800 text-white">Sign In</Button>
            </Link>
            <Link href="/signup" className="flex-1" onClick={() => setMenuOpen(false)}>
              <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white">Get Started</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
