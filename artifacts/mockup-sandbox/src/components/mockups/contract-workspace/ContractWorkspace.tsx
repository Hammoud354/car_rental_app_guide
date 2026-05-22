import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Car, User, Calendar, DollarSign, Shield, Gauge,
  ChevronDown, X, Check, AlertCircle, Clock,
  FileText, Printer, CreditCard, Plus, Search,
  ChevronRight, Info
} from "lucide-react";

// ── helpers ─────────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, label, color = "blue" }: {
  icon: React.ElementType; label: string; color?: string;
}) {
  const colors: Record<string, string> = {
    blue:   "bg-blue-100 text-blue-700",
    violet: "bg-violet-100 text-violet-700",
    green:  "bg-green-100 text-green-700",
    orange: "bg-orange-100 text-orange-700",
    slate:  "bg-slate-100 text-slate-600",
  };
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${colors[color]}`}>
        <Icon className="w-3.5 h-3.5" />
      </span>
      <h3 className="font-semibold text-sm text-gray-800 tracking-wide uppercase">{label}</h3>
    </div>
  );
}

function FieldGroup({ children, cols = 2 }: { children: React.ReactNode; cols?: number }) {
  return (
    <div className={`grid gap-3 ${cols === 2 ? "grid-cols-2" : cols === 3 ? "grid-cols-3" : "grid-cols-1"}`}>
      {children}
    </div>
  );
}

function Field({ label, children, span = 1, required }: {
  label: string; children: React.ReactNode; span?: number; required?: boolean;
}) {
  return (
    <div className={span === 2 ? "col-span-2" : ""}>
      <Label className="text-xs font-medium text-gray-500 mb-1.5 block">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}

const inputCls =
  "h-8.5 text-sm border border-[#1e3a8a]/30 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 rounded-md bg-white placeholder:text-gray-300";

const readonlyCls =
  "h-8.5 text-sm bg-gray-50 border border-gray-200 rounded-md text-gray-600 flex items-center px-3 font-medium";

// ── Main Component ───────────────────────────────────────────────────────────

export function ContractWorkspace() {
  const [activeTab, setActiveTab] = useState<"client" | "driver2">("client");
  const [includeDriver2, setIncludeDriver2] = useState(false);
  const [days, setDays] = useState(5);

  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center p-6 py-8">
      {/* ── Dialog Shell ─────────────────────────────────────────────────── */}
      <div
        className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: "min(1320px, calc(100vw - 48px))", height: "min(88vh, 900px)" }}
      >
        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-7 py-4 border-b border-gray-100 shrink-0 bg-gradient-to-r from-blue-900 to-blue-800">
          <div className="flex items-center gap-3">
            <div className="bg-white/15 rounded-xl p-2">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base leading-tight">New Rental Contract</h2>
              <p className="text-blue-200 text-xs">Fill in all required fields to generate the rental agreement</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-white/15 text-white border-white/20 text-xs font-medium px-3 py-1">
              Draft — CNT-2026-0041
            </Badge>
            <button className="text-white/60 hover:text-white transition-colors rounded-lg p-1.5 hover:bg-white/10">
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* ── Progress bar ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-0 px-7 py-3 bg-blue-50/60 border-b border-blue-100/60 shrink-0">
          {[
            { n: 1, label: "Vehicle", done: true },
            { n: 2, label: "Client", done: true },
            { n: 3, label: "Dates & Pricing", done: false, active: true },
            { n: 4, label: "Car Inspection", done: false },
          ].map((step, i, arr) => (
            <div key={step.n} className="flex items-center">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step.done ? "bg-green-500 text-white" :
                  step.active ? "bg-blue-700 text-white ring-2 ring-blue-300" :
                  "bg-gray-200 text-gray-400"
                }`}>
                  {step.done ? <Check className="w-3 h-3" /> : step.n}
                </div>
                <span className={`text-xs font-medium ${
                  step.active ? "text-blue-800" : step.done ? "text-green-700" : "text-gray-400"
                }`}>{step.label}</span>
              </div>
              {i < arr.length - 1 && (
                <div className={`mx-3 h-px w-12 ${step.done ? "bg-green-300" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* ── Two-column body ───────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* ── LEFT COLUMN: Client & Driver ────────────────────────────── */}
          <div className="flex flex-col w-[52%] border-r border-gray-100 overflow-y-auto bg-white">
            <div className="p-6 space-y-6">

              {/* Vehicle Selection */}
              <div className="rounded-xl border border-gray-200 p-4 bg-gradient-to-br from-slate-50 to-white">
                <SectionHeader icon={Car} label="Vehicle Selection" color="slate" />
                <FieldGroup>
                  <Field label="Plate Number" required>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <Input className={`${inputCls} pl-8`} placeholder="e.g. AB-1234" defaultValue="DZ-789" />
                    </div>
                  </Field>
                  <Field label="Vehicle">
                    <div className={readonlyCls}>
                      <Car className="w-3.5 h-3.5 text-gray-400 mr-2 shrink-0" />
                      <span className="truncate">2023 Toyota Camry</span>
                    </div>
                  </Field>
                </FieldGroup>
                <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200">
                  <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                  <span className="text-xs text-green-700 font-medium">Available · Last odometer: 45,200 km</span>
                </div>
              </div>

              {/* Client Information */}
              <div className="rounded-xl border border-gray-200 p-4">
                {/* Tabs: existing client vs manual */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100 text-blue-700">
                    <User className="w-3.5 h-3.5" />
                  </span>
                  <h3 className="font-semibold text-sm text-gray-800 tracking-wide uppercase">Client Information</h3>
                  <div className="ml-auto flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                    {["Existing", "New"].map(t => (
                      <button key={t} className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                        t === "Existing" ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
                      }`}>{t}</button>
                    ))}
                  </div>
                </div>

                {/* Quick search */}
                <div className="relative mb-4">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <Input className={`${inputCls} pl-8`} placeholder="Search by name or ID..." defaultValue="Ahmed" />
                  <div className="absolute top-full left-0 right-0 z-10 bg-white border border-gray-200 rounded-xl shadow-lg mt-1 py-1 text-sm">
                    {[
                      { name: "Ahmed Benali", id: "DZ-0293811", phone: "+213 550 123 456" },
                      { name: "Ahmed Dridi", id: "TN-119922", phone: "+216 22 334 455" },
                    ].map(c => (
                      <div key={c.id} className="flex items-center gap-3 px-3 py-2 hover:bg-blue-50 cursor-pointer transition-colors">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
                          {c.name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-800 text-xs">{c.name}</div>
                          <div className="text-gray-400 text-xs">{c.id} · {c.phone}</div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                      </div>
                    ))}
                  </div>
                </div>

                <FieldGroup>
                  <Field label="First Name" required>
                    <Input className={inputCls} defaultValue="Ahmed" />
                  </Field>
                  <Field label="Last Name" required>
                    <Input className={inputCls} defaultValue="Benali" />
                  </Field>
                  <Field label="Father's Name">
                    <Input className={inputCls} placeholder="Optional" />
                  </Field>
                  <Field label="Mother's Name">
                    <Input className={inputCls} placeholder="Optional" />
                  </Field>
                  <Field label="Nationality">
                    <div className="relative">
                      <Input className={`${inputCls} pr-7`} defaultValue="Algerian" />
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </Field>
                  <Field label="Phone">
                    <Input className={inputCls} defaultValue="+213 550 123 456" />
                  </Field>
                  <Field label="Address" span={2}>
                    <Input className={inputCls} placeholder="Street, city..." />
                  </Field>
                  <Field label="Passport / National ID" required>
                    <Input className={inputCls} defaultValue="DZ-0293811" />
                  </Field>
                  <Field label="Date of Birth">
                    <Input className={`${inputCls}`} type="date" defaultValue="1988-03-15" />
                  </Field>
                  <Field label="Place of Birth">
                    <Input className={inputCls} placeholder="City, Country" />
                  </Field>
                  <Field label="Place of Registration">
                    <Input className={inputCls} placeholder="Registration office" />
                  </Field>
                </FieldGroup>
              </div>

              {/* Driving License */}
              <div className="rounded-xl border border-gray-200 p-4">
                <SectionHeader icon={CreditCard} label="Driving License" color="violet" />
                <FieldGroup cols={3}>
                  <Field label="License Number" required>
                    <Input className={inputCls} defaultValue="09-1234567" />
                  </Field>
                  <Field label="Issue Date">
                    <Input className={inputCls} type="date" defaultValue="2010-06-01" />
                  </Field>
                  <Field label="Expiry Date">
                    <Input className={`${inputCls} border-orange-300 focus:border-orange-400`} type="date" defaultValue="2025-06-01" />
                  </Field>
                </FieldGroup>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-orange-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  License expires in 8 days — confirm with the renter
                </div>
              </div>

              {/* Second Driver (Collapsed) */}
              <div className="rounded-xl border border-dashed border-gray-300 overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  onClick={() => setIncludeDriver2(!includeDriver2)}
                >
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4 text-gray-400" />
                    <span>Add Second Driver</span>
                    <Badge className="text-[10px] px-1.5 py-0 bg-gray-100 text-gray-500 border-0">Optional</Badge>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${includeDriver2 ? "rotate-180" : ""}`} />
                </button>
                {includeDriver2 && (
                  <div className="px-4 pb-4 bg-gray-50/50 border-t border-dashed border-gray-200">
                    <div className="pt-4 space-y-3">
                      <FieldGroup>
                        <Field label="First Name">
                          <Input className={inputCls} placeholder="Second driver first name" />
                        </Field>
                        <Field label="Last Name">
                          <Input className={inputCls} placeholder="Second driver last name" />
                        </Field>
                        <Field label="License Number">
                          <Input className={inputCls} placeholder="License number" />
                        </Field>
                        <Field label="License Expiry">
                          <Input className={inputCls} type="date" />
                        </Field>
                      </FieldGroup>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* ── RIGHT COLUMN: Dates, Pricing, Options ────────────────────── */}
          <div className="flex flex-col flex-1 overflow-y-auto bg-gray-50/40">
            <div className="p-6 space-y-5">

              {/* Rental Period */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4">
                <SectionHeader icon={Calendar} label="Rental Period" color="blue" />
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <Field label="Start Date" required>
                    <Input className={`${inputCls} bg-white`} type="date" defaultValue="2026-05-22" />
                    <p className="text-[10px] text-blue-500 mt-1 flex items-center gap-1"><Check className="w-3 h-3" /> Past dates allowed</p>
                  </Field>
                  <Field label="Pickup Time">
                    <Input className={`${inputCls} bg-white`} type="time" defaultValue="09:30" />
                    <p className="text-[10px] text-gray-400 mt-1">Exact hour car was picked up</p>
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Rental Days" required>
                    <div className="flex items-center gap-2">
                      <button
                        className="h-8.5 w-8 rounded-md border border-gray-300 bg-white flex items-center justify-center text-base font-bold text-gray-600 hover:border-blue-400 transition-colors shrink-0"
                        onClick={() => setDays(Math.max(1, days - 1))}
                      >−</button>
                      <Input
                        className={`${inputCls} bg-white text-center font-bold text-base`}
                        value={days}
                        onChange={e => setDays(Math.max(1, parseInt(e.target.value) || 1))}
                      />
                      <button
                        className="h-8.5 w-8 rounded-md border border-gray-300 bg-white flex items-center justify-center text-base font-bold text-gray-600 hover:border-blue-400 transition-colors shrink-0"
                        onClick={() => setDays(days + 1)}
                      >+</button>
                    </div>
                  </Field>
                  <Field label="Return Date (Auto)">
                    <div className="h-8.5 flex items-center px-3 rounded-md bg-white border border-dashed border-gray-300 text-sm font-semibold text-gray-700">
                      27 May 2026
                    </div>
                    <p className="text-[10px] text-blue-500 mt-1">{days} day{days !== 1 ? "s" : ""} · 22 May → 27 May 2026</p>
                  </Field>
                </div>
              </div>

              {/* Odometer */}
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <SectionHeader icon={Gauge} label="Vehicle Inspection" color="slate" />
                <FieldGroup>
                  <Field label="Pickup Odometer (KM)" required>
                    <Input className={inputCls} type="number" defaultValue="45200" />
                    <p className="text-[10px] text-gray-400 mt-1">Auto-filled from last contract. Min: 45,000 km</p>
                  </Field>
                  <div className="flex items-center">
                    <div className="mt-3 w-full h-12 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center gap-2">
                      <Info className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-xs text-blue-700 font-medium">Damage marks added in next step</span>
                    </div>
                  </div>
                </FieldGroup>
              </div>

              {/* Pricing */}
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-green-100 text-green-700">
                    <DollarSign className="w-3.5 h-3.5" />
                  </span>
                  <h3 className="font-semibold text-sm text-gray-800 tracking-wide uppercase">Pricing</h3>
                  <Badge className="ml-auto bg-orange-50 text-orange-700 border-orange-200 text-[10px]">🌞 High Season</Badge>
                </div>
                <FieldGroup>
                  <Field label="Daily Rate ($)" required>
                    <Input className={`${inputCls} border-orange-300`} defaultValue="85.00" />
                    <p className="text-[10px] text-orange-500 mt-1">High season rate applied</p>
                  </Field>
                  <Field label="Discount ($)">
                    <Input className={inputCls} defaultValue="0.00" />
                  </Field>
                </FieldGroup>

                {/* Pricing summary card */}
                <div className="mt-3 rounded-lg bg-gradient-to-br from-blue-900 to-blue-800 p-3 text-white">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-blue-200">Subtotal ({days} days × $85)</span>
                    <span className="font-medium">${(days * 85).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-blue-200">VAT (19%)</span>
                    <span className="font-medium">${(days * 85 * 0.19).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs mb-2 pb-2 border-b border-white/20">
                    <span className="text-blue-200">Discount</span>
                    <span className="font-medium text-green-300">−$0.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-bold">Total</span>
                    <span className="text-lg font-bold text-white">${(days * 85 * 1.19).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Insurance & Deposit */}
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <SectionHeader icon={Shield} label="Insurance & Deposit" color="green" />

                {/* Insurance packages */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { name: "None", cost: "$0", color: "border-gray-200 text-gray-500" },
                    { name: "Basic", cost: "$8/day", color: "border-blue-300 text-blue-700 bg-blue-50", active: true },
                    { name: "Full", cost: "$18/day", color: "border-emerald-300 text-emerald-700 bg-emerald-50" },
                  ].map(pkg => (
                    <div key={pkg.name} className={`rounded-lg border-2 p-2 text-center cursor-pointer transition-all ${pkg.color} ${pkg.active ? "ring-2 ring-blue-300" : ""}`}>
                      <div className="font-semibold text-xs">{pkg.name}</div>
                      <div className="text-[10px] font-medium">{pkg.cost}</div>
                    </div>
                  ))}
                </div>

                <FieldGroup>
                  <Field label="Deposit Amount ($)">
                    <Input className={inputCls} defaultValue="500.00" />
                  </Field>
                  <Field label="Deposit Status">
                    <div className="relative">
                      <Input className={`${inputCls} pr-7`} defaultValue="Pending" />
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </Field>
                </FieldGroup>

                <div className="mt-3">
                  <Label className="text-xs font-medium text-gray-500 mb-2 block">Fuel Policy</Label>
                  <div className="flex gap-2">
                    {["Full-to-Full", "Full-to-Empty", "Same Level"].map(policy => (
                      <button key={policy} className={`text-[10px] px-2.5 py-1.5 rounded-lg border font-medium transition-all ${
                        policy === "Full-to-Full"
                          ? "bg-blue-700 text-white border-blue-700"
                          : "bg-white text-gray-500 border-gray-200 hover:border-blue-300"
                      }`}>{policy}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Late Return Fee */}
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <SectionHeader icon={Clock} label="Late Return Fee" color="orange" />
                <FieldGroup>
                  <Field label="Late Fee % per day">
                    <div className="relative">
                      <Input className={inputCls} placeholder="150 (default)" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">%</span>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Default: 150% of daily rate per overdue day</p>
                  </Field>
                  <div className="flex items-center">
                    <div className="mt-3 h-10 flex items-center px-3 rounded-lg bg-gray-50 border border-dashed border-gray-200 text-xs text-gray-400 w-full">
                      = 1.50× daily rate per day late
                    </div>
                  </div>
                </FieldGroup>
              </div>

            </div>
          </div>
        </div>

        {/* ── Sticky Footer ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-7 py-4 border-t border-gray-100 bg-white shrink-0">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <AlertCircle className="w-3.5 h-3.5" />
            Next step: photograph vehicle damage before confirming
          </div>
          <div className="flex items-center gap-2.5">
            <Button variant="outline" size="sm" className="text-xs h-8 px-4 text-gray-600">
              Cancel
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-8 px-4 gap-1.5 text-blue-700 border-blue-200 hover:bg-blue-50">
              <Printer className="w-3.5 h-3.5" />
              Preview PDF
            </Button>
            <Button size="sm" className="text-xs h-8 px-5 bg-blue-800 hover:bg-blue-900 gap-1.5">
              <ChevronRight className="w-3.5 h-3.5" />
              Continue to Car Inspection
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
