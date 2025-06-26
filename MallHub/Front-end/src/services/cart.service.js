import BaseService from "./base.service";

class CartService extends BaseService {
    constructor() {
        super('cart')
    }

    async addToCart(input) {
        const { data } = await this.post(``, input);
        return data;
    }

    async removeFromCart(id) {
        const { data } = await this.patch(``, { item_id: id });
        return data;
    }

    async viewCart() {
        const { data } = await this.get(``);
        return data;
    }

    async viewBill() {
        const { data } = await this.get(`bill`);
        return data;
    }
}

const instance = new CartService();
export { instance as CartService };