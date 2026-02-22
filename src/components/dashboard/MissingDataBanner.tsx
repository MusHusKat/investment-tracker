import { AlertTriangle } from "lucide-react";
import Link from "next/link";

interface MissingDataBannerProps {
  missingProperties: Array<{ id: string; name: string }>;
  year: number;
}

export function MissingDataBanner({ missingProperties, year }: MissingDataBannerProps) {
  if (missingProperties.length === 0) return null;

  return (
    <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-4">
      <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-medium text-amber-900">
          {missingProperties.length} propert{missingProperties.length === 1 ? "y" : "ies"} missing data for {year}
        </p>
        <div className="flex flex-wrap gap-2 mt-1">
          {missingProperties.map((p) => (
            <Link
              key={p.id}
              href={`/wizard?propertyId=${p.id}&year=${year}`}
              className="text-xs text-amber-700 underline hover:text-amber-900"
            >
              {p.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
