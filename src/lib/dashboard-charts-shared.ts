/** Types partagés client/serveur pour les graphiques du dashboard. */

export type DashboardChartData = {
  caByActivity: Array<{ name: string; ca: number }>;
  revenueVsExpenses: Array<{
    name: string;
    revenus: number;
    depenses: number;
  }>;
  paymentsByChannel: Array<{ name: string; value: number }>;
  monthlyTrend: Array<{
    month: string;
    encaissements: number;
    reservations: number;
  }>;
  gauges: {
    occupancy: number;
    stock: number;
  };
};
