const navItems = [
  { id: "dashboard", label: "병목 진단", icon: "diagnosis" },
  { id: "diagnosis", label: "PID 처방", icon: "pid" },
  { id: "alerts", label: "추천 조치", icon: "action" },
  { id: "reports", label: "제어 이력", icon: "history" },
  { id: "fleet", label: "설정", icon: "settings" },
];

function Sidebar({ activePage, onNavigate }) {
  return (
    <aside className="sidebar xite-sidebar flowguard-navbar">
      <div className="brand xite-brand flowguard-nav-brand">
        <div>
          <h1>FlowGuard</h1>
          <p>AI-PID 기반 병목 진단 및 처방 제어</p>
        </div>
      </div>

      <nav className="nav xite-nav flowguard-nav-menu" aria-label="주 메뉴">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={item.id === activePage ? "active" : ""}
            type="button"
            onClick={() => onNavigate(item.id)}
          >
            <span className={`nav-icon nav-icon-${item.icon}`} aria-hidden="true" />
            <span className="label">{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;
