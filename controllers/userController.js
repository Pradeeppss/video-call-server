const { default: axios } = require("axios");

module.exports.login = async (request, response) => {
  const { email, password } = request.body;
  console.log(process.env.URL);
  //   console.log(data, "------------------------");
  const options = {
    method: "POST",
    url: process.env.URL_TOKEN,
    headers: { "content-type": "application/x-www-form-urlencoded" },
    data: new URLSearchParams({
      grant_type: "password",
      username: email,
      password: password,
      audience: process.env.AUDIENCE,
      scope: "sample",
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
    }),
  };
  try {
    const result = await axios.request(options);
    if (result.data.access_token) {
      return response
        .cookie("Authorization", `Bearer ${result.data.access_token}`, {
          httpOnly: true,
        })
        .cookie("email", email, { httpOnly: false })
        .status(200)
        .send({
          status: "success",
          token: result.data.access_token,
        });
    } else {
      response.status(401).send({
        status: "fail",
      });
    }
  } catch (error) {
    console.log(error);
    response.status(401).send({
      status: "fail",
    });
  }
};
