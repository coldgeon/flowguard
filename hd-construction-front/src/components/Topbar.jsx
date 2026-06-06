import { site } from "../data/mockData.js";

const pageTitles = {
  dashboard: "FlowGuard",
  diagnosis: "토공 현장 A",
  alerts: "토공 현장 A",
  mobile: "작업자 모바일 웹앱",
  reports: "토공 현장 A",
  fleet: "토공 현장 A",
};

function Topbar({
  activePage,
  autoMode,
  onToggleAuto,
  rates,
  selectedBottleneck,
  liveMode,
  scenarioRunning,
  onRunScenario,
  onToggleLiveMode,
  onStepScenario,
}) {
  const title = pageTitles[activePage] || "FlowGuard";
  const showDemoControls = activePage === "dashboard";

  return (
    <header className="topbar xite-topbar">
      <div className="site-title xite-top-title">
        <h2>{title}</h2>
      </div>

      <div className="top-actions xite-top-actions">
        {showDemoControls && (
          <div className="top-demo-controls" aria-label="대시보드 시연 제어">
            <button className={`live-toggle ${liveMode ? "on" : ""}`} type="button" onClick={onToggleLiveMode}>
              {liveMode ? "실시간 데모 ON" : "실시간 데모 OFF"}
            </button>
            <button className="panel-link scenario-next" type="button" onClick={onStepScenario}>다음 이벤트</button>
            <button className="primary-button scenario-trigger" type="button" onClick={onRunScenario} disabled={scenarioRunning}>
              {scenarioRunning ? "시나리오 진행 중" : "예시 시나리오 실행"}
            </button>
          </div>
        )}
        <button className="sync-pill" type="button" aria-pressed={autoMode} onClick={onToggleAuto}>
          <i /> 실시간 동기화 상태
        </button>
        <button className="top-icon-button" type="button" aria-label="새로고침">R</button>
        <button className="top-icon-button" type="button" aria-label="알림">N</button>
        <button className="top-icon-button user" type="button" aria-label="사용자">U</button>
        <div className="top-context">
          <strong>{selectedBottleneck?.name || "하차장 A"}</strong>
          <span>확인률 {rates?.confirm || 0}%</span>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
