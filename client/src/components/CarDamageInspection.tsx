import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

/* ─── Color palette ───────────────────────────────── */
const C = {
  body:    "#b0b8c4",
  bodyDark:"#8a9199",
  panel:   "#c8cfd8",
  glass:   "#a8cce0",
  glassDk: "#7aaec8",
  tire:    "#1e1e1e",
  rim:     "#888",
  rimSpoke:"#aaa",
  light:   "#f5e8a0",
  tail:    "#c0281a",
  tailGlow:"#e84030",
  chrome:  "#ccc",
  grille:  "#1a1c20",
  stripe:  "#9aa2ac",
  outline: "#5a6270",
  shadow:  "rgba(0,0,0,0.12)",
};

/* ─────────────────────────────────────────────────
   FRONT VIEW  — modern sedan, realistic proportions
───────────────────────────────────────────────── */
function FrontSVG() {
  return (
    <svg viewBox="0 0 440 320" xmlns="http://www.w3.org/2000/svg" className="w-full h-full pointer-events-none">
      {/* shadow */}
      <ellipse cx="220" cy="310" rx="170" ry="8" fill={C.shadow}/>

      {/* ── Body ── */}
      {/* Lower body / bumper fascia */}
      <path d="M 68 290 C 68 290 58 272 56 254 C 54 236 62 222 72 214 L 90 206 L 350 206 L 368 214 C 378 222 386 236 384 254 C 382 272 372 290 372 290 Z" fill={C.body} stroke={C.outline} strokeWidth="1.8"/>
      {/* Upper body sides */}
      <path d="M 90 206 L 108 180 L 332 180 L 350 206 Z" fill={C.panel} stroke={C.outline} strokeWidth="1.5"/>
      {/* Roof pillar / A-pillar */}
      <path d="M 108 180 L 124 148 L 316 148 L 332 180 Z" fill={C.panel} stroke={C.outline} strokeWidth="1.5"/>
      {/* Roof */}
      <rect x="124" y="100" width="192" height="50" rx="4" fill={C.panel} stroke={C.outline} strokeWidth="1.5"/>
      {/* Windshield */}
      <path d="M 126 148 L 138 106 L 302 106 L 314 148 Z" fill={C.glass} stroke={C.glassDk} strokeWidth="1.5"/>
      {/* Glass glare */}
      <path d="M 134 144 L 144 110 L 190 110 L 178 144 Z" fill="white" opacity="0.18"/>

      {/* ── Hood / bonnet top edge ── */}
      <line x1="90" y1="206" x2="350" y2="206" stroke={C.stripe} strokeWidth="1"/>
      {/* Hood crease */}
      <line x1="220" y1="148" x2="220" y2="206" stroke={C.bodyDark} strokeWidth="1" strokeDasharray="4,3"/>

      {/* ── Headlight left ── */}
      <path d="M 66 212 L 66 252 L 130 248 L 140 212 Z" fill={C.body} stroke={C.outline} strokeWidth="1.5"/>
      {/* Inner headlight (DRL + main) */}
      <path d="M 70 216 L 70 248 L 128 244 L 136 216 Z" fill={C.light} stroke="#ddd" strokeWidth="1"/>
      {/* DRL line */}
      <rect x="72" y="216" width="60" height="5" rx="2.5" fill="white" opacity="0.8"/>
      {/* Projector circle */}
      <circle cx="100" cy="236" r="13" fill="#fffde8" stroke="#ddd" strokeWidth="1"/>
      <circle cx="100" cy="236" r="8" fill="#fff5c0"/>

      {/* ── Headlight right ── */}
      <path d="M 374 212 L 374 252 L 310 248 L 300 212 Z" fill={C.body} stroke={C.outline} strokeWidth="1.5"/>
      <path d="M 370 216 L 370 248 L 312 244 L 304 216 Z" fill={C.light} stroke="#ddd" strokeWidth="1"/>
      <rect x="308" y="216" width="60" height="5" rx="2.5" fill="white" opacity="0.8"/>
      <circle cx="340" cy="236" r="13" fill="#fffde8" stroke="#ddd" strokeWidth="1"/>
      <circle cx="340" cy="236" r="8" fill="#fff5c0"/>

      {/* ── Grille ── */}
      <path d="M 155 228 C 155 222 165 218 220 218 C 275 218 285 222 285 228 L 285 268 C 285 274 275 278 220 278 C 165 278 155 274 155 268 Z" fill={C.grille} stroke="#111" strokeWidth="1.5"/>
      {/* grille mesh lines */}
      {[167,180,193,206,220,234,247,260,273].map(x=><line key={x} x1={x} y1="220" x2={x} y2="276" stroke="#333" strokeWidth="0.8"/>)}
      {[228,238,248,258,268].map(y=><line key={y} x1="157" y1={y} x2="283" y2={y} stroke="#333" strokeWidth="0.8"/>)}
      {/* hood star / badge */}
      <circle cx="220" cy="216" r="9" fill={C.chrome} stroke="#aaa" strokeWidth="1.5"/>

      {/* ── Front bumper lower ── */}
      <path d="M 62 256 Q 220 278 378 256 L 372 290 Q 220 304 68 290 Z" fill={C.bodyDark} stroke={C.outline} strokeWidth="1.5"/>
      {/* fog lights */}
      <rect x="80" y="264" width="36" height="14" rx="4" fill={C.light} stroke="#ccc" strokeWidth="1"/>
      <rect x="324" y="264" width="36" height="14" rx="4" fill={C.light} stroke="#ccc" strokeWidth="1"/>
      {/* bumper splitter */}
      <rect x="158" y="282" width="124" height="6" rx="2" fill="#999" stroke="#777" strokeWidth="1"/>

      {/* ── Left wheel ── */}
      <ellipse cx="104" cy="290" rx="50" ry="18" fill={C.tire} stroke="#111" strokeWidth="2"/>
      <ellipse cx="104" cy="290" rx="36" ry="13" fill="#2c2c2c"/>
      <ellipse cx="104" cy="290" rx="18" ry="6.5" fill={C.rim} stroke="#999" strokeWidth="1"/>
      {[0,51,103,154,206,257,309].map(d=>{const r=d*Math.PI/180;return <line key={d} x1={104+19*Math.cos(r)} y1={290+6.8*Math.sin(r)} x2={104+35*Math.cos(r)} y2={290+12.7*Math.sin(r)} stroke={C.rimSpoke} strokeWidth="1.8"/>;}) }
      <ellipse cx="104" cy="290" rx="6" ry="2.2" fill="#bbb"/>

      {/* ── Right wheel ── */}
      <ellipse cx="336" cy="290" rx="50" ry="18" fill={C.tire} stroke="#111" strokeWidth="2"/>
      <ellipse cx="336" cy="290" rx="36" ry="13" fill="#2c2c2c"/>
      <ellipse cx="336" cy="290" rx="18" ry="6.5" fill={C.rim} stroke="#999" strokeWidth="1"/>
      {[0,51,103,154,206,257,309].map(d=>{const r=d*Math.PI/180;return <line key={d} x1={336+19*Math.cos(r)} y1={290+6.8*Math.sin(r)} x2={336+35*Math.cos(r)} y2={290+12.7*Math.sin(r)} stroke={C.rimSpoke} strokeWidth="1.8"/>;}) }
      <ellipse cx="336" cy="290" rx="6" ry="2.2" fill="#bbb"/>

      <text x="220" y="20" textAnchor="middle" fill="#3a4450" fontSize="13" fontWeight="700" letterSpacing="2" fontFamily="sans-serif">FRONT</text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────
   REAR VIEW
───────────────────────────────────────────────── */
function RearSVG() {
  return (
    <svg viewBox="0 0 440 320" xmlns="http://www.w3.org/2000/svg" className="w-full h-full pointer-events-none">
      <ellipse cx="220" cy="310" rx="170" ry="8" fill={C.shadow}/>

      {/* Body */}
      <path d="M 68 290 C 68 290 58 272 56 254 C 54 236 62 222 72 214 L 90 206 L 350 206 L 368 214 C 378 222 386 236 384 254 C 382 272 372 290 372 290 Z" fill={C.body} stroke={C.outline} strokeWidth="1.8"/>
      <path d="M 90 206 L 108 180 L 332 180 L 350 206 Z" fill={C.panel} stroke={C.outline} strokeWidth="1.5"/>
      <path d="M 108 180 L 124 148 L 316 148 L 332 180 Z" fill={C.panel} stroke={C.outline} strokeWidth="1.5"/>
      <rect x="124" y="100" width="192" height="50" rx="4" fill={C.panel} stroke={C.outline} strokeWidth="1.5"/>
      {/* Rear windshield */}
      <path d="M 126 148 L 138 106 L 302 106 L 314 148 Z" fill={C.glass} stroke={C.glassDk} strokeWidth="1.5"/>
      <path d="M 250 144 L 260 110 L 302 106 L 314 148 Z" fill="white" opacity="0.14"/>

      {/* Trunk lid crease */}
      <line x1="90" y1="206" x2="350" y2="206" stroke={C.stripe} strokeWidth="1"/>
      <line x1="220" y1="148" x2="220" y2="206" stroke={C.bodyDark} strokeWidth="1" strokeDasharray="4,3"/>

      {/* ── Left taillight ── */}
      <path d="M 64 212 L 64 268 L 132 264 L 142 212 Z" fill={C.tail} stroke="#600" strokeWidth="1.5"/>
      <path d="M 68 215 L 68 264 L 130 261 L 139 215 Z" fill={C.tailGlow} opacity="0.85"/>
      {/* brake strip */}
      <rect x="70" y="215" width="64" height="7" rx="3" fill="#ff7070" opacity="0.9"/>
      {/* reverse light */}
      <rect x="70" y="255" width="20" height="8" rx="2" fill="white" opacity="0.8"/>

      {/* ── Right taillight ── */}
      <path d="M 376 212 L 376 268 L 308 264 L 298 212 Z" fill={C.tail} stroke="#600" strokeWidth="1.5"/>
      <path d="M 372 215 L 372 264 L 310 261 L 301 215 Z" fill={C.tailGlow} opacity="0.85"/>
      <rect x="306" y="215" width="64" height="7" rx="3" fill="#ff7070" opacity="0.9"/>
      <rect x="350" y="255" width="20" height="8" rx="2" fill="white" opacity="0.8"/>

      {/* ── Rear bumper ── */}
      <path d="M 62 268 Q 220 288 378 268 L 372 290 Q 220 306 68 290 Z" fill={C.bodyDark} stroke={C.outline} strokeWidth="1.5"/>
      {/* diffuser */}
      <rect x="148" y="274" width="144" height="12" rx="3" fill={C.grille} stroke="#111" strokeWidth="1"/>
      {[158,170,182,194,206,218,230,242,254,266,278].map(x=><line key={x} x1={x} y1="275" x2={x} y2="285" stroke="#333" strokeWidth="0.8"/>)}
      {/* license plate recess */}
      <rect x="175" y="258" width="90" height="22" rx="3" fill="#eee" stroke="#ccc" strokeWidth="1.5"/>
      <text x="220" y="272" textAnchor="middle" fill="#555" fontSize="8" fontWeight="600" fontFamily="sans-serif">LICENSE PLATE</text>
      {/* exhaust tips */}
      <ellipse cx="174" cy="291" rx="10" ry="5.5" fill="#222" stroke="#111" strokeWidth="1.5"/>
      <ellipse cx="170" cy="291" rx="6" ry="3.5" fill="#444"/>
      <ellipse cx="266" cy="291" rx="10" ry="5.5" fill="#222" stroke="#111" strokeWidth="1.5"/>
      <ellipse cx="262" cy="291" rx="6" ry="3.5" fill="#444"/>

      {/* Wheels */}
      <ellipse cx="104" cy="290" rx="50" ry="18" fill={C.tire} stroke="#111" strokeWidth="2"/>
      <ellipse cx="104" cy="290" rx="36" ry="13" fill="#2c2c2c"/>
      <ellipse cx="104" cy="290" rx="18" ry="6.5" fill={C.rim} stroke="#999" strokeWidth="1"/>
      {[0,51,103,154,206,257,309].map(d=>{const r=d*Math.PI/180;return <line key={d} x1={104+19*Math.cos(r)} y1={290+6.8*Math.sin(r)} x2={104+35*Math.cos(r)} y2={290+12.7*Math.sin(r)} stroke={C.rimSpoke} strokeWidth="1.8"/>;}) }
      <ellipse cx="104" cy="290" rx="6" ry="2.2" fill="#bbb"/>
      <ellipse cx="336" cy="290" rx="50" ry="18" fill={C.tire} stroke="#111" strokeWidth="2"/>
      <ellipse cx="336" cy="290" rx="36" ry="13" fill="#2c2c2c"/>
      <ellipse cx="336" cy="290" rx="18" ry="6.5" fill={C.rim} stroke="#999" strokeWidth="1"/>
      {[0,51,103,154,206,257,309].map(d=>{const r=d*Math.PI/180;return <line key={d} x1={336+19*Math.cos(r)} y1={290+6.8*Math.sin(r)} x2={336+35*Math.cos(r)} y2={290+12.7*Math.sin(r)} stroke={C.rimSpoke} strokeWidth="1.8"/>;}) }
      <ellipse cx="336" cy="290" rx="6" ry="2.2" fill="#bbb"/>

      <text x="220" y="20" textAnchor="middle" fill="#3a4450" fontSize="13" fontWeight="700" letterSpacing="2" fontFamily="sans-serif">REAR</text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────
   SIDE VIEW — proper sedan silhouette
───────────────────────────────────────────────── */
function SideSVG({ side }: { side: "left"|"right" }) {
  const flip = side === "right";
  return (
    <svg viewBox="0 0 760 290" xmlns="http://www.w3.org/2000/svg" className="w-full h-full pointer-events-none">
      <g transform={flip ? "scale(-1,1) translate(-760,0)" : undefined}>

        {/* Ground */}
        <ellipse cx="380" cy="278" rx="330" ry="9" fill={C.shadow}/>

        {/* ── Main body silhouette ──
            Key points tuned for a realistic sedan profile */}
        <path
          d="
            M 50 268
            C 48 268 42 260 40 248 C 38 236 44 224 54 218
            L 72 210 L 96 206 L 118 204
            C 124 200 132 188 144 174
            L 168 152 L 196 132 L 228 116
            L 270 105 L 336 100 L 400 100
            L 448 102 L 484 108 L 510 118
            C 522 126 530 136 534 148
            L 542 164 L 556 178 L 578 192
            L 610 202 L 644 208 L 672 212
            C 692 216 706 228 710 244 C 712 256 706 268 696 268
            Z
          "
          fill={C.body} stroke={C.outline} strokeWidth="2"
        />

        {/* ── Wheel arch cutouts ── */}
        {/* front arch */}
        <path d="M 118 268 A 98 98 0 0 1 314 268 Z" fill="#f0f3f6" stroke={C.outline} strokeWidth="2"/>
        {/* rear arch */}
        <path d="M 486 268 A 98 98 0 0 1 682 268 Z" fill="#f0f3f6" stroke={C.outline} strokeWidth="2"/>

        {/* Redraw body over arches to keep silhouette clean */}
        <path
          d="
            M 50 268 C 48 268 42 260 40 248 C 38 236 44 224 54 218
            L 72 210 L 96 206 L 118 204
            C 124 200 132 188 144 174
            L 168 152 L 196 132 L 228 116
            L 270 105 L 336 100 L 400 100
            L 448 102 L 484 108 L 510 118
            C 522 126 530 136 534 148
            L 542 164 L 556 178 L 578 192
            L 610 202 L 644 208 L 672 212
            C 692 216 706 228 710 244 C 712 256 706 268 696 268
            L 682 268
            A 98 98 0 0 0 486 268
            L 314 268
            A 98 98 0 0 0 118 268
            Z
          "
          fill={C.body} stroke={C.outline} strokeWidth="2"
        />

        {/* ── Belt line (character line) ── */}
        <path d="M 96 206 C 180 196 360 192 540 196 L 578 192 L 610 202" fill="none" stroke={C.stripe} strokeWidth="1.5"/>

        {/* ── Greenhouse (glass area) ── */}
        {/* A-pillar base to roof */}
        <path
          d="M 200 200 L 228 116 L 270 105 L 336 100 L 400 100 L 448 102
             L 484 108 L 510 118 C 522 126 530 136 534 148 L 540 196 Z"
          fill={C.glass} stroke={C.glassDk} strokeWidth="1.5"
        />
        {/* B-pillar */}
        <rect x="336" y="100" width="14" height="96" fill={C.body} stroke={C.outline} strokeWidth="1"/>
        {/* C-pillar */}
        <path d="M 510 118 C 522 126 530 136 534 148 L 540 196 L 510 196 Z" fill={C.body} stroke={C.outline} strokeWidth="1"/>
        {/* Glass glare on front window */}
        <path d="M 204 198 L 228 120 L 260 108 L 248 196 Z" fill="white" opacity="0.15"/>
        {/* Glass glare on rear window */}
        <path d="M 365 100 L 390 100 L 388 170 L 364 170 Z" fill="white" opacity="0.1"/>

        {/* ── Hood ── */}
        <path
          d="M 96 206 L 118 204 C 124 200 132 188 144 174 L 168 152
             L 196 132 L 228 116 L 200 196 Z"
          fill={C.panel} stroke={C.stripe} strokeWidth="1.2"
        />
        {/* Hood crease line */}
        <path d="M 120 202 L 168 155 L 200 132 L 204 194" fill="none" stroke={C.bodyDark} strokeWidth="0.8" strokeDasharray="5,4"/>

        {/* ── Trunk / boot lid ── */}
        <path
          d="M 540 196 L 542 164 L 556 178 L 578 192 L 610 202 L 644 208 L 672 212 L 686 210 L 690 198 L 686 214 L 660 218 L 544 216 Z"
          fill={C.panel} stroke={C.stripe} strokeWidth="1.2"
        />

        {/* ── Rocker sill panel ── */}
        <rect x="118" y="255" width="564" height="13" rx="3" fill={C.bodyDark} stroke={C.outline} strokeWidth="1"/>

        {/* ── Front bumper ── */}
        <path d="M 40 248 C 38 236 44 224 54 218 L 72 210 L 96 206 L 118 204 L 118 268 L 50 268 C 44 268 40 260 40 248 Z" fill={C.bodyDark} stroke={C.outline} strokeWidth="1.8"/>
        {/* headlight strip */}
        <rect x="46" y="216" width="30" height="22" rx="4" fill={C.light} stroke="#ccc" strokeWidth="1.2"/>
        <rect x="48" y="218" width="26" height="7" rx="3" fill="white" opacity="0.7"/>
        <circle cx="59" cy="232" r="7" fill="#fffde0" stroke="#eee" strokeWidth="1"/>
        {/* front fog */}
        <rect x="48" y="254" width="28" height="10" rx="3" fill={C.light} stroke="#ccc" strokeWidth="1"/>

        {/* ── Rear bumper ── */}
        <path d="M 682 268 L 696 268 C 706 268 712 256 710 244 C 708 232 702 218 690 214 L 672 212 L 682 268 Z" fill={C.bodyDark} stroke={C.outline} strokeWidth="1.8"/>
        {/* taillight */}
        <rect x="672" y="214" width="20" height="40" rx="3" fill={C.tail} stroke="#600" strokeWidth="1.2"/>
        <rect x="674" y="216" width="16" height="14" rx="2" fill={C.tailGlow} opacity="0.9"/>
        {/* exhaust */}
        <ellipse cx="670" cy="265" rx="9" ry="5.5" fill="#222" stroke="#111" strokeWidth="1.5"/>
        <ellipse cx="667" cy="265" rx="5.5" ry="3.5" fill="#444"/>

        {/* ── Side mirror ── */}
        <path d="M 196 196 L 180 202 L 178 218 L 196 218 L 198 204 Z" fill={C.panel} stroke={C.outline} strokeWidth="1.5"/>
        {/* Mirror glass */}
        <rect x="180" y="204" width="16" height="12" rx="2" fill={C.glass} stroke={C.glassDk} strokeWidth="1"/>

        {/* door handle 1 */}
        <rect x="268" y="210" width="22" height="7" rx="3.5" fill={C.chrome} stroke="#aaa" strokeWidth="1"/>
        {/* door handle 2 */}
        <rect x="430" y="210" width="22" height="7" rx="3.5" fill={C.chrome} stroke="#aaa" strokeWidth="1"/>

        {/* ── Front wheel ── */}
        <circle cx="216" cy="268" r="56" fill={C.tire} stroke="#111" strokeWidth="2.5"/>
        <circle cx="216" cy="268" r="42" fill="#252525"/>
        <circle cx="216" cy="268" r="24" fill={C.rim} stroke="#999" strokeWidth="1.5"/>
        <circle cx="216" cy="268" r="10" fill="#bbb" stroke="#999" strokeWidth="1"/>
        {[0,51.4,102.9,154.3,205.7,257.1,308.6].map(d=>{const r=d*Math.PI/180;return <line key={d} x1={216+25*Math.cos(r)} y1={268+25*Math.sin(r)} x2={216+41*Math.cos(r)} y2={268+41*Math.sin(r)} stroke={C.rimSpoke} strokeWidth="2.5"/>;}) }
        {/* brake caliper */}
        <path d="M 184 245 A 35 35 0 0 1 210 233" fill="none" stroke="#c0392b" strokeWidth="5" strokeLinecap="round"/>

        {/* ── Rear wheel ── */}
        <circle cx="584" cy="268" r="56" fill={C.tire} stroke="#111" strokeWidth="2.5"/>
        <circle cx="584" cy="268" r="42" fill="#252525"/>
        <circle cx="584" cy="268" r="24" fill={C.rim} stroke="#999" strokeWidth="1.5"/>
        <circle cx="584" cy="268" r="10" fill="#bbb" stroke="#999" strokeWidth="1"/>
        {[0,51.4,102.9,154.3,205.7,257.1,308.6].map(d=>{const r=d*Math.PI/180;return <line key={d} x1={584+25*Math.cos(r)} y1={268+25*Math.sin(r)} x2={584+41*Math.cos(r)} y2={268+41*Math.sin(r)} stroke={C.rimSpoke} strokeWidth="2.5"/>;}) }
        <path d="M 552 245 A 35 35 0 0 1 578 233" fill="none" stroke="#c0392b" strokeWidth="5" strokeLinecap="round"/>

        {/* ── Wheel arch trim ── */}
        <path d="M 118 260 A 96 96 0 0 1 314 260" fill="none" stroke={C.bodyDark} strokeWidth="3"/>
        <path d="M 486 260 A 96 96 0 0 1 682 260" fill="none" stroke={C.bodyDark} strokeWidth="3"/>
      </g>

      <text x="380" y="18" textAnchor="middle" fill="#3a4450" fontSize="13" fontWeight="700" letterSpacing="2" fontFamily="sans-serif">
        {side === "left" ? "LEFT SIDE" : "RIGHT SIDE"}
      </text>
    </svg>
  );
}

/* ─── Panel ─────────────────────────────────────── */
interface ViewPanelProps {
  view: CarView;
  marks: DamageMark[];
  selectedMark: string | null;
  allMarks: DamageMark[];
  onPanelClick: (view: CarView, x: number, y: number) => void;
  onMarkClick: (id: string, description: string) => void;
}

function ViewPanel({ view, marks, selectedMark, allMarks, onPanelClick, onMarkClick }: ViewPanelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isWide = view === "left" || view === "right";

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    onPanelClick(view, ((e.clientX - rect.left) / rect.width) * 100, ((e.clientY - rect.top) / rect.height) * 100);
  };

  return (
    <div
      ref={ref}
      className="relative bg-white border border-slate-200 rounded-xl cursor-crosshair overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      style={{ aspectRatio: isWide ? "760/290" : "440/320" }}
      onClick={handleClick}
    >
      {view === "front" && <FrontSVG />}
      {view === "rear"  && <RearSVG />}
      {view === "left"  && <SideSVG side="left" />}
      {view === "right" && <SideSVG side="right" />}

      {marks.filter(m => m.view === view).map(mark => {
        const idx = allMarks.findIndex(m => m.id === mark.id) + 1;
        return (
          <div
            key={mark.id}
            className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer text-white font-bold text-[10px] transition-all shadow-md ${
              selectedMark === mark.id
                ? "bg-red-600 border-white scale-125 ring-2 ring-red-400"
                : "bg-red-500 border-white hover:scale-110"
            }`}
            style={{ left: `${mark.x}%`, top: `${mark.y}%` }}
            onClick={e => { e.stopPropagation(); onMarkClick(mark.id, mark.description); }}
          >
            {idx}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main Component ────────────────────────────── */
export default function CarDamageInspection({ onComplete, onCancel, onBack, contractData }: CarDamageInspectionProps) {
  const [damageMarks, setDamageMarks] = useState<DamageMark[]>([]);
  const [selectedMark, setSelectedMark] = useState<string | null>(null);
  const [markDescription, setMarkDescription] = useState("");
  const [fuelLevel, setFuelLevel] = useState("Full");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePanelClick = (view: CarView, x: number, y: number) => {
    if (selectedMark) { setSelectedMark(null); setMarkDescription(""); return; }
    const mark: DamageMark = { id: `mark-${Date.now()}`, x, y, view, description: "" };
    setDamageMarks(p => [...p, mark]);
    setSelectedMark(mark.id);
    setMarkDescription("");
  };

  const handleMarkClick = (id: string, description: string) => { setSelectedMark(id); setMarkDescription(description); };
  const handleSave = () => {
    if (!selectedMark) return;
    setDamageMarks(p => p.map(m => m.id === selectedMark ? { ...m, description: markDescription } : m));
    setSelectedMark(null); setMarkDescription("");
  };
  const handleDelete = (id: string) => {
    setDamageMarks(p => p.filter(m => m.id !== id));
    if (selectedMark === id) { setSelectedMark(null); setMarkDescription(""); }
  };
  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try { onComplete(damageMarks, "", fuelLevel); } catch { setIsSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      {contractData && (
        <Card>
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
                <div><Label className="text-sm text-gray-600">Start</Label><p className="font-medium">{contractData.startDate.toLocaleDateString()}</p></div>
                <div><Label className="text-sm text-gray-600">Return</Label><p className="font-medium">{contractData.endDate.toLocaleDateString()}</p></div>
                <div><Label className="text-sm text-gray-600">Days</Label><p className="font-medium">{contractData.rentalDays}</p></div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3 border-b pb-2">Pricing</h3>
              <div className="space-y-2">
                <div className="flex justify-between"><Label className="text-sm text-gray-600">Daily Rate</Label><p className="font-medium">${contractData.dailyRate.toFixed(2)}</p></div>
                <div className="flex justify-between"><Label className="text-sm text-gray-600">Total ({contractData.rentalDays}d)</Label><p className="font-medium">${contractData.totalAmount.toFixed(2)}</p></div>
                {contractData.discount > 0 && <div className="flex justify-between"><Label className="text-sm text-gray-600">Discount</Label><p className="font-medium text-green-600">-${contractData.discount.toFixed(2)}</p></div>}
                <div className="flex justify-between border-t pt-2"><Label className="font-semibold">Final Amount</Label><p className="text-lg font-bold text-primary">${contractData.finalAmount.toFixed(2)}</p></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Vehicle Condition Inspection</CardTitle>
          <p className="text-sm text-muted-foreground">Click on any panel to mark existing damage. Click a marker to add a description.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {(["front","rear"] as CarView[]).map(v => (
              <ViewPanel key={v} view={v} marks={damageMarks} selectedMark={selectedMark}
                allMarks={damageMarks} onPanelClick={handlePanelClick} onMarkClick={handleMarkClick}/>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {(["left","right"] as CarView[]).map(v => (
              <ViewPanel key={v} view={v} marks={damageMarks} selectedMark={selectedMark}
                allMarks={damageMarks} onPanelClick={handlePanelClick} onMarkClick={handleMarkClick}/>
            ))}
          </div>

          {selectedMark && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200">
              <Label className="text-sm font-medium">
                Damage #{damageMarks.findIndex(m => m.id === selectedMark) + 1}
                {" — "}
                <span className="text-muted-foreground">{VIEW_LABELS[damageMarks.find(m => m.id === selectedMark)?.view ?? "front"]}</span>
              </Label>
              <div className="flex gap-2 mt-2">
                <Textarea value={markDescription} onChange={e => setMarkDescription(e.target.value)}
                  placeholder="e.g., Scratch on door panel, dent on bumper…" className="flex-1" rows={2}/>
                <Button type="button" onClick={handleSave}>Save</Button>
              </div>
            </div>
          )}

          {damageMarks.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Marked Damages ({damageMarks.length})</h4>
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {damageMarks.map((mark, i) => (
                  <div key={mark.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border">
                    <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i+1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{VIEW_LABELS[mark.view]}</div>
                      <div className="text-xs text-muted-foreground truncate">{mark.description || <em>No description</em>}</div>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleDelete(mark.id)}>
                      <Trash2 className="h-4 w-4 text-red-500"/>
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fuel Level at Rental Start</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            {["Empty","1/4","1/2","3/4","Full"].map(l => (
              <button key={l} type="button" onClick={() => setFuelLevel(l)}
                className={`flex-1 py-3 px-2 rounded-lg border-2 text-sm transition-all ${fuelLevel===l?"border-primary bg-primary/10 font-semibold":"border-gray-300 hover:border-gray-400"}`}>
                {l}
              </button>
            ))}
          </div>
          <div className="relative h-10 bg-gray-200 rounded-lg overflow-hidden border-2 border-gray-300">
            <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-orange-500 to-green-500 transition-all duration-300"
              style={{width: fuelLevel==="Empty"?"0%":fuelLevel==="1/4"?"25%":fuelLevel==="1/2"?"50%":fuelLevel==="3/4"?"75%":"100%"}}/>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-semibold text-gray-700 drop-shadow">{fuelLevel}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Client Signature</CardTitle></CardHeader>
        <CardContent>
          <div className="border-2 border-gray-300 rounded-lg bg-white p-8 space-y-6">
            <div className="space-y-2">
              <Label>Client Signature:</Label>
              <div className="border-b-2 border-gray-400 h-20 relative">
                <span className="absolute bottom-0 left-0 text-xs text-gray-400 italic">Sign here with pen when printed</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Date:</Label><div className="border-b-2 border-gray-400 h-10"/></div>
              <div className="space-y-2"><Label>Agent Signature:</Label><div className="border-b-2 border-gray-400 h-10"/></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        {onBack && <Button type="button" variant="outline" onClick={onBack}>Back</Button>}
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Complete Inspection"}
        </Button>
      </div>
    </div>
  );
}
