import { cn } from "@/utils/cn"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative isolate overflow-hidden rounded-md bg-muted after:absolute after:inset-0 after:-translate-x-full after:bg-linear-to-r after:from-transparent after:via-foreground/5 after:to-transparent after:content-[''] after:animate-[skeleton-shimmer_1.8s_ease-in-out_infinite] motion-reduce:after:animate-none",
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
