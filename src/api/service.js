import axios from 'axios';

const API_URL = 'https://webflare-backend-3.vercel.app/api';

export const fetchAllItems = async () => {
  try {
    const response = await axios.get(`${API_URL}/items`);
    return response.data;
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
};

export const fetchItemById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/items/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching item ${id}:`, error);
    throw error;
  }
};

export const createItem = async (itemData) => {
  try {
    const response = await axios.post(`${API_URL}/items`, itemData);
    return response.data;
  } catch (error) {
    console.error('Error creating item:', error);
    throw error;
  }
};


// Client-side code to add a new item with randomized ID and auto-incrementing sale number

export const updateItem = async (id, itemData) => {
  try {
    const response = await axios.put(`${API_URL}/items/${id}`, itemData);
    return response.data;
  } catch (error) {
    console.error(`Error updating item ${id}:`, error);
    throw error;
  }
};

export const deleteItem = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/items/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting item ${id}:`, error);
    throw error;
  }
};