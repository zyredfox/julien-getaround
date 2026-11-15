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
import { useUiPrefs } from "@/hooks/useUiPrefs";
import { formatMoney } from "@/lib/money";

const COLORS = [
  "#0f9f95",
  "#12c4b0",
  "#ff6b3d",
  "#5b7394",
  "#0b7f78",
  "#fb923c",
  "#2a4466",
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
        <p className="text-xs text-ink-600 dark:text-ink-300">{empty}</p>
      ) : (
        <ul className="mt-1 space-y-0.5">
          {lines.map((line) => (
            <li
              key={`${title}-${line.label}`}
              className="flex justify-between gap-3 text-xs text-ink-800 dark:text-ink-100"
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
      className="chart-tooltip pointer-events-none max-w-[16rem] -translate-y-[calc(100%+18px)] translate-x-3 rounded-xl border border-ink-200 bg-white p-3 text-ink-900 shadow-lift dark:border-ink-600 dark:bg-ink-900 dark:text-ink-50"
      style={{ marginTop: 0 }}
    >
      {label ? (
        <p className="text-sm font-semibold capitalize text-ink-900 dark:text-ink-50">
          {label}
        </p>
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
      <p className="mt-1 text-xs text-ink-600 dark:text-ink-300">
        Net du mois :{" "}
        <span className="font-semibold text-ink-900 dark:text-ink-50">
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
      <p className="mt-1 text-xs text-ink-800 dark:text-ink-100">
        Net cumulé :{" "}
        <span className="font-semibold">{formatMoney(point.net)}</span>
      </p>
      <p className="mt-1 text-xs text-ink-600 dark:text-ink-300">
        Ce mois : {formatMoney(point.monthRevenus)} −{" "}
        {formatMoney(point.monthDepenses)} ={" "}
        <span className="font-semibold text-ink-800 dark:text-ink-100">
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
      <p className="text-sm font-semibold text-ink-900 dark:text-ink-50">
        {name}
      </p>
      <p className="mt-1 text-xs text-ink-600 dark:text-ink-300">
        Total sur la période :{" "}
        <span className="font-semibold text-ink-900 dark:text-ink-50">
          {formatMoney(value)}
        </span>
      </p>
    </TooltipShell>
  );
}

function ChartPanel({
  title,
  hint,
  children,
  footer,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="chart-panel rounded-3xl bg-white p-4 shadow-soft ring-1 ring-ink-200 dark:bg-ink-800 dark:ring-ink-600">
      <h2 className="text-sm font-semibold tracking-wide text-ink-900 dark:text-ink-50">
        {title}
      </h2>
      {hint ? (
        <p className="mt-1 text-xs font-medium text-ink-600 dark:text-ink-300">
          {hint}
        </p>
      ) : null}
      <div className="mt-3 h-56 w-full min-w-0">{children}</div>
      {footer ? <div className="mt-3">{footer}</div> : null}
    </section>
  );
}

export function BilanCharts({
  cashflow,
  cumulative,
  byCategory,
}: BilanChartsProps) {
  const { theme } = useUiPrefs();
  const isDark = theme === "dark";

  // Contraste AA : axes bien foncés sur fond blanc, bien clairs sur fond sombre
  const gridStroke = isDark ? "#3a5473" : "#d0dbe8";
  const tickFill = isDark ? "#e4ebf4" : "#1a2f4a";
  const axisStroke = isDark ? "#5b7394" : "#9eb2c9";
  const cursorFill = isDark
    ? "rgba(238, 243, 248, 0.08)"
    : "rgba(15, 28, 46, 0.06)";

  const tickStyle = { fontSize: 12, fill: tickFill, fontWeight: 600 };

  if (cashflow.length === 0 && byCategory.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <ChartPanel
        title="Cashflow mensuel"
        hint="Survole une barre pour voir le détail."
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart key={`bar-${theme}`} data={cashflow}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis
              dataKey="month"
              tick={tickStyle}
              stroke={axisStroke}
              tickLine={false}
            />
            <YAxis
              tick={tickStyle}
              stroke={axisStroke}
              tickLine={false}
              width={52}
            />
            <Tooltip
              content={<CashflowTooltip />}
              cursor={{ fill: cursorFill }}
              offset={28}
              allowEscapeViewBox={{ x: true, y: true }}
              wrapperStyle={{
                outline: "none",
                zIndex: 40,
                pointerEvents: "none",
              }}
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
      </ChartPanel>

      <ChartPanel title="Net cumulé">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart key={`line-${theme}`} data={cumulative}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis
              dataKey="month"
              tick={tickStyle}
              stroke={axisStroke}
              tickLine={false}
            />
            <YAxis
              tick={tickStyle}
              stroke={axisStroke}
              tickLine={false}
              width={52}
            />
            <Tooltip
              content={<CumulativeTooltip />}
              offset={28}
              allowEscapeViewBox={{ x: true, y: true }}
              wrapperStyle={{
                outline: "none",
                zIndex: 40,
                pointerEvents: "none",
              }}
            />
            <Line
              type="monotone"
              dataKey="net"
              stroke="#0f9f95"
              strokeWidth={3}
              dot={{ r: 4, fill: "#0f9f95", strokeWidth: 0 }}
              activeDot={{ r: 6 }}
              name="Net cumulé"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartPanel>

      <ChartPanel
        title="Dépenses par catégorie"
        footer={
          byCategory.length === 0 ? null : (
            <ul className="chart-legend space-y-1.5 text-sm font-medium text-ink-800 dark:text-ink-100">
              {byCategory.map((entry, index) => (
                <li
                  key={entry.name}
                  className="flex justify-between gap-3 rounded-lg px-1 py-0.5"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="inline-block size-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                      aria-hidden
                    />
                    <span className="truncate text-ink-800 dark:text-ink-100">
                      {entry.name}
                    </span>
                  </span>
                  <span className="shrink-0 tabular-nums text-ink-900 dark:text-ink-50">
                    {formatMoney(entry.value)}
                  </span>
                </li>
              ))}
            </ul>
          )
        }
      >
        {byCategory.length === 0 ? (
          <p className="text-sm font-medium text-ink-600 dark:text-ink-300">
            Aucune dépense sur la période.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart key={`pie-${theme}`}>
              <Pie
                data={byCategory}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={78}
                paddingAngle={3}
                stroke={isDark ? "#1a3048" : "#ffffff"}
                strokeWidth={2}
                isAnimationActive={false}
              >
                {byCategory.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={COLORS[index % COLORS.length]}
                    stroke={isDark ? "#1a3048" : "#ffffff"}
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                content={<CategoryTooltip />}
                offset={28}
                allowEscapeViewBox={{ x: true, y: true }}
                wrapperStyle={{
                  outline: "none",
                  zIndex: 40,
                  pointerEvents: "none",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </ChartPanel>
    </div>
  );
}
