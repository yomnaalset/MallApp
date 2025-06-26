import BaseService from "./base.service";

class OrderService extends BaseService {
    constructor() {
        super('')
    }

    async Pay(input, config) {
        const data = await this.post('payment/process/', input, config);
        return data;
    }

    async getProductById(id) {
        const { data } = await this.get(`products/${id}/`);
        return data.product;
    }

    async getCustomerOrder() {
        const { data } = await this.get('payment/order-status/');
        return data.order_status;
    }

    async getDeliveryOrder() {
        const { data } = await this.get('delivery/orders/');
        return data.orders;
    }

    async updateOrderStatus({ id, status }) {
        const { data } = await this.put(`delivery/orders/${id}/status/`, { status });
        return data.order_status;
    }

    // Return Order methods
    async createReturnRequest(returnData) {
        const { data } = await this.post('delivery/customer/returns/', returnData);
        return data;
    }

    async getCustomerReturns() {
        const { data } = await this.get('delivery/customer/returns/');
        return data.returns || [];
    }

    async getReturnDetails(returnId) {
        const { data } = await this.get(`delivery/customer/returns/${returnId}/`);
        return data.return;
    }
}

const instance = new OrderService();
export { instance as OrderService };