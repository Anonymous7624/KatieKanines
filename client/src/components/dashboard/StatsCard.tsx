import { Link } from "wouter";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  linkText: string;
  linkHref: string;
  colorClass?: string;
}

export default function StatsCard({
  title,
  value,
  icon,
  linkText,
  linkHref,
  colorClass = "primary"
}: StatsCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg border border-pink-light/30">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0 bg-pink-light rounded-md p-3 text-primary">
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-brown-medium truncate">
                {title}
              </dt>
              <dd>
                <div className="text-lg font-medium text-brown-dark">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div className="bg-pink-light/20 px-4 py-4 sm:px-6">
        <div className="text-sm">
          <Link href={linkHref}>
            <div className="font-medium text-primary hover:text-primary/80 cursor-pointer">
              {linkText}
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
