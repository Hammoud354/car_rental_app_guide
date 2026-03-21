import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";

type CarView = "front" | "rear" | "left" | "right";

interface DamageMark {
  id: string;
  x: number;
  y: number;
  view: CarView;
  description: string;
}

interface ContractData {
  clientName: string;
  clientLicense: string;
  clientPhone?: string;
  clientAddress?: string;
  vehiclePlate: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleColor?: string;
  vehicleVin?: string;
  startDate: Date;
  endDate: Date;
  rentalDays: number;
  dailyRate: number;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  insurancePackage?: "None" | "Basic" | "Premium" | "Full Coverage";
  insuranceCost?: number;
  insuranceDailyRate?: number;
  depositAmount?: number;
  depositStatus?: "None" | "Held" | "Refunded" | "Forfeited";
  fuelPolicy?: "Full-to-Full" | "Same-to-Same" | "Pre-purchase";
}

interface CarDamageInspectionProps {
  onComplete: (damageMarks: DamageMark[], signatureData: string, fuelLevel: string) => void;
  onCancel: () => void;
  onBack?: () => void;
  contractData?: ContractData;
}

const VIEW_LABELS: Record<CarView, string> = {
  front: "Front",
  rear: "Rear",
  left: "Left Side",
  right: "Right Side",
};

/* ─── SVG Drawings ─────────────────────────────────── */

function FrontCarSVG() {
  return (
    <svg viewBox="0 0 400 280" className="w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bodyGradF" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d6d6d6" />
          <stop offset="100%" stopColor="#a8a8a8" />
        </linearGradient>
        <linearGradient id="glassF" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#b8e0ff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#78b4e0" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      {/* Road / base line */}
      <rect x="40" y="248" width="320" height="6" rx="3" fill="#ccc" />
      {/* Main body */}
      <path d="M 80 248 L 68 200 L 72 160 L 100 130 L 145 118 L 170 100 L 230 100 L 255 118 L 300 130 L 328 160 L 332 200 L 320 248 Z" fill="url(#bodyGradF)" stroke="#555" strokeWidth="2.5" />
      {/* Roof / cabin silhouette */}
      <path d="M 155 100 L 170 72 L 230 72 L 245 100 Z" fill="#bbb" stroke="#555" strokeWidth="2" />
      {/* Windshield */}
      <path d="M 158 100 L 172 76 L 228 76 L 242 100 Z" fill="url(#glassF)" stroke="#666" strokeWidth="1.5" />
      {/* Hood crease */}
      <line x1="200" y1="130" x2="200" y2="200" stroke="#bbb" strokeWidth="1" strokeDasharray="4,4" />
      {/* Front bumper */}
      <path d="M 72 220 Q 200 240 328 220 L 320 248 Q 200 255 80 248 Z" fill="#b0b0b0" stroke="#666" strokeWidth="1.5" />
      {/* Grille */}
      <rect x="160" y="190" width="80" height="28" rx="6" fill="#2c2c2c" stroke="#555" strokeWidth="1.5" />
      <rect x="165" y="194" width="70" height="20" rx="4" fill="#1a1a1a" />
      {[175, 185, 195, 205, 215, 225].map(x => (
        <line key={x} x1={x} y1="194" x2={x} y2="214" stroke="#444" strokeWidth="1" />
      ))}
      {/* Left headlight */}
      <path d="M 82 165 L 96 152 L 148 155 L 148 180 L 82 180 Z" fill="#fffde0" stroke="#888" strokeWidth="1.5" />
      <path d="M 90 158 L 100 155 L 144 158 L 144 175 L 90 175 Z" fill="#fff8b0" opacity="0.7" />
      {/* Right headlight */}
      <path d="M 318 165 L 304 152 L 252 155 L 252 180 L 318 180 Z" fill="#fffde0" stroke="#888" strokeWidth="1.5" />
      <path d="M 310 158 L 300 155 L 256 158 L 256 175 L 310 175 Z" fill="#fff8b0" opacity="0.7" />
      {/* Wheels */}
      <ellipse cx="96" cy="248" rx="38" ry="14" fill="#1a1a1a" stroke="#111" strokeWidth="2" />
      <ellipse cx="96" cy="248" rx="25" ry="9" fill="#333" />
      <ellipse cx="96" cy="248" rx="10" ry="4" fill="#555" />
      <ellipse cx="304" cy="248" rx="38" ry="14" fill="#1a1a1a" stroke="#111" strokeWidth="2" />
      <ellipse cx="304" cy="248" rx="25" ry="9" fill="#333" />
      <ellipse cx="304" cy="248" rx="10" ry="4" fill="#555" />
      {/* Hood line */}
      <line x1="100" y1="130" x2="300" y2="130" stroke="#999" strokeWidth="1.5" />
      {/* Label */}
      <text x="200" y="24" textAnchor="middle" fill="#333" fontSize="15" fontWeight="700">FRONT</text>
      <text x="200" y="40" textAnchor="middle" fill="#888" fontSize="10">↑</text>
    </svg>
  );
}

