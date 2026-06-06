import { useState } from "react";

import { useEffect } from "react";

const fallbackInstruction = {
  id: "T7",
  role: "7번 트럭 운전자",
  equipment: "덤프트럭 7번",
  action: "보조 하차 구역 B로 우회",
  detail: "메인 하차장 진입 혼잡으로 보조 하차 구역 B로 우회하십시오.",
  status: "확인 대기",
};

function getDisplayInstruction(instruction) {
  const source = instruction || fallbackInstruction;
  return {
    ...fallbackInstruction,
    ...source,
    equipment: source.equipment?.replace("7호", "7번") || fallbackInstruction.equipment,
    action: source.id === "T7" ? "보조 하차 구역 B로 우회" : source.action || fallbackInstruction.action,
  };
}

function ProjectFlowHeader({ compact = false, onBack, title }) {
  if (title) {
    return (
      <header className="pf-sub-header">
        <button type="button" onClick={onBack} aria-label="뒤로가기">←</button>
        <strong>{title}</strong>
        <span />
      </header>
    );
  }

  return (
    <header className={`pf-header ${compact ? "compact" : ""}`}>
      <div className="pf-avatar" aria-hidden="true"><span /></div>
      <strong>ProjectFlow</strong>
      <button type="button" aria-label="설정">⚙</button>
    </header>
  );
}

function ProjectFlowBottomNav({ activeView, onChange }) {
  const items = [
    ["home", "⌂", "Home"],
    ["tasks", "▣", "Tasks"],
    ["alerts", "♢", "Alerts"],
    ["profile", "♙", "Profile"],
  ];

  return (
    <nav className="pf-bottom-nav" aria-label="작업자 하단 메뉴">
      {items.map(([id, icon, label]) => (
        <button key={id} type="button" className={activeView === id || (id === "tasks" && activeView === "detail") ? "active" : ""} onClick={() => onChange(id)}>
          <span>{icon}</span>
          <strong>{label}</strong>
          {id === "alerts" && <i />}
        </button>
      ))}
    </nav>
  );
}

function PushNotification({ instruction, visible, onOpen, onDismiss }) {
  if (!visible) return null;

  return (
    <button className="pf-push-notice" type="button" onClick={onOpen} aria-label="긴급 병목 지시 알림 열기">
      <span className="pf-push-app">FG</span>
      <span className="pf-push-copy">
        <strong>FlowGuard 긴급 지시</strong>
        <small>하차장 A 병목 · {instruction.id} 조치 필요<br />{instruction.action}</small>
      </span>
      <span className="pf-push-meta">
        <b>지금</b>
        <i
          role="button"
          tabIndex={0}
          aria-label="알림 닫기"
          onClick={(event) => {
            event.stopPropagation();
            onDismiss();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              event.stopPropagation();
              onDismiss();
            }
          }}
        >
          ×
        </i>
      </span>
    </button>
  );
}

function HomeScreen({ instruction, onOpenAlerts, onOpenDetail }) {
  return (
    <>
      <ProjectFlowHeader />
      <main className="pf-screen pf-home-screen">
        <section className="pf-greeting">
          <h1>김철수님</h1>
          <p>현재 배정된 지시 1건</p>
        </section>

        <button className="pf-current-card" type="button" onClick={onOpenDetail}>
          <div className="pf-pill-row"><span className="blue">진행 중</span><span className="red">3분 내 도착 예정</span></div>
          <h2>{instruction.action}</h2>
          <p>현재 위치: 메인 게이트 A</p>
        </button>

        <section className="pf-card pf-task-card">
          <h2>진행 상태</h2>
          <label className="pf-check done"><input type="checkbox" checked readOnly />조치 수락 완료</label>
          <label className="pf-check"><input type="checkbox" readOnly />우회 경로 진입</label>
        </section>

        <section className="pf-card pf-alert-history">
          <h2>최근 알림</h2>
          <button type="button" onClick={onOpenAlerts}>
            <i className="dot" /><span><strong>우회 조치 수신</strong><small>경로 변경 지시</small></span><time>10:15</time>
          </button>
          <button type="button" onClick={onOpenAlerts}>
            <i className="warn" /><span><strong>병목 감지</strong><small>하차장 A 혼잡</small></span><time>10:12</time>
          </button>
        </section>
      </main>
    </>
  );
}

