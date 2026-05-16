"use client";

import type { CSSProperties, ReactNode } from "react";
import { Icon, type IconName } from "./Icons";
import type { UploadedDocument } from "./types";

interface AnalyticsPanelProps {
  documents: UploadedDocument[];
  queries: string[];
  satisfaction: { up: number; down: number };
}

const topSubjects = [
  { subject: "Financial Reports", queries: 142, pct: 100 },
  { subject: "AI & Machine Learning", queries: 118, pct: 83 },
  { subject: "HR Policies", queries: 97, pct: 68 },
  { subject: "Legal Compliance", queries: 84, pct: 59 },
  { subject: "Technical Documentation", queries: 71, pct: 50 },
  { subject: "Strategic Planning", queries: 63, pct: 44 },
  { subject: "Product Roadmap", queries: 55, pct: 39 }
];

const leastSubjects = [
  { subject: "Travel Policies", queries: 4, pct: 100 },
  { subject: "Office Supplies", queries: 6, pct: 67 },
  { subject: "Admin Forms", queries: 9, pct: 44 },
  { subject: "Onboarding Checklist", queries: 11, pct: 33 },
  { subject: "Meeting Notes Archive", queries: 14, pct: 22 }
];

const queryVolume = [12, 34, 51, 28, 19, 47, 63, 55, 31];
const queryLabels = ["9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM"];
const triggerWords = [
  { word: "renewal risk", hits: 39, pct: 100 },
  { word: "pricing pressure", hits: 31, pct: 79 },
  { word: "expansion opportunity", hits: 26, pct: 67 },
  { word: "churn signal", hits: 22, pct: 56 },
  { word: "discount request", hits: 18, pct: 46 }
];
const revenueFocus = [
  { band: "3500+", clients: 17, share: "38%" },
  { band: "2500-3499", clients: 26, share: "34%" },
  { band: "1000-2499", clients: 21, share: "20%" },
  { band: "<1000", clients: 13, share: "8%" }
];
const costMetrics = {
  totalTokens: 182340,
  modelCalls: 468,
  avgCostPerRequest: 0.018
};

