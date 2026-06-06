function MetricCard({ label, value, unit, note, color = "teal", icon }) {
  return (
    <article className={`metric-card metric-${color}`}>
      <div className="metric-head"><span>{label}</span><span className="metric-icon">{icon}</span></div>
      <div className="metric-value">{value}{unit && <small>{unit}</small>}</div>
      <div className="metric-note">{note}</div>
    </article>
  );
}

export default MetricCard;
