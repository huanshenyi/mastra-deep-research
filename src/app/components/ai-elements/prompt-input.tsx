"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2, Send } from "lucide-react";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type FormHTMLAttributes,
  type HTMLAttributes,
  type TextareaHTMLAttributes,
  type ReactNode,
} from "react";

interface PromptInputContextValue {
  value: string;
  setValue: (value: string) => void;
  isSubmitting: boolean;
  externalValue: string | undefined;
}

const PromptInputContext = createContext<PromptInputContextValue | null>(null);

const usePromptInput = () => {
  const context = useContext(PromptInputContext);
  if (!context) {
    throw new Error("usePromptInput must be used within a PromptInput");
  }
  return context;
};

export type PromptInputProps = Omit<
  FormHTMLAttributes<HTMLFormElement>,
  "onSubmit"
> & {
  children: ReactNode;
  onSubmit?: (text: string) => void;
  isSubmitting?: boolean;
  value?: string;
};

export const PromptInput = ({
  children,
  className,
  onSubmit,
  isSubmitting = false,
  value: externalValue,
  ...props
}: PromptInputProps) => {
  const [internalValue, setInternalValue] = useState("");
  const currentValue = externalValue !== undefined ? externalValue : internalValue;

  const setValue = useCallback((val: string) => {
    setInternalValue(val);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentValue.trim() && onSubmit && !isSubmitting) {
      onSubmit(currentValue.trim());
      if (externalValue === undefined) {
        setInternalValue("");
      }
    }
  };

  return (
    <PromptInputContext.Provider
      value={{
        value: internalValue,
        setValue,
        isSubmitting,
        externalValue
      }}
    >
      <form
        onSubmit={handleSubmit}
        className={cn(
          "relative flex flex-col gap-2 rounded-2xl border bg-background p-3 shadow-sm",
          "focus-within:ring-2 focus-within:ring-ring/20",
          className
        )}
        {...props}
      >
        {children}
      </form>
    </PromptInputContext.Provider>
  );
};

export type PromptInputTextareaProps = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "value" | "onChange"
> & {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
};

export const PromptInputTextarea = ({
  className,
  placeholder = "メッセージを入力...",
  value: propValue,
  onChange: propOnChange,
  ...props
}: PromptInputTextareaProps) => {
  const context = usePromptInput();

  // Use prop value if provided, otherwise use context internal value
  const displayValue = propValue !== undefined ? propValue : context.value;
  const { setValue } = context;

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (propOnChange) {
      propOnChange(e);
    }
    // Always update internal value for submit button state
    setValue(e.target.value);
  };

  // Sync external value to internal state for submit button
  useEffect(() => {
    if (propValue !== undefined) {
      setValue(propValue);
    }
  }, [propValue, setValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.closest("form");
      if (form) {
        form.requestSubmit();
      }
    }
  };

  return (
    <textarea
      className={cn(
        "flex-1 resize-none bg-transparent text-sm outline-none",
        "placeholder:text-muted-foreground",
        "min-h-[60px] max-h-[200px]",
        className
      )}
      placeholder={placeholder}
      value={displayValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      disabled={context.isSubmitting}
      {...props}
    />
  );
};

export type PromptInputActionsProps = HTMLAttributes<HTMLDivElement>;

export const PromptInputActions = ({
  children,
  className,
  ...props
}: PromptInputActionsProps) => (
  <div
    className={cn("flex items-center justify-between gap-2", className)}
    {...props}
  >
    {children}
  </div>
);

export type PromptInputSubmitProps = HTMLAttributes<HTMLButtonElement> & {
  disabled?: boolean;
};

export const PromptInputSubmit = ({
  className,
  disabled,
  ...props
}: PromptInputSubmitProps) => {
  const { value, isSubmitting } = usePromptInput();
  const isDisabled = disabled || !value.trim() || isSubmitting;

  return (
    <Button
      type="submit"
      size="sm"
      disabled={isDisabled}
      className={cn(
        "rounded-xl transition-all duration-200",
        isDisabled ? "opacity-50" : "hover:scale-105",
        className
      )}
      {...props}
    >
      {isSubmitting ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Send className="size-4" />
      )}
      <span className="sr-only">送信</span>
    </Button>
  );
};
