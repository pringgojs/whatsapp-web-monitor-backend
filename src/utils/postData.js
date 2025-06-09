const axios = require("axios");
require("dotenv").config();
const { URL_ENDPOINT } = process.env;
const https = require("https");

const postData = async function (number, message) {
  const data = {
    number: number,
    message: message,
  };
  var myJson = JSON.stringify(data);
  return axios({
    method: "post",
    url: URL_ENDPOINT,
    data: myJson,
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  })
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      console.log(err);
      return err?.data;
    });
};

module.exports = {
  postData,
};
