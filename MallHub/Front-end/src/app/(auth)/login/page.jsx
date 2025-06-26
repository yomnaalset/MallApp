import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Password } from "@/components/ui/password"
import { useForm } from "react-hook-form"
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema } from "@/schemas/user.schema"
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { AuthService } from "@/services/user.service"
import { useToast } from "@/hooks/use-toast"
import { LoaderCircle } from "lucide-react"
import { Link, useNavigate } from "react-router"
import { useAuth } from "@/providers/auth-provider"


const LoginPage = () => {

    const auth = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const form = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: ""
        }
    })

    const isLoading = form.formState.isSubmitting;

    const onSubmit = async (input) => {
        try {
            const request = await AuthService.login(input);
            auth.login({
                ...request.tokens
            })
            navigate('/')
        } catch (ex) {
            toast({
                title: "Error",
                description: ex?.response?.data?.detail || 'Something went wrong',
                variant: "destructive"
            })
        }
    }

    return (
        <div className="py-8 md:py-16 flex justify-center items-center" >
            <div className="grid gap-y-3 mx-auto w-[80%] md:w-[450px] mt-10">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className='grid gap-y-4  border rounded-lg p-8 bg-background'>
                            <div className="grid gap-y-2">
                                <h1 className="font-bold text-xl">Login</h1>
                                <h3 className="text-xs text-gray-600">Enter your email below to login to your account</h3>
                            </div>
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs">Email</FormLabel>
                                        <FormControl>
                                            <Input className='w-full' placeholder="Email" {...field} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs">Password</FormLabel>
                                        <FormControl>
                                            <Password className='w-full' placeholder="Password" {...field} />
                                        </FormControl>
                                        <div className="text-right">
                                            <Link to="/auth/forgot-password" className="text-xs text-blue-600 hover:underline">
                                                Forgot Password?
                                            </Link>
                                        </div>
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <><LoaderCircle className="animate-spin" />{' '}</>}Login
                            </Button>
                        </div>
                        <div className="text-center text-sm mt-3">
                            Don&apos;t have account? <Link to={"/auth/register"} className={`link`}>Sign up</Link>
                        </div>
                    </form>
                </Form>
            </div>
        </div >
    )
}
export default LoginPage;