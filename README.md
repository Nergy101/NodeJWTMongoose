# NodeJWTMongoose

Node AuthService using JWTs, 2FA, MongoDB and Redis

## Getting Started

Have NodeJS installed, download/clone this Repository onto your own machine.

### Installing

Create a Keys folder with:
* public / private key (public.key / private.key)
* Redis connection string (redis.key)
* Mongo connectrion string (mongo.key)

```bash
node setup/setup.js
```
Make sure to fill in your own Redis & Mongo connection string

End with an example of getting some data out of the system or using it for a little demo

## Deployment

Run the authservice for **development**:

```
npm run dev
```

Run the authservice for **production**:

```
npm run start
```

to **clean-up** any pm2 leftovers, run:
```
npm run pm-clean
```

## Built With

* Redis
* MongoDB
* NodeJS
* ExpressJS
  
## Authors

* **Nergy101**
