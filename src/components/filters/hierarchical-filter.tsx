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
  children?: FilterTreeNode[];
}

export interface QuickFilterOption {
  id: string;
  label: string;
}

interface HierarchicalFilterProps {
  disabled?: boolean;
  getResultCount: (value: string[]) => number;
  label: string;
  labelNodes?: FilterTreeNode[];
  nodes: FilterTreeNode[];
  onApply: (value: string[]) => void;
  quickOptions: QuickFilterOption[];
  selectionMode?: "multiple" | "single";
  value: string[];
}

export function HierarchicalFilter({
  disabled,
  getResultCount,
  label,
  nodes,
  labelNodes = nodes,
  onApply,
  quickOptions,
  selectionMode = "multiple",
  value,
}: HierarchicalFilterProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [draftValue, setDraftValue] = useState<string[]>(value);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(
    () => new Set(nodes.filter(hasChildren).map((node) => node.id)),
  );
  const triggerValue = getFilterValueLabel(labelNodes, value);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setDraftValue(value);
      setSearchQuery("");
      setExpandedNodeIds(
        new Set(nodes.filter(hasChildren).map((node) => node.id)),
      );
    }

    setIsOpen(nextOpen);
  }

  function handleNodeToggle(nodeId: string) {
    setDraftValue((currentValue) => {
      if (selectionMode === "single") {
        return currentValue.includes(nodeId) ? [] : [nodeId];
      }

      return toggleFilterNodeSelection(nodes, currentValue, nodeId);
    });
  }

  function handleApply() {
    onApply(draftValue);
    setIsOpen(false);
  }

  function handleNodeRemove(nodeId: string) {
    setDraftValue((currentValue) =>
      currentValue.filter((selectedId) => selectedId !== nodeId),
    );
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
      draftValue={draftValue}
      expandedNodeIds={expandedNodeIds}
      label={label}
      labelNodes={labelNodes}
      nodes={nodes}
      quickOptions={quickOptions}
      resultCount={getResultCount(draftValue)}
      searchQuery={searchQuery}
      onApply={handleApply}
      onCancel={() => setIsOpen(false)}
      onExpandedChange={handleExpandedChange}
      onNodeToggle={handleNodeToggle}
      onNodeRemove={handleNodeRemove}
      onReset={() => setDraftValue([])}
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
          sideOffset={8}
        >
          <Popover.Popup className="flex h-[min(42rem,calc(100vh-7rem))] w-[min(30rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border border-default bg-surface-raised shadow-2xl outline-none transition-[transform,opacity] duration-default data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
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
  draftValue: string[];
  expandedNodeIds: Set<string>;
  label: string;
  labelNodes: FilterTreeNode[];
  nodes: FilterTreeNode[];
  quickOptions: QuickFilterOption[];
  resultCount: number;
  searchQuery: string;
  onApply: () => void;
  onCancel: () => void;
  onExpandedChange: (nodeId: string) => void;
  onNodeToggle: (nodeId: string) => void;
  onNodeRemove: (nodeId: string) => void;
  onReset: () => void;
  onSearchQueryChange: (query: string) => void;
}

function FilterContent({
  draftValue,
  expandedNodeIds,
  label,
  labelNodes,
  nodes,
  quickOptions,
  resultCount,
  searchQuery,
  onApply,
  onCancel,
  onExpandedChange,
  onNodeToggle,
  onNodeRemove,
  onReset,
  onSearchQueryChange,
}: FilterContentProps) {
  const visibleNodes = filterTreeNodes(nodes, searchQuery);

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
                    draftValue.includes(option.id) &&
                      "border-brand bg-surface-selected text-brand-text",
                  )}
                  isSelected={draftValue.includes(option.id)}
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

      {draftValue.length > 0 ? (
        <div className="shrink-0 space-y-2 border-b border-default px-4 py-3">
          <p className="text-caption font-semibold text-secondary">
            선택 {draftValue.length}개
          </p>
          <div className="flex flex-wrap gap-2">
            {draftValue.map((nodeId) => (
              <Chip
                key={nodeId}
                mode="removable"
                onRemove={() => onNodeRemove(nodeId)}
                removeLabel={
                  (getFilterNodeLabel(labelNodes, nodeId) ?? nodeId) +
                  " 선택 해제"
                }
              >
                {getFilterNodeLabel(labelNodes, nodeId) ?? nodeId}
              </Chip>
            ))}
          </div>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-2">
        {visibleNodes.length > 0 ? (
          <div className="space-y-1">
            {visibleNodes.map((node) => (
              <FilterNode
                draftValue={draftValue}
                expandedNodeIds={expandedNodeIds}
                isSearchActive={searchQuery.trim().length > 0}
                key={node.id}
                node={node}
                onExpandedChange={onExpandedChange}
                onNodeToggle={onNodeToggle}
              />
            ))}
          </div>
        ) : (
          <div className="grid min-h-40 place-items-center px-4 text-center text-body-sm text-secondary">
            검색 결과가 없습니다.
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 border-t border-default bg-surface-raised p-4">
        <Button
          disabled={draftValue.length === 0}
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

interface FilterNodeProps {
  draftValue: string[];
  expandedNodeIds: Set<string>;
  isSearchActive: boolean;
  node: FilterTreeNode;
  onExpandedChange: (nodeId: string) => void;
  onNodeToggle: (nodeId: string) => void;
}

function FilterNode({
  draftValue,
  expandedNodeIds,
  isSearchActive,
  node,
  onExpandedChange,
  onNodeToggle,
}: FilterNodeProps) {
  const children = node.children ?? [];
  const isExpanded =
    children.length > 0 && (isSearchActive || expandedNodeIds.has(node.id));
  const state = getFilterNodeSelectionState(node, draftValue);

  return (
    <div>
      <div
        className={cn(
          "flex min-h-11 items-center rounded-lg pr-3 transition-colors duration-default hover:bg-surface-muted",
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
          indeterminate={state.indeterminate}
          label={node.label}
          onCheckedChange={() => onNodeToggle(node.id)}
        />
        <button
          className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center text-left"
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
            const childState = getFilterNodeSelectionState(
              child,
              draftValue,
              node.id,
            );

            return (
              <div
                className={cn(
                  "flex min-h-11 items-center rounded-lg pr-3 pl-2 transition-colors duration-default hover:bg-surface-muted",
                  childState.checked && "bg-surface-selected/60",
                )}
                key={child.id}
              >
                <FilterCheckbox
                  checked={childState.checked}
                  indeterminate={false}
                  label={child.label}
                  onCheckedChange={() => onNodeToggle(child.id)}
                />
                <button
                  className="flex min-h-11 min-w-0 flex-1 cursor-pointer items-center text-left"
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
  indeterminate,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  indeterminate: boolean;
  label: string;
  onCheckedChange: () => void;
}) {
  return (
    <Checkbox.Root
      aria-label={label + " 선택"}
      checked={checked}
      className={cn(
        "mr-2 grid size-5 shrink-0 cursor-pointer place-items-center rounded border border-control bg-background text-brand-foreground transition-colors duration-default",
        (checked || indeterminate) && "border-brand bg-brand",
      )}
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
  value: string[],
): string {
  if (value.length === 0) {
    return "전체";
  }

  if (value.length > 1) {
    return value.length + "개 선택";
  }

  const label = getFilterNodeLabel(nodes, value[0]);

  if (!label) {
    return "1개 선택";
  }

  return label;
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
