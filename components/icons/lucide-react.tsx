import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number | string;
  strokeWidth?: number | string;
};

type IconPath = {
  d?: string;
  points?: string;
  x1?: number;
  x2?: number;
  y1?: number;
  y2?: number;
  cx?: number;
  cy?: number;
  r?: number;
  kind: "path" | "polyline" | "line" | "circle";
};

function IconBase({ children, size = 24, strokeWidth = 2, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {children}
    </svg>
  );
}

function renderShape(shape: IconPath, index: number) {
  if (shape.kind === "polyline") return <polyline key={index} points={shape.points} />;
  if (shape.kind === "line") return <line key={index} x1={shape.x1} x2={shape.x2} y1={shape.y1} y2={shape.y2} />;
  if (shape.kind === "circle") return <circle key={index} cx={shape.cx} cy={shape.cy} r={shape.r} />;
  return <path key={index} d={shape.d} />;
}

function createIcon(paths: IconPath[]) {
  return function LucideIcon(props: IconProps) {
    return <IconBase {...props}>{paths.map(renderShape)}</IconBase>;
  };
}

export const Activity = createIcon([
  { kind: "path", d: "M22 12h-4l-3 9L9 3l-3 9H2" }
]);

export const Calculator = createIcon([
  { kind: "path", d: "M4 2h16v20H4z" },
  { kind: "line", x1: 8, x2: 16, y1: 6, y2: 6 },
  { kind: "line", x1: 8, x2: 8, y1: 10, y2: 10 },
  { kind: "line", x1: 12, x2: 12, y1: 10, y2: 10 },
  { kind: "line", x1: 16, x2: 16, y1: 10, y2: 10 },
  { kind: "line", x1: 8, x2: 8, y1: 14, y2: 14 },
  { kind: "line", x1: 12, x2: 12, y1: 14, y2: 14 },
  { kind: "line", x1: 16, x2: 16, y1: 14, y2: 18 }
]);

export const FileText = createIcon([
  { kind: "path", d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" },
  { kind: "path", d: "M14 2v6h6" },
  { kind: "line", x1: 16, x2: 8, y1: 13, y2: 13 },
  { kind: "line", x1: 16, x2: 8, y1: 17, y2: 17 },
  { kind: "line", x1: 10, x2: 8, y1: 9, y2: 9 }
]);

export const Languages = createIcon([
  { kind: "path", d: "m5 8 6 6" },
  { kind: "path", d: "m4 14 6-6 2-3" },
  { kind: "path", d: "M2 5h12" },
  { kind: "path", d: "M7 2h1" },
  { kind: "path", d: "m22 22-5-10-5 10" },
  { kind: "path", d: "M14 18h6" }
]);

export const Layers = createIcon([
  { kind: "path", d: "m12.83 2.18 8.34 4.66a1 1 0 0 1 0 1.74l-8.34 4.66a1.7 1.7 0 0 1-1.66 0L2.83 8.58a1 1 0 0 1 0-1.74l8.34-4.66a1.7 1.7 0 0 1 1.66 0Z" },
  { kind: "path", d: "m22 12.5-9.17 5.12a1.7 1.7 0 0 1-1.66 0L2 12.5" },
  { kind: "path", d: "m22 17.5-9.17 5.12a1.7 1.7 0 0 1-1.66 0L2 17.5" }
]);

export const LayoutDashboard = createIcon([
  { kind: "path", d: "M3 3h7v9H3z" },
  { kind: "path", d: "M14 3h7v5h-7z" },
  { kind: "path", d: "M14 12h7v9h-7z" },
  { kind: "path", d: "M3 16h7v5H3z" }
]);

export const LineChart = createIcon([
  { kind: "path", d: "M3 3v18h18" },
  { kind: "polyline", points: "7 16 11 12 14 15 20 9" }
]);

export const Radar = createIcon([
  { kind: "path", d: "M19.07 4.93A10 10 0 1 0 4.93 19.07" },
  { kind: "path", d: "M13 11.5a2 2 0 1 0-1.5 1.5" },
  { kind: "path", d: "M15.7 8.3a6 6 0 1 0-7.4 7.4" },
  { kind: "path", d: "M22 2 12 12" },
  { kind: "path", d: "M16 2h6v6" }
]);

export const TrendingUp = createIcon([
  { kind: "polyline", points: "22 7 13.5 15.5 8.5 10.5 2 17" },
  { kind: "polyline", points: "16 7 22 7 22 13" }
]);

export const Search = createIcon([
  { kind: "circle", cx: 11, cy: 11, r: 8 },
  { kind: "path", d: "m21 21-4.34-4.34" }
]);

export const X = createIcon([
  { kind: "path", d: "M18 6 6 18" },
  { kind: "path", d: "m6 6 12 12" }
]);

export const Home = createIcon([
  { kind: "path", d: "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" },
  { kind: "path", d: "M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" }
]);

export const Star = createIcon([
  { kind: "path", d: "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" }
]);

export const BarChart2 = createIcon([
  { kind: "path", d: "M5 21v-6" },
  { kind: "path", d: "M12 21V3" },
  { kind: "path", d: "M19 21V9" }
]);

export const GitCompare = createIcon([
  { kind: "circle", cx: 18, cy: 18, r: 3 },
  { kind: "circle", cx: 6, cy: 6, r: 3 },
  { kind: "path", d: "M13 6h3a2 2 0 0 1 2 2v7" },
  { kind: "path", d: "M11 18H8a2 2 0 0 1-2-2V9" }
]);
