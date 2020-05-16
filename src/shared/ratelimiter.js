const redis = require("redis");
const moment = require("moment");

const chalk = require("chalk");
const info = chalk.rgb(0, 0, 0).bgBlue;
const fs = require("fs");
const path = require("path");
const redisURLParts = fs
  .readFileSync(path.resolve(__dirname, "../keys/redis.key"), "utf8")
  .split(";");

const redisClient = redis.createClient({
  host: redisURLParts[0], // The redis's server ip
  port: redisURLParts[1], // The redis's server port
  auth_pass: redisURLParts[2], // the redis's server pass
  no_ready_check: true,
});

redisClient.on("connect", () => {
  console.log(chalk.rgb(0, 0, 0).bgGreen("connected to redis"));
  redisClient.flushdb(function (err, succeeded) {
    if (succeeded) {
      console.log(info("Removed all Redis keys"))
    }; // will be true if successfull
    if (err) {
      console.log(chalk.red("Error: " + err))
    }
  });
});
redisClient.on("error", function (err) {
  console.log(chalk.bgRed("Disconnected Redis Error: " + err));
  console.log(chalk.red("Make sure to have a valid redis.key in the format: <ip>;<port>;<password>"))
});

module.exports = async (req, res, next) => {
  redisClient.exists(req.user.username, (err, reply) => {
    if (err) {
      console.log(chalk.red("Coudn't rate-limit: " + err));
      next(); // in case of redis-failure, just let it pass
    }
    if (reply) {
      // if user already existed
      redisClient.get(req.user.username, (_, reply) => {
        let data = JSON.parse(reply);
        const currentTime = moment().unix();
        const difference = (currentTime - data.startTime) / 60;
        if (difference >= 1) {
          // the request is the first in this (hard) start-window
          const body = {
            count: 1,
            startTime: moment().unix(),
          };
          redisClient.set(req.user.username, JSON.stringify(body));
          next();
        } else {
          // request is within 1 minute from the current (hard) start-window
          if (data.count > 10) {
            // if it's more than the 10nth in a minute
            return res.status(422).send({ error: "Rate-limit exceeded..." });
          }
          data.count++;
          redisClient.set(req.user.username, JSON.stringify(data));
          next();
        }
      });
    } else {
      // add new user
      const body = {
        count: 1,
        startTime: moment().unix(),
      };
      redisClient.set(req.user.username, JSON.stringify(body));
      next();
    }
  });
};
