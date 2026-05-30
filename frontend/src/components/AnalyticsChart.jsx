import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

function AnalyticsChart() {
  const data = [
    { subject: "Math", average: 75 },
    { subject: "Physics", average: 68 },
    { subject: "Chemistry", average: 82 },
    { subject: "Biology", average: 70 },
    { subject: "English", average: 88 },
  ];

  return (
    <div className="card p-4 shadow mt-4">
      <h3>Performance Analytics</h3>

      <BarChart width={600} height={300} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="subject" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="average" />
      </BarChart>
    </div>
  );
}

export default AnalyticsChart;