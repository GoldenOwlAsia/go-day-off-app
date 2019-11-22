/**
 * Enable ES6 syntax
 */
require("@babel/register")({
  presets: ["@babel/preset-env"]
});
require("@babel/polyfill");

const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const errorHandler = require("errorhandler");
const express = require("express");
const expressValidator = require("express-validator");
const methodOverride = require("method-override");
const morgan = require("morgan");

/**
 * Load environment variables from .env file,
 * where API keys and passwords are configured.
 */
dotenv.load({ path: ".env.dev" });

/**
 * Declaring express server
 */
const server = express();
server.set("port", process.env.SERVER_HOST_PORT || 3001);
server.use(morgan("dev"));
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));
server.use(methodOverride("X-HTTP-Method-Override"));
server.use(expressValidator());
server.use(cors());

/**
 * Error Handler.
 */
if (process.env.NODE_ENV === "development") {
  // only use in development
  server.use(errorHandler());
} else {
  server.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send("Server Error");
  });
}

/**
 * Middlewares/Helpers
 */
const { verifyAccToken } = require("./helpers/jwt");
const userMustBeAdmin = require("./middlewares/userMustBeAdmin");

/**
 * Controllers
 */
const { API_VERSIONS, DEFAULT_API_VERSION } = require("./configs/constants");
API_VERSIONS.forEach(version => {
  const authCtrl = require(`./controllers/${version}/auth`);
  server.use(`/api/${version}/auth`, authCtrl);
  // ---
  const userCtrl = require(`./controllers/${version}/user`);
  server.use(`/api/${version}/user`, verifyAccToken, userCtrl);
  // ---
  const leaveLetterCtrl = require(`./controllers/${version}/leaveLetter`);
  server.use(`/api/${version}/leaveLetter`, verifyAccToken, leaveLetterCtrl);
  // ---
  const absenceCtrl = require(`./controllers/${version}/absence`);
  server.use(`/api/${version}/absenceType`, verifyAccToken, absenceCtrl);
  // --
  const teamCtrl = require(`./controllers/${version}/team`);
  server.use(`/api/${version}/team`, verifyAccToken, teamCtrl);
  // --
  const positionCtrl = require(`./controllers/${version}/position`);
  server.use(`/api/${version}/position`, verifyAccToken, positionCtrl);
  // --
  const rejectCtrl = require(`./controllers/${version}/reject`);
  server.use(`/api/${version}/reject`, verifyAccToken, rejectCtrl);
  // --
  const settingCtrl = require(`./controllers/${version}/setting`);
  server.use(`/api/${version}/setting`, verifyAccToken, userMustBeAdmin, settingCtrl);
  // --
  const publicSettingCtrl = require(`./controllers/${DEFAULT_API_VERSION}/setting-public`);
  server.use(`/api/${version}/public/setting`, verifyAccToken, publicSettingCtrl);
  // -- 
  const bookingCtrl = require(`./controllers/${version}/booking`);
  server.use(`/api/${version}/booking`, bookingCtrl);
});

// If no api version specified, rollback to the default one
const authCtrl = require(`./controllers/${DEFAULT_API_VERSION}/auth`);
server.use(`/api/auth`, authCtrl);
// ---
const userCtrl = require(`./controllers/${DEFAULT_API_VERSION}/user`);
server.use(`/api/user`, verifyAccToken, userCtrl);
// ---
const leaveLetterCtrl = require(`./controllers/${DEFAULT_API_VERSION}/leaveLetter`);
server.use(`/api/leaveLetter`, verifyAccToken, leaveLetterCtrl);
// ---
const absenceCtrl = require(`./controllers/${DEFAULT_API_VERSION}/absence`);
server.use(`/api/absenceType`, verifyAccToken, absenceCtrl);
// --
const teamCtrl = require(`./controllers/${DEFAULT_API_VERSION}/team`);
server.use(`/api/team`, verifyAccToken, teamCtrl);
// --
const positionCtrl = require(`./controllers/${DEFAULT_API_VERSION}/position`);
server.use(`/api/position`, verifyAccToken, positionCtrl);
// --
const rejectCtrl = require(`./controllers/${DEFAULT_API_VERSION}/reject`);
server.use(`/api/reject`, verifyAccToken, rejectCtrl);
// --
const settingCtrl = require(`./controllers/${DEFAULT_API_VERSION}/setting`);
server.use(`/api/setting`, verifyAccToken, userMustBeAdmin, settingCtrl);
// --
const publicSettingCtrl = require(`./controllers/${DEFAULT_API_VERSION}/setting-public`);
server.use(`/api/public/setting`, verifyAccToken, publicSettingCtrl);

// Handle invalid routes
server.all("*", (req, res) => {
  const err = { code: 404, msg: "INVALID_ROUTE" };
  require("./helpers/handleResponse").handleFailure(res, { err, route: req.originalUrl });
});

/**
 * Start Express server
 */
server.listen(process.env.PORT || 3001, () => {
  console.log(`[GO-LeavingForm] Express server is running at http://localhost:${server.get("port")}`);
});
