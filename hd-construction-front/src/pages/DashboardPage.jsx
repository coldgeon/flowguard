import { bottlenecks as baseBottlenecks } from "../data/mockData.js";

import { TARGET_QUEUE, formatPercent, getQueueError, getRelativeErrorPercent } from "../utils/calculations.js";

function riskPercent(selected) {
  if (selected.level >= 3 || selected.status === "병목") return 92;
  if (selected.level === 2 || selected.status.includes("혼잡")) return 64;
  return 18;
}

function riskLabel(selected) {
  if (selected.level >= 3 || selected.status === "병목") return "위험";
  if (selected.level === 2 || selected.status.includes("혼잡")) return "주의";
  return "정상";
}

function DashboardPage({
  selectedBottleneckId,
  onSelectBottleneck,
  onNavigate,
  instructions = [],
  rates,
  bottlenecksData = baseBottlenecks,
  scenarioStage,
  scenarioStepIndex = 0,
  liveMode,
  simTick = 0,
  onSendAllInstructions,
}) {
  const selected = bottlenecksData.find((item) => item.id === selectedBottleneckId) || bottlenecksData[0];
  const stageId = scenarioStage?.id || "normal";
  const stageTitle = scenarioStage?.title || "정상 운영";
  const stageStep = scenarioStage?.step || "1단계";
  const risk = riskPercent(selected);
  const isDanger = risk >= 80;
  const avgCycle = selected.level >= 3 ? 14.2 : selected.cycleTime;
  const waitRatio = selected.level >= 3 ? 34 : Math.max(8, Math.round(selected.waitTime * 9));
  const arrivalRate = selected.level >= 3 ? 16.0 : selected.level === 2 ? 13.4 : 10.8;
  const processRate = selected.level >= 3 ? 11.5 : selected.level === 2 ? 12.0 : 12.5;
  const imbalanceIndex = selected.rho >= 1.2 ? "1.52" : selected.rho >= 1.08 ? "1.18" : "1.04";
  const controlOutput = selected.level >= 3 ? "5.0" : selected.level === 2 ? "3.2" : "1.4";
  const queueError = getQueueError(selected.queue);
  const relativeErrorPercent = getRelativeErrorPercent(selected.queue);
  const relativeErrorLabel = formatPercent(relativeErrorPercent);
  const isAlgorithmSpike = selected.level >= 3 || stageId === "bottleneck" || stageId === "judgment";
  const t7Status = instructions.find((item) => item.id === "T7")?.status || "발송 준비";
  const t12Status = instructions.find((item) => item.id === "T12")?.status || "발송 준비";
  const w04Status = instructions.find((item) => item.id === "W04")?.status || "발송 준비";

  const kpis = [
    { label: "가동 장비", value: "24", unit: "대", tone: "green", foot: "정상 연결", icon: "OK" },
    { label: "덤프트럭 수", value: "18", unit: "대", tone: "green", foot: "운행 중", icon: "TR" },
    { label: "평균 사이클 타임", value: avgCycle, unit: "분", tone: "neutral", foot: selected.level >= 3 ? "기준 대비 상승" : "정상 범위", icon: "CT" },
    { label: "현재 대기열", value: selected.queue, unit: "대", tone: isDanger ? "red" : "green", foot: isDanger ? "위험" : "안정", icon: "Q" },
    { label: "병목 위험도", value: `${risk}%`, unit: "", tone: isDanger ? "danger" : "green", foot: riskLabel(selected), icon: "BN" },
    { label: "대기율", value: `${waitRatio}%`, unit: "", tone: waitRatio > 30 ? "orange" : "green", foot: waitRatio > 30 ? "상승" : "낮음", icon: "WT" },
    { label: "연료 효율", value: "88%", unit: "", tone: "green", foot: "개선", icon: "FE" },
  ];

  const algorithmMetrics = [
    {
      label: "Queue 이용률 ρ",
      formula: "λ / μ",
      value: selected.rho.toFixed(2),
      state: selected.rho >= 1.2 ? "한계 초과" : selected.rho >= 1.08 ? "주의" : "안정",
      tone: selected.rho >= 1.2 ? "danger" : selected.rho >= 1.08 ? "warn" : "normal",
    },
    {
      label: "상대오차",
      formula: "max(0,Q-Q*) / Q*",
      value: relativeErrorLabel,
      state: relativeErrorPercent >= 100 ? "급등" : relativeErrorPercent >= 50 ? "주의" : "정상",
      tone: relativeErrorPercent >= 100 ? "danger" : relativeErrorPercent >= 50 ? "warn" : "normal",
    },
    {
      label: "불균형률",
      formula: "유입-처리 편차",
      value: selected.imbalanceRate,
      state: selected.level >= 3 ? "불균형" : "정상",
      tone: selected.level >= 3 ? "danger" : selected.level === 2 ? "warn" : "normal",
    },
    {
      label: "PID P/I/D",
      formula: "P + I + D",
      value: `${selected.pid.p.value}/${selected.pid.i.value}/${selected.pid.d.value}`,
      state: `L${selected.level}`,
      tone: selected.level >= 3 ? "danger" : selected.level === 2 ? "warn" : "normal",
    },
    {
      label: "제어출력 u",
      formula: "PID → 처방",
      value: controlOutput,
      state: `Level ${selected.level}`,
      tone: selected.level >= 3 ? "danger" : selected.level === 2 ? "warn" : "normal",
    },
  ];

  const logsByStage = {
    normal: [
      { time: "09:00:12", type: "정상 흐름", detail: "굴착기 A 상차와 하차장 A 처리 리듬이 안정권입니다.", status: "정상" },
      { time: "09:00:31", type: "Queue 관찰", detail: "하차장 A 대기열 1대, 평균 대기 1분 수준입니다.", status: "정상" },
      { time: "09:01:04", type: "PID 감시", detail: "P 낮음, I 낮음, D 낮음 기준 Level 1입니다.", status: "L1" },
    ],
    bottleneck: [
      { time: "09:18:22", type: "대기열 증가", detail: "하차장 A 대기 트럭이 6대로 증가했습니다.", status: "주의" },
      { time: "09:18:48", type: "처리율 저하", detail: "트럭 유입률이 하차 처리율보다 높아지고 있습니다.", status: "감지" },
      { time: "09:19:06", type: "오차 확대", detail: `상대오차 ${relativeErrorLabel}, 불균형률 ${selected.imbalanceRate}가 관찰됩니다.`, status: "경고" },
    ],
    judgment: [
      { time: "09:26:02", type: "병목 판정", detail: "FlowGuard가 하차장 A를 병목 위치로 확정했습니다.", status: "병목" },
      { time: "09:26:11", type: "PID Level 산정", detail: `P ${selected.pid.p.label}, I ${selected.pid.i.label}, D ${selected.pid.d.label} 기준 Level ${selected.level}.`, status: `L${selected.level}` },
      { time: "09:26:31", type: "처방 생성", detail: "우회, 진입 대기, 접근 주의, 보조 하차 위치 개방 지시를 생성했습니다.", status: "준비" },
    ],
    dispatch: [
      { time: "09:27:04", type: "모바일 발송", detail: `T7 하차장 B 우회 지시: ${t7Status}`, status: t7Status },
      { time: "09:27:11", type: "모바일 발송", detail: `T12 진입 3분 대기 지시: ${t12Status}`, status: t12Status },
      { time: "09:27:19", type: "안전 알림", detail: `W04 하차장 A 접근 주의: ${w04Status}`, status: w04Status },
    ],
    result: [
      { time: "09:33:10", type: "대기열 완화", detail: "우회와 진입 대기로 하차장 A 신규 유입이 감소했습니다.", status: "완화" },
      { time: "09:33:36", type: "작업자 응답", detail: `확인률 ${rates?.confirm || 0}%, 조치 진행률 ${rates?.progress || 0}%로 반영되었습니다.`, status: "반영" },
      { time: "09:34:02", type: "효과 추적", detail: "대기열 6대에서 3대로 감소, Cycle Time 회복 중입니다.", status: "회복" },
    ],
  };
  const logs = logsByStage[stageId] || logsByStage.normal;
  const telemetryByStage = {
    normal: { t7: "하차장 A 진입", t12: "운반로 2구간", queue: "대기열 1대", zone: "하차장 A 정상" },
    bottleneck: { t7: "하차장 A 대기", t12: "진입로 정체", queue: "대기열 6대", zone: "하차장 A 정체" },
    judgment: { t7: "하차장 A 대기", t12: "진입로 정체", queue: "대기열 6대", zone: "Level 3 병목" },
    dispatch: { t7: "보조 하차 B 우회", t12: "진입 전 대기", queue: "대기열 6→5대", zone: "우회 지시 발송" },
    result: { t7: "보조 하차 B 도착", t12: "대기 후 재진입", queue: "대기열 3대", zone: "병목 완화" },
  };
  const telemetry = telemetryByStage[stageId] || telemetryByStage.normal;
  const sitePhotoUrl = `${import.meta.env.BASE_URL}site-aerial.png`;
  const equipmentUnits = [
    { id: "EX-A", name: "굴착기 A", kind: "excavator", status: "상차 중", className: "unit-exa", target: "load-wait" },
    { id: "T7", name: "덤프트럭 7", kind: "truck", status: telemetry.t7, className: "unit-t7", target: "dump-a" },
    { id: "T12", name: "덤프트럭 12", kind: "truck", status: telemetry.t12, className: "unit-t12", target: "dump-a" },
    { id: "T18", name: "덤프트럭 18", kind: "truck", status: "순환 운행", className: "unit-t18", target: "haul-2" },
    { id: "W04", name: "작업자 W04", kind: "worker", status: isDanger ? "접근 주의" : "순찰", className: "unit-w04", target: "dump-a" },
    { id: "D1", name: "도저 D1", kind: "dozer", status: "노면 정리", className: "unit-d1", target: "haul-2" },
  ];

  return (
    <section className="workspace xite-dashboard-page">
      <div className="xite-page-toolbar dynamic-toolbar">
        <div className="live-stage-title">
          <span className={`live-indicator ${liveMode ? "on" : ""}`}>{liveMode ? "LIVE" : "READY"}</span>
          <strong>{selected.name} 실시간 관제</strong>
          <small>{stageStep} · {stageTitle}</small>
        </div>
      </div>

      <div className="xite-kpi-grid" aria-label="핵심 현장 지표">
        {kpis.map((item) => (
          <article className={`xite-kpi-card ${item.tone}`} key={item.label}>
            <div className="kpi-label">{item.label}</div>
            <div className="kpi-value"><strong>{item.value}</strong>{item.unit && <span>{item.unit}</span>}</div>
            <div className="kpi-foot"><span>{item.foot}</span><i>{item.icon}</i></div>
          </article>
        ))}
      </div>

      <section className={`algorithm-live-strip ${isAlgorithmSpike ? "spiking" : ""}`} aria-label="실시간 알고리즘 계산값">
        <div className="algorithm-strip-title">
          <span>실시간 알고리즘 계산</span>
          <strong>{stageStep} · {stageTitle}</strong>
        </div>
        <div className="algorithm-metric-row">
          {algorithmMetrics.map((item) => (
            <article className={`algorithm-metric ${item.tone}`} key={item.label}>
              <div><span>{item.label}</span><small>{item.formula}</small></div>
              <strong>{item.value}</strong>
              <b>{item.state}</b>
            </article>
          ))}
        </div>
      </section>

      <div className="xite-main-grid">
        <section className="xite-panel xite-map-panel">
          <div className="xite-panel-head">
            <h3>현장 실시간 모니터링</h3>
            <div className="xite-legend"><span className="normal">정상</span><span className="warn">주의</span><span className="danger">위험</span></div>
          </div>
          <div className={`xite-map-canvas live-map photo-site-map stage-${stageId} ${liveMode ? "is-live" : ""}`} aria-label="현장 실시간 모니터링 맵" style={{ "--tick": simTick % 8 }}>
            <img className="site-photo-bg" src={sitePhotoUrl} alt="" />
            <div className="site-photo-shade" aria-hidden="true" />
            <div className="aerial-command-panel">
              <strong>RTK LIVE</strong>
              <span>{telemetry.queue}</span>
              <span>T7 · {telemetry.t7}</span>
              <span>T12 · {telemetry.t12}</span>
            </div>
            <div className="map-zone-status">{telemetry.zone}</div>
            <button className="aerial-zone aerial-zone-load" type="button" onClick={() => onSelectBottleneck("load-wait")}>상차 구역</button>
            <button className="aerial-zone aerial-zone-haul" type="button" onClick={() => onSelectBottleneck("haul-2")}>주 운반로</button>
            <button className="aerial-zone aerial-zone-bypass" type="button" onClick={() => onSelectBottleneck("exc-b")}>보조 하차 B</button>
            <button className={`map-bottleneck-zone ${isDanger ? "danger" : "normal"}`} type="button" onClick={() => onSelectBottleneck("dump-a")}>
              <span>{isDanger ? "하차장 A 병목" : "하차장 A 관찰"}</span>
              <i />
            </button>
            <div className="aerial-flow flow-main" aria-hidden="true" />
            <div className="aerial-flow flow-bypass" aria-hidden="true" />
            {equipmentUnits.map((unit) => (
              <button className={`aerial-equipment ${unit.kind} ${unit.className}`} key={unit.id} type="button" onClick={() => onSelectBottleneck(unit.target)}>
                <span className={`equipment-icon ${unit.kind}`} aria-hidden="true"><i /><b /></span>
                <span className="equipment-label"><strong>{unit.id}</strong><small>{unit.name}</small></span>
                <em>{unit.status}</em>
              </button>
            ))}
          </div>
        </section>

        <aside className="xite-panel xite-detail-panel">
          <div className="xite-panel-head">
            <h3>병목 진단 상세</h3>
          </div>
          <div className="detail-body">
            <div className="detail-pair"><span>병목 위치</span><strong className={isDanger ? "danger-text" : "green-text"}>{selected.name}</strong></div>
            <div className="detail-pair"><span>병목 유형</span><strong>{selected.type}</strong></div>
            <div className="cause-box"><span>발생 원인</span><p>{selected.cause}</p></div>
            <div className="queue-compare">
              <div><span>현재 대기열</span><strong className="danger-text">{selected.queue}</strong></div>
              <div><span>목표 대기열</span><strong className="green-text">{TARGET_QUEUE}</strong></div>
              <b>오차(E) + {queueError}</b>
            </div>
            <div className="rate-list">
              <div><span>도착률 (λ)</span><strong>{arrivalRate.toFixed(1)} / hr</strong></div>
              <div><span>처리율 (μ)</span><strong>{processRate.toFixed(1)} / hr</strong></div>
              <div><span>장비 활용률 (ρ)</span><strong>{Math.round(selected.rho * 100)}%</strong></div>
              <div><span>불균형 지수</span><strong className="orange-text">{imbalanceIndex}</strong></div>
            </div>
            <div className="detail-action-row">
              <button className="analysis-link" type="button" onClick={() => onNavigate("diagnosis")}>PID 처방 보기</button>
              <button className="send-live-action" type="button" onClick={onSendAllInstructions}>모바일 발송</button>
            </div>
          </div>
        </aside>
      </div>

      <section className="xite-panel xite-log-panel">
        <div className="xite-panel-head"><h3>최근 진단 로그</h3></div>
        <table className="xite-log-table">
          <thead><tr><th>시간</th><th>이벤트 타입</th><th>상세 내용</th><th>상태</th></tr></thead>
          <tbody>
            {logs.map((log) => (
              <tr key={`${log.time}-${log.type}`}>
                <td>{log.time}</td><td>{log.type}</td><td>{log.detail}</td><td><span>{log.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  );
}

export default DashboardPage;
