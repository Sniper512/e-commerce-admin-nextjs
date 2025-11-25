import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

export interface SelectProps
    extends React.SelectHTMLAttributes<HTMLSelectElement> { }

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <div className="relative">
                <select
                    className={cn(
                        "flex h-10 w-full rounded-md border border-gray-300 bg-white pl-3 pr-8 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none",
                        className
                    )}
                    ref={ref}
                    {...props}
                >
                    {children}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none text-gray-500" />
            </div>
        )
    }
)
Select.displayName = "Select"

// Additional components for compatibility
const SelectContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("min-w-[8rem] overflow-hidden rounded-md border bg-white p-1 text-gray-950 shadow-md", className)}
        {...props}
    />
))
SelectContent.displayName = "SelectContent"

const SelectItem = React.forwardRef<
    HTMLOptionElement,
    React.OptionHTMLAttributes<HTMLOptionElement>
>(({ className, children, ...props }, ref) => (
    <option
        ref={ref}
        className={cn(
            "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-gray-100 focus:text-gray-900 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
            className
        )}
        {...props}
    >
        {children}
    </option>
))
SelectItem.displayName = "SelectItem"

const SelectTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => (
    <button
        ref={ref}
        className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            className
        )}
        {...props}
    >
        {children}
    </button>
))
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = React.forwardRef<
    HTMLSpanElement,
    React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
    <span
        ref={ref}
        className={cn("block truncate", className)}
        {...props}
    />
))
SelectValue.displayName = "SelectValue"

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }
