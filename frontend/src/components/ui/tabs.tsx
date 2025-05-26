import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children?: React.ReactNode;
}

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

export function Tabs({ defaultValue = "", value, onValueChange, className, children }: TabsProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const currentValue = value ?? internalValue;

  const handleValueChange = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value: currentValue, setValue: handleValueChange }}>
      <div className={cn("", className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <div className={cn("flex gap-2 bg-gray-100 rounded-lg p-1", className)}>{children}</div>;
}

interface TabsTriggerProps {
  value: string;
  children?: React.ReactNode;
  className?: string;
}

export function TabsTrigger({ value: triggerValue, children, className }: TabsTriggerProps) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error("TabsTrigger must be used within Tabs");

  return (
    <button
      className={cn(
        "px-4 py-2 rounded-lg font-medium transition-colors",
        triggerValue === context.value ? "bg-white shadow text-blue-600" : "text-gray-600 hover:bg-white hover:shadow",
        className
      )}
      onClick={() => context.setValue(triggerValue)}
      type="button"
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  children?: React.ReactNode;
  className?: string;
}

export function TabsContent({ value: contentValue, children, className }: TabsContentProps) {
  const context = React.useContext(TabsContext);
  if (!context) throw new Error("TabsContent must be used within Tabs");

  if (context.value !== contentValue) return null;
  return <div className={cn("mt-2", className)}>{children}</div>;
} 