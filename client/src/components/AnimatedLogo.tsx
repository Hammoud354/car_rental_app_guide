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
      <div className="flex items-baseline gap-0">
        <span className={`${s.fleet} font-extrabold tracking-tight ${fleetColor}`}>
          Fleet
        </span>
        <span className={`${s.wizards} font-extrabold tracking-tight ${wizardsColor}`}>
          Wizards
        </span>
      </div>
      {showSubtext && (
        <span className={`${s.sub} font-semibold uppercase tracking-[0.2em] ${subColor} -mt-0.5`}>
          Rental Management
        </span>
      )}
    </div>
  );
}
