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

/* ─────────────────────────────────────────────────────
   SVG DRAWINGS — clean modern sedan
───────────────────────────────────────────────────── */

function FrontSVG() {
  return (
    <svg viewBox="0 0 500 340" className="w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e2e6ea" />
          <stop offset="60%" stopColor="#c8cdd4" />
          <stop offset="100%" stopColor="#b0b6be" />
        </linearGradient>
        <linearGradient id="fGlass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d0eaf8" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#89bfe0" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="fHL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fffbe6" />
          <stop offset="100%" stopColor="#ffe680" />
        </linearGradient>
        <linearGradient id="fWheel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a3a3a" />
          <stop offset="100%" stopColor="#111" />
        </linearGradient>
        <radialGradient id="fWheelFace" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#555" />
          <stop offset="70%" stopColor="#2a2a2a" />
          <stop offset="100%" stopColor="#111" />
        </radialGradient>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.18" />
        </filter>
      </defs>

      {/* Ground shadow */}
      <ellipse cx="250" cy="316" rx="185" ry="10" fill="#0002" />

      {/* Main body */}
      <path
        d="M 95 305
           L 82 270 L 78 235 L 82 210
           L 95 195 L 115 185 L 140 178
           L 170 168 L 185 148 L 200 132
           L 250 128 L 300 132 L 315 148
           L 330 168 L 360 178 L 385 185
           L 405 195 L 418 210 L 422 235
           L 418 270 L 405 305 Z"
        fill="url(#fBody)" stroke="#8a9099" strokeWidth="2" filter="url(#shadow)"
      />
      {/* Roof / upper cabin taper */}
      <path
        d="M 186 148 L 200 120 L 250 112 L 300 120 L 314 148
           L 295 145 L 250 142 L 205 145 Z"
        fill="#d0d5da" stroke="#8a9099" strokeWidth="1.5"
      />
      {/* Windshield */}
      <path
        d="M 190 146 L 204 120 L 250 113 L 296 120 L 310 146
           L 290 144 L 250 141 L 210 144 Z"
        fill="url(#fGlass)" stroke="#6a8fa8" strokeWidth="1.5"
      />

      {/* Hood panel */}
      <path
        d="M 115 185 L 140 178 L 170 168 L 185 148
           L 205 145 L 250 142 L 295 145 L 315 148
           L 330 168 L 360 178 L 385 185
           L 405 195 L 250 198 Z"
        fill="#cdd1d7" stroke="#9aa0a8" strokeWidth="1.5"
      />
      {/* Hood center crease */}
      <line x1="250" y1="142" x2="250" y2="198" stroke="#b0b5bc" strokeWidth="1" strokeDasharray="5,4" />

      {/* Left headlight assembly */}
      <path d="M 98 222 L 98 248 L 158 245 L 168 222 Z" fill="#ddd" stroke="#8a9099" strokeWidth="1.5" />
      <path d="M 102 225 L 102 244 L 155 242 L 163 225 Z" fill="url(#fHL)" opacity="0.9" />
      {/* DRL strip left */}
      <rect x="104" y="225" width="57" height="5" rx="2" fill="#fff" opacity="0.7" />
      {/* Left fog light */}
      <ellipse cx="118" cy="272" rx="16" ry="8" fill="#fffde0" stroke="#ccc" strokeWidth="1" />

      {/* Right headlight assembly */}
      <path d="M 402 222 L 402 248 L 342 245 L 332 222 Z" fill="#ddd" stroke="#8a9099" strokeWidth="1.5" />
      <path d="M 398 225 L 398 244 L 345 242 L 337 225 Z" fill="url(#fHL)" opacity="0.9" />
      {/* DRL strip right */}
      <rect x="339" y="225" width="57" height="5" rx="2" fill="#fff" opacity="0.7" />
      {/* Right fog light */}
      <ellipse cx="382" cy="272" rx="16" ry="8" fill="#fffde0" stroke="#ccc" strokeWidth="1" />

      {/* Bumper lower */}
      <path d="M 85 268 Q 250 290 415 268 L 410 305 Q 250 315 90 305 Z"
        fill="#bec3ca" stroke="#8a9099" strokeWidth="1.5" />

      {/* Grille surround */}
      <rect x="180" y="238" width="140" height="38" rx="8" fill="#2a2d32" stroke="#1a1c20" strokeWidth="1.5" />
      {/* Grille mesh */}
      {[188, 198, 208, 218, 228, 238, 248, 258, 268, 278, 288, 298, 308].map(x => (
        <line key={x} x1={x} y1="240" x2={x} y2="274" stroke="#3d4148" strokeWidth="0.8" />
      ))}
      {[244, 252, 260, 268].map(y => (
        <line key={y} x1="182" y1={y} x2="318" y2={y} stroke="#3d4148" strokeWidth="0.8" />
      ))}
      {/* Badge / emblem */}
      <circle cx="250" cy="234" r="10" fill="#ddd" stroke="#aaa" strokeWidth="1.5" />
      <circle cx="250" cy="234" r="7" fill="#bbb" stroke="#999" strokeWidth="1" />

      {/* Left wheel */}
      <ellipse cx="118" cy="305" rx="46" ry="18" fill="url(#fWheel)" stroke="#111" strokeWidth="2" />
      <ellipse cx="118" cy="305" rx="33" ry="12" fill="url(#fWheelFace)" />
      <ellipse cx="118" cy="305" rx="14" ry="5" fill="#666" />
      {[0,60,120,180,240,300].map(d=>{const r=d*Math.PI/180;return <line key={d} x1={118+15*Math.cos(r)} y1={305+6*Math.sin(r)} x2={118+32*Math.cos(r)} y2={305+12*Math.sin(r)} stroke="#777" strokeWidth="2"/>;}) }

      {/* Right wheel */}
      <ellipse cx="382" cy="305" rx="46" ry="18" fill="url(#fWheel)" stroke="#111" strokeWidth="2" />
      <ellipse cx="382" cy="305" rx="33" ry="12" fill="url(#fWheelFace)" />
      <ellipse cx="382" cy="305" rx="14" ry="5" fill="#666" />
      {[0,60,120,180,240,300].map(d=>{const r=d*Math.PI/180;return <line key={d} x1={382+15*Math.cos(r)} y1={305+6*Math.sin(r)} x2={382+32*Math.cos(r)} y2={305+12*Math.sin(r)} stroke="#777" strokeWidth="2"/>;}) }

      {/* Label */}
      <text x="250" y="22" textAnchor="middle" fill="#444" fontSize="16" fontWeight="700" fontFamily="sans-serif">FRONT</text>
    </svg>
  );
}

