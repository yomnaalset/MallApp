import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { updateProfileSchema } from "@/lib/validators";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { AuthService } from "@/services/user.service";
import { formatError } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import LoadingPage from "../loading";

const ProfilePage = () => {

    const { toast } = useToast();
    const [loading, setLoading] = useState(true);

    const form = useForm({
        resolver: zodResolver(updateProfileSchema),
        defaultValues: {
            address: '',
            phone_number: ''
        }
    });

    useEffect(() => {
        const init = async () => {
            try {
                const data = await AuthService.getAccount();
                form.reset(data);
            } catch {
                toast({
                    description: 'Something went wrong'
                })
            } finally {
                setLoading(false);
            }
        }
        init().then();
    }, [])

    const onSubmit = async (values) => {
        try {
            await AuthService.updateProfile(values);
            toast({
                title: "Success",
                description: "Profile updated!"
            })
        } catch (ex) {
            const error = formatError(ex);
            toast({
                ...error,
                variant: "destructive"
            })
        }
    }

    if (loading)
        return <LoadingPage />

    return (<div className="wrapper mt-5">
        <div className="max-w-md mx-auto space-y-4">
            <h2 className="h2-bold">
                Profile
            </h2>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
                    <div className="w-full flex flex-col gap-5">
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Address *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Address" {...field} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="phone_number"
                            render={({ field }) => (
                                <FormItem className="w-full">
                                    <FormLabel>Phone Number *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Phone Number" {...field} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>
                    <Button disabled={form.formState.isSubmitting}>Update</Button>
                </form>
            </Form>
        </div>
    </div>)

}

export default ProfilePage;