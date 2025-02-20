import express from 'express';
import bodyParser from 'body-parser';
import crypto from 'crypto';

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const BOT_TOKEN = ''; // Replace with your actual bot token
const BOT_USERNAME = ''; // Your bot's username

app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Telegram Login</title>
    </head>
    <body>
      <script async src="https://telegram.org/js/telegram-widget.js?22" 
              data-telegram-login="${BOT_USERNAME}" 
              data-size="large" 
              data-auth-url="/auth" 
              data-request-access="write">
      </script>
    </body>
    </html>
  `);
});

app.get('/auth', (req, res) => {
    const { hash, auth_date, ...data } = req.query;

    if (!hash || !auth_date) {
        return res.status(400).json({ success: false, message: "Invalid request" });
    }

    // ✅ Ensure URL-decoded values for accuracy
    Object.keys(data).forEach(key => {
        data[key] = decodeURIComponent(data[key]);
    });

    // ✅ Step 1: Create data_check_string (sorted & newline-separated)
    const dataCheckString = Object.keys(data)
        .sort()
        .map(key => `${key}=${data[key]}`)
        .join("\n");

    console.log("Data Check String:", dataCheckString);
    console.log("Received Hash:", hash);

    // ✅ Step 2: Generate the correct secret key from BOT_TOKEN
    const secretKey = crypto.createHash('sha256').update(BOT_TOKEN).digest();

    // ✅ Step 3: Calculate HMAC-SHA256 hash
    const calculatedHash = crypto.createHmac("sha256", secretKey)
        .update(dataCheckString)
        .digest("hex");

    console.log("Calculated Hash:", calculatedHash);
    // is condition mai masla arha hai calculatedHash aur hash, match nahi ho rhe ye condition true ho rhi hai
    // ✅ Step 4: Compare hash (convert to lowercase for safe comparison)
    if (calculatedHash !== hash.toLowerCase()) {
        return res.status(403).json({ success: false, message: "Unauthorized: Invalid hash" });
    }

    // ✅ Step 5: Check if authentication data is recent (optional security check)
    const now = Math.floor(Date.now() / 1000);
    if (now - parseInt(auth_date, 10) > 86400) { // Check if auth is older than 24 hours
        return res.status(403).json({ success: false, message: "Unauthorized: Auth expired" });
    }

    // ✅ Step 6: Authentication successful
    console.log("Telegram Login Successful!", data);
    return res.json({ success: true, user: data });
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
