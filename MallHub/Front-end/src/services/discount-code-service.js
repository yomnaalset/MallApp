import axios from "axios";
import { API_URL, LOCAL_STORAGE } from "@/lib/constants";

const API_ENDPOINT = `${API_URL}/discount/discount-codes/`;

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem(LOCAL_STORAGE.ACCESS_TOKEN);
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
    withCredentials: true,
  };
};

export class DiscountCodeService {
  static async getAllDiscountCodes() {
    try {
      const response = await axios.get(API_ENDPOINT, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error("Error fetching discount codes:", error);
      throw error;
    }
  }
  
  static async getActiveDiscountCodes() {
    try {
      const response = await axios.get(`${API_ENDPOINT}active/`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error("Error fetching active discount codes:", error);
      // Return empty array in case of error to avoid breaking UI
      return [];
    }
  }

  static async getDiscountCodeById(id) {
    try {
      const response = await axios.get(`${API_ENDPOINT}${id}/`, getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error(`Error fetching discount code with id ${id}:`, error);
      throw error;
    }
  }

  static async createDiscountCode(discountData) {
    try {
      const response = await axios.post(
        API_ENDPOINT, 
        discountData, 
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error("Error creating discount code:", error);
      throw error;
    }
  }

  static async updateDiscountCode(id, discountData) {
    try {
      const response = await axios.put(
        `${API_ENDPOINT}${id}/`, 
        discountData, 
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating discount code with id ${id}:`, error);
      throw error;
    }
  }

  static async deleteDiscountCode(id) {
    try {
      const response = await axios.delete(
        `${API_ENDPOINT}${id}/`, 
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error deleting discount code with id ${id}:`, error);
      throw error;
    }
  }

  static async validateDiscountCode(code) {
    try {
      const response = await axios.post(
        `${API_ENDPOINT}validate/`, 
        { code }, 
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error validating discount code ${code}:`, error);
      throw error;
    }
  }
} 