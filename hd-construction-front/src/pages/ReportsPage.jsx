import { controlHistory } from "../data/mockData.js";

function QueueTrendChart({ data }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className="control-bar-chart" aria-label="24시간 대기열 추이">
      <div className="chart-baseline" />
      {data.map((item) => (
        <div className={`control-bar control-bar-${item.state}`} key={item.label}>
          <span style={{ height: `${Math.max(18, (item.value / maxValue) * 100)}%` }} />
          <small>{item.label}</small>
        </div>
      ))}
    </div>
  );
}

function PidTrendChart({ data }) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const points = data.map((item, index) => {
    const x = 18 + (index / Math.max(data.length - 1, 1)) * 284;
    const y = 124 - (item.value / maxValue) * 92;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg className="control-line-chart" viewBox="0 0 320 150" preserveAspectRatio="none" role="img" aria-label="24시간 PID 출력 변화">
      <defs>
        <linearGradient id="pidArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0b7f5b" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#0b7f5b" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="chart-grid" d="M18 28 H302 M18 58 H302 M18 88 H302 M18 118 H302" />
      <path className="chart-threshold" d="M18 116 H302" />
      <polygon className="pid-area" points={`18,124 ${points} 302,124`} />
      <polyline className="pid-line" points={points} />
      {data.map((item, index) => {
        const x = 18 + (index / Math.max(data.length - 1, 1)) * 284;
        const y = 124 - (item.value / maxValue) * 92;
        return <circle className="pid-point" cx={x} cy={y} r="3.5" key={item.label} />;
      })}
    </svg>
  );
}

function HistoryLevelBadge({ level }) {
  const normalized = level.toLowerCase().replace(".", "");
  return <span className={`history-level history-level-${normalized}`}>{level}</span>;
}

function ResultBadge({ result }) {
  const isRecovered = result === "회복";
  return (
    <span className={`history-result ${isRecovered ? "recovered" : "review"}`}>
      {isRecovered ? "✓" : "…"} {result}
    </span>
  );
}

function ReportsPage() {
  const { queueTrend, pidTrend, entries } = controlHistory;

  return (
    <section className="workspace control-history-page">
      <header className="control-history-header">
        <div>
          <h2>제어 이력</h2>
          <p>과거 병목 이벤트 및 PID 제어 대응 기록</p>
        </div>
        <div className="history-actions">
          <button type="button" className="history-download-button">↓ Excel 다운로드</button>
          <button type="button" className="history-report-button">▣ PDF 보고서</button>
        </div>
      </header>

      <div className="history-chart-grid">
        <section className="panel history-chart-card">
          <div className="history-panel-title">
            <h3>대기열 추이 이력 (24h)</h3>
            <span aria-hidden="true">⌁</span>
          </div>
          <QueueTrendChart data={queueTrend} />
          <div className="history-chart-caption">
            <span><i className="dot normal" />정상</span>
            <span><i className="dot warning" />주의</span>
            <span><i className="dot critical" />위험</span>
          </div>
        </section>

        <section className="panel history-chart-card">
          <div className="history-panel-title">
            <h3>PID 출력(u) 변화 추이 (24h)</h3>
            <span aria-hidden="true">☷</span>
          </div>
          <PidTrendChart data={pidTrend} />
          <div className="history-chart-caption">
            <span><i className="line-swatch" />제어 출력</span>
            <span><i className="threshold-swatch" />목표 안정선</span>
          </div>
        </section>
      </div>

      <section className="panel control-history-table-panel">
        <div className="history-table-header">
          <div>
            <h3>상세 제어 이력</h3>
            <p>AI 판단, 현장 수동 조치, 작업자 모바일 웹앱 전달 이력을 함께 기록합니다.</p>
          </div>
          <div className="history-filter-row">
            <label>
              <span>검색</span>
              <input type="search" placeholder="이벤트 검색..." />
            </label>
            <button type="button">필터</button>
          </div>
        </div>

        <div className="history-table-wrap">
          <table className="control-history-table">
            <thead>
              <tr>
                <th>시간 (TIME)</th>
                <th>위치 (LOCATION)</th>
                <th>이벤트 타입</th>
                <th>PID 레벨</th>
                <th>실행 조치</th>
                <th>회복 결과</th>
                <th>담당자</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((item) => (
                <tr key={item.id}>
                  <td>{item.time}</td>
                  <td>{item.location}</td>
                  <td>
                    <strong>{item.type}</strong>
                    <small>{item.severity}</small>
                  </td>
                  <td><HistoryLevelBadge level={item.level} /></td>
                  <td>{item.action}</td>
                  <td><ResultBadge result={item.result} /></td>
                  <td>{item.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="history-table-footer">
          <span>Showing 1 to 4 of 128 entries</span>
          <div className="history-pagination">
            <button type="button" disabled>Prev</button>
            <button type="button" className="active">1</button>
            <button type="button">2</button>
            <button type="button">3</button>
            <span>...</span>
            <button type="button">Next</button>
          </div>
        </footer>
      </section>
    </section>
  );
}

export default ReportsPage;
