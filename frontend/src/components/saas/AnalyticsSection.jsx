import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

// Custom components defined outside render function
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-slate-900 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CustomPieLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos((-midAngle * Math.PI) / 180);
  const y = cy + radius * Math.sin((-midAngle * Math.PI) / 180);

  if (percent < 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

function AnalyticsSection() {
  // Mock data for usage trends
  const usageData = [
    { month: "Jan", cases: 12, submissions: 45, users: 120 },
    { month: "Feb", cases: 19, submissions: 52, users: 145 },
    { month: "Mar", cases: 25, submissions: 61, users: 168 },
    { month: "Apr", cases: 22, submissions: 58, users: 182 },
    { month: "May", cases: 28, submissions: 67, users: 201 },
    { month: "Jun", cases: 32, submissions: 73, users: 225 },
  ];

  // Mock data for category distribution
  const categoryData = [
    { name: "Business", value: 35, color: "#3B82F6" },
    { name: "Technology", value: 28, color: "#10B981" },
    { name: "Healthcare", value: 20, color: "#F59E0B" },
    { name: "Education", value: 12, color: "#8B5CF6" },
    { name: "Other", value: 5, color: "#64748B" },
  ];

  // Mock data for engagement metrics
  const engagementData = [
    { metric: "Views", current: 2450, previous: 2100 },
    { metric: "Downloads", current: 890, previous: 750 },
    { metric: "Submissions", current: 445, previous: 380 },
    { metric: "Comments", current: 234, previous: 195 },
  ];

  return (
    <div className="space-y-6">
      {/* Section Title */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Analytics Overview
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Track your platform performance and user engagement
        </p>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Usage Trends Line Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900">
              Usage Trends
            </h3>
            <p className="text-sm text-slate-500">Monthly platform activity</p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#64748B" }}
                  axisLine={{ stroke: "#E2E8F0" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#64748B" }}
                  axisLine={{ stroke: "#E2E8F0" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "12px" }} iconType="line" />
                <Line
                  type="monotone"
                  dataKey="cases"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: "#3B82F6", r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Cases"
                />
                <Line
                  type="monotone"
                  dataKey="submissions"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: "#10B981", r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Submissions"
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={{ fill: "#F59E0B", r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution Pie Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900">
              Category Distribution
            </h3>
            <p className="text-sm text-slate-500">Case studies by category</p>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={CustomPieLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: "12px" }}
                  verticalAlign="bottom"
                  height={36}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Engagement Metrics Bar Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-slate-900">
            Engagement Metrics
          </h3>
          <p className="text-sm text-slate-500">
            Current vs previous period comparison
          </p>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={engagementData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                dataKey="metric"
                tick={{ fontSize: 12, fill: "#64748B" }}
                axisLine={{ stroke: "#E2E8F0" }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#64748B" }}
                axisLine={{ stroke: "#E2E8F0" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "12px" }} iconType="rect" />
              <Bar
                dataKey="previous"
                fill="#E2E8F0"
                name="Previous Period"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="current"
                fill="#3B82F6"
                name="Current Period"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                Total Cases
              </p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">156</p>
              <p className="text-xs text-emerald-600 mt-1">
                ↑ 12% from last month
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <span className="text-lg">📚</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                Active Users
              </p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">
                1,234
              </p>
              <p className="text-xs text-emerald-600 mt-1">
                ↑ 8% from last month
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
              <span className="text-lg">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                Completion Rate
              </p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">87%</p>
              <p className="text-xs text-amber-600 mt-1">
                ↓ 2% from last month
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <span className="text-lg">📊</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                Avg. Rating
              </p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">4.6</p>
              <p className="text-xs text-emerald-600 mt-1">
                ↑ 0.2 from last month
              </p>
            </div>
            <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <span className="text-lg">⭐</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsSection;
