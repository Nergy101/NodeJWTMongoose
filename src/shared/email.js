const fs = require("fs");
const chalk = require("chalk");
const nodemailer = require("nodemailer");

let emailSettings;
try {
  // Get settings
  const emailData = fs
    .readFileSync(`${__dirname}/../keys/email.key`)
    .toString()
    .split(";");

  emailSettings = {
    host: emailData[0],
    port: emailData[1],
    auth: { user: emailData[2], pass: emailData[3] },
  };

  console.log(chalk.bgGreen("Connected to the email service!"));
} catch (err) {
  console.log(chalk.bgRed("Couldn't connect to email service!" + err));
  console.log(
    chalk.red(
      "Make sure to have a valid email.key in the format: <host>;<port>;<user>;<password>"
    )
  );
}

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    ...emailSettings,
  });

  // Send email
  await transporter.sendMail({
    from: "NodeJWT Authentication System",
    to: options.to,
    subject: options.subject,
    text: options.text,
  });
};

module.exports = sendEmail;
