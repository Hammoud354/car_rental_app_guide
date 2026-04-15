interface AnimatedLogoProps {
  size?: "sm" | "md" | "lg";
  darkBg?: boolean;
  showSubtext?: boolean;
}

export function AnimatedLogo({ size = "md", darkBg = false, showSubtext = false }: AnimatedLogoProps) {
  const sizeStyles = {
    sm: { fleet: "text-lg", wizards: "text-lg", sub: "text-[8px]" },
    md: { fleet: "text-xl", wizards: "text-xl", sub: "text-[9px]" },
    lg: { fleet: "text-2xl", wizards: "text-2xl", sub: "text-[10px]" },
  };

  const s = sizeStyles[size];
  const fleetColor = darkBg ? "text-white" : "text-gray-900";
  const wizardsColor = darkBg ? "text-blue-400" : "text-blue-600";
  const subColor = darkBg ? "text-blue-300/60" : "text-gray-400";

  return (
    <div className="flex flex-col">
      <style>{`
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(8px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slide-left {
          animation: slideInLeft 0.4s ease-out forwards;
        }
        .animate-slide-right {
          animation: slideInRight 0.4s ease-out 0.15s forwards;
          opacity: 0;
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out 0.35s forwards;
          opacity: 0;
        }
      `}</style>
      <div className="flex items-baseline gap-0">
        <span className={`${s.fleet} font-extrabold tracking-tight ${fleetColor} animate-slide-left`}>
          Fleet
        </span>
        <span className={`${s.wizards} font-extrabold tracking-tight ${wizardsColor} animate-slide-right`}>
          Wizards
        </span>
      </div>
      {showSubtext && (
        <span className={`${s.sub} font-semibold uppercase tracking-[0.2em] ${subColor} -mt-0.5 animate-fade-in`}>
          Rental Management
        </span>
      )}
    </div>
  );
}
