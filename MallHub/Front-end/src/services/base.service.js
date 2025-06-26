import { API_URL } from "@/lib/constants";
import axios from './axios';



class BaseService {
    baseUrl;

    constructor(controller) {
        if (controller)
            this.baseUrl = `${API_URL}/${controller}`;
        else
            this.baseUrl = `${API_URL}`;
    }

    get(route, config) {
        return axios.get(`${this.baseUrl}/${route}`, config);
    }

    delete(route, config) {
        console.log("test")
        return axios.delete(`${this.baseUrl}/${route}`, config);
    }

    post(route, input, config) {
        return axios.post(`${this.baseUrl}/${route}`, input, config);
    }

    put(route, input, config) {
        return axios.put(`${this.baseUrl}/${route}`, input, config);
    }

    patch(route, input, config) {
        return axios.patch(`${this.baseUrl}/${route}`, input, config);
    }

    throwError(ex) {

        throw ex;
    }
}

export default BaseService;
