import BaseService from "./base.service";

class AuthService extends BaseService {
    constructor() {
        super("user")
    }

    async register(input) {
        const { data } = await this.post("register/", input);
        return data;
    }

    async login(input) {
        const { data } = await this.post("login/", input);
        return data;
    }

    async updateProfile(input) {
        const { data } = await this.put("profile/", input);
        return data;
    }

    async getAccount(input) {
        const { data } = await this.get("account/", input);
        return data.account_info;
    }
}

const instance = new AuthService();

export { instance as AuthService };