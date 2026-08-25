/** Types partagés client/serveur pour le pilotage Direction. */

export type DirectionMetrics = {
  ca: number;
  caLabel: string;
  occupancyRate: number;
  occupancyLabel: string;
  stockRate: number;
  stockLabel: string;
  lowStockCount: number;
  projectsOpen: number;
  projectsLabel: string;
  unpaid: number;
  unpaidCount: number;
  activeReservations: number;
  btpOpen: number;
  caByActivity: Array<{ activity: string; label: string; amount: number }>;
  generatedAt: string;
};
