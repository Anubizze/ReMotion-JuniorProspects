import type {SessionSummary} from "@/types";

export const demoSummary: SessionSummary = {
  id: "demo-e02-session",
  date: "2026-11-24T10:45:00.000Z",
  durationSeconds: 184,
  detectedCycles: 8,
  completedCycles: 6,
  reviewCycles: 2,
  source: "demo",
  cycles: [
    {id: "01", startedAtMs: 0, endedAtMs: 21000, status: "complete", peakAngle: 151},
    {id: "02", startedAtMs: 22000, endedAtMs: 43000, status: "complete", peakAngle: 154},
    {id: "03", startedAtMs: 44000, endedAtMs: 66000, status: "review", peakAngle: 126},
    {id: "04", startedAtMs: 67000, endedAtMs: 89000, status: "complete", peakAngle: 150},
    {id: "05", startedAtMs: 90000, endedAtMs: 112000, status: "complete", peakAngle: 153},
    {id: "06", startedAtMs: 113000, endedAtMs: 136000, status: "review", peakAngle: 132},
    {id: "07", startedAtMs: 137000, endedAtMs: 159000, status: "complete", peakAngle: 152},
    {id: "08", startedAtMs: 160000, endedAtMs: 184000, status: "complete", peakAngle: 155}
  ]
};

export const angleSeries = [
  {time: 0, angle: 48}, {time: 10, angle: 91}, {time: 20, angle: 151}, {time: 30, angle: 88},
  {time: 40, angle: 154}, {time: 50, angle: 82}, {time: 60, angle: 126}, {time: 70, angle: 76},
  {time: 80, angle: 150}, {time: 90, angle: 84}, {time: 100, angle: 153}, {time: 110, angle: 79},
  {time: 120, angle: 132}, {time: 130, angle: 81}, {time: 140, angle: 152}, {time: 150, angle: 86},
  {time: 160, angle: 155}, {time: 170, angle: 83}
];