function RearCarSVG() {
  return (
    <svg viewBox="0 0 400 280" className="w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bodyGradR" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d6d6d6" />
          <stop offset="100%" stopColor="#a8a8a8" />
        </linearGradient>
        <linearGradient id="glassR" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#b8e0ff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#78b4e0" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <rect x="40" y="248" width="320" height="6" rx="3" fill="#ccc" />
      {/* Main body */}
      <path d="M 80 248 L 68 200 L 72 160 L 100 130 L 145 118 L 170 100 L 230 100 L 255 118 L 300 130 L 328 160 L 332 200 L 320 248 Z" fill="url(#bodyGradR)" stroke="#555" strokeWidth="2.5" />
      {/* Roof */}
      <path d="M 155 100 L 170 72 L 230 72 L 245 100 Z" fill="#bbb" stroke="#555" strokeWidth="2" />
      {/* Rear windshield */}
      <path d="M 158 100 L 172 76 L 228 76 L 242 100 Z" fill="url(#glassR)" stroke="#666" strokeWidth="1.5" />
      {/* Trunk lid */}
      <path d="M 110 130 L 290 130 L 295 160 L 105 160 Z" fill="#c8c8c8" stroke="#888" strokeWidth="1.5" />
      <line x1="200" y1="130" x2="200" y2="160" stroke="#bbb" strokeWidth="1" strokeDasharray="4,4" />
      {/* Rear bumper */}
      <path d="M 75 220 Q 200 238 325 220 L 320 248 Q 200 255 80 248 Z" fill="#b0b0b0" stroke="#666" strokeWidth="1.5" />
      {/* License plate */}
      <rect x="162" y="224" width="76" height="20" rx="3" fill="#f5f5dc" stroke="#888" strokeWidth="1.5" />
      <text x="200" y="237" textAnchor="middle" fill="#333" fontSize="9" fontWeight="600">PLATE</text>
      {/* Left taillight */}
      <path d="M 82 162 L 82 210 L 118 210 L 130 162 Z" fill="#cc2200" stroke="#880000" strokeWidth="1.5" />
      <path d="M 88 166 L 88 206 L 115 206 L 126 166 Z" fill="#ee4422" opacity="0.7" />
      {/* Right taillight */}
      <path d="M 318 162 L 318 210 L 282 210 L 270 162 Z" fill="#cc2200" stroke="#880000" strokeWidth="1.5" />
      <path d="M 312 166 L 312 206 L 285 206 L 274 166 Z" fill="#ee4422" opacity="0.7" />
      {/* Exhaust */}
      <ellipse cx="160" cy="250" rx="8" ry="5" fill="#444" stroke="#222" strokeWidth="1.5" />
      <ellipse cx="240" cy="250" rx="8" ry="5" fill="#444" stroke="#222" strokeWidth="1.5" />
      {/* Wheels */}
      <ellipse cx="96" cy="248" rx="38" ry="14" fill="#1a1a1a" stroke="#111" strokeWidth="2" />
      <ellipse cx="96" cy="248" rx="25" ry="9" fill="#333" />
      <ellipse cx="96" cy="248" rx="10" ry="4" fill="#555" />
      <ellipse cx="304" cy="248" rx="38" ry="14" fill="#1a1a1a" stroke="#111" strokeWidth="2" />
      <ellipse cx="304" cy="248" rx="25" ry="9" fill="#333" />
      <ellipse cx="304" cy="248" rx="10" ry="4" fill="#555" />
      <text x="200" y="24" textAnchor="middle" fill="#333" fontSize="15" fontWeight="700">REAR</text>
      <text x="200" y="40" textAnchor="middle" fill="#888" fontSize="10">↓</text>
    </svg>
  );
}

