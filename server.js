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
  res.send("Hello, please use this ChatGPT plugin at https://chat.openai.com/");
});

// Route for OAuth redirection to Medium's authorization endpoint with query parameters
app.get("/oauth/authorize", (req, res) => {
  // Extracting required query parameters from the incoming request
  const clientId = req.query.client_id;
  const scope = req.query.scope;
  const state = req.query.state;
  const responseType = req.query.response_type;
  const redirectUri = req.query.redirect_uri;

  // Validating that all required parameters are present
  if (!clientId || !scope || !state || !responseType || !redirectUri) {
    return res.status(400).send("Missing required query parameters");
  }

  // Constructing the Medium OAuth URL with the provided query parameters
  const mediumOAuthURL = `https://medium.com/m/oauth/authorize?client_id=${clientId}&scope=${scope}&state=${state}&response_type=${responseType}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  // Redirecting to Medium's OAuth URL
  res.redirect(mediumOAuthURL);
});

app.post("/tokens", urlencodedParser, async (req, res) => {
  const params = req.params;
  const payload = req.body;
  const headers = req.headers;
  console.log("request headers:", req.headers);

  try {
    const response = await axios.post(
      `https://api.medium.com/v1/tokens`, payload, {
        headers,
      }
    );
    console.log("successful response status:", response.status)
    const expires_in_millis = response.data.expires_at - Date.now();
    response.data.expires_in = expires_in_millis / 1000; // chat GPT wants the expires_in to be in seconds
    response.data.token_type = "bearer";
    res.status(200).json(response.data);
  } catch (error) {
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
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(400).json({ error: 'Authorization token is required' });
    }

    const mediumResponse = await axios.get('https://api.medium.com/v1/me', {
      headers: {
          'Authorization': token
      }
    });

    res.status(201).json(mediumResponse.data);
} catch (error) {
    res.status(500).json({ error: 'Failed to forward the request to Medium' });
}
});

// Passthrough route for creating a post on the authenticated user's profile
app.post("/users/:authorId/posts", jsonParser, async (req, res) => {
  const { authorId } = req.params;
  const payload = req.body;
  const headers = prepareHeaders(req.headers);

  try {
    const response = await axios.post(
      `https://api.medium.com/v1/users/${authorId}/posts`, payload, {
        headers,
      }
    );
    res.status(201).json(response.data);
  } catch (error) {
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

app.get("/logo.png", async (_, res) => {
  const filename = path.join(__dirname, "logo.png");
  res.sendFile(filename, { headers: { "Content-Type": "image/png" } });
});

app.get("/.well-known/ai-plugin.json", async (_, res) => {
  const filePath = path.join(__dirname, ".well-known", "ai-plugin.json");
  const text = await fs.readFile(filePath, "utf8");
  res.set("Content-Type", "application/json").send(text);
});

app.get("/openapi.yaml", async (_, res) => {
  const filePath = path.join(__dirname, "openapi.yaml");
  const text = await fs.readFile(filePath, "utf8");
  res.set("Content-Type", "text/yaml").send(text);
});

app.get("/license.txt", async (_, res) => {
  const filePath = path.join(__dirname, "license.txt");
  const text = await fs.readFile(filePath, "utf8");
  res.set("Content-Type", "text/plain").send(text);
});

app.get("/privacy.txt", async (_, res) => {
  const filePath = path.join(__dirname, "privacy.txt");
  const text = await fs.readFile(filePath, "utf8");
  res.set("Content-Type", "text/plain").send(text);
});

app.listen(process.env.PORT || port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
