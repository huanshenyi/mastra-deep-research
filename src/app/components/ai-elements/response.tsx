"use client";

import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

type ResponseProps = HTMLAttributes<HTMLDivElement> & {
  children?: string;
};

export const Response = ({ className, children, ...props }: ResponseProps) => (
  <div
    className={cn(
      "size-full prose prose-sm dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 whitespace-pre-wrap",
      className,
    )}
    {...props}
  >
    {children}
  </div>
);
