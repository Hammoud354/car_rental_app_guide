import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "wouter";

interface BreadcrumbItem {
  label: string;
  href: string;
}

export default function Breadcrumb() {
  const [location] = useLocation();

  // Route mapping for breadcrumb labels
  const routeLabels: Record<string, string> = {
    "/": "Home",
    "/dashboard": "Dashboard",
    "/fleet": "Fleet",
    "/fleet-management": "Fleet Management",
    "/rental-contracts": "Rental Contracts",
    "/reservations": "Reservations",
    "/maintenance": "Maintenance",
    "/clients": "Clients",
    "/analysis": "Analysis",
    "/booking": "Booking",
    "/operations": "Operations",
    "/compliance": "Compliance",
    "/settings": "Settings",
    "/profitability": "Profitability",
  };

  // Generate breadcrumb items from current path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    // Always start with home
    const breadcrumbs: BreadcrumbItem[] = [
      { label: "Home", href: "/" }
    ];

    // If we're on home page, return just home
    if (location === "/") {
      return breadcrumbs;
    }

    // Split path and build breadcrumb trail
    const pathSegments = location.split("/").filter(Boolean);
    let currentPath = "";

    pathSegments.forEach((segment) => {
      currentPath += `/${segment}`;
      const label = routeLabels[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
      breadcrumbs.push({
        label,
        href: currentPath
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1;
        const isHome = index === 0;

        return (
          <div key={item.href} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 mx-2" />
            )}
            {isLast ? (
              <span className="font-medium text-foreground">
                {isHome ? <Home className="h-4 w-4" /> : item.label}
              </span>
            ) : (
              <Link href={item.href}>
                <span className="hover:text-foreground transition-colors cursor-pointer flex items-center">
                  {isHome ? <Home className="h-4 w-4" /> : item.label}
                </span>
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
