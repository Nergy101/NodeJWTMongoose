const fs = require("fs");
const path = require("path");
const express = require("express");
const app = express();
const port = 3000;

const chalk = require("chalk");
const info = chalk.rgb(0, 0, 0).bgBlue;

// MongoDB
const mongoose = require("mongoose");
var mongoURL = "";
try {
  mongoURL = fs.readFileSync(
    path.resolve(__dirname, "../keys/mongo.key"),
    "utf8"
  );
} catch {
  mongoURL = "mongodb://localhost:27017/test";
}
mongoose.connect(mongoURL, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});

mongoose.connection.on("open", function () {
  console.log(chalk.rgb(0, 0, 0).bgGreen("connected to mongodb"));
});

const UserModel = require("./models/UserModel.js");
const MongooseRepository = require("./data/MongooseRepository.js");
const UserRepo = new MongooseRepository({ Model: UserModel });

(async () => {
  users = await UserRepo.find();
  users.forEach(async (user) => await UserRepo.remove(user));
})();

// const rateCheck = require("./shared/ratelimiter");
// app.use(rateCheck);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(async function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// HTTP (Express)
app.get("/", async (_, res) => {
  res.status(200).send(
    `<h1>nergy.space Authentication Service</h1>
        <h2>Disclaimer: Use at your own risk</h2>
        <h3>Public key: </h3>
        <p>
        -----BEGIN PUBLIC KEY-----
        MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAIBl1tJ4kDTQOm1RtjaMAftV8T8IDL0G
        L8HfqHA1dWU9OvbQ9UR1e9x+QwCBYKWPMcRVYz4AJRb/lLV3hLJsYh8CAwEAAQ==
        -----END PUBLIC KEY-----
        </p>`
  );
});

const authRoutes = require("./routes/auth.js");
app.use("/auth", authRoutes);

const userRoutes = require("./routes/user.js");
app.use("/user", userRoutes);

app.listen(port, async () => console.log(info(`Listening on *: ${port}`)));
