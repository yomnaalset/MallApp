import BaseService from "./base.service";

class AdminService extends BaseService {
    constructor() {
        super('store')
    }

    // #region Category
    async getAllCategories() {
        const { data } = await this.get(`categories/all/`);
        return data.categories;
    }

    async getPaginatedCategories({ page, per_page }) {
        const { data } = await this.get(`categories/?page=${page}&per_page=${per_page}`);
        return data;
    }

    async getCategory(id) {
        const { data } = await this.get(`categories/${id}/`);
        return data;
    }

    async deleteCategory(id) {
        const { data } = await this.delete(`categories/${id}/delete/`);
        return data;
    }

    async createCategory(input) {
        const { data } = await this.post('categories/', input);
        return data;
    }

    async updateCategory(input) {
        const { data } = await this.put(`categories/${input.id}/`, input);
        return data;
    }
    // #endregion

    // #region Products
    async getProduct(id) {
        const { data } = await this.get(`products/${id}/`);
        data.product.category = data.product.category_id;
        return data.product;
    }

    async getPaginatedProducts({ page, per_page }) {
        const { data } = await this.get(`my-store/products/?page=${page}&per_page=${per_page}`);
        return data.products;
    }

    async createProduct(input) {
        const formData = new FormData();
        formData.append("name", input.name)
        formData.append("description", input.description)
        formData.append("price", input.price)
        formData.append("category", input.category)
        formData.append("image", input.image)
        formData.append("is_pre_order", input.is_pre_order)
        const { data } = await this.post(`create-product/`, formData);
        return data;
    }

    async updateProduct(input) {
        const formData = new FormData();
        formData.append("name", input.name)
        formData.append("description", input.description)
        formData.append("price", input.price)
        formData.append("category", input.category)
        if (typeof input.image !== 'string') {
            formData.append("image", input.image)
        }
        formData.append("is_pre_order", input.is_pre_order)
        const { data } = await this.put(`products/${input.id}/update/`, formData);
        return data;
    }
    // #endregion

    // #region Store
    async getAllStores() {
        const { data } = await this.get(`stores/`);
        return data;
    }

    async getMyStore(){
        const { data } = await this.get("my-store/")
        return data.store;
    }

    async getPaginatedStore({ page, per_page }) {
        const { data } = await this.get(`stores-paginated/?page=${page}&per_page=${per_page}`);
        return data;
    }

    async getStore(id) {
        const { data } = await this.get(`stores/${id}/`);
        return data;
    }

    async createStore(input) {
        const formData = new FormData();
        formData.append("name", input.name)
        formData.append("description", input.description)
        formData.append("section", input.section)
        formData.append("categories", input.categories)
        formData.append("logo", input.logo)
        const { data } = await this.post(`create-store/`, formData);
        return data;
    }

    async updateStore(input) {
        const formData = new FormData();
        formData.append("name", input.name)
        formData.append("description", input.description)
        formData.append("section", input.section)
        formData.append("categories", input.categories)
        if (typeof input.logo !== 'string') {
            formData.append("logo", input.logo)
        }
        const { data } = await this.put(`update-store/`, formData);
        return data;
    }

    async deleteStore() {
        const { data } = await this.delete(`delete-store/`);
        return data;
    }
    // #endregion

    // #region Section
    async getPaginatedSections({ page, per_page }) {
        const { data } = await this.get(`all-sections/?page=${page}&per_page=${per_page}`);
        return data;
    }

    async getAllSection() {
        const { data } = await this.get(`sections/`);
        return data.data;
    }

    async createSection(input) {
        const { data } = await this.post(`sections/`, input);
        return data;
    }

    async updateSection(input) {
        const { data } = await this.put(`sections/${input.id}/`, input);
        return data;
    }

    async deleteSection(id) {
        const { data } = await this.delete(`sections/${id}/`);
        return data;
    }

    async getSection(id) {
        const { data } = await this.get(`sections/${id}/`);
        return data;
    }
    // #endregion

}

const instance = new AdminService();
export { instance as AdminService };