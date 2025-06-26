import BaseService from "./base.service";

class CustomerService extends BaseService {
    constructor() {
        super('store')
    }

    async getPaginatedProducts({ page = 1, per_page = 10, q = ''}, config) {
        const query = q ? `&q=${q}` : ''
        const { data } = await this.get(`products/all/?page=${page}&per_page=${per_page}${query}&include_store_diamonds=true`, config);
        return data?.products;
    }

    async getProductById(id) {
        const { data } = await this.get(`products/${id}/`);
        return data.product;
    }
}

const instance = new CustomerService();
export { instance as CustomerService };