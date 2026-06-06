import { bottlenecks as baseBottlenecks } from "../data/mockData.js";

import { TARGET_QUEUE, getQueueError } from "../utils/calculations.js";

function weightValue(key, selected) {
  if (key === "P") return selected.level >= 3 ? "2.4" : "1.1";
  if (key === "I") return selected.level >= 3 ? "2.1" : "0.9";
  return selected.level >= 3 ? "0.5" : "0.3";
}

function DiagnosisPage({ selectedBottleneckId, onNavigate, bottlenecksData = baseBottlenecks }) {
  const selected = bottlenecksData.find((item) => item.id === selectedBottleneckId) || bottlenecksData[0];
  const error = getQueueError(selected.queue);
  const controlOutput = selected.level >= 3 ? "5.0" : selected.level === 2 ? "3.2" : "1.4";
  const controlLevel = `Level ${selected.level}`;
  const controlDominant = selected.level >= 3 ? "P + I" : selected.level === 2 ? "P + D" : "감시";
  const recoveryMinutes = selected.level >= 3 ? 12 : selected.level === 2 ? 8 : 0;
  const pidCards = [
    { key: "P", title: "비례 제어", subtitle: "현재 병목 크기", item: selected.pid.p, memo: `현재 대기열이 목표치보다 ${error}대 많음` },
    { key: "I", title: "적분 제어", subtitle: "누적 지연 시간", item: selected.pid.i, memo: "지연이 18분간 누적됨" },
    { key: "D", title: "미분 제어", subtitle: "병목 증가율", item: selected.pid.d, memo: selected.pid.d.value > 50 ? "증가세가 빨라지고 있음" : "증가세가 둔화되었으나 여전히 불안정함" },
  ];

  return (
    <section className="workspace pid-page">
      <div className="pid-title-block">
        <h2>PID 처방 분석</h2>
        <p>시스템이 감지한 병목 현상에 대한 AI-PID 기반 제어 변수 및 시뮬레이션 결과입니다.</p>
      </div>

      <div className="pid-summary-grid">
        <article><span>병목 위치</span><strong>{selected.name}</strong></article>
        <article><span>현재 대기열</span><strong>{selected.queue}<small>대</small></strong></article>
        <article><span>목표 대기열</span><strong className="green-text">{TARGET_QUEUE}<small>대</small></strong></article>
        <article><span>병목 오차 (E)</span><strong className="danger-text">+{error}</strong></article>
        <article className="level-card"><span>대응 레벨</span><strong>Level {selected.level}</strong></article>
      </div>

      <section className="pid-variable-section">
        <h3>PID 제어 변수 분석</h3>
        <div className="pid-variable-grid">
          {pidCards.map((card) => (
            <article className="pid-variable-card" key={card.key}>
              <div className="pid-var-head"><strong>{card.key}</strong><span>{card.item.label}</span></div>
              <p>{card.title} ({card.subtitle})</p>
              <div className="pid-weight"><strong>{weightValue(card.key, selected)}</strong><span>가중치</span></div>
              <div className="pid-mini-bar"><i style={{ width: `${card.item.value}%` }} /></div>
              <footer>{card.memo}</footer>
            </article>
          ))}

          <aside className="control-output-card">
            <div>
              <h3>제어 출력 <span>(Control Output)</span></h3>
              <p>시스템 요구 투입량 (u)</p>
            </div>
            <div className="output-ring"><strong>{controlOutput}</strong><span>/ 5.0</span></div>
            <div className="output-rows">
              <div><span>요구 대응 레벨</span><b>{controlLevel}</b></div>
              <div><span>주요 제어 항</span><strong>{controlDominant}</strong></div>
              <div><span>과응답 방지</span><strong>{selected.level >= 2 ? "활성" : "대기"}</strong></div>
            </div>
          </aside>
        </div>
      </section>

      <section className="xite-panel recovery-panel">
        <div className="recovery-head">
          <div><h3>복구 예상 시뮬레이션</h3><p>제안된 제어 출력 적용 시 목표 대기열 도달 궤적 예측</p></div>
          <div className="recovery-head-actions">
            <div className="recovery-time">예상 복구 시간: <strong>{recoveryMinutes ? `${recoveryMinutes}분` : "관찰"}</strong></div>
            <button className="primary-button" type="button" onClick={() => onNavigate("alerts")}>추천 조치 보기</button>
          </div>
        </div>
        <div className="recovery-chart" aria-label="복구 예상 시뮬레이션 그래프">
          <svg viewBox="0 0 920 260" role="img">
            <line x1="72" y1="36" x2="72" y2="222" />
            <line x1="72" y1="222" x2="872" y2="222" />
            <line className="grid" x1="72" y1="72" x2="872" y2="72" />
            <line className="grid" x1="72" y1="144" x2="872" y2="144" />
            <line className="target" x1="72" y1="204" x2="872" y2="204" />
            <text x="28" y="75">8대</text>
            <text x="28" y="147">5대</text>
            <text x="28" y="207">2대</text>
            <path className="without" d="M86 54 C220 76 360 80 500 70 C650 58 760 76 872 92" />
            <path className="with" d="M86 54 C180 62 260 112 342 154 C430 198 510 208 590 208 C700 208 790 208 872 208" />
            <circle className="chart-focus" cx="590" cy="208" r="5" />
          </svg>
          <div className="chart-legend"><span className="with">제어 적용 궤적</span><span className="without">미적용 궤적</span></div>
        </div>
      </section>
    </section>
  );
}

export default DiagnosisPage;
