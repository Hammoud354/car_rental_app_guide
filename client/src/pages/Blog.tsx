import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight, Clock, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import PublicHeader from "@/components/public/PublicHeader";
import PublicFooter from "@/components/public/PublicFooter";

const ARTICLES = [
  {
    title: "How to Reduce Vehicle Downtime in Your Rental Fleet",
    excerpt: "Unplanned maintenance is the #1 revenue killer for car rental agencies. Here's how smart scheduling and AI alerts can cut your downtime by up to 30%.",
    category: "Fleet Management",
    readTime: "5 min read",
    slug: "#",
  },
  {
    title: "The Complete Guide to Car Rental Contract Management",
    excerpt: "From legally compliant templates to digital signatures — everything you need to know about managing rental contracts efficiently in 2025.",
    category: "Operations",
    readTime: "8 min read",
    slug: "#",
  },
  {
    title: "Understanding Per-Vehicle P&L for Rental Agencies",
    excerpt: "Do you know which vehicles in your fleet are profitable and which are costing you money? Per-vehicle P&L analysis reveals what your accounting software hides.",
    category: "Finance",
    readTime: "6 min read",
    slug: "#",
  },
  {
    title: "Lebanon's Car Rental Industry: Adapting to Dual-Currency Reality",
    excerpt: "Lebanese rental agencies face unique challenges — from LBP/USD dual-pricing to Whish Money payments. How technology is helping them stay competitive.",
    category: "Locations",
    readTime: "4 min read",
    slug: "#",
  },
  {
    title: "5 Signs Your Rental Business Has Outgrown Spreadsheets",
    excerpt: "Spreadsheets work fine for 3 vehicles. For 15+, they become a liability. These five pain points signal it's time to upgrade to dedicated fleet software.",
    category: "Growth",
    readTime: "4 min read",
    slug: "#",
  },
  {
    title: "Fleet Utilization: What's a Good Rate and How to Improve It",
    excerpt: "Most rental agencies have 15-25% of their fleet sitting idle at any given time. Here's how to measure utilization, set targets, and optimize scheduling.",
    category: "Analytics",
    readTime: "6 min read",
    slug: "#",
  },
  {
    title: "VAT Compliance for Car Rental Businesses in the UAE and KSA",
    excerpt: "VAT rules for rental businesses in the UAE (5%) and Saudi Arabia (15%) have important nuances. Get compliant before your next tax audit.",
    category: "Compliance",
    readTime: "7 min read",
    slug: "#",
  },
  {
    title: "How AI Maintenance Predictions Work in Fleet Software",
    excerpt: "AI-powered maintenance alerts aren't magic — they're pattern recognition. Here's the practical explanation of how FleetWizards predicts service needs before breakdowns occur.",
    category: "Technology",
    readTime: "5 min read",
    slug: "#",
  },
];

const CATEGORIES = ["All", "Fleet Management", "Operations", "Finance", "Technology", "Growth", "Compliance", "Locations"];

const CATEGORY_COLORS: Record<string, string> = {
  "Fleet Management": "bg-blue-50 text-blue-700",
  "Operations": "bg-violet-50 text-violet-700",
  "Finance": "bg-emerald-50 text-emerald-700",
  "Technology": "bg-indigo-50 text-indigo-700",
  "Growth": "bg-amber-50 text-amber-700",
  "Compliance": "bg-red-50 text-red-700",
  "Locations": "bg-teal-50 text-teal-700",
  "Analytics": "bg-rose-50 text-rose-700",
};

export default function Blog() {
  useEffect(() => {
    document.title = "Blog — Fleet Management & Car Rental Insights | FleetWizards";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Practical guides, industry insights, and best practices for car rental agencies and fleet management professionals.");
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero */}
      <section className="relative pt-28 pb-16 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-gradient-to-b from-blue-50/60 via-white to-white rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-xs font-semibold text-blue-700 tracking-wide uppercase">FleetWizards Blog</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-5">
            Fleet Management &amp; Car Rental Insights
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Practical guides, industry best practices, and expert advice for rental agencies and fleet managers.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="border-b border-gray-100 sticky top-16 bg-white/95 backdrop-blur-xl z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  cat === "All"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ARTICLES.map((article, i) => (
              <article
                key={i}
                className="group flex flex-col rounded-xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300 overflow-hidden"
              >
                <div className="h-40 bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-indigo-600/10" />
                  <div className="absolute bottom-4 left-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${CATEGORY_COLORS[article.category] ?? "bg-gray-100 text-gray-600"}`}>
                      {article.category}
                    </span>
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{article.readTime}</span>
                    <span className="flex items-center gap-1"><Tag className="h-3 w-3" />{article.category}</span>
                  </div>
                  <h2 className="text-base font-bold text-gray-900 mb-2 leading-snug group-hover:text-blue-600 transition-colors">
                    {article.title}
                  </h2>
                  <p className="text-sm text-gray-500 leading-relaxed flex-1 mb-4">{article.excerpt}</p>
                  <a
                    href={article.slug}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Read article <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 bg-gray-50/60">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Get Fleet Management Tips in Your Inbox</h2>
          <p className="text-gray-500 mb-8">Practical advice for rental agency owners and fleet managers — no spam, unsubscribe anytime.</p>
          <div className="flex gap-2 max-w-md mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 h-11 px-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <Button className="h-11 bg-blue-600 hover:bg-blue-700 text-white px-5 shrink-0">
              Subscribe
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-3">Join 500+ rental professionals already subscribed.</p>
        </div>
      </section>

      {/* Internal Links */}
      <section className="py-12 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest text-center mb-6">Explore FleetWizards</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { label: "Car Rental Software", href: "/car-rental-software" },
              { label: "Fleet Management", href: "/fleet-management-software" },
              { label: "Booking System", href: "/vehicle-booking-system" },
              { label: "Small Business", href: "/industries/small-business" },
              { label: "Enterprise", href: "/industries/enterprise" },
              { label: "Lebanon", href: "/locations/lebanon" },
              { label: "UAE", href: "/locations/uae" },
              { label: "Saudi Arabia", href: "/locations/saudi-arabia" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-500 hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50/50 transition-all"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
