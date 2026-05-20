import { useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Car, FileText, Users, DollarSign, Wrench, BarChart3,
  Calendar, Shield, MapPin, Zap, Globe, Building2,
  CheckCircle2, ArrowRight, ChevronRight, Clock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import PublicHeader from "@/components/public/PublicHeader";
import PublicFooter from "@/components/public/PublicFooter";

interface Feature { icon: LucideIcon; title: string; desc: string; color: string }
interface RelatedPage { label: string; href: string }
interface PageData {
  pageTitle: string;
  metaDesc: string;
  badge: string;
  h1: string;
  heroDesc: string;
  features: Feature[];
  benefits: { title: string; desc: string }[];
  ctaTitle: string;
  ctaDesc: string;
  relatedPages: RelatedPage[];
}

const PAGE_DATA: Record<string, PageData> = {
  "car-rental-software": {
    pageTitle: "Car Rental Software for Modern Rental Agencies | FleetWizards",
    metaDesc: "Manage bookings, contracts, invoices, and clients with FleetWizards car rental software. Trusted by 200+ agencies worldwide. Free trial available.",
    badge: "Car Rental Software",
    h1: "Car Rental Software That Grows With Your Business",
    heroDesc: "All-in-one car rental management: automate contracts, manage bookings, generate invoices instantly, and track your fleet in real time — designed for agencies of all sizes.",
    features: [
      { icon: FileText, title: "Automated Contracts", desc: "Generate professional rental contracts in seconds. Built-in templates, digital signatures, and automatic clause management.", color: "bg-blue-600" },
      { icon: Users, title: "Client Management", desc: "Maintain a complete client database with rental history, documents, and contact details in one place.", color: "bg-indigo-600" },
      { icon: DollarSign, title: "Invoice Generation", desc: "Create VAT-compliant invoices instantly. Supports multiple currencies and automatic late-fee calculations.", color: "bg-emerald-600" },
      { icon: Car, title: "Fleet Tracking", desc: "Real-time visibility into every vehicle's status — available, rented, in maintenance, or out of service.", color: "bg-violet-600" },
      { icon: Wrench, title: "Maintenance Alerts", desc: "Stay ahead of maintenance with AI-powered alerts before breakdowns happen and costly downtime occurs.", color: "bg-amber-600" },
      { icon: BarChart3, title: "Revenue Analytics", desc: "Track revenue per vehicle, fleet utilization, and profit margins with built-in analytics dashboards.", color: "bg-rose-600" },
    ],
    benefits: [
      { title: "60% Less Paperwork", desc: "Automated contracts, invoices, and reports eliminate hours of manual data entry every week." },
      { title: "Zero Double-Bookings", desc: "Real-time availability checks prevent scheduling conflicts before they happen." },
      { title: "Always Audit-Ready", desc: "Every transaction, contract, and payment is logged with a complete audit trail." },
    ],
    ctaTitle: "Ready to Streamline Your Rental Business?",
    ctaDesc: "Join 200+ car rental agencies already using FleetWizards to save time, reduce errors, and grow revenue.",
    relatedPages: [
      { label: "Fleet Management Software", href: "/fleet-management-software" },
      { label: "Vehicle Booking System", href: "/vehicle-booking-system" },
      { label: "Small Business Solution", href: "/industries/small-business" },
      { label: "Enterprise Solution", href: "/industries/enterprise" },
    ],
  },

  "fleet-management-software": {
    pageTitle: "Fleet Management Software for Rental Businesses | FleetWizards",
    metaDesc: "Track, manage, and optimize your entire vehicle fleet with FleetWizards. Real-time status, maintenance alerts, and profitability analytics built in.",
    badge: "Fleet Management",
    h1: "Fleet Management Software That Puts You in Control",
    heroDesc: "Monitor every vehicle's status, maintenance schedule, and profitability from one powerful dashboard. Reduce downtime, extend vehicle life, and maximize fleet utilization.",
    features: [
      { icon: Car, title: "Real-Time Fleet Status", desc: "See instantly which vehicles are available, rented, in maintenance, or out of service — across your entire fleet.", color: "bg-blue-600" },
      { icon: Wrench, title: "Predictive Maintenance", desc: "AI-powered alerts notify you before failures occur. Schedule maintenance around rentals to minimize lost revenue.", color: "bg-amber-600" },
      { icon: Shield, title: "Insurance Tracking", desc: "Track insurance expiry dates for every vehicle and receive automatic alerts before policies lapse.", color: "bg-green-600" },
      { icon: BarChart3, title: "Per-Vehicle P&L", desc: "Know exactly which vehicles make money and which don't. Make data-driven fleet composition decisions.", color: "bg-violet-600" },
      { icon: Zap, title: "AI Maintenance Tasks", desc: "Intelligent task scheduling based on mileage, time, or both — with priority levels from critical to optional.", color: "bg-rose-600" },
      { icon: MapPin, title: "Vehicle History Log", desc: "Complete history for every vehicle: all rentals, maintenance records, damage reports, and mileage logs.", color: "bg-indigo-600" },
    ],
    benefits: [
      { title: "30% Reduction in Downtime", desc: "Predictive maintenance and proactive scheduling keep vehicles on the road and generating revenue." },
      { title: "Full Fleet Visibility", desc: "A single dashboard shows the status, location, and condition of every vehicle in your fleet." },
      { title: "Insurance Compliance", desc: "Automatic alerts ensure no vehicle ever operates with expired insurance or registration." },
    ],
    ctaTitle: "Take Control of Your Fleet Today",
    ctaDesc: "FleetWizards gives you the visibility and tools to run a leaner, more profitable fleet operation.",
    relatedPages: [
      { label: "Car Rental Software", href: "/car-rental-software" },
      { label: "Vehicle Booking System", href: "/vehicle-booking-system" },
      { label: "Fleet Tracking Features", href: "/features/fleet-tracking" },
      { label: "Enterprise Solution", href: "/industries/enterprise" },
    ],
  },

  "vehicle-booking-system": {
    pageTitle: "Vehicle Booking System for Rental Agencies | FleetWizards",
    metaDesc: "Streamline reservations, prevent double-bookings, and manage vehicle availability with FleetWizards. Real-time conflict detection and automated contract generation.",
    badge: "Booking System",
    h1: "Smart Vehicle Booking System for Rental Businesses",
    heroDesc: "Accept reservations, prevent conflicts, and manage vehicle availability in real time. FleetWizards booking system keeps your calendar clean and your customers happy.",
    features: [
      { icon: Calendar, title: "Real-Time Availability", desc: "See exactly which vehicles are available for any date range. Prevent double-bookings with automatic conflict detection.", color: "bg-blue-600" },
      { icon: Shield, title: "Conflict Prevention", desc: "Instant validation checks prevent two customers from booking the same vehicle for overlapping dates.", color: "bg-green-600" },
      { icon: FileText, title: "Instant Contracts", desc: "When a booking is confirmed, a rental contract is generated automatically with all relevant terms and vehicle details.", color: "bg-violet-600" },
      { icon: Users, title: "Client Profiles", desc: "Link every booking to a client profile with full rental history, documents, and contact information.", color: "bg-indigo-600" },
      { icon: DollarSign, title: "Deposit Tracking", desc: "Record and track security deposits separately from rental payments with clear status indicators.", color: "bg-emerald-600" },
      { icon: BarChart3, title: "Booking Analytics", desc: "Understand booking patterns, peak periods, and vehicle demand to optimize pricing and availability.", color: "bg-amber-600" },
    ],
    benefits: [
      { title: "Zero Scheduling Conflicts", desc: "Real-time availability checks make double-bookings impossible — protecting your reputation and revenue." },
      { title: "Faster Check-In/Out", desc: "Pre-generated contracts and pre-filled forms cut vehicle handoff time from 30 minutes to under 5." },
      { title: "Higher Utilization", desc: "Clear availability views help staff fill gaps in the calendar and maximize fleet utilization." },
    ],
    ctaTitle: "Book More, Manage Less",
    ctaDesc: "FleetWizards handles the booking complexity so your team can focus on delivering great customer experiences.",
    relatedPages: [
      { label: "Car Rental Software", href: "/car-rental-software" },
      { label: "Fleet Management Software", href: "/fleet-management-software" },
      { label: "Booking System Features", href: "/features/booking-system" },
      { label: "Small Business Solution", href: "/industries/small-business" },
    ],
  },

  "small-business": {
    pageTitle: "Car Rental Software for Small Businesses | FleetWizards",
    metaDesc: "Affordable car rental management for small agencies. Start with as few as 5 vehicles. No IT team required. FleetWizards grows with your business.",
    badge: "Small Business Solution",
    h1: "Car Rental Software Built for Small Businesses",
    heroDesc: "You don't need an enterprise budget to run a professional fleet. FleetWizards gives small rental agencies the tools to compete with the big players — at a price that makes sense.",
    features: [
      { icon: Zap, title: "5-Minute Setup", desc: "Get started with zero technical knowledge. Import your vehicles, add your clients, and start creating contracts immediately.", color: "bg-blue-600" },
      { icon: DollarSign, title: "Transparent Pricing", desc: "Simple flat-rate plans with no hidden fees. Know exactly what you pay every month, no matter how your business grows.", color: "bg-emerald-600" },
      { icon: FileText, title: "Professional Documents", desc: "Create rental contracts and invoices that look like they came from an enterprise firm — instantly.", color: "bg-violet-600" },
      { icon: Car, title: "Scales With You", desc: "Start with 5 vehicles and grow to 50+. Upgrade your plan as your fleet expands — no data migration needed.", color: "bg-indigo-600" },
      { icon: Wrench, title: "Simple Maintenance Tracking", desc: "Keep track of oil changes, tire rotations, and service history without a complex maintenance management system.", color: "bg-amber-600" },
      { icon: BarChart3, title: "Business Insights", desc: "Understand your revenue, costs, and profit margin with dashboards that don't require an accounting degree.", color: "bg-rose-600" },
    ],
    benefits: [
      { title: "No IT Team Needed", desc: "FleetWizards is designed for business owners, not tech experts. If you can use a smartphone, you can use FleetWizards." },
      { title: "Look Bigger Than You Are", desc: "Professional contracts, branded invoices, and a polished customer experience — on a small business budget." },
      { title: "Pay as You Grow", desc: "Start on a plan that fits today's fleet size and upgrade only when you need to. No long-term contracts required." },
    ],
    ctaTitle: "Start Small, Think Big",
    ctaDesc: "FleetWizards helps small rental agencies punch above their weight. Start your free trial today — no credit card required.",
    relatedPages: [
      { label: "Car Rental Software", href: "/car-rental-software" },
      { label: "Vehicle Booking System", href: "/vehicle-booking-system" },
      { label: "Enterprise Solution", href: "/industries/enterprise" },
      { label: "Pricing Plans", href: "/subscription-plans" },
    ],
  },

  "enterprise": {
    pageTitle: "Enterprise Fleet Management Software | FleetWizards",
    metaDesc: "Scale your rental operations with unlimited vehicles, multi-user access, custom reporting, and API access. Enterprise fleet management by FleetWizards.",
    badge: "Enterprise Solution",
    h1: "Enterprise Fleet Management at Scale",
    heroDesc: "Manage unlimited vehicles across multiple locations with advanced analytics, custom workflows, and dedicated support. FleetWizards Enterprise is built for large-scale operations.",
    features: [
      { icon: Building2, title: "Unlimited Fleet Size", desc: "No caps on vehicles, contracts, or clients. Scale your entire operation within a single platform.", color: "bg-blue-600" },
      { icon: Users, title: "Multi-User Access", desc: "Role-based permissions ensure the right people have access to the right data. Managers, agents, and finance — all separated.", color: "bg-indigo-600" },
      { icon: BarChart3, title: "Custom Reporting", desc: "Build the reports your business needs. Export to Excel, schedule automated delivery, and share with stakeholders.", color: "bg-violet-600" },
      { icon: Globe, title: "API Access", desc: "Integrate FleetWizards with your existing systems — ERP, accounting software, or custom-built tools — via our REST API.", color: "bg-emerald-600" },
      { icon: Shield, title: "Enterprise Security", desc: "Full audit trails, role-based access control, and session management keep your business data secure.", color: "bg-green-600" },
      { icon: Zap, title: "Dedicated Support", desc: "A dedicated account manager, priority support queue, and SLA guarantees ensure your team is never blocked.", color: "bg-amber-600" },
    ],
    benefits: [
      { title: "Built for Complex Operations", desc: "Multi-location fleets, complex pricing rules, and custom workflows are all supported out of the box." },
      { title: "Enterprise-Grade Security", desc: "Full audit trails, role-based access, and encrypted data storage meet enterprise compliance requirements." },
      { title: "Scales Without Friction", desc: "Add vehicles, users, and locations without hitting system limits or requiring re-implementation." },
    ],
    ctaTitle: "Let's Build Your Enterprise Solution",
    ctaDesc: "Contact our enterprise team to discuss your requirements and get a custom demo for your organization.",
    relatedPages: [
      { label: "Car Rental Software", href: "/car-rental-software" },
      { label: "Fleet Management Software", href: "/fleet-management-software" },
      { label: "Small Business Solution", href: "/industries/small-business" },
      { label: "Pricing Plans", href: "/subscription-plans" },
    ],
  },

  "booking-system": {
    pageTitle: "Booking System Features | FleetWizards Car Rental Software",
    metaDesc: "Real-time availability, conflict prevention, automated confirmations, and contract generation — explore the booking system features inside FleetWizards.",
    badge: "Feature Deep-Dive",
    h1: "Powerful Booking System for Car Rental Agencies",
    heroDesc: "From reservation intake to vehicle handoff, FleetWizards automates the booking workflow. Prevent double-bookings, manage deposits, and generate contracts automatically.",
    features: [
      { icon: Calendar, title: "Availability Calendar", desc: "Visual calendar view shows every booking, gap, and available window across your entire fleet.", color: "bg-blue-600" },
      { icon: Shield, title: "Conflict Detection", desc: "The system validates every booking against the existing schedule. Conflicts are blocked before they're saved.", color: "bg-green-600" },
      { icon: FileText, title: "Auto-Contract Generation", desc: "Confirm a booking and the rental contract is created automatically — pre-filled with vehicle, client, and rate details.", color: "bg-violet-600" },
      { icon: DollarSign, title: "Rate Management", desc: "Set daily, weekly, and monthly rates per vehicle. Override pricing for specific bookings when needed.", color: "bg-emerald-600" },
      { icon: Users, title: "Walk-In & Reservation Mode", desc: "Handle both advance reservations and immediate walk-in rentals from the same unified interface.", color: "bg-indigo-600" },
      { icon: BarChart3, title: "Booking History", desc: "Full history for every vehicle and client: dates, rates, contract status, and payment records.", color: "bg-amber-600" },
    ],
    benefits: [
      { title: "Prevent Revenue Loss", desc: "Scheduling conflicts and double-bookings directly cost money. FleetWizards makes them impossible." },
      { title: "Faster Turnaround", desc: "Automated contract generation and pre-filled forms cut vehicle handoff time by up to 80%." },
      { title: "Complete Booking Audit Trail", desc: "Every booking change, cancellation, and modification is logged with a timestamp and user attribution." },
    ],
    ctaTitle: "See the Booking System in Action",
    ctaDesc: "Try our live demo and see how FleetWizards handles a complete rental booking in under 2 minutes.",
    relatedPages: [
      { label: "Car Rental Software", href: "/car-rental-software" },
      { label: "Vehicle Booking System", href: "/vehicle-booking-system" },
      { label: "Fleet Tracking Features", href: "/features/fleet-tracking" },
      { label: "Small Business Solution", href: "/industries/small-business" },
    ],
  },

  "fleet-tracking": {
    pageTitle: "Fleet Tracking Features | FleetWizards",
    metaDesc: "Monitor every vehicle's status, maintenance needs, and insurance expiry in real time. Explore the fleet tracking features built into FleetWizards.",
    badge: "Feature Deep-Dive",
    h1: "Real-Time Fleet Tracking & Status Monitoring",
    heroDesc: "Always know exactly where your vehicles stand. FleetWizards gives you instant visibility into fleet status, mileage, insurance expiry dates, and maintenance schedules — in one dashboard.",
    features: [
      { icon: Car, title: "Live Status Board", desc: "A real-time grid shows every vehicle's current status: available, rented, in maintenance, or out of service.", color: "bg-blue-600" },
      { icon: Wrench, title: "Maintenance Schedule", desc: "Track service intervals, last service dates, and upcoming maintenance for every vehicle in your fleet.", color: "bg-amber-600" },
      { icon: Shield, title: "Insurance Expiry Alerts", desc: "Get notified 30, 15, and 7 days before any vehicle's insurance policy expires — never drive uninsured.", color: "bg-green-600" },
      { icon: BarChart3, title: "Utilization Analytics", desc: "See exactly how much time each vehicle spends rented vs. sitting idle — identify underperforming assets.", color: "bg-violet-600" },
      { icon: Zap, title: "AI Maintenance Predictions", desc: "Machine learning analyzes patterns to predict when a vehicle will need service — before problems occur.", color: "bg-rose-600" },
      { icon: FileText, title: "Vehicle History Log", desc: "Every rental, maintenance record, and damage report is attached to the vehicle's permanent history log.", color: "bg-indigo-600" },
    ],
    benefits: [
      { title: "Never Miss a Service", desc: "Automated maintenance tracking means vehicles are always serviced on time — reducing breakdowns and extending fleet life." },
      { title: "Full Insurance Compliance", desc: "Insurance expiry alerts ensure your business is always compliant and protected against liability." },
      { title: "Data-Driven Fleet Decisions", desc: "Utilization data tells you which vehicles to add, which to retire, and how to optimize your fleet composition." },
    ],
    ctaTitle: "Get Complete Fleet Visibility",
    ctaDesc: "Try FleetWizards free and see your entire fleet status from a single dashboard from day one.",
    relatedPages: [
      { label: "Fleet Management Software", href: "/fleet-management-software" },
      { label: "Car Rental Software", href: "/car-rental-software" },
      { label: "Booking System Features", href: "/features/booking-system" },
      { label: "Enterprise Solution", href: "/industries/enterprise" },
    ],
  },

  "lebanon": {
    pageTitle: "Car Rental Software in Lebanon | FleetWizards",
    metaDesc: "FleetWizards is built for Lebanese car rental agencies. Supports LBP & USD dual-currency, Arabic, Whish Money payments, and local business workflows.",
    badge: "Lebanon",
    h1: "Car Rental Management Software for Lebanese Agencies",
    heroDesc: "Built in Lebanon, designed for the Lebanese market. FleetWizards supports dual-currency (LBP/USD), Arabic language, Whish Money payments, and the workflows Lebanese rental agencies actually use.",
    features: [
      { icon: DollarSign, title: "Dual-Currency Support", desc: "Track revenue, contracts, and invoices in both LBP and USD — with automatic handling for the Lebanese currency reality.", color: "bg-blue-600" },
      { icon: Globe, title: "Full Arabic Support", desc: "The entire platform is available in Arabic with right-to-left layout, proper Arabic numerals, and localized date formats.", color: "bg-indigo-600" },
      { icon: Shield, title: "Whish Money Integration", desc: "Accept payments via Whish Money — the leading payment platform in Lebanon — directly within the system.", color: "bg-green-600" },
      { icon: FileText, title: "Arabic Contracts", desc: "Generate rental contracts in Arabic with proper legal phrasing and formatting accepted by Lebanese courts.", color: "bg-violet-600" },
      { icon: Car, title: "Local Fleet Standards", desc: "Track the vehicle documentation, registration types, and compliance requirements specific to Lebanon.", color: "bg-amber-600" },
      { icon: Users, title: "Lebanese Client Base", desc: "Designed for how Lebanese businesses manage client relationships — including ID types and contact preferences.", color: "bg-rose-600" },
    ],
    benefits: [
      { title: "Made for Lebanon", desc: "Not adapted from a Western product — FleetWizards was built from the ground up with the Lebanese market in mind." },
      { title: "Works in Lebanese Reality", desc: "Handles dual-currency, infrastructure limitations, and the practical realities of doing business in Lebanon." },
      { title: "Local Support Team", desc: "Our support team is based in Lebanon and available in Arabic and English during Lebanese business hours." },
    ],
    ctaTitle: "Join Lebanese Rental Agencies on FleetWizards",
    ctaDesc: "Dozens of Lebanese car rental businesses already trust FleetWizards. Start your free trial today.",
    relatedPages: [
      { label: "Car Rental Software", href: "/car-rental-software" },
      { label: "Fleet Management Software", href: "/fleet-management-software" },
      { label: "UAE", href: "/locations/uae" },
      { label: "Saudi Arabia", href: "/locations/saudi-arabia" },
    ],
  },

  "uae": {
    pageTitle: "Car Rental Software for UAE Businesses | FleetWizards",
    metaDesc: "Fleet management software for UAE car rental companies. AED support, VAT-compliant invoicing, and real-time fleet visibility for Dubai, Abu Dhabi, and across the Emirates.",
    badge: "United Arab Emirates",
    h1: "Fleet Management Software for UAE Rental Companies",
    heroDesc: "Trusted by rental agencies across the UAE. FleetWizards supports AED currency, UAE VAT-compliant invoicing, and the documentation standards required in the Emirates.",
    features: [
      { icon: DollarSign, title: "AED Currency Support", desc: "All pricing, contracts, and invoices are denominated in UAE Dirhams with proper formatting and VAT calculations.", color: "bg-blue-600" },
      { icon: Shield, title: "UAE VAT Compliance", desc: "Automatic 5% VAT application on invoices meets UAE Federal Tax Authority requirements for rental businesses.", color: "bg-green-600" },
      { icon: FileText, title: "UAE-Ready Documentation", desc: "Rental agreements and invoices follow the standards expected by UAE business and legal practices.", color: "bg-violet-600" },
      { icon: Car, title: "Multi-Emirate Operations", desc: "Manage fleets across Dubai, Abu Dhabi, Sharjah, and other Emirates from a single centralized platform.", color: "bg-indigo-600" },
      { icon: BarChart3, title: "Revenue Analytics", desc: "Track performance by vehicle, location, and time period to optimize your UAE rental business operations.", color: "bg-amber-600" },
      { icon: Globe, title: "Arabic & English", desc: "Full bilingual support — switch between English and Arabic to serve both local and international customers.", color: "bg-rose-600" },
    ],
    benefits: [
      { title: "VAT-Ready Invoicing", desc: "Every invoice meets UAE FTA requirements for VAT documentation — no manual adjustments needed." },
      { title: "Multi-Location Management", desc: "Manage branches across multiple Emirates from a single login with consolidated reporting." },
      { title: "Professional Appearance", desc: "Contracts and invoices that meet the high standards of the UAE business environment." },
    ],
    ctaTitle: "Start Your UAE Fleet Operation Right",
    ctaDesc: "Join rental agencies across the UAE already using FleetWizards to manage their fleets more efficiently.",
    relatedPages: [
      { label: "Car Rental Software", href: "/car-rental-software" },
      { label: "Fleet Management Software", href: "/fleet-management-software" },
      { label: "Lebanon", href: "/locations/lebanon" },
      { label: "Saudi Arabia", href: "/locations/saudi-arabia" },
    ],
  },

  "saudi-arabia": {
    pageTitle: "Car Rental Software in Saudi Arabia | FleetWizards",
    metaDesc: "Fleet management and car rental software for Saudi Arabian businesses. SAR support, VAT compliance, Arabic language, and KSA-ready documentation.",
    badge: "Saudi Arabia",
    h1: "Car Rental Software for Saudi Arabian Businesses",
    heroDesc: "FleetWizards is built for the GCC market, with native Arabic support, SAR currency, and VAT compliance that meets Saudi regulatory requirements — from Riyadh to Jeddah and beyond.",
    features: [
      { icon: DollarSign, title: "SAR Currency Support", desc: "All contracts, invoices, and analytics are denominated in Saudi Riyals with proper regional formatting.", color: "bg-blue-600" },
      { icon: Shield, title: "KSA VAT Compliance", desc: "Automatic 15% VAT on rental invoices meets ZATCA (Zakat, Tax and Customs Authority) requirements.", color: "bg-green-600" },
      { icon: Globe, title: "Full Arabic Interface", desc: "Native Arabic support with right-to-left layout, proper Arabic typography, and localized content.", color: "bg-indigo-600" },
      { icon: FileText, title: "KSA-Ready Contracts", desc: "Rental contract templates aligned with Saudi business practices and legal documentation standards.", color: "bg-violet-600" },
      { icon: Car, title: "Multi-City Fleet Management", desc: "Manage vehicles across Riyadh, Jeddah, Dammam, and other cities from a single unified dashboard.", color: "bg-amber-600" },
      { icon: BarChart3, title: "KSA Business Analytics", desc: "Revenue dashboards and fleet analytics calibrated for the Saudi market and seasonal demand patterns.", color: "bg-rose-600" },
    ],
    benefits: [
      { title: "ZATCA-Compliant Invoicing", desc: "Invoices are automatically generated with the correct VAT calculations required by Saudi regulations." },
      { title: "Arabic-First Experience", desc: "The entire platform was designed with Arabic as a first-class language — not an afterthought translation." },
      { title: "GCC Market Expertise", desc: "FleetWizards understands the GCC rental market and builds features for how rental businesses operate in the region." },
    ],
    ctaTitle: "Grow Your Saudi Rental Business With FleetWizards",
    ctaDesc: "Join rental agencies across the Kingdom already using FleetWizards to modernize their operations.",
    relatedPages: [
      { label: "Car Rental Software", href: "/car-rental-software" },
      { label: "Fleet Management Software", href: "/fleet-management-software" },
      { label: "UAE", href: "/locations/uae" },
      { label: "Lebanon", href: "/locations/lebanon" },
    ],
  },
};

export default function SeoLandingPage({ pageId }: { pageId: string }) {
  const page = PAGE_DATA[pageId];

  useEffect(() => {
    if (!page) return;
    document.title = page.pageTitle;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", page.metaDesc);
  }, [page]);

  if (!page) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Page not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-blue-50/70 via-white to-white rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-xs font-semibold text-blue-700 tracking-wide uppercase">{page.badge}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-6">
            {page.h1}
          </h1>
          <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            {page.heroDesc}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 h-12 text-base font-semibold shadow-lg shadow-blue-600/25 group">
                Start Free Trial
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button size="lg" className="bg-red-800 hover:bg-red-900 text-white px-8 h-12 text-base font-bold shadow-lg shadow-red-900/25 group">
                <Clock className="h-4 w-4 mr-2" />
                Try Live Demo
              </Button>
            </Link>
          </div>
          <p className="mt-5 text-xs text-gray-400 flex items-center justify-center gap-4 flex-wrap">
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> No credit card required</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> Free demo available</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" /> Cancel anytime</span>
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <p className="text-sm font-semibold text-blue-600 tracking-wide uppercase mb-3">Key Features</p>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-4">
              Everything You Need in One Platform
            </h2>
            <p className="text-gray-500 text-lg">
              FleetWizards packs an entire rental operations team into one intuitive system.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {page.features.map((feature, i) => (
              <div
                key={i}
                className="group p-6 rounded-xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300"
              >
                <div className={`w-10 h-10 rounded-lg ${feature.color} flex items-center justify-center mb-4`}>
                  <feature.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-14">
            <p className="text-sm font-semibold text-blue-600 tracking-wide uppercase mb-3">Why FleetWizards</p>
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Real Results for Real Businesses
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {page.benefits.map((b, i) => (
              <div key={i} className="text-center p-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{b.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-2xl bg-gradient-to-br from-gray-900 via-gray-900 to-blue-950 p-10 sm:p-16 text-center overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">{page.ctaTitle}</h2>
              <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">{page.ctaDesc}</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/signup">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white px-8 h-12 text-base font-semibold shadow-lg shadow-blue-600/30">
                    Start Free Trial
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button size="lg" className="bg-red-800 hover:bg-red-900 text-white px-8 h-12 text-base font-bold shadow-lg shadow-red-900/30">
                    Try Live Demo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Internal Links */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-wide text-center mb-8">Explore More</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {page.relatedPages.map((rp) => (
              <Link
                key={rp.href}
                href={rp.href}
                className="group flex items-center justify-between gap-2 px-4 py-3 rounded-lg border border-gray-100 bg-white hover:border-blue-200 hover:bg-blue-50/50 transition-all text-sm font-medium text-gray-600 hover:text-blue-600"
              >
                {rp.label}
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-300 group-hover:text-blue-400 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
