import * as React from "react";
import { cn } from "@/lib/utils";

interface CodeProps extends React.HTMLAttributes<HTMLPreElement> {}

export function Code({ className, ...props }: CodeProps) {
  return (
    <pre
      className={cn(
        "rounded-lg bg-brown-dark p-4 text-sm font-mono text-pink-light overflow-auto shadow-sm border border-pink-medium/20",
        className
      )}
      {...props}
    />
  );
}