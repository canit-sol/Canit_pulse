const placeholderImages = Array.from({ length: 9 }, (_, i) => ({
  id: i,
  color: [
    "bg-primary/10",
    "bg-highlight/10",
    "bg-info/10",
    "bg-primary/20",
    "bg-highlight/20",
    "bg-info/20",
    "bg-primary/15",
    "bg-highlight/15",
    "bg-info/15",
  ][i],
}));

export default function InstagramMirror({ handle = "brand" }: { handle?: string }) {
  return (
    <div className="bento-card">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-highlight via-live to-primary flex items-center justify-center">
          <span className="text-primary-foreground text-xs font-bold">{handle.charAt(0).toUpperCase()}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">@{handle}</p>
          <p className="text-xs text-muted-foreground">Instagram Mirror</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5 rounded-xl overflow-hidden">
        {placeholderImages.map((img) => (
          <div
            key={img.id}
            className={`aspect-square ${img.color} flex items-center justify-center rounded-lg`}
          >
            <span className="text-xs text-muted-foreground/50">Post {img.id + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
