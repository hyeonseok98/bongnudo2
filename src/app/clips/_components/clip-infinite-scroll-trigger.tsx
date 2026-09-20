"use client";

import { useEffect, useEffectEvent, useRef } from "react";

import { LoaderCircle } from "lucide-react";

interface ClipInfiniteScrollTriggerProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  idleMessage?: string | null;
  loadingMessage?: string;
  onLoadMore: () => void;
  requireUserScroll?: boolean;
}

export function ClipInfiniteScrollTrigger({
  hasNextPage,
  isFetchingNextPage,
  idleMessage = "아래로 스크롤하면 클립을 더 불러옵니다.",
  loadingMessage = "클립을 더 불러오는 중입니다.",
  onLoadMore,
  requireUserScroll = false,
}: ClipInfiniteScrollTriggerProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const hasUserScrolledRef = useRef(!requireUserScroll);
  const lastRequestedScrollPositionRef = useRef<number | null>(null);
  const handleLoadMore = useEffectEvent(onLoadMore);

  useEffect(() => {
    const target = targetRef.current;

    if (!target || !hasNextPage || isFetchingNextPage) {
      return;
    }

    const scrollRoot = getScrollRoot(target);
    const scrollTarget = scrollRoot ?? window;
    const getScrollPosition = () => scrollRoot ? scrollRoot.scrollTop : window.scrollY;

    function handleScroll() {
      hasUserScrolledRef.current = true;
    }

    scrollTarget.addEventListener("scroll", handleScroll, { passive: true });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          if (
            requireUserScroll &&
            (!hasUserScrolledRef.current ||
              lastRequestedScrollPositionRef.current === getScrollPosition())
          ) {
            return;
          }

          lastRequestedScrollPositionRef.current = getScrollPosition();
          handleLoadMore();
        }
      },
      { root: scrollRoot, rootMargin: "320px 0px" },
    );

    observer.observe(target);

    return () => {
      scrollTarget.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, requireUserScroll]);

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
          {loadingMessage}
        </span>
      ) : idleMessage}
    </div>
  );
}

function getScrollRoot(target: HTMLElement): HTMLElement | null {
  let parent = target.parentElement;

  while (parent) {
    const overflowY = window.getComputedStyle(parent).overflowY;

    if (overflowY === "auto" || overflowY === "scroll") {
      return parent;
    }

    parent = parent.parentElement;
  }

  return null;
}