function AlertScreen({ instruction, onAccept, onDetail }) {
  return (
    <>
      <ProjectFlowHeader compact />
      <main className="pf-screen pf-alert-screen">
        <section className="pf-urgent-banner"><span>LEVEL 3</span><h1>하차장 A 병목</h1></section>
        <section className="pf-card pf-alert-detail-card">
          <div className="pf-info-row"><span>위치</span><strong>하차장 A</strong></div>
          <div className="pf-info-row"><span>Target</span><strong>{instruction.equipment}</strong></div>
          <div className="pf-risk-grid">
            <article><span>Current</span><strong>8</strong></article>
            <article><span>Goal</span><strong className="blue-text">2</strong></article>
            <article><span>Error</span><strong className="red-text">+6</strong></article>
            <article><span>Risk</span><strong className="red-label">HIGH</strong></article>
          </div>
          <div className="pf-action-box"><strong>권장 조치</strong><p>{instruction.action}</p></div>
        </section>
        <div className="pf-alert-actions">
          <button className="pf-primary" type="button" onClick={onAccept}>조치 수락</button>
          <button className="pf-secondary" type="button" onClick={onDetail}>상세 보기</button>
        </div>
      </main>
    </>
  );
}

function DetailScreen({ instruction, onBack, onAccept, onReport }) {
  return (
    <>
      <ProjectFlowHeader title="조치 상세" onBack={onBack} />
      <main className="pf-screen pf-detail-screen">
        <span className="pf-required">실행 필요</span>
        <h1>{instruction.action}</h1>
        <section className="pf-route-map" aria-label="우회 경로 지도">
          <div className="pf-river" />
          <div className="pf-dashed-route" />
          <span className="route-a">경로 A</span>
          <span className="route-b">구역 B</span>
          <i className="pin-a" />
          <i className="pin-b" />
        </section>
        <div className="pf-mini-stat-grid">
          <article><span>예상 소요 시간</span><strong>+3 <small>분</small></strong></article>
          <article><span>기대 효과</span><strong>대기열 완화</strong></article>
        </div>
        <section className="pf-card pf-route-detail">
          <h2>경로 변경</h2>
          <div className="pf-route-step old"><i /> <div><strong>현재 경로 (Route A)</strong><p>메인 하차 구역 진입</p></div></div>
          <div className="pf-route-step new"><i /> <div><strong>우회 경로 (Destination B)</strong><p>보조 하차 구역으로 이동</p></div></div>
        </section>
        <div className="pf-detail-actions">
          <button className="pf-primary" type="button" onClick={onAccept}>조치 수락</button>
          <button className="pf-text-button" type="button" onClick={onReport}>나중에 결정하기</button>
        </div>
      </main>
    </>
  );
}

