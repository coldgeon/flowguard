function parsePercent(value) {
  if (typeof value === "number") return value;
  return Number(String(value).replace("%", "")) || 0;
}

import { formatPercent, getRelativeErrorPercent } from "../utils/calculations.js";

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(value, max));
}

function AlgorithmBoard({ selected }) {
  const relativeError = getRelativeErrorPercent(selected.queue);
  const relativeErrorLabel = formatPercent(relativeError);
  const imbalanceRate = parsePercent(selected.imbalanceRate);
  const pidTotal = selected.pid.p.value + selected.pid.i.value + selected.pid.d.value;
  const pidAverage = Math.round(pidTotal / 3);
  const isNormal = selected.level === 1 && selected.status === "정상";
  const isRecovering = selected.status.includes("완화");

  const graphWidth = 680;
  const graphHeight = 300;
  const graphPad = { top: 26, right: 34, bottom: 48, left: 58 };
  const plotWidth = graphWidth - graphPad.left - graphPad.right;
  const plotHeight = graphHeight - graphPad.top - graphPad.bottom;
  const queueMax = 8;
  const rhoMin = 0.7;
  const rhoMax = 1.5;

  const xScale = (queue) => graphPad.left + (clamp(queue, 0, queueMax) / queueMax) * plotWidth;
  const yScale = (rho) => graphPad.top + (1 - ((clamp(rho, rhoMin, rhoMax) - rhoMin) / (rhoMax - rhoMin))) * plotHeight;
  const bubbleRadius = (waitTime) => 7 + clamp(waitTime, 0, 8) * 1.8;

  const coordinatePoints = isNormal
    ? [
      { label: "정상", queue: 1, rho: 1.04, wait: 1, className: "normal" },
      { label: "관찰", queue: 1.2, rho: 1.03, wait: 1.1, className: "normal" },
      { label: "현재", queue: selected.queue, rho: selected.rho, wait: selected.waitTime, className: `current ${selected.level >= 3 ? "danger" : selected.level === 2 ? "warning" : "normal"}` },
    ]
    : isRecovering
      ? [
        { label: "병목", queue: 6, rho: 1.39, wait: 7, className: "danger" },
        { label: "조치", queue: 4.5, rho: 1.24, wait: 5, className: "warning" },
        { label: "현재", queue: selected.queue, rho: selected.rho, wait: selected.waitTime, className: `current ${selected.level >= 3 ? "danger" : selected.level === 2 ? "warning" : "normal"}` },
      ]
      : [
        { label: "정상", queue: 1, rho: 1.04, wait: 1, className: "normal" },
        { label: "누적", queue: 3, rho: 1.16, wait: 3.6, className: "warning" },
        { label: "경고", queue: 4.5, rho: 1.24, wait: 5.2, className: "warning" },
        { label: "현재", queue: selected.queue, rho: selected.rho, wait: selected.waitTime, className: `current ${selected.level >= 3 ? "danger" : selected.level === 2 ? "warning" : "normal"}` },
      ];

  const vectorPath = coordinatePoints.map((point, index) => `${index === 0 ? "M" : "L"} ${xScale(point.queue).toFixed(1)} ${yScale(point.rho).toFixed(1)}`).join(" ");
  const dangerX = xScale(4);
  const dangerY = yScale(1.2);
  const currentPoint = coordinatePoints[coordinatePoints.length - 1];
  const queueScore = clamp((selected.queue / 6) * 100);
  const rhoScore = clamp(((selected.rho - 1) / 0.39) * 100);
  const waitScore = clamp((selected.waitTime / 7) * 100);
  const algorithmScore = Math.round((queueScore + rhoScore + waitScore + pidAverage) / 4);

  const metricRows = [
    { label: "대기열", value: `${selected.queue}대`, score: Math.round(queueScore), danger: selected.queue >= 5 },
    { label: "ρ", value: selected.rho, score: Math.round(rhoScore), danger: selected.rho >= 1.2 },
    { label: "평균 대기", value: `${selected.waitTime}분`, score: Math.round(waitScore), danger: selected.waitTime >= 6 },
  ];

  const algorithmRows = [
    {
      name: "Queueing",
      input: "트럭 도착률, 하차 처리율",
      formula: "ρ = λ / μ",
      threshold: "ρ > 1.0 누적, 1.2 이상 위험",
      value: `ρ ${selected.rho}`,
      result: selected.rho >= 1.2 ? "처리율 초과" : selected.rho >= 1 ? "누적 주의" : "안정",
      action: "진입 제한, 우회",
      color: selected.rho >= 1.2 ? "red" : selected.rho >= 1 ? "orange" : "green",
    },
    {
      name: "Relative Error",
      input: "예측 대기열, 실제 대기열",
      formula: "max(0,Q-Q*) / Q*",
      threshold: "50% 이상 이상징후",
      value: relativeErrorLabel,
      result: relativeError >= 100 ? "급격한 오차" : relativeError >= 50 ? "주의" : "안정",
      action: "원인 분석 우선순위 상승",
      color: relativeError >= 100 ? "red" : relativeError >= 50 ? "orange" : "green",
    },
    {
      name: "Line Balance",
      input: "상차/운반/하차 cycle",
      formula: "구간 편차 / 평균 cycle",
      threshold: "20% 이상 불균형",
      value: selected.imbalanceRate,
      result: imbalanceRate >= 50 ? "강한 불균형" : imbalanceRate >= 20 ? "불균형" : "정상",
      action: "장비/트럭 재배치",
      color: imbalanceRate >= 50 ? "red" : imbalanceRate >= 20 ? "orange" : "green",
    },
    {
      name: "PID Response",
      input: "현재 병목, 누적 지연, 악화 속도",
      formula: "u = P + I + D",
      threshold: "평균 65 이상 Level 3",
      value: `P${selected.pid.p.value} I${selected.pid.i.value} D${selected.pid.d.value}`,
      result: pidAverage >= 65 ? "Level 3 처방" : pidAverage >= 45 ? "Level 2 처방" : "Level 1 모니터링",
      action: selected.recommendation,
      color: pidAverage >= 65 ? "red" : pidAverage >= 45 ? "orange" : "green",
    },
  ];

  return (
    <section className="panel algorithm-board">
      <div className="panel-header">
        <div>
          <h3>핵심 알고리즘 좌표 그래프</h3>
          <p>대기열, Queue 이용률, 평균 대기시간이 병목 좌표로 이동하는 과정을 시각화</p>
        </div>
      </div>

      <div className="algorithm-body">
        <div className="algorithm-graph-layout">
          <article className="algorithm-coordinate-card">
            <div className="coordinate-head">
              <div>
                <strong>병목 판정 좌표계</strong>
                <span>x = 대기 트럭 수 · y = Queue 이용률 ρ · 원 크기 = 평균 대기시간</span>
              </div>
              <b className={`score-chip ${algorithmScore >= 70 ? "red" : algorithmScore >= 45 ? "orange" : "green"}`}>판정 점수 {algorithmScore}</b>
            </div>

            <svg key={`${selected.id}-${selected.queue}-${selected.rho}`} className="coordinate-svg" viewBox={`0 0 ${graphWidth} ${graphHeight}`} role="img" aria-label="대기열과 Queue 이용률 병목 좌표 그래프">
              <defs>
                <marker id="axis-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                  <path d="M0,0 L6,3.5 L0,7 Z" />
                </marker>
                <marker id="vector-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                  <path d="M0,0 L8,4 L0,8 Z" />
                </marker>
              </defs>

              <rect className="danger-zone" x={dangerX} y={graphPad.top} width={graphWidth - graphPad.right - dangerX} height={dangerY - graphPad.top} rx="8" />
              <rect className="warning-zone" x={dangerX} y={dangerY} width={graphWidth - graphPad.right - dangerX} height={graphHeight - graphPad.bottom - dangerY} rx="8" />

              {[0, 2, 4, 6, 8].map((tick) => (
                <g key={`x-${tick}`} className="axis-tick">
                  <line x1={xScale(tick)} y1={graphPad.top} x2={xScale(tick)} y2={graphHeight - graphPad.bottom} />
                  <text x={xScale(tick)} y={graphHeight - 18}>{tick}</text>
                </g>
              ))}
              {[0.8, 1.0, 1.2, 1.4].map((tick) => (
                <g key={`y-${tick}`} className="axis-tick">
                  <line x1={graphPad.left} y1={yScale(tick)} x2={graphWidth - graphPad.right} y2={yScale(tick)} />
                  <text x={18} y={yScale(tick) + 4}>{tick.toFixed(1)}</text>
                </g>
              ))}

              <line className="threshold-line" x1={dangerX} y1={graphPad.top} x2={dangerX} y2={graphHeight - graphPad.bottom} />
              <line className="threshold-line" x1={graphPad.left} y1={dangerY} x2={graphWidth - graphPad.right} y2={dangerY} />
              <text className="threshold-label" x={dangerX + 8} y={dangerY - 9}>병목 기준 x≥4, ρ≥1.2</text>

              <line className="axis-line" x1={graphPad.left} y1={graphHeight - graphPad.bottom} x2={graphWidth - 18} y2={graphHeight - graphPad.bottom} markerEnd="url(#axis-arrow)" />
              <line className="axis-line" x1={graphPad.left} y1={graphHeight - graphPad.bottom} x2={graphPad.left} y2={14} markerEnd="url(#axis-arrow)" />
              <text className="axis-label x-label" x={graphWidth - 156} y={graphHeight - 4}>대기 트럭 수</text>
              <text className="axis-label y-label" x={graphPad.left + 8} y={16}>Queue 이용률 ρ</text>

              <path className="bottleneck-vector" d={vectorPath} markerEnd="url(#vector-arrow)" />

              {coordinatePoints.map((point) => (
                <g key={`${point.label}-${point.queue}-${point.rho}`} className={`coordinate-point ${point.className}`} style={{ "--bubble-r": `${bubbleRadius(point.wait)}px` }}>
                  <circle cx={xScale(point.queue)} cy={yScale(point.rho)} r={bubbleRadius(point.wait)} />
                  <text x={xScale(point.queue) + 12} y={yScale(point.rho) - 12}>{point.label}</text>
                </g>
              ))}
            </svg>
          </article>

          <aside className="algorithm-reading-panel">
            <div className="current-coordinate">
              <span>현재 좌표</span>
              <strong>({selected.queue}대, ρ {selected.rho})</strong>
              <p>평균 대기 {selected.waitTime}분 · 상대오차 {relativeErrorLabel} · 불균형률 {selected.imbalanceRate}</p>
            </div>
            <div className="coordinate-metrics">
              {metricRows.map((row) => (
                <div key={row.label} className={row.danger ? "danger" : ""}>
                  <span>{row.label}</span>
                  <strong>{row.value}</strong>
                  <i><b style={{ width: `${row.score}%` }} /></i>
                </div>
              ))}
            </div>
            <div className="pid-stack-card coordinate-pid">
              <div className="trend-head">
                <strong>PID 처방 강도</strong>
                <span>Level {selected.level}</span>
              </div>
              <div className="pid-stack">
                <i className="p" style={{ width: `${(selected.pid.p.value / pidTotal) * 100}%` }}>P</i>
                <i className="i" style={{ width: `${(selected.pid.i.value / pidTotal) * 100}%` }}>I</i>
                <i className="d" style={{ width: `${(selected.pid.d.value / pidTotal) * 100}%` }}>D</i>
              </div>
              <p>P 현재 대기열 · I 누적 지연 · D 악화 속도</p>
            </div>
          </aside>
        </div>

        <div className="algorithm-table-wrap">
          <table className="algorithm-table">
            <thead>
              <tr>
                <th>알고리즘</th>
                <th>보는 데이터</th>
                <th>계산식</th>
                <th>기준</th>
                <th>현재값</th>
                <th>판정</th>
                <th>연결 조치</th>
              </tr>
            </thead>
            <tbody>
              {algorithmRows.map((row) => (
                <tr key={row.name}>
                  <td data-label="알고리즘"><strong>{row.name}</strong></td>
                  <td data-label="보는 데이터">{row.input}</td>
                  <td data-label="계산식"><code>{row.formula}</code></td>
                  <td data-label="기준">{row.threshold}</td>
                  <td data-label="현재값">{row.value}</td>
                  <td data-label="판정"><span className={`algorithm-result ${row.color}`}>{row.result}</span></td>
                  <td data-label="연결 조치">{row.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default AlgorithmBoard;

