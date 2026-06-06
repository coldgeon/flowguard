import { bottlenecks as baseBottlenecks } from "../data/mockData.js";

import { TARGET_QUEUE, formatPercent, getQueueError, getRelativeErrorPercent } from "../utils/calculations.js";

function AlertsPage({ instructions, rates, onSendInstruction, onSendAllInstructions, onApplyDemoResponses, onNavigate, selectedBottleneckId, bottlenecksData = baseBottlenecks }) {
  const bottleneck = bottlenecksData.find((item) => item.id === selectedBottleneckId) || bottlenecksData[0];
  const queueError = getQueueError(bottleneck.queue);
  const relativeErrorPercent = getRelativeErrorPercent(bottleneck.queue);
  const relativeErrorLabel = formatPercent(relativeErrorPercent);
  const queueUsePercent = Math.round(bottleneck.rho * 100);
  const activeRecommendationCount = bottleneck.level >= 3 ? 3 : bottleneck.level === 2 ? 2 : 1;
  const expectedImprovement = bottleneck.level >= 3 ? 18.5 : bottleneck.level === 2 ? 9.5 : 3.0;
  const summaryBarWidth = `${Math.max(8, Math.min(100, Math.round((expectedImprovement / 20) * 100)))}%`;
  const relativeErrorClass = relativeErrorPercent >= 100 ? "danger-text" : relativeErrorPercent >= 50 ? "orange-text" : "green-text";
  const queueUseClass = queueUsePercent >= 120 ? "danger-text" : queueUsePercent >= 108 ? "orange-text" : "green-text";
  const recommendations = [
    {
      id: "P1",
      title: "유입 트럭 제한 (하차 구역 A)",
      trigger: "P 항 높음",
      effect: "대기열 즉시 감소",
      status: "추천됨",
      tone: "red",
      button: "조치 실행",
      action: () => onSendInstruction?.("T12"),
    },
    {
      id: "P2",
      title: "보조 하차 구역 B로 우회",
      trigger: "P+I 복합",
      effect: "누적 지연 해소",
      status: "대기 중",
      tone: "orange",
      button: "조치 실행",
      action: () => onSendInstruction?.("T7"),
    },
    {
      id: "P3",
      title: "배차 간격 조정",
      trigger: "D 항 상승",
      effect: "대기열 증가 억제",
      status: "시뮬레이션 중",
      tone: "yellow",
      button: "시뮬레이션 확인",
      action: onApplyDemoResponses,
    },
  ];

  return (
    <section className="workspace recommend-page">
      <div className="recommend-title">
        <h2>추천 조치</h2>
        <p>현재 병목 해소를 위한 AI 권장 조치 리스트</p>
      </div>

      <div className="recommend-layout">
        <div className="recommend-list">
          {recommendations.map((item) => (
            <article className={`recommend-card ${item.tone}`} key={item.id}>
              <div className="recommend-card-head">
                <span>{item.id}</span>
                <h3>{item.title}</h3>
                <b>{item.status}</b>
              </div>
              <div className="recommend-card-body">
                <div><small>TRIGGER</small><strong>{item.trigger}</strong></div>
                <div><small>예상 효과</small><strong>{item.effect}</strong></div>
              </div>
              <button className={item.id === "P1" ? "primary-button" : "panel-link"} type="button" onClick={item.action}>{item.button}</button>
            </article>
          ))}
        </div>

        <aside className="xite-panel recommend-summary">
          <h3>요약 보고서</h3>
          <div className="summary-divider" />
          <div className="summary-metric"><span>활성 추천 조치</span><strong>{activeRecommendationCount}<small>건</small></strong></div>
          <div className="summary-metric"><span>예상 종합 개선율</span><strong>+{expectedImprovement.toFixed(1)}%</strong><b>효율 증가</b></div>
          <div className="summary-bar"><i style={{ width: summaryBarWidth }} /></div>
          <div className="summary-divider" />
          <div className="resource-list">
            <div><span>현재/목표 대기열</span><strong className={queueError > 0 ? "danger-text" : "green-text"}>{bottleneck.queue}/{TARGET_QUEUE}대</strong></div>
            <div><span>상대오차</span><strong className={relativeErrorClass}>{relativeErrorLabel}</strong></div>
            <div><span>Queue 이용률 ρ</span><strong className={queueUseClass}>{queueUsePercent}%</strong></div>
            <div><span>작업자 확인률</span><strong className="green-text">{rates.confirm}%</strong></div>
          </div>
          <button className="primary-button full" type="button" onClick={onSendAllInstructions}>모바일 웹앱 일괄 발송</button>
          <button className="panel-link full" type="button" onClick={() => onNavigate("mobile")}>작업자 화면 보기</button>
        </aside>
      </div>

      <section className="xite-panel mobile-dispatch-strip">
        <div className="xite-panel-head"><h3>작업자별 모바일 지시 상태</h3></div>
        <div className="dispatch-chip-grid">
          {instructions.map((item) => (
            <button key={item.id} type="button" onClick={() => onSendInstruction?.(item.id)}>
              <strong>{item.id}</strong><span>{item.action}</span><b>{item.status}</b>
            </button>
          ))}
        </div>
      </section>
    </section>
  );
}

export default AlertsPage;
