"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const day = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" })

/** Single series → one brand hue, no legend (the card title names it), table for screen readers. */
export function EnquiriesChart({ data }: { data: { date: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  return (
    <figure>
      <div className="h-56" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -24 }} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke="#eef0f3" />
            <XAxis dataKey="date" tickFormatter={day} tickLine={false} axisLine={false} tick={{ fill: "#667085", fontSize: 11 }} interval="preserveStartEnd" minTickGap={16} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#667085", fontSize: 11 }} width={40} />
            <Tooltip
              cursor={{ fill: "rgb(6 69 165 / 0.06)" }}
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <div className="rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-lift">
                    <p className="text-ink-muted">{day(String(payload[0].payload.date))}</p>
                    <p className="mt-0.5 font-semibold text-ink tabular">
                      {payload[0].value} {payload[0].value === 1 ? "enquiry" : "enquiries"}
                    </p>
                  </div>
                ) : null
              }
            />
            <Bar dataKey="count" fill="#0645a5" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">
        {total} enquiries in the last 14 days.
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Enquiries</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.date}>
                <td>{day(d.date)}</td>
                <td>{d.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  )
}
