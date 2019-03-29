const express = require('express');
const Router = express.Router();

/**
 * Models
 */
const {
  users: userModel,
  positions: positionModel,
  teams: teamModel,
  userPermission: permissionModel
} = require('../../models');

/**
 * Helpers
 */
const {
  handleSuccess,
  handleFailure
} = require('../../helpers/handleResponse');
const { standardizeObj } = require('../../helpers/standardize');
const {
  getIdFromToken,
  getPermissionByUserId
} = require('../../helpers/getUserInfo');

/**
 * Middlewares
 */
const userMustBeHR = require("../../middlewares/userMustBeHR");
const bodyMustNotEmpty = require('../../middlewares/bodyMustNotEmpty');

// Get user profile
Router.get('/profile', async (req, res) => {
  try {
    const ownUserId = getIdFromToken(req.token_payload);
    if (!ownUserId) throw { msg: 'USER_NOT_FOUND' };
    const demandUserId = req.query.id;
    if (!demandUserId) throw { msg: 'USER_NOT_FOUND' };

    // HR can view profile of everyone
    // Others can view oneself's
    const fUserType = await getPermissionByUserId(ownUserId);
    if (!fUserType || (fUserType !== 'HR' && ownUserId !== demandUserId))
      throw { code: 401, msg: 'NO_PERMISSION' };

    const attributes = [
      'fEmail',
      'fFirstName',
      'fLastName',
      'fPhone',
      'fPosition',
      'fTeamId',
      'fTypeId',
      'fUsername',
      'fGender'
    ];
    const users = await userModel.loadAll(attributes, {
      where: { fId: demandUserId }
    });
    if (!users || users.length !== 1) throw { msg: 'USER_NOT_FOUND' };
    //extract info
    const user = users[0].get({ plain: true });
    const { fPosition, fTeamId } = user;
    // get position name
    const positions = await positionModel.loadAll(['fPosName'], {
      where: { fId: fPosition }
    });
    if (!positions || positions.length !== 1) throw { msg: 'USER_NOT_FOUND' };
    user.fPositionName = positions[0].get({ plain: true }).fPosName;
    // get team name
    const teams = await teamModel.loadAll(['fTeamName'], {
      where: { fId: fTeamId }
    });
    if (!teams || teams.length !== 1) throw { msg: 'USER_NOT_FOUND' };
    user.fTeamName = teams[0].get({ plain: true }).fTeamName;

    handleSuccess(res, { user });
  } catch (err) {
    handleFailure(res, { err, route: req.originalUrl });
  }
});

// Update user profile
Router.patch("/profile", bodyMustNotEmpty, userMustBeHR, async (req, res) => {
  try {
    const userId = getIdFromToken(req.token_payload);
    if (!userId) throw { msg: 'USER_NOT_FOUND' };

    const keys = Object.keys(req.body);
    if (
      keys.length < 2 ||
      !keys.includes('info') ||
      (keys.includes('info') && Object.keys(req.body.info) < 1)
    )
      throw { msg: 'INVALID_VALUES' };
    const entity = req.body.info && standardizeObj(req.body.info);

    // validate gender value
    const { fGender } = entity;
    if (
      (fGender || 3) &&
      !userModel.rawAttributes.fGender.values.includes(fGender)
    )
      throw { msg: 'INVALID_VALUES' };

    // update foreign keys
    const { fTeamId, fPositionId, fTypeId } = entity;
    if (fTeamId) entity.teams_fId = fTeamId;
    if (fPositionId) entity.positions_fId = fPositionId;
    if (fTypeId) entity.userPermission_fId = fTypeId;

    const affected = await userModel.modify(entity, {
      where: { fId: userId }
    });
    if (affected[0] !== 1) throw { msg: 'USER_NOT_FOUND' };

    handleSuccess(res, { user: entity });
  } catch (err) {
    handleFailure(res, { err, route: req.originalUrl });
  }
});

Router.get('/approver', async (req, res) => {
  try {
    // get hr user type id
    const userTypeIds = await permissionModel.loadAll(['fId'], {
      where: { fUserType: 'HR' }
    });
    if (!userTypeIds || userTypeIds.length !== 1)
      throw { msg: 'USER_NOT_FOUND' };

    // get users who are hr
    const hrId = userTypeIds[0].get({ plain: true }).fId;
    const users = await userModel.loadAll(['fId', 'fFirstName', 'fLastName'], {
      where: { fTypeId: hrId }
    });
    const approvers = users.map(user => user.get({ plain: true }));

    handleSuccess(res, { approvers });
  } catch (err) {
    handleFailure(res, { err, route: req.originalUrl });
  }
});

Router.get('/team-leader', async (req, res) => {
  try {
    console.log(`userController -> path '/team-leader':`);
    const { userId } = req.token_payload;
    // find which team the user belongs to
    const users = await userModel.loadAll(['fTeamId'], {
      where: { fId: userId }
    });
    if (!users || users.length !== 1) throw { msg: 'USER_NOT_FOUND' };

    // find which user is the team leader
    const { fTeamId } = users[0].get({ plain: true });
    const teams = await teamModel.loadAll(['fTeamLead'], {
      where: { fId: fTeamId }
    });
    if (!teams || teams.length !== 1) throw { msg: 'TEAM_NOT_FOUND' };

    // find the team leader name
    const { fTeamLead } = teams[0].get({ plain: true });
    const leaders = await userModel.loadAll(['fFirstName', 'fLastName', 'fEmail'], { where: { fId: fTeamLead }});

    if (!leaders || leaders.length !== 1) {
      handleSuccess(res, 
        {
          msg: 'LEADERS_NOT_FOUND',
          teamLeader: {}
        })
    }
    else {
      const { fFirstName, fLastName, fEmail } = leaders[0].get({ plain: true });
      const teamLeader = {
        fId: fTeamLead,
        fFirstName,
        fLastName,
        fEmail
      };
      handleSuccess(res, { teamLeader });
    }
  } 
  catch (err) {
    handleFailure(res, { err, route: req.originalUrl });
  }
});

Router.get('/substitutes', async (req, res) => {
  try {
    console.log(`userController -> path '/subsitutes':`);
    let userId = req.query.id;
    if (!userId) {
      userId = req.token_payload.userId;
      if (!userId) throw { msg: "INVALID_QUERY" };
    }
    
    //Find which team the user is belongs to 
    const users = await userModel.loadAll(['fTeamId'], {
      where: { fId: userId }
    });
    if (!users || users.length !== 1) throw { msg: 'USER_NOT_FOUND' };

    //Find all user(s) in the same team with found team's Id
    const { fTeamId } = users[0].get({ plain: true });
    const substitutes = await userModel.loadAll(['fId', 'fFirstName', 'fLastName', 'fEmail'], {
      where: { fTeamId: fTeamId }
    });
    
    if (!substitutes || substitutes.length < 1) {
      handleSuccess(res, 
        { 
          msg: 'SUBSTITUTES_NOT_FOUND', 
          substitutes: []
        });
    }
    else {
    //Return `fFirstName`, `fLastName`, `fEmail`, `fId`
      const mappedSubstitutes = substitutes.map(user => user.get({ plain: true }));
      handleSuccess(res, { substitutes: mappedSubstitutes });
    }
  } 
  catch(err) {
    handleFailure(res, { err, route: req.originalUrl });
  }
});


module.exports = Router;
