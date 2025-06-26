import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSectionSchema, updateSectionSchema } from "@/lib/validators";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { AdminService } from "@/services/admin.service";
import { useNavigate } from "react-router";
import { formatError } from "@/lib/utils";

const SectionForm = ({ section }) => {

    const isInsert = section === undefined;
    const isUpdate = !isInsert;
    const type = isInsert ? "Create" : "Update";

    const navigate = useNavigate();
    const { toast } = useToast();

    const form = useForm({
        resolver: zodResolver(isInsert ? insertSectionSchema : updateSectionSchema),
        defaultValues: section || {
            id: undefined,
            name: '',
            description: '',
            is_default: false,
        }
    })

    const onSubmit = async (values) => {
        try {
            if (isInsert) {
                await AdminService.createSection(values);
            }
            else {
                await AdminService.updateSection(values);
            }
            toast({
                title: "Success",
                description: `Section ${isInsert ? "created" : "updated"} successfully`,
            })
            navigate('/manage/sections');
        } catch (ex) {
            const error = formatError(ex);
            toast({
                title: error.title,
                description: error.description,
                variant: "destructive"
            })
        }
    }

    return (<Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
            {isUpdate && (<FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                    <FormItem className="w-full">
                        <FormControl>
                            <Input type="hidden" {...field} />
                        </FormControl>
                    </FormItem>
                )}
            />)}

            {/* Name */}
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem className="w-full">
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                            <Input placeholder="Enter section name" {...field} />
                        </FormControl>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem className="w-full">
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                            <Textarea
                                placeholder="Tell us about the section"
                                className="resize-none"
                                {...field}
                            />
                        </FormControl>
                    </FormItem>
                )}
            />

            <div>
                <Button disabled={form.formState.isSubmitting} type="submit" size="lg" className="capitalize button col-span-2 w-full">
                    {form.formState.isSubmitting ? 'Submitting...' : `${type} Section`}
                </Button>
            </div>
        </form>
    </Form >);
}

export default SectionForm;