function RearSVG() {
  return (
    <svg viewBox="0 0 500 340" className="w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e2e6ea" />
          <stop offset="60%" stopColor="#c8cdd4" />
          <stop offset="100%" stopColor="#b0b6be" />
        </linearGradient>
        <linearGradient id="rGlass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d0eaf8" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#89bfe0" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="rTL" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#dd1111" />
          <stop offset="100%" stopColor="#ff3333" />
        </linearGradient>
        <filter id="rshadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.18" />
        </filter>
      </defs>

      <ellipse cx="250" cy="316" rx="185" ry="10" fill="#0002" />

      {/* Main body */}
      <path
        d="M 95 305 L 82 270 L 78 235 L 82 210
           L 95 195 L 115 185 L 140 178
           L 170 168 L 185 148 L 200 132
           L 250 128 L 300 132 L 315 148
           L 330 168 L 360 178 L 385 185
           L 405 195 L 418 210 L 422 235
           L 418 270 L 405 305 Z"
        fill="url(#rBody)" stroke="#8a9099" strokeWidth="2" filter="url(#rshadow)"
      />
      {/* Roof */}
      <path
        d="M 186 148 L 200 120 L 250 112 L 300 120 L 314 148
           L 295 145 L 250 142 L 205 145 Z"
        fill="#d0d5da" stroke="#8a9099" strokeWidth="1.5"
      />
      {/* Rear windshield */}
      <path
        d="M 190 146 L 204 120 L 250 113 L 296 120 L 310 146
           L 290 144 L 250 141 L 210 144 Z"
        fill="url(#rGlass)" stroke="#6a8fa8" strokeWidth="1.5"
      />

      {/* Trunk lid */}
      <path
        d="M 175 148 L 185 148 L 205 145 L 250 142 L 295 145
           L 315 148 L 325 168 L 360 178
           L 385 185 L 400 192 L 250 196 L 100 192
           L 115 185 L 140 178 L 175 168 Z"
        fill="#cdd1d7" stroke="#9aa0a8" strokeWidth="1.5"
      />
      <line x1="250" y1="142" x2="250" y2="196" stroke="#b0b5bc" strokeWidth="1" strokeDasharray="5,4" />

      {/* Left taillight — wide slim */}
      <path d="M 82 210 L 82 265 L 130 262 L 140 210 Z" fill="#c01010" stroke="#800000" strokeWidth="1.5" />
      <path d="M 87 214 L 87 260 L 127 258 L 136 214 Z" fill="url(#rTL)" opacity="0.85" />
      {/* Brake inner strip */}
      <rect x="89" y="216" width="44" height="6" rx="2" fill="#ff6666" opacity="0.8" />

      {/* Right taillight — wide slim */}
      <path d="M 418 210 L 418 265 L 370 262 L 360 210 Z" fill="#c01010" stroke="#800000" strokeWidth="1.5" />
      <path d="M 413 214 L 413 260 L 373 258 L 364 214 Z" fill="url(#rTL)" opacity="0.85" />
      <rect x="367" y="216" width="44" height="6" rx="2" fill="#ff6666" opacity="0.8" />

      {/* Bumper */}
      <path d="M 85 268 Q 250 290 415 268 L 410 305 Q 250 315 90 305 Z"
        fill="#bec3ca" stroke="#8a9099" strokeWidth="1.5" />

      {/* Diffuser */}
      <rect x="180" y="278" width="140" height="18" rx="4" fill="#2a2d32" stroke="#1a1c20" strokeWidth="1" />
      {[188,200,212,224,236,248,260,272,284,296,308].map(x=>(
        <line key={x} x1={x} y1="279" x2={x} y2="295" stroke="#3d4148" strokeWidth="0.8"/>
      ))}

      {/* License plate */}
      <rect x="205" y="258" width="90" height="22" rx="3" fill="#f5f5dc" stroke="#aaa" strokeWidth="1.5" />
      <text x="250" y="273" textAnchor="middle" fill="#333" fontSize="9" fontWeight="600" fontFamily="sans-serif">LICENSE PLATE</text>

      {/* Exhaust */}
      <ellipse cx="185" cy="302" rx="9" ry="5" fill="#333" stroke="#1a1a1a" strokeWidth="1.5" />
      <ellipse cx="315" cy="302" rx="9" ry="5" fill="#333" stroke="#1a1a1a" strokeWidth="1.5" />

      {/* Left wheel */}
      <ellipse cx="118" cy="305" rx="46" ry="18" fill="#222" stroke="#111" strokeWidth="2" />
      <ellipse cx="118" cy="305" rx="33" ry="12" fill="#333" />
      <ellipse cx="118" cy="305" rx="14" ry="5" fill="#555" />
      {[0,60,120,180,240,300].map(d=>{const r=d*Math.PI/180;return <line key={d} x1={118+15*Math.cos(r)} y1={305+6*Math.sin(r)} x2={118+32*Math.cos(r)} y2={305+12*Math.sin(r)} stroke="#666" strokeWidth="2"/>;}) }

      {/* Right wheel */}
      <ellipse cx="382" cy="305" rx="46" ry="18" fill="#222" stroke="#111" strokeWidth="2" />
      <ellipse cx="382" cy="305" rx="33" ry="12" fill="#333" />
      <ellipse cx="382" cy="305" rx="14" ry="5" fill="#555" />
      {[0,60,120,180,240,300].map(d=>{const r=d*Math.PI/180;return <line key={d} x1={382+15*Math.cos(r)} y1={305+6*Math.sin(r)} x2={382+32*Math.cos(r)} y2={305+12*Math.sin(r)} stroke="#666" strokeWidth="2"/>;}) }

      <text x="250" y="22" textAnchor="middle" fill="#444" fontSize="16" fontWeight="700" fontFamily="sans-serif">REAR</text>
    </svg>
  );
}

