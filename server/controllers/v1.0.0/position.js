const express = require("express");
const Router = express.Router();

/**
 * Helpers
 */
const {
  handleSuccess,
  handleFailure
} = require("../../helpers/handleResponse");

/**
 * Models
 */
const { positions: positionModel } = require("../../models");

Router.get("/", async (req, res) => {
  try {
    const positions = await positionModel.loadAll();
    handleSuccess(res, { positions: positions.sort(( a, b ) => {
      if ( a.fPosName < b.fPosName ){
        return -1;
      }
      if ( a.fPosName > b.fPosName ){
        return 1;
      }
      return 0;
    }) });
  } catch (err) {
    handleFailure(res, { err, route: req.originalUrl });
  }
});

Router.get("/details", async (req, res) => {
  try {
    const fId = req.query.id;
    if (!fId) throw { msg: "INVALID_QUERY" };
    const position = await positionModel.loadAll([], { where: { fId } });
    if (!position || position.length !== 1) throw { msg: "POSITION_NOT_FOUND" };
    handleSuccess(res, { position: position[0] });
  } catch (err) {
    handleFailure(res, { err, route: req.originalUrl });
  }
});

module.exports = Router;