function SideCarSVG({ flip = false }: { flip?: boolean }) {
  const transform = flip ? "scale(-1,1) translate(-600,0)" : undefined;
  return (
    <svg viewBox="0 0 600 260" className="w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`bodyGradS${flip ? "R" : "L"}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d8d8d8" />
          <stop offset="100%" stopColor="#aaaaaa" />
        </linearGradient>
        <linearGradient id={`glassS${flip ? "R" : "L"}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#c4e8ff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#80c0e8" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <g transform={transform}>
        {/* Ground */}
        <rect x="30" y="226" width="540" height="5" rx="2" fill="#ccc" />
        {/* Main car body */}
        <path
          d="M 60 225 L 55 195 L 60 170 L 80 150
             L 140 130 L 180 90 L 240 72 L 370 72
             L 420 80 L 460 100 L 490 120 L 520 145
             L 540 170 L 548 195 L 545 225 Z"
          fill={`url(#bodyGradS${flip ? "R" : "L"})`}
          stroke="#555"
          strokeWidth="2.5"
        />
        {/* Windshield */}
        <path d="M 185 92 L 242 74 L 310 74 L 310 120 L 188 120 Z" fill={`url(#glassS${flip ? "R" : "L"})`} stroke="#666" strokeWidth="1.5" />
        {/* Rear window */}
        <path d="M 310 74 L 368 74 L 410 90 L 420 120 L 310 120 Z" fill={`url(#glassS${flip ? "R" : "L"})`} stroke="#666" strokeWidth="1.5" />
        {/* Roof */}
        <path d="M 183 90 L 240 70 L 370 70 L 412 88 L 310 120 L 188 120 Z" fill="#c0c0c0" stroke="#666" strokeWidth="1.5" />
        {/* Door 1 */}
        <path d="M 188 122 L 306 122 L 306 200 L 192 200 Z" fill="none" stroke="#888" strokeWidth="1.5" />
        <circle cx="302" cy="165" r="5" fill="#aaa" stroke="#888" strokeWidth="1" />
        {/* Door 2 */}
        <path d="M 310 122 L 418 122 L 416 200 L 312 200 Z" fill="none" stroke="#888" strokeWidth="1.5" />
        <circle cx="315" cy="165" r="5" fill="#aaa" stroke="#888" strokeWidth="1" />
        {/* Hood */}
        <path d="M 62 170 L 80 150 L 140 130 L 183 120 L 188 150 L 72 170 Z" fill="#c8c8c8" stroke="#888" strokeWidth="1.5" />
        {/* Hood crease */}
        <line x1="75" y1="168" x2="186" y2="140" stroke="#bbb" strokeWidth="1" />
        {/* Trunk */}
        <path d="M 418 120 L 460 100 L 490 120 L 520 145 L 540 170 L 545 195 L 420 200 Z" fill="#c8c8c8" stroke="#888" strokeWidth="1.5" />
        {/* Front bumper */}
        <path d="M 57 195 L 68 185 L 76 190 L 76 225 L 57 225 Z" fill="#b0b0b0" stroke="#777" strokeWidth="1.5" />
        {/* Rear bumper */}
        <path d="M 543 195 L 548 188 L 556 195 L 556 225 L 543 225 Z" fill="#b0b0b0" stroke="#777" strokeWidth="1.5" />
        {/* Front headlight */}
        <path d="M 62 168 L 62 185 L 82 185 L 86 168 Z" fill="#fffde0" stroke="#888" strokeWidth="1.5" />
        {/* Rear taillight */}
        <path d="M 540 165 L 540 195 L 522 195 L 518 165 Z" fill="#cc2200" stroke="#880000" strokeWidth="1.5" />
        {/* Side mirror */}
        <path d="M 180 128 L 165 136 L 165 148 L 180 148 Z" fill="#999" stroke="#777" strokeWidth="1.5" />
        {/* Front wheel */}
        <circle cx="145" cy="226" r="38" fill="#1a1a1a" stroke="#111" strokeWidth="3" />
        <circle cx="145" cy="226" r="27" fill="#333" stroke="#555" strokeWidth="2" />
        <circle cx="145" cy="226" r="13" fill="#555" />
        {[0, 60, 120, 180, 240, 300].map(deg => {
          const r = Math.PI * deg / 180;
          return <line key={deg} x1={145 + 14 * Math.cos(r)} y1={226 + 14 * Math.sin(r)} x2={145 + 26 * Math.cos(r)} y2={226 + 26 * Math.sin(r)} stroke="#666" strokeWidth="2" />;
        })}
        {/* Rear wheel */}
        <circle cx="460" cy="226" r="38" fill="#1a1a1a" stroke="#111" strokeWidth="3" />
        <circle cx="460" cy="226" r="27" fill="#333" stroke="#555" strokeWidth="2" />
        <circle cx="460" cy="226" r="13" fill="#555" />
        {[0, 60, 120, 180, 240, 300].map(deg => {
          const r = Math.PI * deg / 180;
          return <line key={deg} x1={460 + 14 * Math.cos(r)} y1={226 + 14 * Math.sin(r)} x2={460 + 26 * Math.cos(r)} y2={226 + 26 * Math.sin(r)} stroke="#666" strokeWidth="2" />;
        })}
        {/* Exhaust */}
        <ellipse cx="540" cy="224" rx="7" ry="4" fill="#333" stroke="#111" strokeWidth="1" />
      </g>
      <text x="300" y="18" textAnchor="middle" fill="#333" fontSize="14" fontWeight="700">
        {flip ? "RIGHT SIDE" : "LEFT SIDE"}
      </text>
    </svg>
  );
}

/* ─── Panel Component ───────────────────────────────── */
interface ViewPanelProps {
  view: CarView;
  marks: DamageMark[];
  selectedMark: string | null;
  onPanelClick: (view: CarView, x: number, y: number) => void;
  onMarkClick: (id: string, description: string, e: React.MouseEvent) => void;
}

function ViewPanel({ view, marks, selectedMark, onPanelClick, onMarkClick }: ViewPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const viewMarks = marks.filter(m => m.view === view);
  const allMarks = marks;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onPanelClick(view, x, y);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="text-xs font-semibold text-center text-muted-foreground uppercase tracking-wide">
        {VIEW_LABELS[view]}
      </div>
      <div
        ref={ref}
        className="relative w-full bg-gradient-to-b from-slate-50 to-slate-100 border-2 border-slate-200 rounded-xl cursor-crosshair overflow-hidden shadow-inner"
        style={{ aspectRatio: view === "left" || view === "right" ? "600/260" : "400/280" }}
        onClick={handleClick}
      >
        {view === "front" && <FrontCarSVG />}
        {view === "rear" && <RearCarSVG />}
        {view === "left" && <SideCarSVG flip={false} />}
        {view === "right" && <SideCarSVG flip={true} />}

        {viewMarks.map((mark) => {
          const globalIndex = allMarks.findIndex(m => m.id === mark.id) + 1;
          return (
            <div
              key={mark.id}
              className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer text-white font-bold text-[10px] transition-all shadow-md ${
                selectedMark === mark.id
                  ? "bg-red-600 border-red-800 scale-125 ring-2 ring-red-300"
                  : "bg-red-500 border-red-700 hover:scale-110"
              }`}
              style={{ left: `${mark.x}%`, top: `${mark.y}%` }}
              onClick={(e) => { e.stopPropagation(); onMarkClick(mark.id, mark.description, e); }}
            >
              {globalIndex}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main Component ────────────────────────────────── */
export default function CarDamageInspection({ onComplete, onCancel, onBack, contractData }: CarDamageInspectionProps) {
  const [damageMarks, setDamageMarks] = useState<DamageMark[]>([]);
  const [selectedMark, setSelectedMark] = useState<string | null>(null);
  const [markDescription, setMarkDescription] = useState("");
  const [fuelLevel, setFuelLevel] = useState<string>("Full");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePanelClick = (view: CarView, x: number, y: number) => {
    if (selectedMark) {
      setSelectedMark(null);
      setMarkDescription("");
      return;
    }
    const newMark: DamageMark = { id: `mark-${Date.now()}`, x, y, view, description: "" };
    setDamageMarks(prev => [...prev, newMark]);
    setSelectedMark(newMark.id);
    setMarkDescription("");
  };

  const handleMarkClick = (id: string, description: string, e: React.MouseEvent) => {
    setSelectedMark(id);
    setMarkDescription(description);
  };

  const handleSaveDescription = () => {
    if (!selectedMark) return;
    setDamageMarks(prev => prev.map(m => m.id === selectedMark ? { ...m, description: markDescription } : m));
    setSelectedMark(null);
    setMarkDescription("");
  };

  const handleDeleteMark = (id: string) => {
    setDamageMarks(prev => prev.filter(m => m.id !== id));
    if (selectedMark === id) { setSelectedMark(null); setMarkDescription(""); }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try { onComplete(damageMarks, "", fuelLevel); }
    catch { setIsSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      {/* Contract Details */}
      {contractData && (
        <Card className="print:shadow-none">
          <CardHeader>
            <CardTitle className="text-2xl">Rental Contract</CardTitle>
            <p className="text-sm text-gray-600">Contract Date: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3 border-b pb-2">Client Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-sm text-gray-600">Full Name</Label><p className="font-medium">{contractData.clientName}</p></div>
                <div><Label className="text-sm text-gray-600">License Number</Label><p className="font-medium">{contractData.clientLicense}</p></div>
                {contractData.clientPhone && <div><Label className="text-sm text-gray-600">Phone</Label><p className="font-medium">{contractData.clientPhone}</p></div>}
                {contractData.clientAddress && <div><Label className="text-sm text-gray-600">Address</Label><p className="font-medium">{contractData.clientAddress}</p></div>}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3 border-b pb-2">Vehicle Information</h3>
              <div className="grid grid-cols-3 gap-4">
                <div><Label className="text-sm text-gray-600">Plate</Label><p className="font-medium">{contractData.vehiclePlate}</p></div>
                <div><Label className="text-sm text-gray-600">Brand</Label><p className="font-medium">{contractData.vehicleBrand}</p></div>
                <div><Label className="text-sm text-gray-600">Model</Label><p className="font-medium">{contractData.vehicleModel}</p></div>
                {contractData.vehicleColor && <div><Label className="text-sm text-gray-600">Color</Label><p className="font-medium">{contractData.vehicleColor}</p></div>}
                {contractData.vehicleVin && <div className="col-span-2"><Label className="text-sm text-gray-600">VIN</Label><p className="font-medium font-mono">{contractData.vehicleVin}</p></div>}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3 border-b pb-2">Rental Period</h3>
              <div className="grid grid-cols-3 gap-4">
                <div><Label className="text-sm text-gray-600">Start Date</Label><p className="font-medium">{contractData.startDate.toLocaleDateString()}</p></div>
                <div><Label className="text-sm text-gray-600">Return Date</Label><p className="font-medium">{contractData.endDate.toLocaleDateString()}</p></div>
                <div><Label className="text-sm text-gray-600">Rental Days</Label><p className="font-medium">{contractData.rentalDays} days</p></div>
              </div>
            </div>
            {(contractData.insurancePackage || contractData.depositAmount || contractData.fuelPolicy) && (
              <div>
                <h3 className="font-semibold text-lg mb-3 border-b pb-2">Additional Options</h3>
                <div className="space-y-3">
                  {contractData.insurancePackage && contractData.insurancePackage !== "None" && (
                    <div><Label className="text-sm text-gray-600">Insurance Package</Label><p className="font-medium">{contractData.insurancePackage}</p>{contractData.insuranceCost && <p className="text-sm text-gray-500">Total: ${contractData.insuranceCost.toFixed(2)}</p>}</div>
                  )}
                  {contractData.depositAmount && contractData.depositAmount > 0 && (
                    <div><Label className="text-sm text-gray-600">Security Deposit</Label><p className="font-medium">${contractData.depositAmount.toFixed(2)}</p></div>
                  )}
                  {contractData.fuelPolicy && (
                    <div><Label className="text-sm text-gray-600">Fuel Policy</Label><p className="font-medium">{contractData.fuelPolicy}</p></div>
                  )}
                </div>
              </div>
            )}
            <div>
              <h3 className="font-semibold text-lg mb-3 border-b pb-2">Pricing Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between"><Label className="text-sm text-gray-600">Daily Rate</Label><p className="font-medium">${contractData.dailyRate.toFixed(2)}</p></div>
                <div className="flex justify-between"><Label className="text-sm text-gray-600">Total ({contractData.rentalDays} days)</Label><p className="font-medium">${contractData.totalAmount.toFixed(2)}</p></div>
                {contractData.discount > 0 && <div className="flex justify-between"><Label className="text-sm text-gray-600">Discount</Label><p className="font-medium text-green-600">-${contractData.discount.toFixed(2)}</p></div>}
                <div className="flex justify-between border-t pt-2 mt-2"><Label className="text-base font-semibold">Final Amount</Label><p className="text-lg font-bold text-primary">${contractData.finalAmount.toFixed(2)}</p></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4-Panel Vehicle Damage Inspection */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Condition Inspection</CardTitle>
          <p className="text-sm text-muted-foreground">Click on any panel to mark existing damage. Click a marker to add a description.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 2×2 grid of car views */}
          <div className="grid grid-cols-2 gap-4">
            {(["front", "rear", "left", "right"] as CarView[]).map(view => (
              <ViewPanel
                key={view}
                view={view}
                marks={damageMarks}
                selectedMark={selectedMark}
                onPanelClick={handlePanelClick}
                onMarkClick={handleMarkClick}
              />
            ))}
          </div>

          {/* Description editor */}
          {selectedMark && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
              <Label className="text-sm font-medium">
                Describe damage #{damageMarks.findIndex(m => m.id === selectedMark) + 1}
                {" — "}
                <span className="text-muted-foreground capitalize">{damageMarks.find(m => m.id === selectedMark)?.view} view</span>
              </Label>
              <div className="flex gap-2 mt-2">
                <Textarea
                  value={markDescription}
                  onChange={(e) => setMarkDescription(e.target.value)}
                  placeholder="e.g., Small scratch on door, Dent on bumper..."
                  className="flex-1"
                  rows={2}
                />
                <Button type="button" onClick={handleSaveDescription}>Save</Button>
              </div>
            </div>
          )}

          {/* Damage list */}
          {damageMarks.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Marked Damages ({damageMarks.length})</h4>
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {damageMarks.map((mark, index) => (
                  <div key={mark.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border">
                    <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium capitalize">{VIEW_LABELS[mark.view]}</div>
                      {mark.description
                        ? <div className="text-xs text-muted-foreground truncate">{mark.description}</div>
                        : <div className="text-xs text-muted-foreground italic">No description</div>
                      }
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleDeleteMark(mark.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fuel Level */}
      <Card>
        <CardHeader>
          <CardTitle>Fuel Level at Rental Start</CardTitle>
          <p className="text-sm text-gray-600">Select the current fuel level in the vehicle</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {["Empty", "1/4", "1/2", "3/4", "Full"].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFuelLevel(level)}
                  className={`flex-1 py-3 px-2 rounded-lg border-2 text-sm transition-all ${
                    fuelLevel === level
                      ? "border-primary bg-primary/10 font-semibold"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <div className="relative h-10 bg-gray-200 rounded-lg overflow-hidden border-2 border-gray-300">
              <div
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-orange-500 to-green-500 transition-all duration-300"
                style={{ width: fuelLevel === "Empty" ? "0%" : fuelLevel === "1/4" ? "25%" : fuelLevel === "1/2" ? "50%" : fuelLevel === "3/4" ? "75%" : "100%" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-semibold text-gray-700 drop-shadow">{fuelLevel}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signature */}
      <Card>
        <CardHeader>
          <CardTitle>Client Signature</CardTitle>
          <p className="text-sm text-gray-600">This contract will be printed for the client to sign with pen</p>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-gray-300 rounded-lg bg-white p-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Client Signature:</Label>
              <div className="border-b-2 border-gray-400 h-20 relative">
                <span className="absolute bottom-0 left-0 text-xs text-gray-400 italic">Sign here with pen when printed</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Date:</Label>
                <div className="border-b-2 border-gray-400 h-10" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Agent Signature:</Label>
                <div className="border-b-2 border-gray-400 h-10" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        {onBack && (
          <Button type="button" variant="outline" onClick={onBack}>Back</Button>
        )}
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Complete Inspection"}
        </Button>
      </div>
    </div>
  );
}
