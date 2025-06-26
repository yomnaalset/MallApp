import { Button } from "../ui/button"


const Pagination = ({ page = 1, totalPages, onChange }) => {

    const nextPage = () => {
        onChange(Number(page) + 1);
    }

    const previousPage = () => {
        onChange(Number(page) - 1);
    }

    return (<div className="flex gap-2">
        <Button size={'lg'} variant={'outline'} className="w-28" disabled={Number(page) <= 1} onClick={previousPage}>Previous</Button>
        <Button size={'lg'} variant={'outline'} className="w-28" disabled={Number(page) >= totalPages} onClick={nextPage}>Next</Button>
    </div>);
}

export default Pagination;