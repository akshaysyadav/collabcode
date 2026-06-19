import axios from "axios";

const API_URL =
  "http://localhost:5000/api/code";

export const runCode =
  async (code, language) => {

    const response =
      await axios.post(
        `${API_URL}/run`,
        {
          code,
          language,
        }
      );

    return response.data;
};