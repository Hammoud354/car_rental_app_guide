import { Link } from "wouter";
import { AnimatedLogo } from "@/components/AnimatedLogo";
import { Phone, Mail, MessageCircle } from "lucide-react";

const COLS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Live Demo", href: "/demo" },
      { label: "Sign Up Free", href: "/signup" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "Fleet Management", href: "/fleet-management-software" },
      { label: "Car Rental Software", href: "/car-rental-software" },
      { label: "Booking System", href: "/vehicle-booking-system" },
    ],
  },
  {
    title: "Industries",
    links: [
      { label: "Small Business", href: "/industries/small-business" },
      { label: "Enterprise", href: "/industries/enterprise" },
      { label: "Airport Rentals", href: "/industries/enterprise" },
    ],
  },
  {
    title: "Locations",
    links: [
      { label: "Lebanon", href: "/locations/lebanon" },
      { label: "UAE", href: "/locations/uae" },
      { label: "Saudi Arabia", href: "/locations/saudi-arabia" },
      { label: "Global", href: "/signup" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Guides", href: "/blog" },
      { label: "Contact Support", href: "/#contact" },
    ],
  },
];

export default function PublicFooter() {
  const handleWhatsApp = () => {
    const msg = encodeURIComponent("Hello! I'm interested in FleetWizards. Can you tell me more?");
    window.open(`https://wa.me/96176354131?text=${msg}`, "_blank");
  };

  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-10">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <AnimatedLogo size="md" darkBg />
            <p className="mt-4 text-sm leading-relaxed text-gray-500 max-w-xs">
              The operating system for car rental businesses worldwide.
            </p>
            <div className="mt-5 space-y-2">
              <a href="tel:+96176354131" className="flex items-center gap-2 text-xs hover:text-gray-200 transition-colors">
                <Phone className="h-3.5 w-3.5 shrink-0" /> +961 76 354 131
              </a>
              <a href="mailto:info@fleetwizards.com" className="flex items-center gap-2 text-xs hover:text-gray-200 transition-colors">
                <Mail className="h-3.5 w-3.5 shrink-0" /> info@fleetwizards.com
              </a>
              <button
                onClick={handleWhatsApp}
                className="flex items-center gap-2 text-xs text-green-400 hover:text-green-300 transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5 shrink-0" /> WhatsApp Us
              </button>
            </div>
          </div>

          {/* Link columns */}
          {COLS.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold text-gray-200 uppercase tracking-wider mb-4">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm hover:text-gray-200 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <p>&copy; {new Date().getFullYear()} FleetWizards. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/signin" className="hover:text-gray-400 transition-colors">Sign In</Link>
            <Link href="/signup" className="hover:text-gray-400 transition-colors">Sign Up</Link>
            <Link href="/subscription-plans" className="hover:text-gray-400 transition-colors">Pricing</Link>
            <Link href="/blog" className="hover:text-gray-400 transition-colors">Blog</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
