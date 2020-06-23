# NodeJWTMongoose

Node AuthService using JWTs, 2FA, MongoDB and Redis

## Getting Started

Have NodeJS installed, download/clone this Repository onto your own machine.

### Installing

Create a 'Keys' folder with:

- public / private key (inside the 'public.key' and 'private.key' files)
- Redis connection string (inside the 'redis.key' file)
- Mongo connection string (inside the 'mongo.key' file)

run the next line and it will auto-create a 'public.key' and 'private.key' inside the 'Keys' folder:

```bash
node setup/setup.js
```

Make sure to fill in your own Redis & Mongo connection string inside the designated file

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

- Redis
- MongoDB
- NodeJS
- ExpressJS

## Authors

- **Nergy101**
