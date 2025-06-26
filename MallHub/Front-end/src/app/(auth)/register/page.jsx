import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Password } from "@/components/ui/password"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { registerSchema } from "@/schemas/user.schema"
import { AuthService } from "@/services/user.service"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { LoaderCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Link, useNavigate } from "react-router"
import { ROLES } from "@/lib/constants"


export default function RegisterPage() {

    const { toast } = useToast();
    const navigate = useNavigate();

    const form = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            email: "",
            name: "",
            password: "",
            confirmPassword: "",
            role: "",
        }
    })

    const isLoading = form.formState.isSubmitting;


    const onSubmit = async (input) => {
        try {
            const request = await AuthService.register(input);
            toast({
                title: "Success",
                description: request.message,
                variant: "success"
            })
            navigate("/auth/login");
        }
        catch (ex) {

            const errors = ex.response.data;
            const firstKey = Object.keys(errors)[0];


            toast({
                title: "Error",
                description: errors[firstKey]?.[0],
                variant: "destructive"
            })
        }
    }
    return (
        <div className="py-8 md:py-16 flex justify-center items-center" >
            <div className="grid gap-y-3 mx-auto w-[80%] md:w-[500px] mt-2">

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className='grid gap-y-4 w-full border rounded-lg p-8 bg-background'>

                            <div className="grid gap-y-2">
                                <h1 className="font-bold text-xl">Register</h1>
                                <h3 className="text-xs text-gray-600">Create a new account to buy or sell products.</h3>
                            </div>
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input autoFocus={false} type="text" className='w-full' {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input autoFocus={false} type="text" className='w-full' {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Role</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Select a role" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>                                                
                                                {ROLES.map((src) => (
                                                    <SelectItem key={src.value} value={src.value}>{src.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl>
                                                <Password autoFocus={false} className='w-full'{...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Confirm Password</FormLabel>
                                            <FormControl>
                                                <Password autoFocus={false} className='w-full'{...field} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <><LoaderCircle className="animate-spin" />{' '}</>}Register
                            </Button>
                        </div>
                        <div className="text-center text-sm mt-3">
                            Have an account? <Link to={"/auth/login"} className={`link`}>Log In</Link>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    )
}
