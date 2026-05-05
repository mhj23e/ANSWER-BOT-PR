import type { SVGProps } from "react";

export type IconName =
  | "activity"
  | "alert"
  | "bar-chart"
  | "bot"
  | "chevron-right"
  | "clock"
  | "database"
  | "file"
  | "file-text"
  | "hard-drive"
  | "link"
  | "login"
  | "logout"
  | "message"
  | "panel-close"
  | "plus"
  | "search"
  | "send"
  | "shield"
  | "smile"
  | "thumbs-down"
  | "thumbs-up"
  | "trending-down"
  | "trending-up"
  | "upload"
  | "user"
  | "x";

const paths: Record<IconName, string[]> = {
  activity: ["M22 12h-4l-3 8L9 4l-3 8H2"],
  alert: ["M12 9v4", "M12 17h.01", "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"],
  "bar-chart": ["M3 3v18h18", "M7 16V9", "M12 16V5", "M17 16v-3"],
  bot: ["M12 8V4", "M8 4h8", "M5 10a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-6Z", "M9 13h.01", "M15 13h.01", "M9 17h6"],
  "chevron-right": ["m9 18 6-6-6-6"],
  clock: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z", "M12 6v6l4 2"],
  database: ["M4 6c0-2.2 3.6-4 8-4s8 1.8 8 4-3.6 4-8 4-8-1.8-8-4Z", "M4 6v6c0 2.2 3.6 4 8 4s8-1.8 8-4V6", "M4 12v6c0 2.2 3.6 4 8 4s8-1.8 8-4v-6"],
  file: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z", "M14 2v6h6"],
  "file-text": ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z", "M14 2v6h6", "M8 13h8", "M8 17h8", "M8 9h2"],
  "hard-drive": ["M22 12H2l3-7h14l3 7Z", "M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6", "M6 16h.01", "M10 16h.01"],
  link: ["M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1", "M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 12 20.1l1.1-1.1"],
  login: ["M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4", "m10 17 5-5-5-5", "M15 12H3"],
  logout: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "m16 17 5-5-5-5", "M21 12H9"],
  message: ["M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z"],
  "panel-close": ["M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Z", "M9 3v18", "m16 9-3 3 3 3"],
  plus: ["M12 5v14", "M5 12h14"],
  search: ["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z", "m21 21-4.3-4.3"],
  send: ["m22 2-7 20-4-9-9-4 20-7Z", "M22 2 11 13"],
  shield: ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"],
  smile: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z", "M8 14s1.5 2 4 2 4-2 4-2", "M9 9h.01", "M15 9h.01"],
  "thumbs-down": ["M17 14V2", "M7 10v4l5 8 1-1a4 4 0 0 0 1-3v-4h4a3 3 0 0 0 3-3l-1-7a2 2 0 0 0-2-2H7a4 4 0 0 0-4 4v4a2 2 0 0 0 2 2h2Z"],
  "thumbs-up": ["M7 10v12", "M17 14V2", "M7 10l5-8 1 1a4 4 0 0 1 1 3v4h4a3 3 0 0 1 3 3l-1 7a2 2 0 0 1-2 2H7a4 4 0 0 1-4-4v-4a4 4 0 0 1 4-4Z"],
  "trending-down": ["m22 17-8.5-8.5-5 5L2 7", "M16 17h6v-6"],
  "trending-up": ["m22 7-8.5 8.5-5-5L2 17", "M16 7h6v6"],
  upload: ["M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4", "m17 8-5-5-5 5", "M12 3v12"],
  user: ["M20 21a8 8 0 0 0-16 0", "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"],
  x: ["M18 6 6 18", "m6 6 12 12"]
};

export function Icon({
  name,
  size = 18,
  strokeWidth = 2,
  ...props
}: SVGProps<SVGSVGElement> & { name: IconName; size?: number }) {
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
      {...props}
    >
      {paths[name].map((d) => (
        <path d={d} key={d} />
      ))}
    </svg>
  );
}
