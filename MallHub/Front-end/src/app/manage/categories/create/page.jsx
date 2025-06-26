import CategoryForm from "@/components/manage/category-form";

const CreateCategoryPage = () => {
    return (<>
        <h2 className="h2-bold">Create Category</h2>
        <div className="my-6">
            <CategoryForm type="create" />
        </div>
    </>);
}

export default CreateCategoryPage;