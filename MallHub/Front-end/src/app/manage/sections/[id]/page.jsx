import SectionForm from "@/components/manage/section-form";
import LoadingPage from "@/app/loading";
import { useToast } from "@/hooks/use-toast";
import { formatError } from "@/lib/utils";
import { AdminService } from "@/services/admin.service";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from 'react-router-dom';

const UpdateSectionPage = () => {

    const { id } = useParams(); // Access the `id` parameter from the URL
    const [section, setSection] = useState();
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [error, setError] = useState()

    const { toast } = useToast();

    useEffect(() => {
        const init = async () => {
            try {
                const data = await AdminService.getSection(id);
                setSection(data.data);
            } catch (ex) {
                const error = formatError(ex);
                setError(error)
                toast({
                    ...error
                })
            } finally {
                setLoading(false);
            }
        };
        init().then();
    }, [id]);

    if (loading)
        return <LoadingPage />

    return (<>
        <h2 className="h2-bold">Update Section</h2>
        <div className="my-6">
            <SectionForm section={section} />
        </div>
    </>);
}

export default UpdateSectionPage;