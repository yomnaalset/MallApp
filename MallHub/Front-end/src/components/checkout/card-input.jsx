/* eslint-disable react/prop-types */
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";

export default function CreditCardForm({ form = {} }) {
    return (
        <>
            <FormField
                control={form.control}
                name="card_number"
                render={({ field }) => (
                    <FormItem className="w-full">
                        <FormLabel className="text-sm">Card Number</FormLabel>
                        <FormControl>
                            <Input
                                type="text"
                                placeholder="1234 5678 9012 3456"
                                maxLength={16}
                                //pattern="d{4} d{4} d{4} d{4}"
                                className="flex-1"
                                {...field}
                            />
                        </FormControl>
                    </FormItem>
                )}
            />

            <div className="flex gap-x-2">
                <FormField
                    control={form.control}
                    name="expiry_month"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel className="text-sm">MM</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger id="expiration-year" className="w-full">
                                        <SelectValue placeholder="MM" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent className="outline-none">
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                                        <SelectItem key={month} value={month.toString().padStart(2, "0")}>
                                            {month}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="expiry_year"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel className="text-sm">YY</FormLabel>

                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger id="expiration-year" className="w-full">
                                        <SelectValue placeholder="YY" />
                                    </SelectTrigger>

                                </FormControl>
                                <SelectContent className="outline-none">
                                    {Array.from({ length: 10 }, (_, i) => i + 2023).map((year) => (
                                        <SelectItem key={year} value={year.toString().slice(2)}>
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="cvv"
                    render={({ field }) => (
                        <FormItem className="w-full">
                            <FormLabel className="text-sm">CVV</FormLabel>
                            <FormControl>
                                <Input type="text" placeholder="123" maxLength={3} {...field} />
                            </FormControl>
                        </FormItem>
                    )}
                />
            </div>
        </>
    )
}

