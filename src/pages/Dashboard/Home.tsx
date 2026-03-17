import { useEffect, useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  RadialBarChart,
  RadialBar,
  Legend,
} from "recharts";

export default function Home() {
  const [failures, setFailures] = useState([]);
  const [preventiveTasks, setPreventiveTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError("");

        const [failuresRes, pmRes] = await Promise.all([
          fetch("https://machine-backend.azurewebsites.net/ajouter/failures"),
          fetch(
            "https://machine-backend.azurewebsites.net/ajouter/preventive-maintenances"
          ),
        ]);

        if (!failuresRes.ok) throw new Error("Failed to fetch failures");
        if (!pmRes.ok) throw new Error("Failed to fetch preventive tasks");

        const failuresData = await failuresRes.json();
        const pmData = await pmRes.json();

        setFailures(Array.isArray(failuresData) ? failuresData : []);
        setPreventiveTasks(Array.isArray(pmData) ? pmData : []);
      } catch (err) {
        console.error(err);
        setError("Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDuration = (ms) => {
    if (!ms || ms <= 0) return "0h 0m";

    const totalMinutes = Math.floor(ms / (1000 * 60));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    return `${hours}h ${minutes}m`;
  };

  const toDays = (ms) => {
    if (!ms || ms <= 0) return 0;
    return Number((ms / (1000 * 60 * 60 * 24)).toFixed(2));
  };

  const monthLabel = (key) => {
    const [year, month] = key.split("-");
    const d = new Date(Number(year), Number(month) - 1, 1);
    return d.toLocaleString("en-US", { month: "short", year: "numeric" });
  };

  const failureData = useMemo(() => {
    const validFailures = failures
      .filter((item) => item.failure_date)
      .map((item) => ({
        ...item,
        failureDateObj: new Date(item.failure_date),
        resolvedDateObj: item.resolved_date ? new Date(item.resolved_date) : null,
      }))
      .filter((item) => !isNaN(item.failureDateObj.getTime()))
      .sort((a, b) => a.failureDateObj - b.failureDateObj);

    // -----------------------------
    // KPI 1: Time between failures
    // -----------------------------
    const betweenFailuresMonthlyMap = {};
    let totalBetweenFailuresMs = 0;
    let betweenFailuresCount = 0;

    for (let i = 0; i < validFailures.length - 1; i++) {
      const currentFailure = validFailures[i];
      const nextFailure = validFailures[i + 1];

      const diffMs = nextFailure.failureDateObj - currentFailure.failureDateObj;
      if (diffMs < 0) continue;

      // group by current failure month
      const key = `${currentFailure.failureDateObj.getFullYear()}-${String(
        currentFailure.failureDateObj.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!betweenFailuresMonthlyMap[key]) {
        betweenFailuresMonthlyMap[key] = {
          month: key,
          totalBetweenFailuresMs: 0,
          count: 0,
        };
      }

      betweenFailuresMonthlyMap[key].totalBetweenFailuresMs += diffMs;
      betweenFailuresMonthlyMap[key].count += 1;

      totalBetweenFailuresMs += diffMs;
      betweenFailuresCount += 1;
    }

    // -----------------------------
    // KPI 2 & 3: Repair time
    // -----------------------------
    const resolvedFailures = validFailures.filter(
      (item) =>
        item.resolvedDateObj && !isNaN(item.resolvedDateObj.getTime())
    );

    const repairMonthlyMap = {};
    let totalRepairMs = 0;
    let resolvedCount = 0;

    resolvedFailures.forEach((item) => {
      const repairMs = item.resolvedDateObj - item.failureDateObj;
      if (repairMs < 0) return;

      const key = `${item.failureDateObj.getFullYear()}-${String(
        item.failureDateObj.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!repairMonthlyMap[key]) {
        repairMonthlyMap[key] = {
          month: key,
          totalRepairMs: 0,
          count: 0,
        };
      }

      repairMonthlyMap[key].totalRepairMs += repairMs;
      repairMonthlyMap[key].count += 1;

      totalRepairMs += repairMs;
      resolvedCount += 1;
    });

    // merge all months
    const allMonths = Array.from(
      new Set([
        ...Object.keys(betweenFailuresMonthlyMap),
        ...Object.keys(repairMonthlyMap),
      ])
    ).sort();

    const monthlyRows = allMonths.map((month) => {
      const betweenData = betweenFailuresMonthlyMap[month];
      const repairData = repairMonthlyMap[month];

      const avgBetweenFailuresMs =
        betweenData && betweenData.count > 0
          ? betweenData.totalBetweenFailuresMs / betweenData.count
          : 0;

      const avgRepairMs =
        repairData && repairData.count > 0
          ? repairData.totalRepairMs / repairData.count
          : 0;

      return {
        month,
        label: monthLabel(month),
        avgBetweenFailuresDays: toDays(avgBetweenFailuresMs),
        avgRepairDays: toDays(avgRepairMs),
        totalRepairDays: toDays(repairData?.totalRepairMs || 0),
        failuresCount: repairData?.count || 0,
        betweenFailuresCount: betweenData?.count || 0,
      };
    });

    const overallAvgBetweenFailuresMs =
      betweenFailuresCount > 0
        ? totalBetweenFailuresMs / betweenFailuresCount
        : 0;

    const overallAvgRepairMs =
      resolvedCount > 0 ? totalRepairMs / resolvedCount : 0;

    return {
      monthlyRows,
      overallAvgBetweenFailuresMs,
      overallAvgRepairMs,
      totalRepairMs,
      resolvedCount,
      betweenFailuresCount,
    };
  }, [failures]);

  const preventiveData = useMemo(() => {
    const totalTasks = preventiveTasks.length;

    const completedTasks = preventiveTasks.filter(
      (task) => task.task_status === "Completed" && task.completed_date
    );

    const completedCount = completedTasks.length;
    const accomplishmentPercentage =
      totalTasks > 0 ? Number(((completedCount / totalTasks) * 100).toFixed(1)) : 0;

    const monthlyTotalMap = {};
    const monthlyCompletedMap = {};

    preventiveTasks.forEach((task) => {
      if (!task.start_date) return;
      const startDate = new Date(task.start_date);
      if (isNaN(startDate.getTime())) return;

      const key = `${startDate.getFullYear()}-${String(
        startDate.getMonth() + 1
      ).padStart(2, "0")}`;

      monthlyTotalMap[key] = (monthlyTotalMap[key] || 0) + 1;
    });

    completedTasks.forEach((task) => {
      const completedDate = new Date(task.completed_date);
      if (isNaN(completedDate.getTime())) return;

      const key = `${completedDate.getFullYear()}-${String(
        completedDate.getMonth() + 1
      ).padStart(2, "0")}`;

      monthlyCompletedMap[key] = (monthlyCompletedMap[key] || 0) + 1;
    });

    const allMonths = Array.from(
      new Set([...Object.keys(monthlyTotalMap), ...Object.keys(monthlyCompletedMap)])
    ).sort();

    const monthlyRows = allMonths.map((key) => {
      const total = monthlyTotalMap[key] || 0;
      const completed = monthlyCompletedMap[key] || 0;
      const percentage = total > 0 ? Number(((completed / total) * 100).toFixed(1)) : 0;

      return {
        month: key,
        label: monthLabel(key),
        totalTasks: total,
        completedTasks: completed,
        accomplishmentPercentage: percentage,
      };
    });

    return {
      totalTasks,
      completedCount,
      accomplishmentPercentage,
      monthlyRows,
    };
  }, [preventiveTasks]);

  const radialData = [
    {
      name: "Accomplishment",
      value: preventiveData.accomplishmentPercentage,
      fill: "#f97316",
    },
  ];

  const cardBase =
    "rounded-3xl border border-white/40 bg-white/80 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.06)]";

  if (loading) {
    return (
      <>
        <PageMeta title="Maintenance Dashboard" description="Loading dashboard" />
        <div className="p-6">
          <div className={`${cardBase} p-8 text-center text-gray-500`}>
            Loading dashboard...
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageMeta title="Maintenance Dashboard" description="Dashboard error" />
        <div className="p-6">
          <div className={`${cardBase} p-8 text-center text-red-500`}>
            {error}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Maintenance Intelligence Dashboard"
        description="Modern KPI dashboard for failures and preventive maintenance"
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50 p-6">
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">
              Maintenance Intelligence Dashboard
            </h1>
            <p className="text-sm text-slate-500">
              Real-time view of failure repair performance and preventive maintenance accomplishment
            </p>
          </div>

          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className={`${cardBase} p-6`}>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100">
                <span className="text-xl">🛠️</span>
              </div>
              <p className="text-sm text-slate-500">Average time between failures</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-800">
                {formatDuration(failureData.overallAvgBetweenFailuresMs)}
              </h2>
              <p className="mt-2 text-xs text-slate-400">Based on consecutive failure dates</p>
            </div>

            <div className={`${cardBase} p-6`}>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
                <span className="text-xl">⏱️</span>
              </div>
              <p className="text-sm text-slate-500">Total repair time</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-800">
                {formatDuration(failureData.totalRepairMs)}
              </h2>
              <p className="mt-2 text-xs text-slate-400">Accumulated downtime repair duration</p>
            </div>

            <div className={`${cardBase} p-6`}>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100">
                <span className="text-xl">✅</span>
              </div>
              <p className="text-sm text-slate-500">Resolved failures</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-800">
                {failureData.resolvedCount}
              </h2>
              <p className="mt-2 text-xs text-slate-400">Failures with repair completion date</p>
            </div>

            <div className={`${cardBase} p-6`}>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100">
                <span className="text-xl">📋</span>
              </div>
              <p className="text-sm text-slate-500">PM accomplishment</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-800">
                {preventiveData.accomplishmentPercentage}%
              </h2>
              <p className="mt-2 text-xs text-slate-400">
                {preventiveData.completedCount} of {preventiveData.totalTasks} tasks completed
              </p>
            </div>
          </div>

          {/* Failure Section */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className={`${cardBase} p-6 xl:col-span-2`}>
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">
                  Average time between failures per month
                  </h3>
                  <p className="text-sm text-slate-500">
                    Displayed in days for clear monthly comparison
                  </p>
                </div>

                <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                  Monthly KPI
                </div>
              </div>

              <div className="h-80">
                {failureData.monthlyRows.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={failureData.monthlyRows}
                      barCategoryGap="28%"
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e5e7eb"
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(59,130,246,0.06)" }}
                        formatter={(value) => [`${value} days`, "Avg. time between failures"]}
                        contentStyle={{
                          borderRadius: "16px",
                          border: "1px solid #e5e7eb",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                        }}
                      />
                      <Bar
                        dataKey="avgBetweenFailuresDays"
                        name="Avg. time between failures"
                        fill="#3b82f6"
                        radius={[10, 10, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400">
                    No repair data available yet.
                  </div>
                )}
              </div>
            </div>

            <div className={`${cardBase} p-6`}>
              <div className="mb-5">
                <h3 className="text-lg font-semibold text-slate-800">
                  Repair overview
                </h3>
                <p className="text-sm text-slate-500">
                  Monthly total repair duration
                </p>
              </div>

              <div className="h-80">
                {failureData.monthlyRows.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={failureData.monthlyRows}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 12 }} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                      <Tooltip
                        formatter={(value) => [`${value} days`, "Total repair time"]}
                        contentStyle={{
                          borderRadius: "16px",
                          border: "1px solid #e5e7eb",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                        }}
                      />
                      <Bar
                        dataKey="totalRepairDays"
                        fill="#10b981"
                        radius={[12, 12, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400">
                    No monthly totals yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preventive Section */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className={`${cardBase} p-6`}>
              <div className="mb-5">
                <h3 className="text-lg font-semibold text-slate-800">
                  Preventive maintenance accomplishment
                </h3>
                <p className="text-sm text-slate-500">
                  Completion percentage across all tasks
                </p>
              </div>

              <div className="flex h-80 flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    innerRadius="70%"
                    outerRadius="100%"
                    barSize={18}
                    data={radialData}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <RadialBar
                      minAngle={15}
                      background
                      clockWise
                      dataKey="value"
                      cornerRadius={20}
                    />
                    <Legend
                      iconSize={0}
                      layout="vertical"
                      verticalAlign="middle"
                      align="center"
                      formatter={() => (
                        <div className="text-center">
                          <div className="text-4xl font-bold text-slate-800">
                            {preventiveData.accomplishmentPercentage}%
                          </div>
                          <div className="mt-2 text-sm text-slate-500">
                            Accomplishment
                          </div>
                        </div>
                      )}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={`${cardBase} p-6 xl:col-span-2`}>
              <div className="mb-5">
                <h3 className="text-lg font-semibold text-slate-800">
                  Completed preventive maintenance per month
                </h3>
                <p className="text-sm text-slate-500">
                  Monthly count based on completed date
                </p>
              </div>

              <div className="h-80">
                {preventiveData.monthlyRows.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={preventiveData.monthlyRows}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 12 }} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                      <Tooltip
                        formatter={(value, name) => [
                          name === "completedTasks" ? `${value} tasks` : `${value}%`,
                          name === "completedTasks" ? "Completed tasks" : "Accomplishment",
                        ]}
                        contentStyle={{
                          borderRadius: "16px",
                          border: "1px solid #e5e7eb",
                          boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                        }}
                      />
                      <Bar
                        dataKey="completedTasks"
                        fill="#0ea5e9"
                        radius={[12, 12, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400">
                    No preventive maintenance completion data yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Monthly accomplishment trend */}
          <div className={`${cardBase} p-6`}>
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-slate-800">
                Monthly preventive maintenance accomplishment
              </h3>
              <p className="text-sm text-slate-500">
                Completion percentage by month
              </p>
            </div>

            <div className="h-80">
              {preventiveData.monthlyRows.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={preventiveData.monthlyRows}>
                    <defs>
                      <linearGradient id="pmGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 12 }} />
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Accomplishment"]}
                      contentStyle={{
                        borderRadius: "16px",
                        border: "1px solid #e5e7eb",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="accomplishmentPercentage"
                      stroke="#f97316"
                      fillOpacity={1}
                      fill="url(#pmGradient)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400">
                  No accomplishment trend available yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
