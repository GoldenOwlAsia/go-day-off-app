import sha256 from "sha256";
const express = require('express');
const Router = express.Router();
const { Op } = require('sequelize');
const moment = require('moment');

/**
 * Models
 */
const {
  users: userModel,
  teams: teamModel,
  positions: positionModel,
  leaveLetters: leaveLetterModel,
  userPermission: permissionModel,
  dayOff: dayOffModel,
  settings: settingModel,
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
  getPermissionByUserId,
  getPermissionByToken
} = require('../../helpers/getUserInfo');

/**
 * Constants
 */
const { DEFAULT_PAGE_ORDER, DEFAULT_PAGE_SIZE, 
  ALLOWED_PAGE_SIZE, LEAVING_LETTER_STATUS } = require('../../configs/constants');

/**
 * Middlewares
 */
const userMustBeAdmin = require("../../middlewares/userMustBeAdmin");
const bodyMustNotEmpty = require('../../middlewares/bodyMustNotEmpty');

// Get user profile
Router.get('/profile', async (req, res) => {
  try {
    const ownUserId = getIdFromToken(req.token_payload);
    if (!ownUserId) throw { msg: 'USER_NOT_FOUND' };
    let demandUserId = req.query.id;
    if (!demandUserId){
      demandUserId = ownUserId;
    }

    // Admin can view profile of everyone
    // Others can view oneself's
    const fUserType = await getPermissionByUserId(ownUserId);
    if (!fUserType || (fUserType !== 'Admin' && ownUserId !== demandUserId))
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
Router.patch("/profile", bodyMustNotEmpty, userMustBeAdmin, async (req, res) => {
  try {
    const keys = Object.keys(req.body);
    if (
      keys.length < 2 ||
      !keys.includes('info') ||
      (keys.includes('info') && Object.keys(req.body.info) < 1)
    )
      throw { msg: 'INVALID_VALUES' };
    const { id } = req.body;
    if (!id || id === undefined) throw { msg: 'USER_NOT_FOUND' };
  
    const entity = req.body.info && standardizeObj(req.body.info);

    // validate gender value
    const { fGender } = entity;
    if (
      (fGender || 3) &&
      !userModel.rawAttributes.fGender.values.includes(fGender)
    )
      throw { msg: 'INVALID_VALUES' };

    // update foreign keys
    const { fTeamId, fPosition, fTypeId } = entity;
    if (fTeamId) entity.teams_fId = fTeamId;
    if (fPosition) entity.positions_fId = fPosition;
    if (fTypeId) entity.userPermission_fId = fTypeId;    

    // validate new total day-off
    const fYear = moment().local().year();

    const newYearTotal = entity.fYearTotal;

    const settings = await settingModel.loadAll([], {
      where: { fName: 'maxDayOff' }
    });

    const maxDayOff = settings[0].dataValues.fValue;

    const selectedDayOff = await dayOffModel.loadAll({ 
      fYearTotal, fYearUsed
    }, {
      where: {
        fUserId: id,
        fYear,
      }
    })

    const { fYearTotal, fYearUsed } = selectedDayOff[0].dataValues;

  if (newYearTotal > maxDayOff)
      throw { msg: 'INVALID_DAY-OFF' }
    
    const affectedDayOff = await dayOffModel.modify({
      fYearTotal: newYearTotal, fYearRemaining: newYearTotal - fYearUsed
    }, {
      where: {
        fUserId: id,
        fYear,
      }
    });
    if (affectedDayOff[0] !== 1) throw { msg: 'DAY-OFF_NOT_FOUND' };

    const affectedUser = await userModel.modify(entity, {
      where: { fId: id }
    });
    if (affectedUser[0] !== 1) throw { msg: 'USER_NOT_FOUND' };

    handleSuccess(res, { user: entity });
  } catch (err) {
    handleFailure(res, { err, route: req.originalUrl });
  }
});

Router.get('/approver', async (req, res) => {
  try {
    // get admin user type id
    const userTypeIds = await permissionModel.loadAll(['fId'], {
      where: { fUserType: 'Admin' }
    });
    if (!userTypeIds || userTypeIds.length !== 1)
      throw { msg: 'USER_TYPE_NOT_FOUND' };

    // get users who are admin
    const adminId = userTypeIds[0].get({ plain: true }).fId;
    const users = await userModel.loadAll(['fId', 'fFirstName', 'fLastName'], {
      where: { fTypeId: adminId }
    });
    const approvers = users.map(user => user.get({ plain: true }));

    handleSuccess(res, { approvers });
  } catch (err) {
    handleFailure(res, { err, route: req.originalUrl });
  }
});

Router.get('/team-leader', async (req, res) => {
  try {
    const { userId } = req.token_payload;
    // find which team the user belongs to
    const team = await userModel.loadAll(['fTeamId'], {
      where: { fId: userId }
    });
    if (!team || team.length !== 1) throw { msg: 'TEAM_NOT_FOUND' };
    const { fTeamId } = team[0].get({ plain: true });

    // find team leader position
    const position = await positionModel.loadAll(['fId'], { where: { fPosName: 'Leader' } });
    if (!position || position.length !== 1) throw { msg: 'POSITION_NOT_FOUND' };
    const fPosition = position[0].dataValues.fId;

    // find which user is the team leader
    // const { fTeamId } = team[0].get({ plain: true });
    // const teams = await teamModel.loadAll(['fTeamLead'], { where: { fId: fTeamId } });
    // if (!teams || teams.length !== 1) throw { msg: 'TEAM_NOT_FOUND' };

    // find the team leader name
    // const { fTeamLead } = teams[0].get({ plain: true });
    const leader = await userModel.loadAll(['fId', 'fFirstName', 'fLastName', 'fEmail'], { where: { fTeamId, fPosition }});
    
    if (!leader || leader.length !== 1) {
      handleSuccess(res, 
        {
          msg: 'LEADER_NOT_FOUND',
          teamLeader: {}
        })
    }
    else {
      const { fId, fFirstName, fLastName, fEmail } = leader[0].get({ plain: true });
      const teamLeader = {
        fId,
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
      where: { fTeamId }
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

Router.get("/", userMustBeAdmin, async (req, res) => {
  try {
    let { page = DEFAULT_PAGE_ORDER, size = DEFAULT_PAGE_SIZE } = req.query;
    if(isNaN(page) || page < 1) page = DEFAULT_PAGE_ORDER;
    if(isNaN(size) || !ALLOWED_PAGE_SIZE.includes(+size)) size = DEFAULT_PAGE_SIZE;
    if(+size === 0) size = Number.MAX_SAFE_INTEGER;

    const { rawUsers, count } = await userModel.countAll(
      ['fId', 'fFirstName', 'fLastName', 'fTeamId', 'fEmail'],
      {},
      { limit: +size },
      { offset: (page - 1) * size },
      { order: [['fFirstName', 'ASC'], ['fLastName', 'ASC']] });

    const users = [];
    await (async () => {
        for (let i = 0; i < rawUsers.length; i++) {
          const user = rawUsers[i].get({ plain: true });
          const { fId, fTeamId } = user;

          // get team name
          const teams = await teamModel.loadAll(['fTeamName'], { where: { fId: fTeamId } });
          if(teams.length > 0) {
            user.fTeamName = teams[0].get({ plain: true }).fTeamName;
          }

          // get available status
          // get all approved letters of the user with now - 3days < fToDT < now
          const now = new Date();
          const { count } = await leaveLetterModel.countAll([], 
            { where: { 
                fUserId: fId, 
                fStatus: LEAVING_LETTER_STATUS.APPROVED,
                fToDT: { [Op.between]: [now, now.setTime(now.getTime() - 3*24*60*60*1000)] }
            }});
          user.fAvailable = !count;

          users.push(user);
        }
      })();

    handleSuccess(res, { users, count: users.length > 0 && count || 0 });
  }
  catch(err) {
    handleFailure(res, { err, route: req.originalUrl });
  }
});


Router.put('/changePassword', async (req, res) => {
  
  try {
    const ownUserId = getIdFromToken(req.token_payload);
    const {userId, password, newPassword} = req.body;
  
    if (!ownUserId) throw { msg: 'USER_NOT_FOUND' };
  
    const fUserType = await getPermissionByUserId(ownUserId);

    if (fUserType && fUserType === 'Admin' && ownUserId !== userId) { // admin changes other's password
        const fPassword = sha256(newPassword);
  
        await userModel.modify({fPassword}, {
          where: { fId: userId }
        });
  
        res.status(200).json({
          success: true
        })
    } else { //user or admin changes his/her own password
      const users = await userModel.loadAll([], { where: { fId: userId } });
      if(users.length && sha256(password) === users[0].dataValues.fPassword){
        const fPassword = sha256(newPassword);
  
        await userModel.modify({fPassword}, {
          where: { fId: userId }
        });
  
        res.status(200).json({
          success: true
        })
      } else {
        res.status(400).json({
          error: true,
          message: "Change password error"
        })
      }
    }
  } catch (err) {
    res.status(500).json({
      error: true
    })
  }
})

Router.get('/day-off', async (req, res) => {
  try {
    let { userId } = req.query;
    console.log("TCL: userId", userId)
    // only Admin can view all; others can view oneself's
    const fUserType = await getPermissionByToken(req.token_payload);
    console.log("TCL: fUserType", fUserType)
    if(fUserType !== 'Admin' && userId !== getIdFromToken(req.token_payload)) throw { code: 401, msg: 'NO_PERMISSION' };

    if(!userId || 
      (await getPermissionByToken(req.token_payload) !== 'Admin' && 
      userId !== getIdFromToken(req.token_payload))) throw { msg: 'INVALID_QUERY' };
    
    const fYear = moment().local().year();
    console.log("TCL: fYear", fYear)
    
    const dOEntity = await dayOffModel.loadAll({ fYearTotal, fYearUsed, fYearRemaining },
      { where: { 
        fUserId: userId,
        fYear
      } });

    const { fYearTotal, fYearUsed, fYearRemaining } = dOEntity[0];
    console.log("TCL: fYearTotal, fYearUsed, fYearRemaining", fYearTotal, fYearUsed, fYearRemaining);
    
    handleSuccess(res, { fYearTotal, fYearUsed, fYearRemaining });
  }
  catch(err) {
    handleFailure(res, { err, route: req.originalUrl });
  }
})

module.exports = Router;