export function AnalyticsPanel({ documents, queries, satisfaction }: AnalyticsPanelProps) {
  const totalQueries = queries.length + 340;
  const totalRated = satisfaction.up + satisfaction.down;
  const satisfactionPct = totalRated > 0 ? Math.round((satisfaction.up / totalRated) * 100) : null;
  const positiveDegrees = totalRated > 0 ? `${(satisfaction.up / totalRated) * 360}deg` : "0deg";

  return (
    <section className="page" aria-label="Analytics">
      <header className="page-header">
        <div>
          <h1 className="rag-h1">Analytics</h1>
          <p className="rag-h5" style={{ color: "rgba(26,58,107,0.5)", marginTop: 1 }}>
            Session usage - knowledge base insights
          </p>
        </div>
        <div className="status-pill">
          <span className="status-dot ready" />
          <span>Live session</span>
        </div>
      </header>

      <div className="analytics-body">
        <div className="stat-grid">
          <StatCard accent="#1565C0" icon="search" label="Total Queries" sub="this session" value={totalQueries} />
          <StatCard accent="#1A3A6B" icon="file-text" label="Documents Loaded" sub="in knowledge base" value={documents.length} />
          <StatCard accent="#00B050" icon="clock" label="Avg Response" sub="retrieval latency" value="1.4s" />
          <StatCard accent="#F59E0B" icon="activity" label="Retrieval Rate" sub="queries answered" value="94%" />
        </div>

        <SectionCard title="Answer Satisfaction" subtitle="User feedback collected from thumbs-up / thumbs-down ratings in chat">
          <div className="satisfaction">
            <div
              className={`donut${totalRated === 0 ? " empty" : ""}`}
              style={{ "--positive": positiveDegrees } as CSSProperties}
            >
              <div className="donut-label">
                {satisfactionPct !== null ? (
                  <>
                    <strong>{satisfactionPct}%</strong>
                    <span className="rag-meta">positive</span>
                  </>
                ) : (
                  <Icon name="smile" size={22} style={{ color: "rgba(26,58,107,0.22)" }} />
                )}
              </div>
            </div>

            <div className="meter-group">
              <Meter
                color="var(--rag-success)"
                icon="thumbs-up"
                label="Helpful"
                total={totalRated}
                value={satisfaction.up}
              />
              <Meter
                color="var(--rag-danger)"
                icon="thumbs-down"
                label="Not helpful"
                total={totalRated}
                value={satisfaction.down}
              />
              <p className="rag-meta">
                {totalRated === 0
                  ? "No ratings yet - rate answers in the Chat tab using the thumbs icons."
                  : `${totalRated} answer${totalRated === 1 ? "" : "s"} rated this session`}
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Query Volume - Today" subtitle="Number of queries per hour">
          <LineChart values={queryVolume} labels={queryLabels} />
        </SectionCard>

        <div className="two-column">
          <SectionCard title="Most Searched Subjects" subtitle="Top topics queried against the knowledge base">
            <div className="rank-list">
              {topSubjects.map((subject, index) => (
                <BarRow
                  color="var(--rag-blue)"
                  key={subject.subject}
                  label={subject.subject}
                  prefix={<span className={`rank-number${index < 3 ? " top" : ""}`}>{index + 1}</span>}
                  pct={subject.pct}
                  value={subject.queries}
                />
              ))}
              <div className="insight-note">
                <Icon name="trending-up" size={12} style={{ color: "var(--rag-success)" }} />
                <span>Financial Reports up 18% from last session</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Least Searched Subjects" subtitle="Topics with low engagement in the knowledge base">
            <div className="bar-list">
              {leastSubjects.map((subject) => (
                <BarRow
                  color="rgba(26,58,107,0.35)"
                  key={subject.subject}
                  label={subject.subject}
                  pct={subject.pct}
                  value={subject.queries}
                />
              ))}
              <div className="insight-note">
                <Icon name="trending-down" size={12} style={{ color: "var(--rag-warning)" }} />
                <span>Consider archiving low-engagement documents</span>
              </div>
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Salesforce Consolidation & Revenue Focus" subtitle="RAG trigger words, client sentiment, and high-value client concentration">
          <div className="two-column" style={{ gap: 12 }}>
            <div className="section-card" style={{ border: "1px solid var(--rag-border)", boxShadow: "none" }}>
              <div className="section-card-header">
                <p className="section-card-title">RAG Trigger Words</p>
                <p className="rag-meta" style={{ marginTop: 1 }}>Detected from Salesforce-linked conversation patterns</p>
              </div>
              <div className="section-card-body">
                <div className="bar-list">
                  {triggerWords.map((item) => (
                    <BarRow
                      color="var(--rag-blue)"
                      key={item.word}
                      label={item.word}
                      pct={item.pct}
                      value={item.hits}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="section-card" style={{ border: "1px solid var(--rag-border)", boxShadow: "none" }}>
              <div className="section-card-header">
                <p className="section-card-title">Client Sentiment + True Revenue</p>
                <p className="rag-meta" style={{ marginTop: 1 }}>Priority on 2500-3500+ revenue clients</p>
              </div>
              <div className="section-card-body">
                <div className="meter-group">
                  <Meter color="var(--rag-success)" icon="smile" label="Positive sentiment" total={100} value={72} />
                  <Meter color="var(--rag-warning)" icon="activity" label="Neutral sentiment" total={100} value={20} />
                  <Meter color="var(--rag-danger)" icon="alert" label="Negative sentiment" total={100} value={8} />
                </div>
                <div className="rank-list" style={{ marginTop: 14 }}>
                  {revenueFocus.map((row, index) => (
                    <BarRow
                      color={index < 2 ? "var(--rag-success)" : "rgba(26,58,107,0.35)"}
                      key={row.band}
                      label={`$${row.band}`}
                      pct={Math.max(12, Number.parseInt(row.share, 10))}
                      value={row.clients}
                    />
                  ))}
                  <div className="insight-note">
                    <Icon name="trending-up" size={12} style={{ color: "var(--rag-success)" }} />
                    <span>Top-tier ($2500-3500+) clients represent 72% of tracked revenue-focused accounts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Cost Tracking" subtitle="Token consumption, model calls, and request-level spend">
          <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
            <StatCard
              accent="#1A3A6B"
              icon="activity"
              label="Total Tokens"
              sub="prompt + completion"
              value={costMetrics.totalTokens.toLocaleString()}
            />
            <StatCard
              accent="#1565C0"
              icon="bot"
              label="Model Calls"
              sub="requests to LLM endpoints"
              value={costMetrics.modelCalls}
            />
            <StatCard
              accent="#00B050"
              icon="bar-chart"
              label="Cost / Request"
              sub="average estimated spend"
              value={`$${costMetrics.avgCostPerRequest.toFixed(3)}`}
            />
          </div>
        </SectionCard>
      </div>
    </section>
  );
}

function StatCard({
  accent,
  icon,
  label,
  sub,
  value
}: {
  accent: string;
  icon: IconName;
  label: string;
  sub: string;
  value: number | string;
}) {
  return (
    <article className="stat-card">
      <div className="stat-icon" style={{ background: `${accent}18`, color: accent }}>
        <Icon name={icon} size={18} />
      </div>
      <div>
        <strong>{value}</strong>
        <p className="rag-h2" style={{ color: "var(--rag-primary)", marginTop: 1 }}>
          {label}
        </p>
        <p className="rag-meta" style={{ marginTop: 1 }}>
          {sub}
        </p>
      </div>
    </article>
  );
}

function SectionCard({
  children,
  subtitle,
  title
}: {
  children: ReactNode;
  subtitle?: string;
  title: string;
}) {
  return (
    <article className="section-card">
      <div className="section-card-header">
        <p className="section-card-title">{title}</p>
        {subtitle ? <p className="rag-meta" style={{ marginTop: 1 }}>{subtitle}</p> : null}
      </div>
      <div className="section-card-body">{children}</div>
    </article>
  );
}

function Meter({
  color,
  icon,
  label,
  total,
  value
}: {
  color: string;
  icon: IconName;
  label: string;
  total: number;
  value: number;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div>
      <div className="meter-label">
        <span style={{ alignItems: "center", color: "var(--rag-primary)", display: "flex", gap: 6, fontSize: 11, fontWeight: 700 }}>
          <Icon name={icon} size={12} style={{ color }} />
          {label}
        </span>
        <span style={{ color, fontSize: 11, fontWeight: 700 }}>{value}</span>
      </div>
      <div className="meter-track" style={{ background: `${color}18` }}>
        <div className="meter-fill" style={{ background: color, width: `${pct}%` }} />
      </div>
    </div>
  );
}

function LineChart({ labels, values }: { labels: string[]; values: number[] }) {
  const width = 700;
  const height = 170;
  const padding = 24;
  const max = Math.max(...values);
  const points = values.map((value, index) => {
    const x = padding + (index / (values.length - 1)) * (width - padding * 2);
    const y = height - padding - (value / max) * (height - padding * 2);
    return { x, y, value, label: labels[index] };
  });
  const pointString = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <svg className="line-chart" role="img" viewBox={`0 0 ${width} ${height}`} aria-label="Hourly query volume line chart">
      {[0, 1, 2, 3].map((line) => {
        const y = padding + line * ((height - padding * 2) / 3);
        return <line key={line} x1={padding} x2={width - padding} y1={y} y2={y} stroke="rgba(26,58,107,0.08)" strokeDasharray="4 4" />;
      })}
      <polyline fill="none" points={pointString} stroke="var(--rag-blue)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      {points.map((point) => (
        <g key={point.label}>
          <circle cx={point.x} cy={point.y} fill="var(--rag-blue)" r="4" />
          <text fill="rgba(26,58,107,0.55)" fontSize="10" textAnchor="middle" x={point.x} y={height - 4}>
            {point.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function BarRow({
  color,
  label,
  pct,
  prefix,
  value
}: {
  color: string;
  label: string;
  pct: number;
  prefix?: ReactNode;
  value: number;
}) {
  return (
    <div className="bar-row">
      {prefix}
      <span className="bar-label truncate" title={label}>
        {label}
      </span>
      <span className="bar-track">
        <span className="bar-fill" style={{ background: color, width: `${pct}%` }} />
      </span>
      <span className="bar-value">{value}</span>
    </div>
  );
}
