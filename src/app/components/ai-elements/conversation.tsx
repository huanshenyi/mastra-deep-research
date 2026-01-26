"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
  type HTMLAttributes,
  type ReactNode,
} from "react";

interface ConversationContextValue {
  scrollToBottom: () => void;
  isAtBottom: boolean;
}

const ConversationContext = createContext<ConversationContextValue | null>(null);

export const useConversation = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error("useConversation must be used within a Conversation");
  }
  return context;
};

export type ConversationProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export const Conversation = ({
  children,
  className,
  ...props
}: ConversationProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const threshold = 100;
      setIsAtBottom(scrollHeight - scrollTop - clientHeight < threshold);
    }
  }, []);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll);
      return () => scrollElement.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  return (
    <ConversationContext.Provider value={{ scrollToBottom, isAtBottom }}>
      <div
        ref={scrollRef}
        className={cn(
          "relative flex flex-1 flex-col overflow-y-auto",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </ConversationContext.Provider>
  );
};

export type ConversationContentProps = HTMLAttributes<HTMLDivElement>;

export const ConversationContent = ({
  children,
  className,
  ...props
}: ConversationContentProps) => (
  <div
    className={cn("flex flex-1 flex-col gap-2 px-4 py-4", className)}
    {...props}
  >
    {children}
  </div>
);

export type ConversationScrollButtonProps = HTMLAttributes<HTMLButtonElement>;

export const ConversationScrollButton = ({
  className,
  ...props
}: ConversationScrollButtonProps) => {
  const { scrollToBottom, isAtBottom } = useConversation();

  if (isAtBottom) return null;

  return (
    <button
      onClick={scrollToBottom}
      className={cn(
        "absolute bottom-4 left-1/2 -translate-x-1/2 z-10",
        "flex items-center gap-1.5 px-3 py-1.5",
        "bg-background/95 backdrop-blur-sm border rounded-full shadow-lg",
        "text-sm text-muted-foreground hover:text-foreground",
        "transition-all duration-200 hover:shadow-xl",
        className
      )}
      {...props}
    >
      <ChevronDown className="size-4" />
      <span>最新へ</span>
    </button>
  );
};
