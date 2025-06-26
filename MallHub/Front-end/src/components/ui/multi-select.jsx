import * as React from "react";
import { ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function MultiSelect({
    options = [],
    value = [],
    onChange,
    optionLabel = "name",
    optionValue = "id",
    placeholder = "Select items...",
    className,
    renderOption,
    renderSelected,
    groupBy,
    filter = false,
    filterPlaceholder = "Search...",
    emptyMessage = "No items found.",
    showCheckbox = true,
}) {
    const [open, setOpen] = React.useState(false);

    const handleSelect = (selectedValue) => {
        const newValue = value.includes(selectedValue)
            ? value.filter((v) => v !== selectedValue)
            : [...value, selectedValue];
        onChange(newValue);
    };

    const handleRemove = (event, selectedValue) => {
        event.preventDefault();
        const newValue = value.filter((v) => v !== selectedValue);
        onChange(newValue);
    };

    const getLabel = (option) => {
        if (typeof option === "object" && option !== null) {
            return option[optionLabel];
        }
        return option; // For primitive values, use the value itself as the label
    };

    const getValue = (option) => {
        if (typeof option === "object" && option !== null) {
            return option[optionValue];
        }
        return option; // For primitive values, use the value itself
    };

    const groupedOptions = groupBy
        ? options.reduce((acc, option) => {
            const group = option[groupBy];
            if (!acc[group]) {
                acc[group] = [];
            }
            acc[group].push(option);
            return acc;
        }, {})
        : null;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between", className)}
                >
                    {value.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {value.map((val) => {
                                const option = options.find((opt) => getValue(opt) === val);
                                return (
                                    <Badge
                                        key={val}
                                        className="cursor-pointer"
                                        onClick={(e) => handleRemove(e, val)}
                                    >
                                        {renderSelected ? (
                                            renderSelected(option)
                                        ) : (
                                            <span className="flex">
                                                {getLabel(option)}{" "}
                                                <X
                                                    className="ml-1 h-3 w-3 cursor-pointer"
                                                    onClick={(e) => handleRemove(e, val)}
                                                />
                                            </span>
                                        )}
                                    </Badge>
                                );
                            })}
                        </div>
                    ) : (
                        <span className="text-muted-foreground">{placeholder}</span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="popover-content-width-full p-0">
                <Command>
                    <CommandList>
                        {filter && (
                            <CommandInput
                                placeholder={filterPlaceholder}
                            />
                        )}
                        {options.length === 0 && (
                            <CommandEmpty>{emptyMessage}</CommandEmpty>
                        )}
                        {groupBy && groupedOptions ? (
                            Object.keys(groupedOptions).map((groupKey) => (
                                <CommandGroup key={groupKey} heading={groupKey}>
                                    {groupedOptions[groupKey].map((option) => (
                                        <CommandItem
                                            key={getValue(option)}
                                            onSelect={() => handleSelect(getValue(option))}
                                        >
                                            {showCheckbox && (
                                                <Checkbox
                                                    checked={value.includes(getValue(option))}
                                                    className="mr-2"
                                                />
                                            )}
                                            {renderOption ? (
                                                renderOption(option)
                                            ) : (
                                                <span>{getLabel(option)}</span>
                                            )}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            ))
                        ) : (
                            <CommandGroup>
                                {options.map((option) => (
                                    <CommandItem
                                        key={getValue(option)}
                                        onSelect={() => handleSelect(getValue(option))}
                                    >
                                        {showCheckbox && (
                                            <Checkbox
                                                checked={value.includes(getValue(option))}
                                                className="mr-2"
                                            />
                                        )}
                                        {renderOption ? (
                                            renderOption(option)
                                        ) : (
                                            <span>{getLabel(option)}</span>
                                        )}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}