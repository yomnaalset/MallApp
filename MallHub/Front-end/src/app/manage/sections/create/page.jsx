import SectionForm from "@/components/manage/section-form";

const CreateSectionPage = () => {

    return (<>
        <h2 className="h2-bold">Create Section</h2>
        <div className="my-6">
            <SectionForm type="create" />
        </div>
    </>);
}

export default CreateSectionPage;