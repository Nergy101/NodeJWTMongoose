const redis = require('redis')
const redisClient = redis.createClient()
const moment = require('moment')

module.exports = (req, res, next) => {
    redisClient.exists(req.user.username, (err, reply) => {
        if (err) {
            console.error("Coudn't rate-limit");
        }
        if (reply === 1) { // if user already existed
            redisClient.get(req.user.username, (_, reply) => {
                let data = JSON.parse(reply);
                const currentTime = moment().unix();
                const difference = (currentTime - data.startTime) / 60;
                if (difference >= 1) { // the request is the first in this (hard) start-window
                    const body = {
                        'count': 1,
                        'startTime': moment().unix()
                    };
                    redisClient.set(req.user.username, JSON.stringify(body));
                    next();
                }
                else { // request is within 1 minute from the current (hard) start-window
                    if (data.count > 10) { // if it's more than the 10nth in a minute 
                        return res.status(422).send({ "error": "Rate-limit exceeded..." })
                    }
                    data.count++;
                    redisClient.set(req.user.username, JSON.stringify(data));
                    next();
                }
            })
        } else {
            // add new user
            const body = {
                'count': 1,
                'startTime': moment().unix()
            };
            redisClient.set(req.user.username, JSON.stringify(body));
            next();
        }
    })
}