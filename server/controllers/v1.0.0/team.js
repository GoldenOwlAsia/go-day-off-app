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
const { teams: teamModel } = require("../../models");

Router.get("/", async (req, res) => {
  try {
    const teams = await teamModel.loadAll();
    handleSuccess(res, { teams: teams.sort(( a, b ) => {
      if ( a.fTeamName < b.fTeamName ){
        return -1;
      }
      if ( a.fTeamName > b.fTeamName ){
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
    const team = await teamModel.loadAll([], { where: { fId } });
    if (!team || team.length !== 1) throw { msg: "TEAM_NOT_FOUND" };
    handleSuccess(res, { team: team[0] });
  } catch (err) {
    handleFailure(res, { err, route: req.originalUrl });
  }
});

module.exports = Router;