function ReportScreen({ instruction, onClose, onSubmit }) {
  return (
    <>
      <ProjectFlowHeader title="보고서 작성" onBack={onClose} />
      <main className="pf-screen pf-report-screen">
        <h1>조치 완료 보고</h1>
        <p>현장 조치 내역을 확인하고 통제실로 최종 보고를 전송합니다.</p>
        <section className="pf-report-hero"><i /> <div><span>지시된 우회 경로</span><strong>{instruction.action}</strong></div><b /></section>
        <section className="pf-report-checks">
          <h2>확인 목록</h2>
          {['구역 B 진입로 확보 완료', '유도 요원(2명) 배치 완료', '기존 대기 차량 우회 안내 방송 송출'].map((item) => <label key={item}><input type="checkbox" checked readOnly />{item}</label>)}
        </section>
        <section className="pf-report-note">
          <h2>현장 특이사항 입력</h2>
          <textarea placeholder="현장에서 발생한 추가적인 특이사항이나 지연 사유를 입력해주세요." />
          <div className="pf-chip-row"><button type="button">이상 없음</button><button type="button">경로 혼잡</button><button type="button">장비 대기</button></div>
        </section>
        <button className="pf-photo-box" type="button"><span>사진 첨부 (선택)</span><small>현장 상황을 증명할 수 있는 사진</small></button>
        <button className="pf-primary report-submit" type="button" onClick={onSubmit}>완료 보고 전송</button>
      </main>
    </>
  );
}

function ProfileScreen() {
  return (
    <>
      <ProjectFlowHeader />
      <main className="pf-screen pf-profile-screen">
        <section className="pf-card"><h1>김철수</h1><p>덤프트럭 운전자 · 토공 현장 A</p></section>
        <section className="pf-card"><h2>오늘의 상태</h2><p>지시 확인 1건 · 수행 중 1건 · 안전 알림 2건</p></section>
      </main>
    </>
  );
}

export function ProjectFlowMobileApp({ instruction, scenarioStage, rates, onSetInstructionStatus, embedded = false }) {
  const activeInstruction = getDisplayInstruction(instruction);
  const [view, setView] = useState("home");
  const [showPush, setShowPush] = useState(false);

  useEffect(() => {
    if (embedded) {
      setShowPush(false);
      return undefined;
    }

    setShowPush(false);
    const timer = window.setTimeout(() => setShowPush(true), 520);
    return () => window.clearTimeout(timer);
  }, [embedded, activeInstruction.id]);

  const acceptInstruction = (nextView = "detail") => {
    setShowPush(false);
    onSetInstructionStatus?.(activeInstruction.id, "확인");
    setView(nextView);
  };

  const startInstruction = () => {
    setShowPush(false);
    onSetInstructionStatus?.(activeInstruction.id, "수행 중");
    setView("report");
  };

  const submitReport = () => {
    onSetInstructionStatus?.(activeInstruction.id, "완료");
    setView("home");
  };

  const changeNav = (target) => {
    setShowPush(false);
    if (target === "tasks") setView("detail");
    else setView(target);
  };

  return (
    <div className={`projectflow-shell ${embedded ? "embedded" : ""}`}>
      <section className={`projectflow-phone ${showPush ? "has-push" : ""}`} aria-label="ProjectFlow 작업자 모바일 웹앱" data-stage={scenarioStage?.id || "normal"} data-confirm={rates?.confirm || 0}>
        <PushNotification
          instruction={activeInstruction}
          visible={showPush}
          onOpen={() => {
            setShowPush(false);
            setView("alerts");
          }}
          onDismiss={() => setShowPush(false)}
        />
        {view === "home" && <HomeScreen instruction={activeInstruction} onOpenAlerts={() => setView("alerts")} onOpenDetail={() => setView("detail")} />}
        {view === "alerts" && <AlertScreen instruction={activeInstruction} onAccept={() => acceptInstruction("detail")} onDetail={() => setView("detail")} />}
        {view === "detail" && <DetailScreen instruction={activeInstruction} onBack={() => setView("alerts")} onAccept={startInstruction} onReport={() => setView("report")} />}
        {view === "report" && <ReportScreen instruction={activeInstruction} onClose={() => setView("detail")} onSubmit={submitReport} />}
        {view === "profile" && <ProfileScreen />}
        {!["detail", "report"].includes(view) && <ProjectFlowBottomNav activeView={view} onChange={changeNav} />}
      </section>
    </div>
  );
}

function WorkerPhoneRoute(props) {
  return <ProjectFlowMobileApp {...props} />;
}

export default WorkerPhoneRoute;

