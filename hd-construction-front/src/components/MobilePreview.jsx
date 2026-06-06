import { useState } from "react";

const statusClass = {
  "발송 준비": "ready",
  "확인 대기": "waiting",
  "발송됨": "sent",
  "확인": "confirm",
  "수행 중": "progress",
  "완료": "done",
  "수행 불가": "failed",
};

function MobilePreview({ instruction, onSetStatus, standalone = false }) {
  const [phoneTab, setPhoneTab] = useState("알림");
  const activeInstruction = instruction;
  const currentStatus = activeInstruction?.status || "확인 대기";

  return (
    <div className={standalone ? "mobile-stage" : "mobile-preview-card"}>
      <div className="phone">
        <div className="phone-statusbar"><span>09:42</span><span>LTE · 82%</span></div>
        <div className="phone-top">
          <div>
            <strong>FlowGuard Mobile</strong>
            <small>{activeInstruction?.id} · {activeInstruction?.role}</small>
          </div>
          <span className={`phone-state ${statusClass[currentStatus] || "waiting"}`}>{currentStatus}</span>
        </div>
        <div className="phone-body">
          {phoneTab === "알림" && (
            <div className="notice-card">
              <span>Level 3 긴급 지시</span>
              <h4>{activeInstruction?.action}</h4>
              <p>{activeInstruction?.detail}</p>
              <div className="notice-meta">
                <b>하차장 A 병목</b>
                <b>예상 지연 +7.8분</b>
              </div>
              <div className="phone-actions">
                <button type="button" onClick={() => onSetStatus?.(activeInstruction.id, "확인")}>확인</button>
                <button type="button" onClick={() => onSetStatus?.(activeInstruction.id, "수행 불가")}>수행 불가</button>
                <button type="button" onClick={() => onSetStatus?.(activeInstruction.id, "수행 중")}>수행 중</button>
                <button type="button" onClick={() => onSetStatus?.(activeInstruction.id, "완료")}>완료</button>
              </div>
            </div>
          )}
          {phoneTab === "지도" && (
            <div className="mini-map route-map">
              <div className="route-line"><i /><i /><i /></div>
              <strong>하차장 A → 하차장 B</strong>
              <span>교차 통제 전 우측 우회, 보조 하차 위치로 진입</span>
            </div>
          )}
          {phoneTab === "신고" && (
            <div className="report-list">
              <button type="button">경로 막힘</button>
              <button type="button">장비 이상</button>
              <button type="button">접근 위험</button>
            </div>
          )}
        </div>
        <div className="phone-tabs">
          {["알림", "지도", "신고"].map((tab) => (
            <button key={tab} type="button" className={phoneTab === tab ? "active" : ""} onClick={() => setPhoneTab(tab)}>
              {tab}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MobilePreview;
