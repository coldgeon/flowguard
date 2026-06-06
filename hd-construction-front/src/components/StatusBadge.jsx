const statusClassMap = {
  "발송 준비": "ready",
  "확인 대기": "waiting",
  "발송됨": "sent",
  "확인": "confirm",
  "수행 중": "progress",
  "완료": "done",
  "수행 불가": "failed",
};

function StatusBadge({ status }) {
  return <span className={`status-badge status-${statusClassMap[status] || "sent"}`}>{status}</span>;
}

export default StatusBadge;
