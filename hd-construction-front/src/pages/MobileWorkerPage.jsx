import StatusBadge from "../components/StatusBadge.jsx";
import { ProjectFlowMobileApp } from "./WorkerPhoneRoute.jsx";

function MobileWorkerPage({ instructions, selectedInstructionId, onSelectInstruction, onSetInstructionStatus, rates, scenarioStage }) {
  const selected = instructions.find((item) => item.id === selectedInstructionId) || instructions[0];

  return (
    <section className="workspace mobile-page projectflow-admin-page">
      <div className="projectflow-admin-head">
        <div>
          <span>No Install Mobile Web App</span>
          <h2>작업자 모바일 웹앱</h2>
          <p>작업자는 앱 설치 없이 휴대폰 웹에서 알림, 조치 상세, 완료 보고까지 처리합니다.</p>
        </div>
        <div className="projectflow-admin-kpis"><strong>확인률 {rates.confirm}%</strong><strong>완료 {rates.completed}건</strong></div>
      </div>

      <div className="projectflow-admin-layout">
        <ProjectFlowMobileApp instruction={selected} scenarioStage={scenarioStage} rates={rates} onSetInstructionStatus={onSetInstructionStatus} embedded />

        <aside className="xite-panel projectflow-admin-side">
          <h3>작업자 화면 선택</h3>
          <p>관리자가 발송한 지시가 실제 휴대폰에서 어떻게 보이는지 전환합니다.</p>
          <div className="projectflow-worker-list">
            {instructions.map((item) => (
              <button key={item.id} className={item.id === selected.id ? "active" : ""} type="button" onClick={() => onSelectInstruction(item.id)}>
                <span>{item.id}</span>
                <strong>{item.action}</strong>
                <StatusBadge status={item.status} />
              </button>
            ))}
          </div>
          <div className="projectflow-sync-note"><strong>상태 공유</strong><p>모바일에서 수락/완료한 응답은 모바일 지시 관제와 대시보드 KPI에 즉시 반영됩니다.</p></div>
        </aside>
      </div>
    </section>
  );
}

export default MobileWorkerPage;
