function Tag({ color = "green", children }) {
  return <span className={`tag ${color}`}>{children}</span>;
}

export default Tag;
