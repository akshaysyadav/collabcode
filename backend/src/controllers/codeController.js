const axios = require("axios");

exports.runCode = async (req, res) => {

  try {

    const { code, language } =
      req.body;

    res.json({
      message:
        "API Connected",
      code,
      language,
    });

  } catch (error) {

    res.status(500).json({
      message: error.message,
    });

  }

};