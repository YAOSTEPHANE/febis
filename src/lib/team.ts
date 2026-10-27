/** Ordre métier des pôles sur la vitrine publique */
export const TEAM_DEPT_ORDER = [
  "direction",
  "residences",
  "btp",
  "evenementiel",
  "boutique",
  "operations",
  "rh",
  "compta",
  "admin",
] as const;

const PHOTO_BY_NAME: Record<string, string> = {
  "amina koffi": "/images/team/amina.jpg",
  "jean traoré": "/images/team/jean.jpg",
  "jean traore": "/images/team/jean.jpg",
  "sara blé": "/images/team/sara.jpg",
  "sara ble": "/images/team/sara.jpg",
  "yao mensah": "/images/team/yao.jpg",
};

const PHOTO_BY_DEPT: Record<string, string> = {
  direction: "/images/team/jean.jpg",
  residences: "/images/team/amina.jpg",
  btp: "/images/team/jean.jpg",
  evenementiel: "/images/team/sara.jpg",
  boutique: "/images/team/yao.jpg",
  operations: "/images/team/jean.jpg",
  rh: "/images/team/amina.jpg",
  compta: "/images/team/yao.jpg",
  admin: "/images/team/sara.jpg",
};

function normalizeName(name: string) {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

export function resolveTeamPhoto(member: {
  name: string;
  department: string;
  imageUrl?: string;
}): string {
  if (member.imageUrl) return member.imageUrl;
  const byName = PHOTO_BY_NAME[normalizeName(member.name)];
  if (byName) return byName;
  return PHOTO_BY_DEPT[member.department] ?? "/images/team/amina.jpg";
}

export function sortTeamMembers<T extends { department: string; name: string }>(
  members: T[],
): T[] {
  const rank = new Map(
    TEAM_DEPT_ORDER.map((dept, index) => [dept, index] as const),
  );
  return [...members].sort((a, b) => {
    const ra = rank.get(a.department as (typeof TEAM_DEPT_ORDER)[number]) ?? 99;
    const rb = rank.get(b.department as (typeof TEAM_DEPT_ORDER)[number]) ?? 99;
    if (ra !== rb) return ra - rb;
    return a.name.localeCompare(b.name, "fr");
  });
}

export function preparePublicTeam<
  T extends { name: string; department: string; imageUrl?: string },
>(members: T[], limit = 8): Array<T & { imageUrl: string }> {
  return sortTeamMembers(members)
    .slice(0, limit)
    .map((member) => ({
      ...member,
      imageUrl: resolveTeamPhoto(member),
    }));
}
