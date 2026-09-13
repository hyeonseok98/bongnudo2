"use client";

import { useRef } from "react";

import { Input, type InputProps } from "./input";

interface PickerInputProps extends Omit<InputProps, "type"> {
  type: "date" | "time";
}

export function PickerInput({ onClick, onFocus, ...props }: PickerInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function showPicker(): void {
    try {
      inputRef.current?.showPicker();
    } catch {
      // 일부 브라우저는 사용자 동작 밖의 showPicker 호출을 허용하지 않습니다.
    }
  }

  return (
    <Input
      {...props}
      onClick={(event) => {
        onClick?.(event);
        showPicker();
      }}
      onFocus={(event) => {
        onFocus?.(event);
        showPicker();
      }}
      ref={inputRef}
    />
  );
}
