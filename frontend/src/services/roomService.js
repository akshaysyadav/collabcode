import axios from "axios";

const API_URL = "http://localhost:5000/api/rooms";

export const createRoom = async () => {
  const token = localStorage.getItem("token");

  const response = await axios.post(
    `${API_URL}/create`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};