"use client";

import { Checkbox } from "@base-ui/react/checkbox";
import { Popover } from "@base-ui/react/popover";
import { Check, ChevronDown, ChevronRight, Minus } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { SearchField } from "@/components/ui/search-field";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/utils/cn";
import { matchesKoreanSearch } from "@/utils/korean-search";

const DRAFT_SUMMARY_GAP = 8;

export interface FilterTreeNode {
  id: string;
  label: string;
  count?: number;
  disabled?: boolean;
  children?: FilterTreeNode[];
}

export interface QuickFilterOption {
  id: string;
  label: string;
}

export interface HierarchicalFilterSelection {
  ids: string[];
}

interface HierarchicalFilterProps {
  applyLabel?: string;
  disabled?: boolean;
  getResultCount: (selection: HierarchicalFilterSelection) => number;
  label: string;
  labelNodes?: FilterTreeNode[];
  nodes: FilterTreeNode[];
  onApply: (selection: HierarchicalFilterSelection) => void;
  panelSize?: "compact" | "default";
  quickOptions?: QuickFilterOption[];
  selectionMode?: "multiple" | "single";
  value: HierarchicalFilterSelection;
}

export function HierarchicalFilter({
  applyLabel,
  disabled,
  getResultCount,
  label,
  nodes,
  labelNodes = nodes,
  onApply,
  panelSize = "default",
  quickOptions = [],
  selectionMode = "multiple",
  value,
}: HierarchicalFilterProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [draftSelection, setDraftSelection] =
    useState<HierarchicalFilterSelection>(value);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(
    () => new Set(nodes.filter(hasChildren).map((node) => node.id)),
  );
  const triggerValue = getFilterValueLabel(labelNodes, value);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setDraftSelection(value);
      setIsAllSelected(false);
      setSearchQuery("");
      setExpandedNodeIds(
        new Set(nodes.filter(hasChildren).map((node) => node.id)),
      );
    }

    setIsOpen(nextOpen);
  }

  function handleNodeToggle(nodeId: string) {
    setIsAllSelected(false);
    setDraftSelection((currentSelection) => {
      if (selectionMode === "single") {
        return {
          ids:
            currentSelection.ids.length === 1 &&
            currentSelection.ids[0] === nodeId
              ? []
              : [nodeId],
        };
      }

      return toggleHierarchicalFilterSelection(
        nodes,
        currentSelection,
        nodeId,
      );
    });
  }

  function handleApply() {
    onApply(draftSelection);
    setIsOpen(false);
  }

  function handleNodeRemove(nodeId: string) {
    setIsAllSelected(false);
    setDraftSelection((currentSelection) => ({
      ...currentSelection,
      ids: currentSelection.ids.filter((selectedId) => selectedId !== nodeId),
    }));
  }

  function handleExpandedChange(nodeId: string) {
    setExpandedNodeIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(nodeId)) {
        nextIds.delete(nodeId);
      } else {
        nextIds.add(nodeId);
      }

      return nextIds;
    });
  }

  const content = (
    <FilterContent
      allCount={getResultCount({ ids: [] })}
      applyLabel={applyLabel}
      draftSelection={draftSelection}
      expandedNodeIds={expandedNodeIds}
      label={label}
      labelNodes={labelNodes}
      nodes={nodes}
      quickOptions={quickOptions}
      searchQuery={searchQuery}
      isAllSelected={isAllSelected}
      onApply={handleApply}
      onCancel={() => setIsOpen(false)}
      onExpandedChange={handleExpandedChange}
      onNodeToggle={handleNodeToggle}
      onNodeRemove={handleNodeRemove}
      onReset={() => {
        setDraftSelection(getDefaultFilterSelection());
        setIsAllSelected(false);
      }}
      onSelectAll={() => {
        setDraftSelection(getDefaultFilterSelection());
        setIsAllSelected(true);
      }}
      onSearchQueryChange={setSearchQuery}
    />
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetTrigger
          render={
            <button
              className={getTriggerClassName(isOpen)}
              disabled={disabled}
              type="button"
            />
          }
        >
          <FilterTriggerContent label={label} value={triggerValue} />
        </SheetTrigger>
        <SheetContent
          className="inset-0 z-modal h-[100dvh] w-full gap-0 border-0 bg-background sm:max-w-none"
          showCloseButton
          side="bottom"
        >
          <SheetHeader className="shrink-0 border-b border-default px-4 py-3">
            <SheetTitle className="text-body font-semibold">
              {label} 선택
            </SheetTitle>
          </SheetHeader>
          {content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Popover.Trigger
        className={getTriggerClassName(isOpen)}
        disabled={disabled}
      >
        <FilterTriggerContent label={label} value={triggerValue} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          align="start"
          className="z-popover"
          collisionAvoidance={{
            side: "none",
            align: "shift",
            fallbackAxisSide: "none",
          }}
          collisionPadding={16}
          collisionBoundary="clipping-ancestors"
          side="bottom"
          sideOffset={8}
        >
          <Popover.Popup
            className={cn(
              "flex flex-col overflow-hidden rounded-xl border border-default bg-surface-raised shadow-2xl outline-none transition-[transform,opacity] duration-default data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0",
              panelSize === "compact"
                ? "max-h-[min(31.25rem,var(--available-height))] w-[min(23rem,calc(100vw-2rem))]"
                : "max-h-[min(42rem,var(--available-height))] w-[min(26rem,calc(100vw-2rem))]",
            )}
          >
            <Popover.Title className="sr-only">{label} 선택</Popover.Title>
            {content}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}

function FilterTriggerContent({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <>
      <span className="text-caption font-medium text-tertiary">{label}</span>
      <span className="min-w-0 max-w-48 truncate text-body-sm font-semibold text-primary">
        {value}
      </span>
      <ChevronDown aria-hidden="true" className="ml-auto size-4 text-tertiary" />
    </>
  );
}

function getTriggerClassName(isOpen: boolean) {
  return cn(
    "inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-lg border bg-background py-0 pr-2.5 pl-3 text-left transition-[background-color,border-color] duration-default hover:bg-surface-muted focus-visible:border-focus-ring disabled:pointer-events-none disabled:opacity-50",
    isOpen ? "border-brand" : "border-default",
  );
}

interface FilterContentProps {
  allCount: number;
  applyLabel?: string;
  draftSelection: HierarchicalFilterSelection;
  expandedNodeIds: Set<string>;
  label: string;
  labelNodes: FilterTreeNode[];
  nodes: FilterTreeNode[];
  quickOptions: QuickFilterOption[];
  searchQuery: string;
  isAllSelected: boolean;
  onApply: () => void;
  onCancel: () => void;
  onExpandedChange: (nodeId: string) => void;
  onNodeToggle: (nodeId: string) => void;
  onNodeRemove: (nodeId: string) => void;
  onReset: () => void;
  onSelectAll: () => void;
  onSearchQueryChange: (query: string) => void;
}

function FilterContent({
  allCount,
  applyLabel,
  draftSelection,
  expandedNodeIds,
  label,
  labelNodes,
  nodes,
  quickOptions,
  searchQuery,
  isAllSelected,
  onApply,
  onCancel,
  onExpandedChange,
  onNodeToggle,
  onNodeRemove,
  onReset,
  onSelectAll,
  onSearchQueryChange,
}: FilterContentProps) {
  const visibleNodes = filterTreeNodes(nodes, searchQuery);
  const allState = getSelectAllState(isAllSelected);
  const isSearchActive = searchQuery.trim().length > 0;
  const isDefaultSelection =
    draftSelection.ids.length === 0 && !isAllSelected;
  const draftSummary = getFilterDraftSummary(labelNodes, draftSelection);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 space-y-4 border-b border-default p-4 md:space-y-3 md:p-3">
        {quickOptions.length > 0 ? (
          <div className="space-y-2">
            <p className="text-caption font-semibold text-secondary">
              빠른 선택
            </p>
            <div className="flex flex-wrap gap-2">
              {quickOptions.map((option) => (
                <Chip
                  className={cn(
                    "h-8 px-2.5 md:text-[13px]",
                    getHierarchicalFilterNodeSelectionState(
                      nodes,
                      draftSelection,
                      option.id,
                    ).checked &&
                      "border-brand bg-surface-selected text-brand-text",
                  )}
                  isSelected={
                    getHierarchicalFilterNodeSelectionState(
                      nodes,
                      draftSelection,
                      option.id,
                    ).checked
                  }
                  key={option.id}
                  onClick={() => onNodeToggle(option.id)}
                >
                  {option.label}
                </Chip>
              ))}
            </div>
          </div>
        ) : null}

        <SearchField
          className="h-10 md:text-[13px]"
          label={label + " 검색"}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          onClear={() => onSearchQueryChange("")}
          placeholder={label + " 검색..."}
          value={searchQuery}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
        <div className="space-y-1">
          {!isSearchActive ? (
            <FilterAllNode
              checked={allState.checked}
              count={allCount}
              indeterminate={allState.indeterminate}
              onToggle={onSelectAll}
            />
          ) : null}
          {visibleNodes.length > 0 ? (
            visibleNodes.map((node) => (
              <FilterNode
                draftSelection={draftSelection}
                expandedNodeIds={expandedNodeIds}
                isSearchActive={isSearchActive}
                key={node.id}
                node={node}
                onExpandedChange={onExpandedChange}
                onNodeToggle={onNodeToggle}
              />
            ))
          ) : (
            <div className="grid min-h-40 place-items-center px-4 text-center text-body-sm text-secondary md:text-[13px]">
              검색 결과가 없습니다.
            </div>
          )}
        </div>
      </div>

      {draftSummary ? (
        <div className="shrink-0 border-t border-default px-4 py-2 md:px-3">
          <div className="flex items-start gap-3">
            <p className="shrink-0 pt-2 text-caption font-semibold text-secondary">
              선택
            </p>
            <FilterDraftSummary
              items={draftSummary.items}
              onRemove={onNodeRemove}
            />
          </div>
        </div>
      ) : null}

      <div className="flex shrink-0 items-center gap-2 border-t border-default bg-surface-raised p-4 md:p-3 [&_button]:md:text-[13px]">
        <Button
          disabled={isDefaultSelection}
          onClick={onReset}
          variant="ghost"
        >
          초기화
        </Button>
        <Button className="ml-auto" onClick={onCancel} variant="outline">
          취소
        </Button>
        <Button className="min-w-32" onClick={onApply}>
          {applyLabel ?? "선택 적용"}
        </Button>
      </div>
    </div>
  );
}

