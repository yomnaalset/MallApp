import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { AdminService } from "@/services/admin.service";
import { updateProductSchema, insertProductSchema } from "@/lib/validators";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { formatError } from "@/lib/utils";
import {
    FileUploader,
    FileUploaderContent,
    FileUploaderItem,
    FileInput,
} from "@/components/ui/file-uploader";
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { useNavigate } from "react-router";
import { Checkbox } from "@/components/ui/checkbox";

const ProductForm = ({ product, categories }) => {

    const isInsert = product === undefined;
    const type = isInsert ? "Create" : "Update";

    const { toast } = useToast();

    const navigate = useNavigate();

    const form = useForm({
        resolver: zodResolver(isInsert ? insertProductSchema : updateProductSchema),
        defaultValues: product || {
            name: '',
            description: '',
            category: undefined,
            price: 0,
            image: undefined,
            is_pre_order: false
        }
    });

    const image_url = form.watch('image_url') || '';


    const onSubmit = async (values) => {
        try {
            if (isInsert) {
                await AdminService.createProduct(values);

            }
            else {
                await AdminService.updateProduct(values);
            }

            toast({
                title: "Success",
                description: `Product ${isInsert ? "created" : "updated"} successfully`,
            })

            navigate('/manage/products');

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
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            {/* Name */}
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem className="w-full">
                        <FormLabel>Name *</FormLabel>
                        <FormControl>
                            <Input placeholder="Enter product name" {...field} />
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
                                placeholder="Tell us about the product"
                                className="resize-none"
                                {...field}
                            />
                        </FormControl>
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                    <FormItem className="w-full">
                        <FormLabel>Price *</FormLabel>
                        <FormControl>
                            <Input placeholder="Enter product price" {...field} />
                        </FormControl>
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={`${field.value}`}>
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
                name="is_pre_order"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                            <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>Pre-order</FormLabel>
                            <p className="text-sm text-muted-foreground">
                                Mark this product as available for pre-order only
                            </p>
                        </div>
                    </FormItem>
                )}
            />

            <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                    <FormItem>
                        <FileUploader
                            value={[field.value]}
                            onValueChange={(e) => {
                                field.onChange(e?.[0])
                                form.setValue('image_url', undefined)
                            }}
                            dropzoneOptions={dropzone}
                            reSelect={true}
                        >
                            <FileInput>
                                <div className="flex items-center justify-center h-32 w-full border bg-background rounded-md">
                                    <p className="text-gray-400">Drop files here</p>
                                </div>
                            </FileInput>
                            {(field.value || image_url) && (
                                <FileUploaderContent className="rounded-b-none rounded-t-md flex-row gap-2 ">
                                    <FileUploaderItem
                                        className="p-0 size-20"
                                    >
                                        <AspectRatio className="size-full">
                                            <img
                                                src={image_url || (typeof field.value === 'object' ? URL.createObjectURL(field.value) : '')}
                                                alt={"image"}
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
                    {form.formState.isSubmitting ? 'Submitting...' : `${type} Product`}
                </Button>
            </div>
        </form>
    </Form>);
}

export default ProductForm;

const dropzone = {
    multiple: false,
    maxFiles: 2,
    maxSize: 4 * 1024 * 1024,
} 