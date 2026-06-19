import axios from "axios";

const API_URL =
  "http://localhost:5000/api/coderoom";

export const getCode =
  async (roomId) => {

    const response =
      await axios.get(
        `${API_URL}/${roomId}`
      );

    return response.data;
};

export const saveCode =
  async (
    roomId,
    code,
    language
  ) => {

    const response =
      await axios.post(
        `${API_URL}/save`,
        {
          roomId,
          code,
          language,
        }
      );

    return response.data;
};