/* eslint-disable react/prop-types */
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateStoreSchema, insertStoreSchema } from "@/lib/validators";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { AdminService } from "@/services/admin.service";
import { useNavigate } from "react-router";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AspectRatio } from "@/components/ui/aspect-ratio"

import {
    FileUploader,
    FileUploaderContent,
    FileUploaderItem,
    FileInput,
} from "@/components/ui/file-uploader";
import { formatError } from "@/lib/utils";

const StoreForm = ({ store, categories = [], sections = [] }) => {

    const isInsert = store === undefined;
    const isUpdate = !isInsert;
    const type = isInsert ? "Create" : "Update";

    const navigate = useNavigate();
    const { toast } = useToast();


    const form = useForm({
        resolver: zodResolver(isInsert ? insertStoreSchema : updateStoreSchema),
        defaultValues: store || {
            name: '',
            description: '',
            section: '',
            categories: '0',
            logo: '',
            logo_url: ''
        }
    })

    const logo_url = form.watch('logo_url') || '';

    const onSubmit = async (values) => {
        try {
            if (isInsert) {
                await AdminService.createStore(values);
            }
            else {
                await AdminService.updateStore(values);
            }
            toast({
                title: "Success",
                description: `Store ${isInsert ? "created" : "updated"} successfully`,
            })
            navigate('/manage/stores');
        } catch (ex) {
            const error = formatError(ex);
            toast({
                ...error,
                variant: "destructive"
            })
        }
    }


    return (<Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
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
                            <Input placeholder="Enter store name" {...field} />
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
                                placeholder="Tell us about the stores"
                                className="resize-none"
                                {...field}
                            />
                        </FormControl>
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="categories"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {categories?.map((src) => (
                                    <SelectItem key={src.id} value={`${src.id}`}>{src.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="section"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Section *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={`${field.value}`}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a section" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {sections?.map((src) => (
                                    <SelectItem key={src.id} value={`${src.id}`}>{src.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="logo"
                render={({ field }) => (
                    <FormItem>
                        <FileUploader
                            value={[field.value]}
                            onValueChange={(e) => {
                                field.onChange(e?.[0])
                                form.setValue('logo_url', undefined)
                            }}
                            dropzoneOptions={dropzone}
                            reSelect={true}
                        >
                            <FileInput>
                                <div className="flex items-center justify-center h-32 w-full border bg-background rounded-md">
                                    <p className="text-gray-400">Drop files here</p>
                                </div>
                            </FileInput>
                            {(field.value || logo_url) && (
                                <FileUploaderContent className="rounded-b-none rounded-t-md flex-row gap-2 ">
                                    <FileUploaderItem
                                        className="p-0 size-20"
                                    >
                                        <AspectRatio className="size-full">
                                            <img
                                                src={logo_url || (typeof field.value === 'object' ? URL.createObjectURL(field.value) : '')}
                                                alt={"logo"}
                                                className="object-cover rounded-md"
                                            />
                                        </AspectRatio>
                                    </FileUploaderItem>
                                </FileUploaderContent>
                            )}
                        </FileUploader>
                    </FormItem>
                )}
            />
            <div>
                <Button disabled={form.formState.isSubmitting} type="submit" size="lg" className="capitalize button col-span-2 w-full">
                    {form.formState.isSubmitting ? 'Submitting...' : `${type} Store`}
                </Button>
            </div>
        </form>
    </Form >);
}

export default StoreForm;

const dropzone = {
    multiple: false,
    maxFiles: 2,
    maxSize: 4 * 1024 * 1024,
} 