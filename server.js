const express = require("express");
const app = express();
const port = 3000;
const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");
var bodyParser = require('body-parser')

var jsonParser = bodyParser.json()
var urlencodedParser = bodyParser.urlencoded({ extended: false })

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.post("/tokens", urlencodedParser, async (req, res) => {
  // console.log("req:", req)
  const params = req.params;
  const payload = req.body;
  const headers = req.headers;
  console.log("params:", params);
  console.log("payload:", payload);
  console.log("headers:", headers);

  try {
    const response = await axios.post(
      `https://api.medium.com/v1/tokens`, payload, {
        headers,
      }
    );
    const expires_in = response.data.expires_at - Date.now();
    response.data.expires_in = expires_in;
    response.data.token_type = "bearer";
    console.log("Logged Response:", response.data); // Logging the response
    res.status(200).json(response.data);
  } catch (error) {
    console.log("Error:", error); // Logging the error
    res.status(error.response?.status || 500).json(error.response?.data || {});
  }
});

function prepareHeaders(headers) {
  return {
    Host: "api.medium.com",
    Authorization: headers.authorization,
    "Content-Type": "application/json",
    Accept: "application/json",
    "Accept-Charset": "utf-8",
  };
}

// Passthrough route for getting user's info
app.get("/me", jsonParser, async (req, res) => {
  const payload = req.body;
  const headers = prepareHeaders(req.headers);

  try {
    const response = await axios.get(
      `https://api.medium.com/v1/me`, payload, {
        headers,
      }
    );
    console.log(request.headers);
    console.log("me data:", response.data)
    res.status(201).json(response.data);
  } catch (error) {
    console.log("$$ error.response?.status", error.response?.status);
    console.log("$$ error.response?.data", error.response?.data);
    res.status(error.response?.status || 500).json(error.response?.data || {});
  }
});

// Passthrough route for creating a post on the authenticated user's profile
app.post("/users/:authorId/posts", jsonParser, async (req, res) => {
  const { authorId } = req.params;
  const payload = req.body;
  const headers = prepareHeaders(req.headers);
  console.log("req.headers", headers);
  console.log("req.headers", headers.authorization);

  try {
    const response = await axios.post(
      `https://api.medium.com/v1/users/${authorId}/posts`, payload, {
        headers,
      }
    );
    res.status(201).json(response.data);
  } catch (error) {
    console.log("$$ error.response?.status", error.response?.status);
    console.log("$$ error.response?.data", error.response?.data);
    res.status(error.response?.status || 500).json(error.response?.data || {});
  }
});

// Passthrough route for creating a post under a publication
app.post("/publications/:publicationId/posts", jsonParser, async (req, res) => {
  const { publicationId } = req.params;
  const payload = req.body;
  const headers = prepareHeaders(req.headers);

  try {
    const response = await axios.post(
      `https://api.medium.com/v1/publications/${publicationId}/posts`, payload, {
        headers,
      }
    );
    res.status(201).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || {});
  }
});

app.get("/logo.png", async (req, res) => {
  const filename = path.join(__dirname, "logo.png");
  res.sendFile(filename, { headers: { "Content-Type": "image/png" } });
});

app.get("/.well-known/ai-plugin.json", async (req, res) => {
  const host = req.headers.host;
  const filePath = path.join(__dirname, ".well-known", "ai-plugin.json");
  const text = await fs.readFile(filePath, "utf8");
  res.set("Content-Type", "application/json").send(text);
});

app.get("/openapi.yaml", async (req, res) => {
  const filePath = path.join(__dirname, "openapi.yaml");
  const text = await fs.readFile(filePath, "utf8");
  res.set("Content-Type", "text/yaml").send(text);
});

app.listen(process.env.PORT || port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