function SideSVG({ label }: { label: string }) {
  const flip = label === "RIGHT SIDE";
  const sx = flip ? -1 : 1;
  const tx = flip ? -700 : 0;
  return (
    <svg viewBox="0 0 700 300" className="w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`sBody${label}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e2e6ea" />
          <stop offset="55%" stopColor="#c9cdd4" />
          <stop offset="100%" stopColor="#adb3bc" />
        </linearGradient>
        <linearGradient id={`sGlass${label}`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#cce8f8" stopOpacity="0.92" />
          <stop offset="100%" stopColor="#7ab8dc" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id={`sWh${label}`} cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#444" />
          <stop offset="100%" stopColor="#111" />
        </linearGradient>
        <filter id={`ss${label}`}>
          <feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Ground line */}
      <rect x="30" y="262" width="640" height="4" rx="2" fill="#ccc" />
      {/* Ground shadow */}
      <ellipse cx="350" cy="268" rx="290" ry="8" fill="#0001" />

      <g transform={`scale(${sx},1) translate(${tx},0)`}>
        {/* ── Body silhouette – modern sedan ── */}
        <path
          d="M 68 262
             C 68 262 55 258 52 245 C 50 232 55 218 62 210
             C 68 202 80 198 95 196
             L 110 188 L 130 180 L 160 174
             L 190 166 L 215 148 L 230 126
             L 255 108 L 310 98 L 380 96
             L 430 98 L 470 106 L 500 118
             L 525 135 L 545 155 L 562 172
             L 580 184 L 600 192 L 620 200
             L 638 212 C 645 220 648 232 646 246
             C 644 256 638 262 630 262 Z"
          fill={`url(#sBody${label})`} stroke="#8a9099" strokeWidth="2.5" filter={`url(#ss${label})`}
        />

        {/* ── Roof ── */}
        <path
          d="M 228 126 L 255 105 L 310 95 L 380 93 L 430 95
             L 470 105 L 500 118 L 525 135 L 545 158
             L 490 152 L 430 148 L 380 147 L 310 147
             L 260 149 L 232 153 Z"
          fill="#d2d6db" stroke="#8a9099" strokeWidth="1.5"
        />
        {/* Roof highlight strip */}
        <path d="M 240 120 C 300 108 420 108 510 125 C 440 118 310 118 240 120 Z" fill="#e8eaec" opacity="0.6" />

        {/* ── Windshield ── */}
        <path
          d="M 232 153 L 260 149 L 310 147 L 230 127 L 215 148 Z"
          fill={`url(#sGlass${label})`} stroke="#6a8fa8" strokeWidth="1.5"
        />
        {/* Windshield glare */}
        <path d="M 234 151 L 257 148 L 252 134 L 230 133 Z" fill="#e0f3ff" opacity="0.4" />

        {/* ── Rear window ── */}
        <path
          d="M 490 152 L 545 158 L 525 135 L 500 118 L 470 105 L 430 95 L 430 148 Z"
          fill={`url(#sGlass${label})`} stroke="#6a8fa8" strokeWidth="1.5"
        />

        {/* ── Door 1 (front) ── */}
        <path
          d="M 260 149 L 310 147 L 310 230 L 258 232 Z"
          fill="none" stroke="#9aa0a8" strokeWidth="1.5"
        />
        {/* Door 1 window */}
        <path d="M 263 151 L 308 149 L 308 185 L 261 187 Z" fill={`url(#sGlass${label})`} stroke="#6a8fa8" strokeWidth="1" opacity="0.7" />
        {/* Door handle 1 */}
        <rect x="285" y="212" width="20" height="6" rx="3" fill="#aaa" stroke="#888" strokeWidth="1" />

        {/* ── Door 2 (rear) ── */}
        <path
          d="M 312 147 L 430 148 L 430 230 L 312 230 Z"
          fill="none" stroke="#9aa0a8" strokeWidth="1.5"
        />
        {/* Door 2 window */}
        <path d="M 314 149 L 428 150 L 428 186 L 314 185 Z" fill={`url(#sGlass${label})`} stroke="#6a8fa8" strokeWidth="1" opacity="0.7" />
        {/* Door handle 2 */}
        <rect x="358" y="212" width="20" height="6" rx="3" fill="#aaa" stroke="#888" strokeWidth="1" />

        {/* ── Hood ── */}
        <path
          d="M 95 196 L 110 188 L 130 180 L 160 174 L 190 166
             L 215 148 L 232 153 L 260 149 L 258 232
             L 112 232 C 90 228 78 215 68 202 Z"
          fill="#ccd0d6" stroke="#9aa0a8" strokeWidth="1.5"
        />
        {/* Hood highlight */}
        <path d="M 180 172 C 200 162 220 155 258 151 L 255 156 C 220 160 196 168 178 178 Z" fill="#dde0e4" opacity="0.5" />

        {/* ── Trunk / boot ── */}
        <path
          d="M 430 148 L 490 152 L 545 158 L 562 172
             L 580 184 L 600 192 L 620 200
             L 638 212 L 636 230 L 432 230 Z"
          fill="#ccd0d6" stroke="#9aa0a8" strokeWidth="1.5"
        />

        {/* ── Rocker / sill ── */}
        <rect x="112" y="230" width="520" height="12" rx="3" fill="#b8bdc4" stroke="#8a9099" strokeWidth="1" />

        {/* ── Front bumper ── */}
        <path d="M 52 244 C 52 244 60 228 75 224 L 95 224 L 112 230 L 112 262 L 60 262 C 55 258 52 252 52 244 Z"
          fill="#bec3ca" stroke="#8a9099" strokeWidth="1.5" />
        {/* Front light bar */}
        <rect x="62" y="224" width="26" height="14" rx="3" fill="#fffbe6" stroke="#ccc" strokeWidth="1" />
        <rect x="64" y="226" width="22" height="5" rx="1.5" fill="#fff" opacity="0.7" />

        {/* ── Rear bumper ── */}
        <path d="M 638 212 C 645 220 648 232 646 246 C 644 256 638 262 630 262 L 584 262 L 584 230 L 620 228 L 635 214 Z"
          fill="#bec3ca" stroke="#8a9099" strokeWidth="1.5" />
        {/* Taillight */}
        <rect x="612" y="220" width="24" height="30" rx="3" fill="#c00" stroke="#800" strokeWidth="1.5" />
        <rect x="614" y="222" width="20" height="12" rx="2" fill="#ff3333" opacity="0.85" />
        {/* Exhaust */}
        <ellipse cx="600" cy="260" rx="8" ry="5" fill="#2a2a2a" stroke="#111" strokeWidth="1.5" />

        {/* ── Side mirror ── */}
        <path d="M 220 170 L 205 178 L 205 192 L 222 192 L 225 178 Z" fill="#aab0b8" stroke="#888" strokeWidth="1.5" />

        {/* ── Front wheel ── */}
        <circle cx="168" cy="262" r="48" fill="#111" stroke="#0d0d0d" strokeWidth="3" />
        <circle cx="168" cy="262" r="36" fill="#2a2a2a" />
        <circle cx="168" cy="262" r="20" fill="#444" />
        <circle cx="168" cy="262" r="8" fill="#555" />
        {[0,51.4,102.9,154.3,205.7,257.1,308.6].map(d=>{const r=d*Math.PI/180; return <line key={d} x1={168+21*Math.cos(r)} y1={262+21*Math.sin(r)} x2={168+35*Math.cos(r)} y2={262+35*Math.sin(r)} stroke="#666" strokeWidth="2.5"/>;})}

        {/* ── Rear wheel ── */}
        <circle cx="530" cy="262" r="48" fill="#111" stroke="#0d0d0d" strokeWidth="3" />
        <circle cx="530" cy="262" r="36" fill="#2a2a2a" />
        <circle cx="530" cy="262" r="20" fill="#444" />
        <circle cx="530" cy="262" r="8" fill="#555" />
        {[0,51.4,102.9,154.3,205.7,257.1,308.6].map(d=>{const r=d*Math.PI/180; return <line key={d} x1={530+21*Math.cos(r)} y1={262+21*Math.sin(r)} x2={530+35*Math.cos(r)} y2={262+35*Math.sin(r)} stroke="#666" strokeWidth="2.5"/>;})}
      </g>

      <text x="350" y="22" textAnchor="middle" fill="#444" fontSize="15" fontWeight="700" fontFamily="sans-serif">{label}</text>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────
   Panel + Main Component (unchanged logic)
───────────────────────────────────────────────────── */

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
  const viewMarks = marks.filter(m => m.view === view);
  const isWide = view === "left" || view === "right";

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onPanelClick(view, x, y);
  };

  return (
    <div
      ref={ref}
      className="relative bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-200 rounded-xl cursor-crosshair overflow-hidden shadow-sm hover:shadow-md transition-shadow"
      style={{ aspectRatio: isWide ? "700/300" : "500/340" }}
      onClick={handleClick}
    >
      {view === "front" && <FrontSVG />}
      {view === "rear" && <RearSVG />}
      {view === "left" && <SideSVG label="LEFT SIDE" />}
      {view === "right" && <SideSVG label="RIGHT SIDE" />}

      {viewMarks.map((mark) => {
        const globalIndex = allMarks.findIndex(m => m.id === mark.id) + 1;
        return (
          <div
            key={mark.id}
            className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer text-white font-bold text-[10px] transition-all shadow-lg ${
              selectedMark === mark.id
                ? "bg-red-600 border-red-800 scale-125 ring-2 ring-red-300"
                : "bg-red-500 border-red-700 hover:scale-110"
            }`}
            style={{ left: `${mark.x}%`, top: `${mark.y}%` }}
            onClick={(e) => { e.stopPropagation(); onMarkClick(mark.id, mark.description); }}
          >
            {globalIndex}
          </div>
        );
      })}
    </div>
  );
}

export default function CarDamageInspection({ onComplete, onCancel, onBack, contractData }: CarDamageInspectionProps) {
  const [damageMarks, setDamageMarks] = useState<DamageMark[]>([]);
  const [selectedMark, setSelectedMark] = useState<string | null>(null);
  const [markDescription, setMarkDescription] = useState("");
  const [fuelLevel, setFuelLevel] = useState<string>("Full");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePanelClick = (view: CarView, x: number, y: number) => {
    if (selectedMark) { setSelectedMark(null); setMarkDescription(""); return; }
    const newMark: DamageMark = { id: `mark-${Date.now()}`, x, y, view, description: "" };
    setDamageMarks(prev => [...prev, newMark]);
    setSelectedMark(newMark.id);
    setMarkDescription("");
  };

  const handleMarkClick = (id: string, description: string) => {
    setSelectedMark(id);
    setMarkDescription(description);
  };

  const handleSaveDescription = () => {
    if (!selectedMark) return;
    setDamageMarks(prev => prev.map(m => m.id === selectedMark ? { ...m, description: markDescription } : m));
    setSelectedMark(null); setMarkDescription("");
  };

  const handleDeleteMark = (id: string) => {
    setDamageMarks(prev => prev.filter(m => m.id !== id));
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
            {(contractData.insurancePackage && contractData.insurancePackage !== "None") || (contractData.depositAmount && contractData.depositAmount > 0) || contractData.fuelPolicy ? (
              <div>
                <h3 className="font-semibold text-lg mb-3 border-b pb-2">Additional Options</h3>
                <div className="space-y-3">
                  {contractData.insurancePackage && contractData.insurancePackage !== "None" && (
                    <div><Label className="text-sm text-gray-600">Insurance</Label><p className="font-medium">{contractData.insurancePackage}{contractData.insuranceCost ? ` — $${contractData.insuranceCost.toFixed(2)}` : ""}</p></div>
                  )}
                  {contractData.depositAmount && contractData.depositAmount > 0 ? (
                    <div><Label className="text-sm text-gray-600">Security Deposit</Label><p className="font-medium">${contractData.depositAmount.toFixed(2)}</p></div>
                  ) : null}
                  {contractData.fuelPolicy && <div><Label className="text-sm text-gray-600">Fuel Policy</Label><p className="font-medium">{contractData.fuelPolicy}</p></div>}
                </div>
              </div>
            ) : null}
            <div>
              <h3 className="font-semibold text-lg mb-3 border-b pb-2">Pricing</h3>
              <div className="space-y-2">
                <div className="flex justify-between"><Label className="text-sm text-gray-600">Daily Rate</Label><p className="font-medium">${contractData.dailyRate.toFixed(2)}</p></div>
                <div className="flex justify-between"><Label className="text-sm text-gray-600">Total ({contractData.rentalDays} days)</Label><p className="font-medium">${contractData.totalAmount.toFixed(2)}</p></div>
                {contractData.discount > 0 && <div className="flex justify-between"><Label className="text-sm text-gray-600">Discount</Label><p className="font-medium text-green-600">-${contractData.discount.toFixed(2)}</p></div>}
                <div className="flex justify-between border-t pt-2"><Label className="font-semibold">Final Amount</Label><p className="text-lg font-bold text-primary">${contractData.finalAmount.toFixed(2)}</p></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 4-panel inspection */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Condition Inspection</CardTitle>
          <p className="text-sm text-muted-foreground">Click on any panel to mark existing damage. Click a marker to edit its description.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Top row: Front / Rear */}
          <div className="grid grid-cols-2 gap-4">
            {(["front", "rear"] as CarView[]).map(view => (
              <ViewPanel key={view} view={view} marks={damageMarks} selectedMark={selectedMark}
                allMarks={damageMarks} onPanelClick={handlePanelClick} onMarkClick={handleMarkClick} />
            ))}
          </div>
          {/* Bottom row: Left Side / Right Side (wider aspect) */}
          <div className="grid grid-cols-2 gap-4">
            {(["left", "right"] as CarView[]).map(view => (
              <ViewPanel key={view} view={view} marks={damageMarks} selectedMark={selectedMark}
                allMarks={damageMarks} onPanelClick={handlePanelClick} onMarkClick={handleMarkClick} />
            ))}
          </div>

          {/* Description editor */}
          {selectedMark && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800">
              <Label className="text-sm font-medium">
                Damage #{damageMarks.findIndex(m => m.id === selectedMark) + 1}
                {" — "}
                <span className="text-muted-foreground">{VIEW_LABELS[damageMarks.find(m => m.id === selectedMark)?.view ?? "front"]}</span>
              </Label>
              <div className="flex gap-2 mt-2">
                <Textarea value={markDescription} onChange={(e) => setMarkDescription(e.target.value)}
                  placeholder="e.g., Scratch on door panel, dent on bumper..." className="flex-1" rows={2} />
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
                    <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{index + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{VIEW_LABELS[mark.view]}</div>
                      {mark.description
                        ? <div className="text-xs text-muted-foreground truncate">{mark.description}</div>
                        : <div className="text-xs text-muted-foreground italic">No description added</div>}
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
          <p className="text-sm text-gray-600">Select the current fuel level</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            {["Empty", "1/4", "1/2", "3/4", "Full"].map((level) => (
              <button key={level} type="button" onClick={() => setFuelLevel(level)}
                className={`flex-1 py-3 px-2 rounded-lg border-2 text-sm transition-all ${fuelLevel === level ? "border-primary bg-primary/10 font-semibold" : "border-gray-300 hover:border-gray-400"}`}>
                {level}
              </button>
            ))}
          </div>
          <div className="relative h-10 bg-gray-200 rounded-lg overflow-hidden border-2 border-gray-300">
            <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-orange-500 to-green-500 transition-all duration-300"
              style={{ width: fuelLevel === "Empty" ? "0%" : fuelLevel === "1/4" ? "25%" : fuelLevel === "1/2" ? "50%" : fuelLevel === "3/4" ? "75%" : "100%" }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-semibold text-gray-700 drop-shadow">{fuelLevel}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Signature */}
      <Card>
        <CardHeader>
          <CardTitle>Client Signature</CardTitle>
          <p className="text-sm text-gray-600">This contract will be printed for the client to sign</p>
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
              <div className="space-y-2"><Label className="text-sm font-medium">Date:</Label><div className="border-b-2 border-gray-400 h-10" /></div>
              <div className="space-y-2"><Label className="text-sm font-medium">Agent Signature:</Label><div className="border-b-2 border-gray-400 h-10" /></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        {onBack && <Button type="button" variant="outline" onClick={onBack}>Back</Button>}
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Complete Inspection"}
        </Button>
      </div>
    </div>
  );
}
