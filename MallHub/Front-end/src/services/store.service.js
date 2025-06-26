import BaseService from "./base.service";

class StoreService extends BaseService {
    constructor(){
        super('store')
    }

    async getPaginatedStores({ page = 1, per_page = 10, q ='' }){
        const { data } = await this.get(`stores-paginated/?page=${page}&per_page=${per_page}&q=${q}&include_diamonds=true`);
        return { stores: data.stores.items, pagination: data.pagination };
    }

    async getStoreProducts({ id, page = 1, per_page = 10, q = '' }){
        const { data } = await this.get(`stores/${id}/products/paginated/?page=${page}&page_size=${per_page}&q=${q}`);
        return data.products;
    }

    async getStoreWithDiamonds(storeId) {
        const { data } = await this.get(`stores/${storeId}/?include_diamonds=true`);
        return data.store;
    }

    async getProductDetails(productId) {
        const { data } = await this.get(`products/${productId}/`);
        return data;
    }
    
    // Store-wide discount methods
    async getStoreDiscount() {
        const { data } = await this.get('my-store/discount/');
        return data;
    }
    
    async applyStoreDiscount(percentage) {
        const { data } = await this.post('my-store/discount/', { percentage });
        return data;
    }
    
    async removeStoreDiscount() {
        const { data } = await this.delete('my-store/discount/');
        return data;
    }
}

const instance = new StoreService();
export { instance as StoreService };