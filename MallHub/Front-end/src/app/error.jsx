import { buttonVariants } from "@/components/ui/button";
import { Link } from "react-router";

const ErrorPage = () => {
    return (<div className="flex flex-col items-center justify-center min-h-screen">
        {/* <Image src="/images/logo.svg" width={48} height={48} alt={`${APP_NAME} logo`} priority /> */}
        <div className="p-6 w-1/3 rounded-lg shadow-md text-center">
            <h1 className="text-3xl font-bold mb-4">
                Not Found
            </h1>
            <p className="text-destructive">
                Could not find requested page
            </p>
            <Link className={`mt-4 ml-2 ${buttonVariants({ variant: 'outline' })}`} to={"/"}>Back To Home</Link>
        </div>
    </div>);
}

export default ErrorPage;