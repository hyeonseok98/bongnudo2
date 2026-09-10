"use client";

import { Checkbox } from "@base-ui/react/checkbox";
import { Popover } from "@base-ui/react/popover";
import { Check, ChevronDown, ChevronRight, Minus } from "lucide-react";
import { useState } from "react";

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

export type HierarchicalFilterSelection =
  | { mode: "include"; ids: string[] }
  | { mode: "exclude"; ids: string[] };

interface HierarchicalFilterProps {
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
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(
    () => new Set(nodes.filter(hasChildren).map((node) => node.id)),
  );
  const triggerValue = getFilterValueLabel(labelNodes, value);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setDraftSelection(value);
      setSearchQuery("");
      setExpandedNodeIds(
        new Set(nodes.filter(hasChildren).map((node) => node.id)),
      );
    }

    setIsOpen(nextOpen);
  }

  function handleNodeToggle(nodeId: string) {
    setDraftSelection((currentSelection) =>
      toggleHierarchicalFilterSelection(
        nodes,
        currentSelection,
        nodeId,
        selectionMode,
      ),
    );
  }

  function handleApply() {
    onApply(draftSelection);
    setIsOpen(false);
  }

  function handleNodeRemove(nodeId: string) {
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
      allCount={getResultCount({ mode: "include", ids: [] })}
      draftSelection={draftSelection}
      expandedNodeIds={expandedNodeIds}
      label={label}
      labelNodes={labelNodes}
      nodes={nodes}
      quickOptions={quickOptions}
      resultCount={getResultCount(draftSelection)}
      searchQuery={searchQuery}
      selectionMode={selectionMode}
      onApply={handleApply}
      onCancel={() => setIsOpen(false)}
      onExpandedChange={handleExpandedChange}
      onNodeToggle={handleNodeToggle}
      onNodeRemove={handleNodeRemove}
      onReset={() => setDraftSelection(getDefaultFilterSelection())}
      onSelectAll={() =>
        setDraftSelection((currentSelection) =>
          toggleSelectAll(currentSelection, selectionMode),
        )
      }
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
          collisionAvoidance={
            panelSize === "compact"
              ? {
                  side: "none",
                  align: "shift",
                  fallbackAxisSide: "none",
                }
              : undefined
          }
          collisionPadding={panelSize === "compact" ? 16 : undefined}
          side={panelSize === "compact" ? "bottom" : undefined}
          sideOffset={8}
        >
          <Popover.Popup
            className={cn(
              "flex flex-col overflow-hidden rounded-xl border border-default bg-surface-raised shadow-2xl outline-none transition-[transform,opacity] duration-default data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0",
              panelSize === "compact"
                ? "max-h-[min(31.25rem,var(--available-height))] w-[min(26rem,calc(100vw-2rem))]"
                : "max-h-[min(42rem,calc(100vh-7rem))] w-[min(30rem,calc(100vw-2rem))]",
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
    "inline-flex h-11 min-w-40 cursor-pointer items-center gap-2 rounded-lg border bg-background px-3 text-left transition-[background-color,border-color] duration-default hover:bg-surface-muted focus-visible:border-focus-ring disabled:pointer-events-none disabled:opacity-50",
    isOpen ? "border-brand" : "border-default",
  );
}

interface FilterContentProps {
  allCount: number;
  draftSelection: HierarchicalFilterSelection;
  expandedNodeIds: Set<string>;
  label: string;
  labelNodes: FilterTreeNode[];
  nodes: FilterTreeNode[];
  quickOptions: QuickFilterOption[];
  resultCount: number;
  searchQuery: string;
  selectionMode: "multiple" | "single";
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
  draftSelection,
  expandedNodeIds,
  label,
  labelNodes,
  nodes,
  quickOptions,
  resultCount,
  searchQuery,
  selectionMode,
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
  const allState = getSelectAllState(draftSelection, selectionMode);
  const isDefaultSelection =
    draftSelection.mode === "include" && draftSelection.ids.length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 space-y-4 border-b border-default p-4">
        {quickOptions.length > 0 ? (
          <div className="space-y-2">
            <p className="text-caption font-semibold text-secondary">
              빠른 선택
            </p>
            <div className="flex flex-wrap gap-2">
              {quickOptions.map((option) => (
                <Chip
                  className={cn(
                    "h-8 px-2.5",
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
          className="h-10"
          label={label + " 검색"}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          onClear={() => onSearchQueryChange("")}
          placeholder={label + " 검색..."}
          value={searchQuery}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
        <div className="space-y-1">
          <FilterAllNode
            checked={allState.checked}
            count={allCount}
            indeterminate={allState.indeterminate}
            onToggle={onSelectAll}
          />
          {visibleNodes.length > 0 ? (
            visibleNodes.map((node) => (
              <FilterNode
                draftSelection={draftSelection}
                expandedNodeIds={expandedNodeIds}
                isSearchActive={searchQuery.trim().length > 0}
                key={node.id}
                node={node}
                onExpandedChange={onExpandedChange}
                onNodeToggle={onNodeToggle}
              />
            ))
          ) : (
            <div className="grid min-h-40 place-items-center px-4 text-center text-body-sm text-secondary">
              검색 결과가 없습니다.
            </div>
          )}
        </div>
      </div>

      {!isDefaultSelection ? (
        <div className="flex h-14 shrink-0 items-center gap-3 border-t border-default px-4">
          <p className="shrink-0 text-caption font-semibold text-secondary">
            {getDraftSummaryLabel(draftSelection)}
          </p>
          {draftSelection.ids.length > 0 ? (
            <div className="min-w-0 flex-1 overflow-x-auto">
              <div className="flex w-max gap-2 pr-1">
                {draftSelection.ids.map((nodeId) => (
                  <Chip
                    className="shrink-0"
                    key={nodeId}
                    mode="removable"
                    onRemove={() => onNodeRemove(nodeId)}
                    removeLabel={
                      (getFilterNodeLabel(labelNodes, nodeId) ?? nodeId) +
                      (draftSelection.mode === "exclude"
                        ? " 제외 해제"
                        : " 선택 해제")
                    }
                  >
                    {getFilterNodeLabel(labelNodes, nodeId) ?? nodeId}
                  </Chip>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex shrink-0 items-center gap-2 border-t border-default bg-surface-raised p-4">
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
          {resultCount}명 보기
        </Button>
      </div>
    </div>
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
        "flex min-h-11 items-center rounded-lg pr-3 transition-colors duration-default hover:bg-surface-muted",
        (checked || indeterminate) && "bg-surface-selected/60",
      )}
    >
      <span aria-hidden="true" className="size-11 shrink-0" />
      <FilterCheckbox
        checked={checked}
        indeterminate={indeterminate}
        label="전체"
        onCheckedChange={onToggle}
      />
      <button
        className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center text-left"
        onClick={onToggle}
        type="button"
      >
        <span className="min-w-0 flex-1 truncate text-body-sm font-medium text-primary">
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
          "flex min-h-11 items-center rounded-lg pr-3 transition-colors duration-default",
          node.disabled ? "opacity-50" : "hover:bg-surface-muted",
          (state.checked || state.indeterminate) && "bg-surface-selected/60",
        )}
      >
        {children.length > 0 ? (
          <button
            aria-expanded={isExpanded}
            aria-label={node.label + (isExpanded ? " 접기" : " 펼치기")}
            className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-lg text-tertiary hover:text-primary"
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
          <span aria-hidden="true" className="size-11 shrink-0" />
        )}
        <FilterCheckbox
          checked={state.checked}
          disabled={node.disabled}
          indeterminate={state.indeterminate}
          label={node.label}
          onCheckedChange={() => onNodeToggle(node.id)}
        />
        <button
          className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center text-left disabled:cursor-not-allowed"
          disabled={node.disabled}
          onClick={() => onNodeToggle(node.id)}
          type="button"
        >
          <span className="min-w-0 flex-1 truncate text-body-sm font-medium text-primary">
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
        <div className="relative ml-11 space-y-1 border-l border-default/70 pl-3">
          {children.map((child) => {
            const childState = getHierarchicalFilterNodeSelectionState(
              [node],
              draftSelection,
              child.id,
            );

            return (
              <div
                className={cn(
                  "flex min-h-11 items-center rounded-lg pr-3 pl-2 transition-colors duration-default",
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
                  className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center text-left disabled:cursor-not-allowed"
                  disabled={child.disabled}
                  onClick={() => onNodeToggle(child.id)}
                  type="button"
                >
                  <span className="min-w-0 flex-1 truncate text-body-sm text-primary">
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
  checked,
  disabled,
  indeterminate,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  disabled?: boolean;
  indeterminate: boolean;
  label: string;
  onCheckedChange: () => void;
}) {
  return (
    <Checkbox.Root
      aria-label={label + " 선택"}
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
  const normalizedQuery = query.trim().toLocaleLowerCase("ko-KR");

  if (!normalizedQuery) {
    return nodes;
  }

  return nodes.flatMap((node) => {
    if (node.label.toLocaleLowerCase("ko-KR").includes(normalizedQuery)) {
      return [node];
    }

    const matchedChildren = (node.children ?? []).filter((child) =>
      child.label.toLocaleLowerCase("ko-KR").includes(normalizedQuery),
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
    return (
      selection.ids.length +
      (selection.mode === "exclude" ? "개 제외" : "개 선택")
    );
  }

  const label = getFilterNodeLabel(nodes, selection.ids[0]);

  if (!label) {
    return selection.mode === "exclude" ? "1개 제외" : "1개 선택";
  }

  return selection.mode === "exclude" ? label + " 제외" : label;
}

export function toggleSelectAll(
  selection: HierarchicalFilterSelection,
  selectionMode: "multiple" | "single",
): HierarchicalFilterSelection {
  if (selectionMode === "single" || selection.mode === "exclude") {
    return { mode: "include", ids: [] };
  }

  return { mode: "exclude", ids: [] };
}

export function toggleHierarchicalFilterSelection(
  nodes: FilterTreeNode[],
  selection: HierarchicalFilterSelection,
  nodeId: string,
  selectionMode: "multiple" | "single",
): HierarchicalFilterSelection {
  const branch = findFilterBranch(nodes, nodeId);
  const node = branch?.child ?? branch?.parent;

  if (!node || node.disabled) {
    return selection;
  }

  if (selectionMode === "single") {
    return {
      mode: "include",
      ids: selection.ids.includes(nodeId) ? [] : [nodeId],
    };
  }

  if (selection.mode === "include") {
    return {
      mode: "include",
      ids: toggleFilterNodeSelection(nodes, selection.ids, nodeId),
    };
  }

  return {
    mode: "exclude",
    ids: toggleFilterNodeExclusion(nodes, selection.ids, nodeId),
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

  if (selection.mode === "include") {
    return getFilterNodeSelectionState(
      branch.child ?? branch.parent,
      selection.ids,
      branch.child ? branch.parent.id : undefined,
    );
  }

  if (selection.ids.includes(branch.parent.id)) {
    return { checked: false, indeterminate: false };
  }

  if (branch.child) {
    return {
      checked: !selection.ids.includes(branch.child.id),
      indeterminate: false,
    };
  }

  const hasExcludedChild = (branch.parent.children ?? []).some((child) =>
    selection.ids.includes(child.id),
  );

  return {
    checked: !hasExcludedChild,
    indeterminate: hasExcludedChild,
  };
}

export function getSelectAllState(
  selection: HierarchicalFilterSelection,
  selectionMode: "multiple" | "single",
): { checked: boolean; indeterminate: boolean } {
  if (selectionMode === "single") {
    return {
      checked: selection.ids.length === 0,
      indeterminate: false,
    };
  }

  return {
    checked: selection.mode === "exclude" && selection.ids.length === 0,
    indeterminate: selection.ids.length > 0,
  };
}

function toggleFilterNodeExclusion(
  nodes: FilterTreeNode[],
  excludedIds: string[],
  nodeId: string,
): string[] {
  const nextExcludedIds = new Set(excludedIds);
  const branch = findFilterBranch(nodes, nodeId);

  if (!branch) {
    return excludedIds;
  }

  if (branch.parent.id === nodeId) {
    if (nextExcludedIds.has(nodeId)) {
      nextExcludedIds.delete(nodeId);
    } else {
      nextExcludedIds.add(nodeId);
      for (const child of branch.parent.children ?? []) {
        nextExcludedIds.delete(child.id);
      }
    }
  } else if (nextExcludedIds.has(branch.parent.id)) {
    nextExcludedIds.delete(branch.parent.id);
    for (const sibling of branch.parent.children ?? []) {
      if (sibling.id !== nodeId) {
        nextExcludedIds.add(sibling.id);
      }
    }
  } else if (nextExcludedIds.has(nodeId)) {
    nextExcludedIds.delete(nodeId);
  } else {
    nextExcludedIds.add(nodeId);
  }

  return Array.from(nextExcludedIds);
}

export function getDefaultFilterSelection(): HierarchicalFilterSelection {
  return { mode: "include", ids: [] };
}

export function getDraftSummaryLabel(
  selection: HierarchicalFilterSelection,
): string {
  if (selection.mode === "exclude" && selection.ids.length === 0) {
    return "전체 선택";
  }

  return (
    (selection.mode === "exclude" ? "제외 " : "선택 ") +
    selection.ids.length
  );
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
