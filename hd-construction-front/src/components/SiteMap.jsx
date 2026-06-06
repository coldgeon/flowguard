import { bottlenecks, fleet } from "../data/mockData.js";

const vehicles = [
  ["07", "vehicle stop", { left: "100px", top: "154px" }],
  ["12", "vehicle stop", { left: "142px", top: "160px" }],
  ["04", "vehicle alert", { left: "204px", top: "190px" }],
  ["18", "vehicle", { left: "334px", top: "204px" }],
  ["09", "vehicle", { left: "512px", top: "220px" }],
  ["21", "vehicle alert", { left: "300px", bottom: "132px" }],
  ["15", "vehicle", { right: "242px", bottom: "168px" }],
  ["03", "vehicle", { right: "276px", top: "180px" }],
];

function SiteMap({ selectedBottleneckId, onSelectBottleneck, compact = false, bottleneckItems = bottlenecks }) {
  const selected = bottleneckItems.find((item) => item.id === selectedBottleneckId) || bottleneckItems[0];
  const isBottleneck = selected.status === "병목" || selected.level >= 3;
  const isNormal = selected.status === "정상" && selected.level === 1;
  const displayedVehicles = vehicles.map(([label, className, style], index) => {
    if (isNormal) return [label, "vehicle", style];
    if (selected.status.includes("완화") && index < 3) return [label, index === 0 ? "vehicle stop" : "vehicle", style];
    return [label, className, style];
  });

  return (
    <section className={`panel map-panel ${compact ? "compact-map" : ""}`}>
      <div className="panel-header">
        <div>
          <h3>실시간 현장 맵</h3>
          <p>장비 위치, 작업자 접근, 병목 구역을 클릭해서 확인</p>
        </div>
        <div className="legend">
          <span><i className="chip-dot green" />정상</span>
          <span><i className="chip-dot yellow" />주의</span>
          <span><i className="chip-dot orange" />혼잡</span>
          <span><i className="chip-dot red" />병목</span>
        </div>
      </div>

      <div className="site-map" aria-label="현장 지도 시각화">
        <div className="road r1" />
        <div className="road r2" />
        <div className="road r3" />
        <div className="road r4" />
        <div className="road-label label-1">운반로 1구간</div>
        <div className="road-label label-2">운반로 2구간</div>
        <div className="road-label label-3">교차 통제</div>

        <div className={`bottleneck-ring ${isBottleneck ? "" : "normal"}`} />
        <div className={`bottleneck-callout ${isBottleneck ? "" : "normal"}`}>{selected.name} {selected.status}<small>대기 {selected.queue}대 · ρ {selected.rho} · Level {selected.level}</small></div>

        {bottleneckItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`zone ${item.mapClass} ${selectedBottleneckId === item.id ? "selected" : ""}`}
            onClick={() => onSelectBottleneck(item.id)}
          >
            {item.name}<small>{item.mapNote}</small>
          </button>
        ))}

        <div className="excavator exc-a-icon" title="굴착기 A" />
        <div className="excavator exc-b-icon" title="굴착기 B" />
        {displayedVehicles.map(([label, className, style]) => <div key={label} className={className} style={style}>{label}</div>)}
        {fleet.filter((item) => item.type === "작업자").map((item, index) => (
          <div key={item.id} className={`worker worker-${index + 1}`}>W</div>
        ))}
      </div>
    </section>
  );
}

export default SiteMap;


