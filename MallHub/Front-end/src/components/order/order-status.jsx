import { ORDER_STATUS_ENUM } from "@/lib/constants";
import { Badge } from "../ui/badge";

const OrderStatus = ({ status }) => {


    const { label, color } = getStatus(status)

    return (<Badge variant={color}>
        {label}
    </Badge>);
}

export default OrderStatus;



const getStatus = (status) => {

    if (status === ORDER_STATUS_ENUM.PENDING)
        return { label: 'Pending', color: 'warning' };

    if (status === ORDER_STATUS_ENUM.IN_PROGRESS)
        return { label: 'In Progress', color: 'secondary' };

    return { label: 'Delivered', color: '' };
}