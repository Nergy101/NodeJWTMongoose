const fs = require("fs");
const path = require("path");
const keypair = require("keypair");

const pair = keypair();
const setupDir = path.dirname(require.main.filename);

try {
  fs.mkdirSync(path.join(setupDir, "../src/keys"));
} catch {
} finally {
  if (!fs.existsSync(path.join(setupDir, "../src/keys/mongo.key"))) {
    fs.writeFileSync(
      path.join(setupDir, "../src/keys/mongo.key"),
      "<your-connection-string>"
    );
  } else {
    console.log(
      `${path.join(setupDir, "../src/keys/mongo.key")} already exists`
    );
  }

  if (!fs.existsSync(path.join(setupDir, "../src/keys/redis.key"))) {
    fs.writeFileSync(
      path.join(setupDir, "../src/keys/redis.key"),
      "<your-connection-string>"
    );
  } else {
    console.log(
      `${path.join(setupDir, "../src/keys/mongo.key")} already exists`
    );
  }

  if (!fs.existsSync(path.join(setupDir, "../src/keys/email.key"))) {
    fs.writeFileSync(
      path.join(setupDir, "../src/keys/email.key"),
      "<host>;<port>;<user>;<password>"
    );
  } else {
    console.log(
      `${path.join(setupDir, "../src/keys/email.key")} already exists`
    );
  }

  if (!fs.existsSync(path.join(setupDir, "../src/keys/public.key"))) {
    fs.writeFileSync(
      path.join(setupDir, "../src/keys/public.key"),
      pair.public
    );
  } else {
    console.log(
      `${path.join(setupDir, "../src/keys/mongo.key")} already exists`
    );
  }

  if (!fs.existsSync(path.join(setupDir, "../src/keys/private.key"))) {
    fs.writeFileSync(
      path.join(setupDir, "../src/keys/private.key"),
      pair.private
    );
  } else {
    console.log(
      `${path.join(setupDir, "../src/keys/mongo.key")} already exists`
    );
  }
}

console.log("finished generating keys");
