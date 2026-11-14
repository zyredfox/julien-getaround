import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  CashflowPoint,
  CumulativePoint,
  MonthDetailLine,
} from "@/hooks/useBilan";
import { formatMoney } from "@/lib/money";

const COLORS = [
  "#0f9f95",
  "#12c4b0",
  "#ff6b3d",
  "#0f1c2e",
  "#5b7394",
  "#0b7f78",
  "#c2410c",
];

type CategoryPoint = { name: string; value: number };

type BilanChartsProps = {
  cashflow: CashflowPoint[];
  cumulative: CumulativePoint[];
  byCategory: CategoryPoint[];
};

function DetailList({
  title,
  color,
  lines,
  empty,
}: {
  title: string;
  color: string;
  lines: MonthDetailLine[];
  empty: string;
}) {
  return (
    <div className="mt-2">
      <p className="text-xs font-semibold" style={{ color }}>
        {title}
      </p>
      {lines.length === 0 ? (
        <p className="text-xs text-ink-500">{empty}</p>
      ) : (
        <ul className="mt-1 space-y-0.5">
          {lines.map((line) => (
            <li
              key={`${title}-${line.label}`}
              className="flex justify-between gap-3 text-xs text-ink-800"
            >
              <span className="min-w-0 flex-1 truncate">{line.label}</span>
              <span className="shrink-0 font-medium">
                {formatMoney(line.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TooltipShell({
  label,
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <div
      className="pointer-events-none max-w-[16rem] -translate-y-[calc(100%+18px)] translate-x-3 rounded-xl border border-ink-100 bg-white p-3 shadow-lift"
      style={{ marginTop: 0 }}
    >
      {label ? (
        <p className="text-sm font-semibold capitalize text-ink-900">{label}</p>
      ) : null}
      {children}
    </div>
  );
}

function CashflowTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload: CashflowPoint }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <TooltipShell label={label}>
      <p className="mt-1 text-xs text-ink-500">
        Net du mois :{" "}
        <span className="font-semibold text-ink-900">
          {formatMoney(point.net)}
        </span>
      </p>
      <DetailList
        title={`Revenus · ${formatMoney(point.revenus)}`}
        color="#0f9f95"
        lines={point.revenuDetails}
        empty="Aucun revenu"
      />
      <DetailList
        title={`Dépenses · ${formatMoney(point.depenses)}`}
        color="#ff6b3d"
        lines={point.depenseDetails}
        empty="Aucune dépense"
      />
    </TooltipShell>
  );
}

function CumulativeTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload: CumulativePoint }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <TooltipShell label={label}>
      <p className="mt-1 text-xs text-ink-800">
        Net cumulé :{" "}
        <span className="font-semibold">{formatMoney(point.net)}</span>
      </p>
      <p className="mt-1 text-xs text-ink-500">
        Ce mois : {formatMoney(point.monthRevenus)} −{" "}
        {formatMoney(point.monthDepenses)} ={" "}
        <span className="font-semibold text-ink-800">
          {formatMoney(point.monthNet)}
        </span>
      </p>
      <DetailList
        title="Revenus du mois"
        color="#0f9f95"
        lines={point.revenuDetails}
        empty="Aucun revenu"
      />
      <DetailList
        title="Dépenses du mois"
        color="#ff6b3d"
        lines={point.depenseDetails}
        empty="Aucune dépense"
      />
    </TooltipShell>
  );
}

function CategoryTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; payload?: CategoryPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const name = item?.payload?.name ?? item?.name ?? "Catégorie";
  const value = Number(item?.value ?? item?.payload?.value ?? 0);

  return (
    <TooltipShell>
      <p className="text-sm font-semibold text-ink-900">{name}</p>
      <p className="mt-1 text-xs text-ink-600">
        Total sur la période :{" "}
        <span className="font-semibold text-ink-900">{formatMoney(value)}</span>
      </p>
    </TooltipShell>
  );
}

export function BilanCharts({
  cashflow,
  cumulative,
  byCategory,
}: BilanChartsProps) {
  if (cashflow.length === 0 && byCategory.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-white/90 p-4 shadow-soft ring-1 ring-ink-100/80">
        <h2 className="text-sm font-semibold tracking-wide text-ink-800">
          Cashflow mensuel
        </h2>
        <p className="mt-1 text-xs text-ink-500">
          Survole une barre pour voir le détail.
        </p>
        <div className="mt-3 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cashflow}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} width={48} />
              <Tooltip
                content={<CashflowTooltip />}
                cursor={{ fill: "rgba(15, 28, 46, 0.06)" }}
                offset={28}
                allowEscapeViewBox={{ x: true, y: true }}
                wrapperStyle={{ outline: "none", zIndex: 40, pointerEvents: "none" }}
              />
              <Bar
                dataKey="revenus"
                fill="#0f9f95"
                name="Revenus nets"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="depenses"
                fill="#ff6b3d"
                name="Dépenses"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-3xl bg-white/90 p-4 shadow-soft ring-1 ring-ink-100/80">
        <h2 className="text-sm font-semibold tracking-wide text-ink-800">
          Net cumulé
        </h2>
        <div className="mt-3 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cumulative}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} width={48} />
              <Tooltip
                content={<CumulativeTooltip />}
                offset={28}
                allowEscapeViewBox={{ x: true, y: true }}
                wrapperStyle={{ outline: "none", zIndex: 40, pointerEvents: "none" }}
              />
              <Line
                type="monotone"
                dataKey="net"
                stroke="#12c4b0"
                strokeWidth={3}
                dot={{ r: 4, fill: "#12c4b0" }}
                activeDot={{ r: 6 }}
                name="Net cumulé"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-3xl bg-white/90 p-4 shadow-soft ring-1 ring-ink-100/80">
        <h2 className="text-sm font-semibold tracking-wide text-ink-800">
          Dépenses par catégorie
        </h2>
        <div className="mt-3 h-56 w-full">
          {byCategory.length === 0 ? (
            <p className="text-sm text-ink-500">Aucune dépense sur la période.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byCategory}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {byCategory.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={<CategoryTooltip />}
                  offset={28}
                  allowEscapeViewBox={{ x: true, y: true }}
                  wrapperStyle={{ outline: "none", zIndex: 40, pointerEvents: "none" }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        <ul className="mt-2 space-y-1 text-sm text-ink-700">
          {byCategory.map((entry, index) => (
            <li key={entry.name} className="flex justify-between gap-3">
              <span className="flex items-center gap-2">
                <span
                  className="inline-block size-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  aria-hidden
                />
                {entry.name}
              </span>
              <span>{formatMoney(entry.value)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
