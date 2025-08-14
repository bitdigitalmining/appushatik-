const express = require("express");
const session = require("express-session");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
app.use(express.static("public"));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}));

// TikTok Redirect URI
app.get("/auth/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.send("No code returned from TikTok");

  try {
    // Exchange code for access token
    const response = await axios.post("https://open.tiktokapis.com/v2/oauth/token/", {
      client_key: process.env.TIKTOK_CLIENT_KEY,
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      code: code,
      grant_type: "authorization_code",
      redirect_uri: process.env.TIKTOK_REDIRECT_URI
    }, {
      headers: { "Content-Type": "application/json" }
    });

    const data = response.data;
    req.session.access_token = data.access_token;

    res.send(`
      <h2>Login Successful 🎉</h2>
      <p>Access Token: ${data.access_token}</p>
      <a href="/">Go Back Home</a>
    `);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.send("Error exchanging code for token");
  }
});

// Example route to get user profile
app.get("/me", async (req, res) => {
  if (!req.session.access_token) return res.send("Not logged in");
  
  try {
    const response = await axios.get("https://open.tiktokapis.com/v2/user/info/", {
      headers: { "Authorization": `Bearer ${req.session.access_token}` }
    });
    res.json(response.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.send("Error fetching user profile");
  }
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
