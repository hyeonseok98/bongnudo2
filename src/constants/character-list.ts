export const CHARACTER_SORT_VALUES = ["asc", "desc"] as const;
export const CHARACTER_VIEW_VALUES = ["grid", "list"] as const;

export type CharacterSort = (typeof CHARACTER_SORT_VALUES)[number];
export type CharacterView = (typeof CHARACTER_VIEW_VALUES)[number];

export function isCharacterSort(value: string): value is CharacterSort {
  return CHARACTER_SORT_VALUES.some((sort) => sort === value);
}

export function isCharacterView(value: string): value is CharacterView {
  return CHARACTER_VIEW_VALUES.some((view) => view === value);
}
