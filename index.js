// Whatsapp-web.js
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

const client = new Client({
	authStrategy: new LocalAuth(),
  puppeteer: {
    headless: false,
  }
});

// Express server
const express = require("express");
const bodyParser = require('body-parser')
const app = express();
const port = process.env.port || 5000;

const fs = require("fs");

client.on("qr", (qr) => {
	qrcode.generate(qr, { small: true });
});

app.use(bodyParser.json());

app.get("/", (req, res) => {
	res.status(200).json({
		message: "Whatsapp API is running",
	});
});

app.post("/getotp", (req, res) => {
	const otp = Math.floor(Math.random() * 9999).toString().padStart(4, "0");

  console.log(req.body);

  const { phoneNumber } = req.body;

	const data = JSON.parse(fs.readFileSync("./active-otp.json"));

	newData = [
    ...data.filter((item) => item.phoneNumber !== phoneNumber),
    {
      phoneNumber,
      otp,
    }
  ]

	fs.writeFile("./active-otp.json", JSON.stringify(newData), (err) => {
		if (err) throw err;
	});

  const waNumber = `${phoneNumber}@c.us`
  const message = `Your Cukuy login OTP is *${otp}*\n\nDon't share this OTP with anyone.\n#CukurDiCukuy`

  client.sendMessage(waNumber, message);

	res.status(200).json({
		newData,
	});
});

app.post('/verify', (req, res) => {
  const { phoneNumber, otp } = req.body;

  const data = JSON.parse(fs.readFileSync("./active-otp.json"));

  if (data.find((item) => item.phoneNumber === phoneNumber && item.otp === otp)) {
    const newData = data.filter((item) => item.phoneNumber !== phoneNumber);
    fs.writeFile("./active-otp.json", JSON.stringify(newData), (err) => {
      if (err) throw err;
    })
    res.status(200).json({
      message: "OTP verified",
    });
  } else {
    res.status(400).json({
      message: "OTP not verified",
    });
  }
})

client.on("ready", () => {
	console.log("Client is ready!");
	app.listen(port, () => {
		console.log(`Server started on port ${port}`);
	});
});

client.on("message", (message) => {
	message.reply("Terima kasih telah menghubungi Cukuy. Akun ini hanya digunakan untuk OTP, pesan kamu tidak akan dibalas.\n\n#CukurDiCukuy")
});

client.initialize();
