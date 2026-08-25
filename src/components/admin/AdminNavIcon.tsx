import { cn } from "@/lib/cn";

type IconProps = { className?: string };

function IconSvg({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-[1.05em] w-[1.05em]", className)}
      aria-hidden
    >
      {children}
    </svg>
  );
}

function IconDashboard(p: IconProps) {
  return (
    <IconSvg {...p}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </IconSvg>
  );
}

function IconDirection(p: IconProps) {
  return (
    <IconSvg {...p}>
      <path d="M12 3 4 7v5c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V7l-8-4Z" />
      <path d="M9 12h6" />
      <path d="M12 9v6" />
    </IconSvg>
  );
}

function IconHome(p: IconProps) {
  return (
    <IconSvg {...p}>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-5h4v5h4a1 1 0 0 0 1-1v-9" />
    </IconSvg>
  );
}

function IconCalendar(p: IconProps) {
  return (
    <IconSvg {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </IconSvg>
  );
}

function IconHardHat(p: IconProps) {
  return (
    <IconSvg {...p}>
      <path d="M2 18h20" />
      <path d="M4 18v-2a8 8 0 0 1 16 0v2" />
      <path d="M12 6v4" />
      <path d="M8 10h8" />
    </IconSvg>
  );
}

function IconParty(p: IconProps) {
  return (
    <IconSvg {...p}>
      <path d="M5.8 11.3 2 22l10.7-3.8" />
      <path d="M4 15s3-1 6-4 4-6 4-6" />
      <path d="M14 7s1 3 4 6 6 4 6 4" />
      <circle cx="17" cy="5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="4" r="1" fill="currentColor" stroke="none" />
      <circle cx="20" cy="10" r="1" fill="currentColor" stroke="none" />
    </IconSvg>
  );
}

function IconBag(p: IconProps) {
  return (
    <IconSvg {...p}>
      <path d="M6 7h12l-1.2 12.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6 7Z" />
      <path d="M9 7V5a3 3 0 0 1 6 0v2" />
    </IconSvg>
  );
}

function IconUsers(p: IconProps) {
  return (
    <IconSvg {...p}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 19a6.5 6.5 0 0 1 13 0" />
      <circle cx="17.5" cy="9" r="2.4" />
      <path d="M16 19a5 5 0 0 1 5.5-4.8" />
    </IconSvg>
  );
}

function IconWallet(p: IconProps) {
  return (
    <IconSvg {...p}>
      <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5.5A2.5 2.5 0 0 1 3 17.5v-9Z" />
      <path d="M3 10h18" />
      <circle cx="16.5" cy="15" r="1" fill="currentColor" stroke="none" />
    </IconSvg>
  );
}

function IconCreditCard(p: IconProps) {
  return (
    <IconSvg {...p}>
      <rect x="2.5" y="5" width="19" height="14" rx="2" />
      <path d="M2.5 10h19" />
      <path d="M7 15h3" />
    </IconSvg>
  );
}

function IconFile(p: IconProps) {
  return (
    <IconSvg {...p}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9l-5-6Z" />
      <path d="M14 3v6h6" />
      <path d="M9 13h6M9 17h4" />
    </IconSvg>
  );
}

function IconBriefcase(p: IconProps) {
  return (
    <IconSvg {...p}>
      <rect x="3" y="8" width="18" height="12" rx="2" />
      <path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
    </IconSvg>
  );
}

function IconMail(p: IconProps) {
  return (
    <IconSvg {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 8 9 6 9-6" />
    </IconSvg>
  );
}

function IconSettings(p: IconProps) {
  return (
    <IconSvg {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </IconSvg>
  );
}

function IconSearch(p: IconProps) {
  return (
    <IconSvg {...p}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16.5 16.5 4 4" />
    </IconSvg>
  );
}

function IconBell(p: IconProps) {
  return (
    <IconSvg {...p}>
      <path d="M6 9a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </IconSvg>
  );
}

function IconUserCog(p: IconProps) {
  return (
    <IconSvg {...p}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 19a6.5 6.5 0 0 1 11.2-4.4" />
      <circle cx="18" cy="16" r="2.2" />
      <path d="M18 12.5v1.2M18 18.3v1.2M14.8 14.2l.9.7M20.3 17.1l.9.7M14.8 17.8l.9-.7M20.3 14.9l.9-.7" />
    </IconSvg>
  );
}

function IconDatabase(p: IconProps) {
  return (
    <IconSvg {...p}>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
      <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
    </IconSvg>
  );
}

function IconImage(p: IconProps) {
  return (
    <IconSvg {...p}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.8" />
      <path d="m21 16-5.5-5.5L7 19" />
    </IconSvg>
  );
}

function IconTags(p: IconProps) {
  return (
    <IconSvg {...p}>
      <path d="M3 12V5.5A1.5 1.5 0 0 1 4.5 4H12l8 8-7.5 7.5L3 12Z" />
      <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none" />
    </IconSvg>
  );
}

function IconChart(p: IconProps) {
  return (
    <IconSvg {...p}>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 16v-5M12 16V8M16 16v-3" />
    </IconSvg>
  );
}

function IconGrid(p: IconProps) {
  return (
    <IconSvg {...p}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </IconSvg>
  );
}

function IconNewspaper(p: IconProps) {
  return (
    <IconSvg {...p}>
      <path d="M5 5h11a2 2 0 0 1 2 2v13H7a2 2 0 0 1-2-2V5Z" />
      <path d="M18 7h1a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-1" />
      <path d="M8 9h7M8 13h7M8 17h4" />
    </IconSvg>
  );
}

function IconQuote(p: IconProps) {
  return (
    <IconSvg {...p}>
      <path d="M7 12h3v5H6a1 1 0 0 1-1-1v-2a4 4 0 0 1 4-4" />
      <path d="M16 12h3v5h-4a1 1 0 0 1-1-1v-2a4 4 0 0 1 4-4" />
    </IconSvg>
  );
}

function IconLayers(p: IconProps) {
  return (
    <IconSvg {...p}>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" />
      <path d="m3 18 9 5 9-5" />
    </IconSvg>
  );
}

function IconWrench(p: IconProps) {
  return (
    <IconSvg {...p}>
      <path d="M14.7 6.3a4 4 0 0 0-5.6 5.6L4 17l3 3 5.1-5.1a4 4 0 0 0 5.6-5.6L15 12l-2.3-2.3 2-3.4Z" />
    </IconSvg>
  );
}

function IconOccupancy(p: IconProps) {
  return (
    <IconSvg {...p}>
      <path d="M4 20V10l8-6 8 6v10" />
      <path d="M9 20v-6h6v6" />
    </IconSvg>
  );
}

function IconBoxes(p: IconProps) {
  return (
    <IconSvg {...p}>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="M12 12 4 7.5M12 12l8-4.5M12 12v9" />
    </IconSvg>
  );
}

function IconProjects(p: IconProps) {
  return (
    <IconSvg {...p}>
      <path d="M4 19V7a2 2 0 0 1 2-2h3l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
    </IconSvg>
  );
}

const ICONS_BY_HREF: Record<string, (p: IconProps) => React.ReactNode> = {
  "/admin/dashboard": IconDashboard,
  "/admin/dashboard/direction": IconDirection,
  "/admin/dashboard/residences": IconHome,
  "/admin/dashboard/reservations": IconCalendar,
  "/admin/dashboard/btp": IconHardHat,
  "/admin/dashboard/evenementiel": IconParty,
  "/admin/dashboard/boutique": IconBag,
  "/admin/dashboard/crm": IconUsers,
  "/admin/dashboard/finance": IconWallet,
  "/admin/dashboard/paiements": IconCreditCard,
  "/admin/dashboard/facturation": IconFile,
  "/admin/dashboard/rh": IconBriefcase,
  "/admin/dashboard/contacts": IconMail,
  "/admin/dashboard/parametres": IconSettings,
  "/admin/dashboard/recherche": IconSearch,
  "/admin/dashboard/notifications": IconBell,
  "/admin/dashboard/utilisateurs": IconUserCog,
  "/admin/dashboard/sauvegardes": IconDatabase,
  "/admin/dashboard/hero": IconImage,
  "/admin/dashboard/categories": IconTags,
  "/admin/dashboard/stats": IconChart,
  "/admin/dashboard/poles": IconGrid,
  "/admin/dashboard/blog": IconNewspaper,
  "/admin/dashboard/temoignages": IconQuote,
  "/admin/dashboard/plateforme": IconLayers,
  "/admin/dashboard/travaux": IconWrench,
};

const ICONS_BY_KEY: Record<string, (p: IconProps) => React.ReactNode> = {
  ca: IconWallet,
  occupancy: IconOccupancy,
  stock: IconBoxes,
  projects: IconProjects,
};

export function AdminNavIcon({
  href,
  iconKey,
  className,
}: {
  href?: string;
  iconKey?: string;
  className?: string;
}) {
  const Icon =
    (href ? ICONS_BY_HREF[href] : undefined) ??
    (iconKey ? ICONS_BY_KEY[iconKey] : undefined) ??
    IconLayers;

  return <Icon className={className} />;
}
