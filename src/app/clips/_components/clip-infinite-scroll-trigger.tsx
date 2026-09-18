"use client";

import { useEffect, useEffectEvent, useRef } from "react";

import { LoaderCircle } from "lucide-react";

interface ClipInfiniteScrollTriggerProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

export function ClipInfiniteScrollTrigger({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: ClipInfiniteScrollTriggerProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const handleLoadMore = useEffectEvent(onLoadMore);

  useEffect(() => {
    const target = targetRef.current;

    if (!target || !hasNextPage || isFetchingNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          handleLoadMore();
        }
      },
      { rootMargin: "320px 0px" },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage]);

  if (!hasNextPage) {
    return null;
  }

  return (
    <div
      aria-label="다음 클립을 불러오는 영역"
      className="flex min-h-12 items-center justify-center text-body-sm text-secondary"
      ref={targetRef}
    >
      {isFetchingNextPage ? (
        <span className="inline-flex items-center gap-2" role="status">
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          클립을 더 불러오는 중입니다.
        </span>
      ) : "아래로 스크롤하면 클립을 더 불러옵니다."}
    </div>
  );
}
