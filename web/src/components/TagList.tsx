type TagListProps = {
  tags?: string[];
  className?: string;
};

export default function TagList({ tags, className }: TagListProps) {
  if (!tags?.length) {
    return null;
  }

  return (
    <div className={className}>
      {tags.map((tag) => (
        <span className="badge" key={tag}>
          {tag}
        </span>
      ))}
    </div>
  );
}
