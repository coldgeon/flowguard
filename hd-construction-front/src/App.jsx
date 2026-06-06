import { useEffect, useMemo, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import Topbar from "./components/Topbar.jsx";
import { bottlenecks, demoSteps, initialInstructions, navItems, scenarioStages, statusOrder } from "./data/mockData.js";
import AlertsPage from "./pages/AlertsPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import DiagnosisPage from "./pages/DiagnosisPage.jsx";
import FleetPage from "./pages/FleetPage.jsx";
import MobileWorkerPage from "./pages/MobileWorkerPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import WorkerPhoneRoute from "./pages/WorkerPhoneRoute.jsx";

const DEMO_STORAGE_KEY = "flowguard-demo-state";
const WORKER_ROUTE_PREFIX = "/worker";
const LIVE_STAGE_SECONDS = 5;
const ROUTE_BASE = import.meta.env.BASE_URL || "/";

const scenarioStatusByStage = {
  normal: { T7: "발송 준비", T12: "발송 준비", W04: "발송 준비", PM: "발송 준비" },
  bottleneck: { T7: "발송 준비", T12: "발송 준비", W04: "발송 준비", PM: "발송 준비" },
  judgment: { T7: "발송 준비", T12: "발송 준비", W04: "발송 준비", PM: "발송 준비" },
  dispatch: { T7: "확인 대기", T12: "확인 대기", W04: "확인 대기", PM: "발송됨" },
  result: { T7: "완료", T12: "수행 중", W04: "확인", PM: "완료" },
};

function getCurrentPath() {
  if (typeof window === "undefined") return "/";
  return normalizeAppPath(window.location.pathname || "/");
}

function normalizeAppPath(path) {
  const rawPath = String(path || "/");
  const base = ROUTE_BASE.endsWith("/") ? ROUTE_BASE : `${ROUTE_BASE}/`;

  if (base !== "/" && rawPath === base.slice(0, -1)) return "/";
  if (base !== "/" && rawPath.startsWith(base)) {
    return rawPath.slice(base.length - 1) || "/";
  }

  return rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
}

function getBrowserPath(appPath) {
  const normalizedPath = String(appPath || "/").startsWith("/") ? String(appPath || "/") : `/${appPath}`;
  const base = ROUTE_BASE.endsWith("/") ? ROUTE_BASE : `${ROUTE_BASE}/`;

  if (base === "/") return normalizedPath;

  const baseWithoutSlash = base.slice(0, -1);
  return normalizedPath === "/" ? `${baseWithoutSlash}/` : `${baseWithoutSlash}${normalizedPath}`;
}

function getWorkerIdFromPath(path) {
  const parts = String(path || "").split("/").filter(Boolean);
  if (parts[0] !== "worker") return null;
  return decodeURIComponent(parts[1] || "T7");
}

function isWorkerPath(path) {
  return String(path || "").startsWith(WORKER_ROUTE_PREFIX);
}

function getPageFromPath(path) {
  const firstSegment = String(path || "").split("/").filter(Boolean)[0];
  const validPage = ["dashboard", "diagnosis", "alerts", "mobile", "reports", "fleet"].includes(firstSegment);
  return validPage ? firstSegment : "dashboard";
}

function getPathForPage(pageId) {
  return pageId === "dashboard" ? "/" : `/${pageId}`;
}

function readStoredDemoState() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DEMO_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredDemoState(payload) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Local storage can be unavailable in some embedded previews.
  }
}

function makeScenarioInstructions(stageIndex) {
  const stage = scenarioStages[stageIndex] || scenarioStages[0];
  const statusMap = scenarioStatusByStage[stage.id] || scenarioStatusByStage.normal;
  return initialInstructions.map((item) => ({
    ...item,
    status: statusMap[item.id] || "발송 준비",
  }));
}

function findInstructionById(instructions, instructionId) {
  const normalizedId = String(instructionId || "").toLowerCase();
  return instructions.find((item) => item.id.toLowerCase() === normalizedId) || instructions[0];
}

function getLiveStageIndex(tick) {
  const totalTicks = scenarioStages.length * LIVE_STAGE_SECONDS;
  const cycleTick = tick % totalTicks;
  return Math.min(scenarioStages.length - 1, Math.floor(cycleTick / LIVE_STAGE_SECONDS));
}

