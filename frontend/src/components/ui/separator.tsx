import * as React from "react";
import { cn } from "@/lib/utils";

export const Separator = React.forwardRef<HTMLHRElement, React.HTMLAttributes<HTMLHRElement>>(
  ({ className, ...props }, ref) => (
    <hr
      ref={ref}
      className={cn("my-2 border-t border-gray-200", className)}
      {...props}
    />
  )
);
Separator.displayName = "Separator"; 