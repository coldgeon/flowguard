import Tag from "../components/Tag.jsx";
import { fleet } from "../data/mockData.js";

const typeColors = {
  덤프트럭: "blue",
  굴착기: "yellow",
  작업자: "teal",
};

function FleetPage() {
  const grouped = ["덤프트럭", "굴착기", "작업자"].map((type) => ({
    type,
    items: fleet.filter((item) => item.type === type),
  }));
  const stoppedCount = fleet.filter((item) => item.speed === "0km/h").length;
  const idleNoticeCount = fleet.filter((item) => item.status.includes("주의") || item.status.includes("대기") || item.status.includes("우회")).length;

  return (
    <section className="workspace page-grid fleet-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Fleet / Field State</span>
          <h2>장비 / 현장 상태</h2>
          <p>병목 판단에 쓰이는 입력 데이터를 장비, 작업자, 구역 상태로 설명합니다.</p>
        </div>
      </div>
      <section className="fleet-signal-grid">
        <article><span>GPS 수집</span><strong>24/26</strong><p>장비 위치 로그 정상</p></article>
        <article><span>모바일 접속</span><strong>18/20</strong><p>작업자 웹앱 연결</p></article>
        <article><span>정지 차량</span><strong>{stoppedCount}대</strong><p>대기열 판단 입력</p></article>
        <article><span>주의 이벤트</span><strong>{idleNoticeCount}건</strong><p>처방 후보 입력</p></article>
      </section>

      <section className="panel fleet-table-panel">
        <div className="panel-header"><div><h3>전체 장비 상태</h3><p>GPS, 작업 상태, 유휴시간 목데이터</p></div></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>유형</th><th>담당</th><th>현재 위치</th><th>작업 상태</th><th>속도</th><th>유휴</th></tr></thead>
            <tbody>
              {fleet.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td><Tag color={typeColors[item.type] || "green"}>{item.type}</Tag></td>
                  <td>{item.operator}</td>
                  <td>{item.zone}</td>
                  <td>{item.status}</td>
                  <td>{item.speed}</td>
                  <td>{item.idle}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="fleet-group-grid">
        {grouped.map((group) => (
          <article className="panel fleet-group" key={group.type}>
            <div className="panel-header"><div><h3>{group.type}</h3><p>{group.items.length}개 객체 추적 중</p></div><Tag color={typeColors[group.type]}>{group.items.length}</Tag></div>
            <div className="fleet-list">
              {group.items.map((item) => (
                <div className="fleet-card" key={item.id}>
                  <span>{item.id}</span>
                  <div><strong>{item.status}</strong><p>{item.zone} · {item.operator}</p></div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}

export default FleetPage;



