"use client";

import {CartesianGrid, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import {useTranslations} from "next-intl";
import {angleSeries} from "@/lib/demo-data";

export function AngleChart() {
  const t = useTranslations("results");
  return <div className="chartWrap" role="img" aria-label={t("chartAria")}><ResponsiveContainer width="100%" height="100%"><LineChart data={angleSeries} margin={{top: 12, right: 12, bottom: 4, left: -12}}><CartesianGrid vertical={false} stroke="#dfe9e5" strokeDasharray="4 5"/><ReferenceArea y1={140} y2={160} fill="#dcece7" fillOpacity={.75}/><XAxis dataKey="time" tickLine={false} axisLine={false} tick={{fill: "#607069", fontSize: 12}}/><YAxis domain={[0, 180]} ticks={[0, 45, 90, 135, 180]} tickLine={false} axisLine={false} tick={{fill: "#607069", fontSize: 12}}/><Tooltip contentStyle={{borderRadius: 12, borderColor: "#dfe9e5", boxShadow: "0 8px 24px rgba(23,67,54,.08)"}}/><Line type="monotone" dataKey="angle" stroke="#176b55" strokeWidth={3} dot={false} activeDot={{r: 5, fill: "#176b55"}}/></LineChart></ResponsiveContainer></div>;
}