function App() {
  const [routePath, setRoutePath] = useState(() => getCurrentPath());
  const [initialDemoState] = useState(() => isWorkerPath(getCurrentPath()) ? readStoredDemoState() : null);
  const [activePage, setActivePage] = useState(() => getPageFromPath(getCurrentPath()));
  const [autoMode, setAutoMode] = useState(true);
  const [scenarioStepIndex, setScenarioStepIndex] = useState(() => typeof initialDemoState?.scenarioStepIndex === "number" ? initialDemoState.scenarioStepIndex : 0);
  const [scenarioRunning, setScenarioRunning] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [simTick, setSimTick] = useState(0);
  const [selectedBottleneckId, setSelectedBottleneckId] = useState(() => initialDemoState?.selectedBottleneckId || bottlenecks[0].id);
  const [selectedInstructionId, setSelectedInstructionId] = useState(() => getWorkerIdFromPath(getCurrentPath()) || initialDemoState?.selectedInstructionId || initialInstructions[0].id);
  const [instructions, setInstructions] = useState(() => initialDemoState?.instructions || makeScenarioInstructions(typeof initialDemoState?.scenarioStepIndex === "number" ? initialDemoState.scenarioStepIndex : 0));
  const [feedback, setFeedback] = useState(null);

  const activePageLabel = navItems.find((item) => item.id === activePage)?.label || "현장 개요";
  const activeDemoIndex = Math.max(0, demoSteps.findIndex((step) => step.page === activePage));
  const activeDemoStep = demoSteps[activeDemoIndex] || demoSteps[0];
  const scenarioStage = scenarioStages[scenarioStepIndex] || scenarioStages[0];
  const scenarioBottlenecks = useMemo(
    () => bottlenecks.map((item) => item.id === "dump-a" ? scenarioStage.bottleneck : item),
    [scenarioStage]
  );
  const selectedBottleneck = scenarioBottlenecks.find((item) => item.id === selectedBottleneckId) || scenarioBottlenecks[0];
  const workerRouteId = getWorkerIdFromPath(routePath);
  const isWorkerRoute = isWorkerPath(routePath);
  const workerInstruction = findInstructionById(instructions, workerRouteId || selectedInstructionId);

  const rates = useMemo(() => {
    const confirmedStatuses = ["확인", "수행 중", "완료", "수행 불가"];
    const confirmed = instructions.filter((item) => confirmedStatuses.includes(item.status)).length;
    const completed = instructions.filter((item) => item.status === "완료").length;
    const progressing = instructions.filter((item) => item.status === "수행 중").length;
    const total = instructions.length || 1;

    return {
      confirm: Math.round((confirmed / total) * 100),
      progress: Math.round(((completed + progressing) / total) * 100),
      confirmed,
      completed,
      progressing,
    };
  }, [instructions]);

  const showFeedback = (text) => {
    setFeedback({ id: Date.now(), text });
  };

  const applyScenarioStage = (stageIndex) => {
    const nextStage = scenarioStages[stageIndex] || scenarioStages[0];
    setScenarioStepIndex(stageIndex);
    setSelectedBottleneckId("dump-a");
    setSelectedInstructionId("T7");
    setInstructions(makeScenarioInstructions(stageIndex));
    showFeedback(nextStage.toast);
  };

  useEffect(() => {
    const handlePopState = () => {
      const nextPath = getCurrentPath();
      setRoutePath(nextPath);
      if (!isWorkerPath(nextPath)) {
        setActivePage(getPageFromPath(nextPath));
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== DEMO_STORAGE_KEY || !event.newValue) return;
      try {
        const nextState = JSON.parse(event.newValue);
        if (typeof nextState.scenarioStepIndex === "number") setScenarioStepIndex(nextState.scenarioStepIndex);
        if (nextState.selectedBottleneckId) setSelectedBottleneckId(nextState.selectedBottleneckId);
        if (nextState.selectedInstructionId) setSelectedInstructionId(nextState.selectedInstructionId);
        if (Array.isArray(nextState.instructions)) setInstructions(nextState.instructions);
      } catch {
        // Ignore malformed demo state.
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    writeStoredDemoState({ scenarioStepIndex, selectedBottleneckId, selectedInstructionId, instructions });
  }, [scenarioStepIndex, selectedBottleneckId, selectedInstructionId, instructions]);

  useEffect(() => {
    if (!feedback) return undefined;
    const timer = window.setTimeout(() => setFeedback(null), 2600);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    if (!scenarioRunning) return undefined;

    if (scenarioStepIndex >= scenarioStages.length - 1) {
      const doneTimer = window.setTimeout(() => setScenarioRunning(false), 400);
      return () => window.clearTimeout(doneTimer);
    }

    const timer = window.setTimeout(() => {
      applyScenarioStage(scenarioStepIndex + 1);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [scenarioRunning, scenarioStepIndex]);

  useEffect(() => {
    if (!liveMode) return undefined;

    const timer = window.setInterval(() => {
      setSimTick((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [liveMode]);

  useEffect(() => {
    if (!liveMode) return;
    const nextStageIndex = getLiveStageIndex(simTick);
    if (nextStageIndex !== scenarioStepIndex) {
      applyScenarioStage(nextStageIndex);
    }
  }, [liveMode, simTick]);

  const navigate = (pageId) => {
    setActivePage(pageId);
    const nextPath = getPathForPage(pageId);
    if (getCurrentPath() !== nextPath) {
      window.history.pushState({}, "", getBrowserPath(nextPath));
      setRoutePath(nextPath);
    }
  };

  const openWorkerRoute = (instructionId = "T7") => {
    const nextPath = `${WORKER_ROUTE_PREFIX}/${encodeURIComponent(instructionId)}`;
    setSelectedInstructionId(instructionId);
    window.history.pushState({}, "", getBrowserPath(nextPath));
    setRoutePath(nextPath);
  };

  const backToDashboard = () => {
    window.history.pushState({}, "", getBrowserPath("/"));
    setRoutePath("/");
    setActivePage("dashboard");
  };

  const selectDemoStep = (step) => {
    navigate(step.page);
    showFeedback(`${step.label} 장면으로 이동했습니다.`);
  };

  const runDemoTransition = (nextPage) => {
    setScenarioRunning(false);
    setLiveMode(false);

    if (nextPage === "dashboard") {
      applyScenarioStage(0);
      showFeedback("정상 운영 화면으로 돌아왔습니다. 예시 시나리오 실행 버튼으로 병목 흐름을 시작할 수 있습니다.");
      return;
    }

    if (nextPage === "diagnosis") {
      applyScenarioStage(2);
      return;
    }

    if (nextPage === "alerts") {
      applyScenarioStage(3);
      return;
    }

    if (nextPage === "mobile") {
      applyScenarioStage(3);
      setInstructions((items) => items.map((item) => item.id === "T7" ? { ...item, status: "확인" } : item));
      showFeedback("T7 작업자가 휴대폰에서 지시를 확인했습니다.");
      return;
    }

    if (nextPage === "reports") {
      applyScenarioStage(4);
      return;
    }

    showFeedback(`${navItems.find((item) => item.id === nextPage)?.label || "다음"} 화면으로 이동했습니다.`);
  };

  const nextDemoStep = () => {
    const nextStep = demoSteps[(activeDemoIndex + 1) % demoSteps.length];
    navigate(nextStep.page);
    runDemoTransition(nextStep.page);
  };

  const runScenario = () => {
    setLiveMode(false);
    navigate("dashboard");
    setScenarioRunning(true);
    applyScenarioStage(0);
  };

  const toggleLiveMode = () => {
    setScenarioRunning(false);
    if (!liveMode) {
      navigate("dashboard");
      setSimTick(0);
      applyScenarioStage(0);
      setLiveMode(true);
      showFeedback("실시간 데모를 시작합니다. 현장 데이터가 자동으로 변합니다.");
      return;
    }

    setLiveMode(false);
    showFeedback("실시간 데모를 일시정지했습니다.");
  };

  const stepScenario = () => {
    setLiveMode(false);
    setScenarioRunning(false);
    applyScenarioStage((scenarioStepIndex + 1) % scenarioStages.length);
  };

  const selectBottleneck = (bottleneckId) => {
    setSelectedBottleneckId(bottleneckId);
    const selected = scenarioBottlenecks.find((item) => item.id === bottleneckId);
    if (selected) showFeedback(`${selected.name} 후보를 선택했습니다.`);
  };

  const selectInstruction = (instructionId) => {
    setSelectedInstructionId(instructionId);
  };

  const sendInstruction = (instructionId) => {
    const target = instructions.find((item) => item.id === instructionId);
    setScenarioRunning(false);
    setLiveMode(false);
    setScenarioStepIndex(Math.max(scenarioStepIndex, 3));
    setInstructions((items) =>
      items.map((item) =>
        item.id === instructionId ? { ...item, status: "확인 대기" } : item
      )
    );
    setSelectedInstructionId(instructionId);
    showFeedback(`${target?.id || instructionId} 지시가 작업자 휴대폰 알림으로 발송되었습니다.`);
  };

  const sendAllInstructions = () => {
    setScenarioRunning(false);
    setLiveMode(false);
    setScenarioStepIndex(3);
    setInstructions(makeScenarioInstructions(3));
    setSelectedInstructionId("T7");
    showFeedback("추천 조치가 작업자 휴대폰 알림과 모바일 웹앱 지시로 일괄 발송되었습니다.");
  };

  const applyDemoResponses = () => {
    setScenarioRunning(false);
    setLiveMode(false);
    applyScenarioStage(4);
  };

  const resetDemoState = () => {
    setScenarioRunning(false);
    setLiveMode(false);
    setSimTick(0);
    applyScenarioStage(0);
    showFeedback("시연 목데이터를 정상 운영 상태로 되돌렸습니다.");
  };

  const setInstructionStatus = (instructionId, status) => {
    setInstructions((items) =>
      items.map((item) =>
        item.id === instructionId ? { ...item, status } : item
      )
    );
    setSelectedInstructionId(instructionId);
    showFeedback(`${instructionId} 작업자 응답이 '${status}' 상태로 반영되었습니다.`);
  };

  const cycleInstructionStatus = (instructionId) => {
    const target = instructions.find((item) => item.id === instructionId);
    const currentIndex = statusOrder.indexOf(target?.status);
    const nextStatus = target?.status === "수행 불가" ? "확인" : currentIndex >= 0 ? statusOrder[(currentIndex + 1) % statusOrder.length] : "발송됨";

    setInstructions((items) =>
      items.map((item) => item.id === instructionId ? { ...item, status: nextStatus } : item)
    );
    setSelectedInstructionId(instructionId);
    showFeedback(`${instructionId} 상태를 '${nextStatus}'로 변경했습니다.`);
  };

  const pageProps = {
    selectedBottleneckId,
    selectedInstructionId,
    instructions,
    rates,
    autoMode,
    bottlenecksData: scenarioBottlenecks,
    scenarioStage,
    scenarioStepIndex,
    scenarioRunning,
    liveMode,
    simTick,
    onRunScenario: runScenario,
    onToggleLiveMode: toggleLiveMode,
    onStepScenario: stepScenario,
    onOpenWorkerRoute: openWorkerRoute,
    onNavigate: navigate,
    onSelectBottleneck: selectBottleneck,
    onSelectInstruction: selectInstruction,
    onSendInstruction: sendInstruction,
    onSendAllInstructions: sendAllInstructions,
    onApplyDemoResponses: applyDemoResponses,
    onResetDemoState: resetDemoState,
    onSetInstructionStatus: setInstructionStatus,
    onCycleInstructionStatus: cycleInstructionStatus,
  };

  const pages = {
    dashboard: <DashboardPage {...pageProps} />,
    diagnosis: <DiagnosisPage {...pageProps} />,
    alerts: <AlertsPage {...pageProps} />,
    mobile: <MobileWorkerPage {...pageProps} />,
    reports: <ReportsPage {...pageProps} />,
    fleet: <FleetPage {...pageProps} />,
  };

  if (isWorkerRoute) {
    return (
      <WorkerPhoneRoute
        instruction={workerInstruction}
        scenarioStage={scenarioStage}
        rates={rates}
        onSetInstructionStatus={setInstructionStatus}
        onBackToDashboard={backToDashboard}
      />
    );
  }

  return (
    <div className={`app app-${activePage}`}>
      <Sidebar activePage={activePage} onNavigate={navigate} />
      <main>
        <Topbar
          activePage={activePage}
          activePageLabel={activePageLabel}
          autoMode={autoMode}
          onToggleAuto={() => setAutoMode((value) => !value)}
          instructionCount={instructions.length}
          rates={rates}
          selectedBottleneck={selectedBottleneck}
          liveMode={liveMode}
          scenarioRunning={scenarioRunning}
          onRunScenario={runScenario}
          onToggleLiveMode={toggleLiveMode}
          onStepScenario={stepScenario}
          onSelectDemoStep={selectDemoStep}
          onNextDemoStep={nextDemoStep}
          demoMessage={feedback?.text || (activePage === "dashboard" ? scenarioStage.summary : activeDemoStep?.talkTrack)}
        />
        {pages[activePage] || pages.dashboard}
      </main>
      {feedback && <div className="toast-message" role="status">{feedback.text}</div>}
    </div>
  );
}

export default App;


