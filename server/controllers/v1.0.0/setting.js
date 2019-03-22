const express = require("express");
const Router = express.Router();

/**
 * Models
 */
const { settings: settingModel } = require("../../models");

/**
 * Helpers
 */
const {
  handleSuccess,
  handleFailure
} = require("../../helpers/handleResponse");

Router.get("/", async (req, res) => {
  try {
    const settings = await settingModel.loadAll();
    handleSuccess(res, { settings });
  }
  catch(err) {
    handleFailure(res, { err, route: req.originalUrl });
  }
});

Router.post("/", async (req, res) => {
  try {
    const { pairs } = req.body;
    if (!Array.isArray(pairs) || pairs.length < 1) throw { msg: "INVALID_VALUES" };

    const entities = pairs
      // not save empty fields
      .filter(setting => setting[0].length > 0)
      .map(setting => 
        settingModel.save({ fValue: setting[1], fName: setting[0] }, { 
          where: { fName: setting[0] } }));
          
    if(entities.length > 0) Promise.all(entities)
      .then(() => handleSuccess(res))
      .catch(err => handleFailure(res, { err, route: req.originalUrl }) );
    else throw { msg: "INVALID_VALUES" }
  } catch (err) {
    handleFailure(res, { err, route: req.originalUrl });
  }
});

module.exports = Router;