interface FilterDraftSummaryProps {
  items: { id: string; label: string }[];
  onRemove: (nodeId: string) => void;
}

function FilterDraftSummary({ items, onRemove }: FilterDraftSummaryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef(new Map<string, HTMLSpanElement>());
  const overflowRefs = useRef(new Map<number, HTMLSpanElement>());
  const [visibleItemCount, setVisibleItemCount] = useState(items.length);

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const summaryContainer = container;

    function updateVisibleItemCount() {
      const availableWidth = summaryContainer.clientWidth;
      const itemWidths = items.map(
        (item) =>
          Math.ceil(itemRefs.current.get(item.id)?.getBoundingClientRect().width ?? 0),
      );
      const totalItemsWidth = itemWidths.reduce(
        (total, width) => total + width,
        0,
      );
      const totalGapsWidth = Math.max(items.length - 1, 0) * DRAFT_SUMMARY_GAP;

      if (totalItemsWidth + totalGapsWidth <= availableWidth) {
        setVisibleItemCount(items.length);
        return;
      }

      for (let count = items.length - 1; count >= 0; count -= 1) {
        const overflowCount = items.length - count;
        const overflowWidth =
          Math.ceil(
            overflowRefs.current
              .get(overflowCount)
              ?.getBoundingClientRect().width ?? 0,
          );
        const visibleItemsWidth = itemWidths
          .slice(0, count)
          .reduce((total, width) => total + width, 0);
        const requiredWidth =
          visibleItemsWidth +
          (count > 0 ? DRAFT_SUMMARY_GAP : 0) +
          overflowWidth;

        if (requiredWidth <= availableWidth) {
          setVisibleItemCount(count);
          return;
        }
      }

      setVisibleItemCount(0);
    }

    const resizeObserver = new ResizeObserver(updateVisibleItemCount);

    resizeObserver.observe(summaryContainer);
    updateVisibleItemCount();

    return () => resizeObserver.disconnect();
  }, [items]);

  const boundedVisibleItemCount = Math.min(visibleItemCount, items.length);
  const overflowCount = items.length - boundedVisibleItemCount;

  return (
    <div className="relative min-w-0 flex-1" ref={containerRef}>
      <div className="flex h-8 min-w-0 flex-nowrap items-center gap-2 overflow-hidden">
        {items.slice(0, boundedVisibleItemCount).map((item) => (
          <FilterDraftSummaryChip
            item={item}
            key={item.id}
            onRemove={() => onRemove(item.id)}
          />
        ))}
        {overflowCount > 0 ? (
          <DraftSummaryOverflow className="ml-auto" count={overflowCount} />
        ) : null}
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute invisible left-0 top-0 flex gap-2 whitespace-nowrap"
      >
        {items.map((item) => (
          <FilterDraftSummaryChip
            item={item}
            key={item.id}
            onRemove={() => undefined}
            ref={(element) => {
              if (element) {
                itemRefs.current.set(item.id, element);
              }
            }}
          />
        ))}
        {items.map((_, index) => {
          const count = index + 1;

          return (
            <DraftSummaryOverflow
              count={count}
              key={count}
              ref={(element) => {
                if (element) {
                  overflowRefs.current.set(count, element);
                }
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function FilterDraftSummaryChip({
  item,
  onRemove,
  ref,
}: {
  item: { id: string; label: string };
  onRemove: () => void;
  ref?: (element: HTMLSpanElement | null) => void;
}) {
  return (
    <span className="max-w-80 shrink-0" ref={ref}>
      <Chip
        className="max-w-full md:text-[13px]"
        mode="removable"
        onRemove={onRemove}
        removeLabel={item.label + " 선택 해제"}
      >
        <span className="min-w-0 truncate">{item.label}</span>
      </Chip>
    </span>
  );
}

function DraftSummaryOverflow({
  className,
  count,
  ref,
}: {
  className?: string;
  count: number;
  ref?: (element: HTMLSpanElement | null) => void;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-default bg-surface-muted px-2.5 text-body-sm font-medium text-secondary md:text-[13px]",
        className,
      )}
      ref={ref}
    >
      +{count}
    </span>
  );
}

function FilterAllNode({
  checked,
  count,
  indeterminate,
  onToggle,
}: {
  checked: boolean;
  count: number;
  indeterminate: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        "flex min-h-11 items-center rounded-lg pr-3 transition-colors duration-default hover:bg-surface-muted md:min-h-10 md:pr-2",
        (checked || indeterminate) && "bg-surface-selected/60",
      )}
    >
      <span aria-hidden="true" className="size-11 shrink-0 md:size-9" />
      <FilterCheckbox
        ariaLabel="전체 필터"
        checked={checked}
        indeterminate={indeterminate}
        label="전체"
        onCheckedChange={onToggle}
      />
      <button
        className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center text-left md:min-h-10"
        onClick={onToggle}
        type="button"
      >
        <span className="min-w-0 flex-1 truncate text-body-sm font-medium text-primary md:text-[13px]">
          전체
        </span>
        <span className="ml-3 shrink-0 text-caption tabular-nums text-tertiary">
          {count}
        </span>
      </button>
    </div>
  );
}

interface FilterNodeProps {
  draftSelection: HierarchicalFilterSelection;
  expandedNodeIds: Set<string>;
  isSearchActive: boolean;
  node: FilterTreeNode;
  onExpandedChange: (nodeId: string) => void;
  onNodeToggle: (nodeId: string) => void;
}

function FilterNode({
  draftSelection,
  expandedNodeIds,
  isSearchActive,
  node,
  onExpandedChange,
  onNodeToggle,
}: FilterNodeProps) {
  const children = node.children ?? [];
  const isExpanded =
    children.length > 0 && (isSearchActive || expandedNodeIds.has(node.id));
  const state = getHierarchicalFilterNodeSelectionState(
    [node],
    draftSelection,
    node.id,
  );

  return (
    <div>
      <div
        className={cn(
          "flex min-h-11 items-center rounded-lg pr-3 transition-colors duration-default md:min-h-10 md:pr-2",
          node.disabled ? "opacity-50" : "hover:bg-surface-muted",
          (state.checked || state.indeterminate) && "bg-surface-selected/60",
        )}
      >
        {children.length > 0 ? (
          <button
            aria-expanded={isExpanded}
            aria-label={node.label + (isExpanded ? " 접기" : " 펼치기")}
            className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-lg text-tertiary hover:text-primary md:size-9"
            onClick={() => onExpandedChange(node.id)}
            type="button"
          >
            {isExpanded ? (
              <ChevronDown aria-hidden="true" className="size-4" />
            ) : (
              <ChevronRight aria-hidden="true" className="size-4" />
            )}
          </button>
        ) : (
          <span aria-hidden="true" className="size-11 shrink-0 md:size-9" />
        )}
        <FilterCheckbox
          checked={state.checked}
          disabled={node.disabled}
          indeterminate={state.indeterminate}
          label={node.label}
          onCheckedChange={() => onNodeToggle(node.id)}
        />
        <button
          className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center text-left disabled:cursor-not-allowed md:min-h-10"
          disabled={node.disabled}
          onClick={() => onNodeToggle(node.id)}
          type="button"
        >
          <span className="min-w-0 flex-1 truncate text-body-sm font-medium text-primary md:text-[13px]">
            {node.label}
          </span>
          {node.count !== undefined ? (
            <span className="ml-3 shrink-0 text-caption tabular-nums text-tertiary">
              {node.count}
            </span>
          ) : null}
        </button>
      </div>

      {isExpanded ? (
        <div className="relative ml-11 space-y-1 border-l border-default/70 pl-3 md:ml-9 md:pl-2">
          {children.map((child) => {
            const childState = getHierarchicalFilterNodeSelectionState(
              [node],
              draftSelection,
              child.id,
            );

            return (
              <div
                className={cn(
                  "flex min-h-11 items-center rounded-lg pr-3 pl-2 transition-colors duration-default md:min-h-10 md:pr-2 md:pl-1",
                  child.disabled ? "opacity-50" : "hover:bg-surface-muted",
                  (childState.checked || childState.indeterminate) &&
                    "bg-surface-selected/60",
                )}
                key={child.id}
              >
                <FilterCheckbox
                  checked={childState.checked}
                  disabled={child.disabled}
                  indeterminate={childState.indeterminate}
                  label={child.label}
                  onCheckedChange={() => onNodeToggle(child.id)}
                />
                <button
                  className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center text-left disabled:cursor-not-allowed md:min-h-10"
                  disabled={child.disabled}
                  onClick={() => onNodeToggle(child.id)}
                  type="button"
                >
                  <span className="min-w-0 flex-1 truncate text-body-sm text-primary md:text-[13px]">
                    {child.label}
                  </span>
                  {child.count !== undefined ? (
                    <span className="ml-3 shrink-0 text-caption tabular-nums text-tertiary">
                      {child.count}
                    </span>
                  ) : null}
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function FilterCheckbox({
  ariaLabel,
  checked,
  disabled,
  indeterminate,
  label,
  onCheckedChange,
}: {
  ariaLabel?: string;
  checked: boolean;
  disabled?: boolean;
  indeterminate: boolean;
  label: string;
  onCheckedChange: () => void;
}) {
  return (
    <Checkbox.Root
      aria-label={ariaLabel ?? label + " 선택"}
      checked={checked}
      className={cn(
        "mr-2 grid size-5 shrink-0 place-items-center rounded border border-control bg-background text-brand-foreground transition-colors duration-default",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        (checked || indeterminate) && "border-brand bg-brand",
      )}
      disabled={disabled}
      indeterminate={indeterminate}
      onCheckedChange={onCheckedChange}
    >
      <Checkbox.Indicator>
        {indeterminate ? (
          <Minus aria-hidden="true" className="size-3.5" />
        ) : (
          <Check aria-hidden="true" className="size-3.5" />
        )}
      </Checkbox.Indicator>
    </Checkbox.Root>
  );
}

export function filterTreeNodes(
  nodes: FilterTreeNode[],
  query: string,
): FilterTreeNode[] {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return nodes;
  }

  return nodes.flatMap((node) => {
    if (matchesKoreanSearch(node.label, normalizedQuery)) {
      return [node];
    }

    const matchedChildren = (node.children ?? []).filter((child) =>
      matchesKoreanSearch(child.label, normalizedQuery),
    );

    return matchedChildren.length > 0
      ? [{ ...node, children: matchedChildren }]
      : [];
  });
}

export function toggleFilterNodeSelection(
  nodes: FilterTreeNode[],
  value: string[],
  nodeId: string,
): string[] {
  const selectedIds = new Set(value);
  const branch = findFilterBranch(nodes, nodeId);

  if (!branch) {
    return value;
  }

  if (branch.parent.id === nodeId) {
    if (selectedIds.has(nodeId)) {
      selectedIds.delete(nodeId);
    } else {
      selectedIds.add(nodeId);
      for (const child of branch.parent.children ?? []) {
        selectedIds.delete(child.id);
      }
    }
  } else {
    selectedIds.delete(branch.parent.id);

    if (selectedIds.has(nodeId)) {
      selectedIds.delete(nodeId);
    } else {
      selectedIds.add(nodeId);
    }
  }

  return Array.from(selectedIds);
}

export function getFilterNodeSelectionState(
  node: FilterTreeNode,
  value: string[],
  parentId?: string,
): { checked: boolean; indeterminate: boolean } {
  const checked =
    value.includes(node.id) ||
    (parentId !== undefined && value.includes(parentId));
  const indeterminate =
    !checked &&
    (node.children ?? []).some((child) => value.includes(child.id));

  return { checked, indeterminate };
}

export function getFilterValueLabel(
  nodes: FilterTreeNode[],
  selection: HierarchicalFilterSelection,
): string {
  if (selection.ids.length === 0) {
    return "전체";
  }

  if (selection.ids.length > 1) {
    return selection.ids.length + "개 선택";
  }

  const label = getFilterNodeLabel(nodes, selection.ids[0]);

  if (!label) {
    return "1개 선택";
  }

  return label;
}

export function toggleHierarchicalFilterSelection(
  nodes: FilterTreeNode[],
  selection: HierarchicalFilterSelection,
  nodeId: string,
): HierarchicalFilterSelection {
  const branch = findFilterBranch(nodes, nodeId);
  const node = branch?.child ?? branch?.parent;

  if (!node || node.disabled) {
    return selection;
  }

  return {
    ids: toggleFilterNodeSelection(nodes, selection.ids, nodeId),
  };
}

export function getHierarchicalFilterNodeSelectionState(
  nodes: FilterTreeNode[],
  selection: HierarchicalFilterSelection,
  nodeId: string,
): { checked: boolean; indeterminate: boolean } {
  const branch = findFilterBranch(nodes, nodeId);

  if (!branch) {
    return { checked: false, indeterminate: false };
  }

  return getFilterNodeSelectionState(
    branch.child ?? branch.parent,
    selection.ids,
    branch.child ? branch.parent.id : undefined,
  );
}

export function getSelectAllState(
  isAllSelected: boolean,
): { checked: boolean; indeterminate: boolean } {
  return {
    checked: isAllSelected,
    indeterminate: false,
  };
}

export function getDefaultFilterSelection(): HierarchicalFilterSelection {
  return { ids: [] };
}

interface FilterDraftSummary {
  items: { id: string; label: string }[];
}

export function getFilterDraftSummary(
  nodes: FilterTreeNode[],
  selection: HierarchicalFilterSelection,
): FilterDraftSummary | null {
  if (selection.ids.length === 0) {
    return null;
  }

  return {
    items: selection.ids.map((id) => ({
      id,
      label: getFilterNodeLeafLabel(nodes, id) ?? id,
    })),
  };
}

export function getFilterNodeLabel(
  nodes: FilterTreeNode[],
  nodeId: string,
): string | null {
  const branch = findFilterBranch(nodes, nodeId);

  if (!branch) {
    return null;
  }

  return branch.child
    ? branch.parent.label + " > " + branch.child.label
    : branch.parent.label;
}

export function getFilterNodeLeafLabel(
  nodes: FilterTreeNode[],
  nodeId: string,
): string | null {
  const branch = findFilterBranch(nodes, nodeId);

  return branch ? (branch.child ?? branch.parent).label : null;
}

function findFilterBranch(
  nodes: FilterTreeNode[],
  nodeId: string,
): { parent: FilterTreeNode; child: FilterTreeNode | null } | null {
  for (const parent of nodes) {
    if (parent.id === nodeId) {
      return { parent, child: null };
    }

    const child = (parent.children ?? []).find(
      (candidate) => candidate.id === nodeId,
    );

    if (child) {
      return { parent, child };
    }
  }

  return null;
}

function hasChildren(node: FilterTreeNode): boolean {
  return (node.children?.length ?? 0) > 0;
}
