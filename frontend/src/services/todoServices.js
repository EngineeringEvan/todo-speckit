import apiClient from "./services.js";

export default {
  getAll(listId) {
    return apiClient.get(`lists/${listId}/todos`);
  },
  createTodo(listId, data) {
    return apiClient.post(`lists/${listId}/todos`, data);
  },
  updateTodo(todoId, data) {
    return apiClient.put(`todos/${todoId}`, data);
  },
  deleteTodo(todoId) {
    return apiClient.delete(`todos/${todoId}`);
  },
};
