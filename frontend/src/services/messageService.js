import axios from "axios";

const API_URL = "http://localhost:5000/api/messages";

export const getMessages = async (roomId) => {

  const token =
    localStorage.getItem("token");

  const response = await axios.get(
    `${API_URL}/${roomId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};