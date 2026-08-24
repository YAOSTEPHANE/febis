"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardChartData } from "@/lib/dashboard-charts-shared";

const COLORS = ["#b42318", "#c9a227", "#1f2937", "#0f766e", "#9a3412"];

function formatCompact(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(value);
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="admin-panel p-5">
      <h3 className="font-display text-base font-bold text-febis-ink">{title}</h3>
      <p className="mt-0.5 text-xs text-febis-ink/45">{description}</p>
      <div className="mt-4 h-64 w-full">{children}</div>
    </div>
  );
}

export function DashboardCharts({ data }: { data: DashboardChartData }) {
  const hasCa = data.caByActivity.some((r) => r.ca > 0);
  const hasRevExp = data.revenueVsExpenses.some(
    (r) => r.revenus > 0 || r.depenses > 0,
  );
  const hasChannels =
    data.paymentsByChannel.length > 0 &&
    !(
      data.paymentsByChannel.length === 1 &&
      data.paymentsByChannel[0]?.name === "Aucun"
    );
  const hasTrend = data.monthlyTrend.some(
    (r) => r.encaissements > 0 || r.reservations > 0,
  );

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-lg font-bold text-febis-ink">
          Graphiques
        </h2>
        <p className="text-sm text-febis-ink/45">
          CA, canaux de paiement, tendance mensuelle et taux opérationnels
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="CA par activité"
          description="Chiffre d’affaires cumulé (factures payées + encaissements)"
        >
          {hasCa ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.caByActivity} margin={{ left: 4, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e0d6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={formatCompact} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value) => [
                    `${Number(value ?? 0).toLocaleString("fr-FR")} XOF`,
                    "CA",
                  ]}
                />
                <Bar dataKey="ca" fill="#b42318" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <ChartCard
          title="Revenus vs dépenses"
          description="Par pôle d’activité"
        >
          {hasRevExp ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.revenueVsExpenses}
                margin={{ left: 4, right: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e0d6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={formatCompact} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value) =>
                    `${Number(value ?? 0).toLocaleString("fr-FR")} XOF`
                  }
                />
                <Legend />
                <Bar
                  dataKey="revenus"
                  name="Revenus"
                  fill="#0f766e"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="depenses"
                  name="Dépenses"
                  fill="#b42318"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <ChartCard
          title="Encaissements Mobile Money / canaux"
          description="Répartition des paiements entrants confirmés"
        >
          {hasChannels ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.paymentsByChannel}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={88}
                  paddingAngle={3}
                >
                  {data.paymentsByChannel.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) =>
                    `${Number(value ?? 0).toLocaleString("fr-FR")} XOF`
                  }
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>

        <ChartCard
          title="Tendance 6 mois"
          description="Encaissements (XOF) et volume de réservations"
        >
          {hasTrend ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyTrend} margin={{ left: 4, right: 8 }}>
                <defs>
                  <linearGradient id="encaisse" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b42318" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#b42318" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e0d6" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis
                  yAxisId="left"
                  tickFormatter={formatCompact}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value, name) => {
                    const n = Number(value ?? 0);
                    if (name === "encaissements") {
                      return [`${n.toLocaleString("fr-FR")} XOF`, "Encaissements"];
                    }
                    return [n, "Réservations"];
                  }}
                />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="encaissements"
                  name="encaissements"
                  stroke="#b42318"
                  fill="url(#encaisse)"
                  strokeWidth={2}
                />
                <Area
                  yAxisId="right"
                  type="monotone"
                  dataKey="reservations"
                  name="reservations"
                  stroke="#c9a227"
                  fill="transparent"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </ChartCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <GaugeCard
          title="Taux d’occupation"
          value={data.gauges.occupancy}
          color="#b42318"
        />
        <GaugeCard
          title="Disponibilité stock"
          value={data.gauges.stock}
          color="#0f766e"
        />
      </div>
    </section>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full items-center justify-center rounded-xl bg-febis-smoke/60 text-sm text-febis-ink/45">
      Pas encore assez de données.
    </div>
  );
}

function GaugeCard({
  title,
  value,
  color,
}: {
  title: string;
  value: number;
  color: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const data = [
    { name: "ok", value: clamped },
    { name: "rest", value: 100 - clamped },
  ];

  return (
    <div className="admin-panel flex items-center gap-4 p-5">
      <div className="h-28 w-28 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              cx="50%"
              cy="50%"
              startAngle={90}
              endAngle={-270}
              innerRadius={34}
              outerRadius={48}
              stroke="none"
            >
              <Cell fill={color} />
              <Cell fill="#efe8df" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-febis-gold-deep">
          {title}
        </p>
        <p className="mt-1 font-display text-3xl font-extrabold text-febis-ink">
          {clamped} %
        </p>
      </div>
    </div>
  );
}
