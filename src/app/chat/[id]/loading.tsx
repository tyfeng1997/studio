// app/chat/loading.tsx
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="relative flex gap-2">
        <div
          className="w-3 h-3 rounded-full bg-zinc-400 animate-bounce"
          style={{ animationDelay: "0ms" }}
        ></div>
        <div
          className="w-3 h-3 rounded-full bg-zinc-400 animate-bounce"
          style={{ animationDelay: "150ms" }}
        ></div>
        <div
          className="w-3 h-3 rounded-full bg-zinc-400 animate-bounce"
          style={{ animationDelay: "300ms" }}
        ></div>
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-sm text-muted-foreground font-serif">
          Loading
        </div>
      </div>
    </div>
  );
}
