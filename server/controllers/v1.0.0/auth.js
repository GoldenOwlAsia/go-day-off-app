const express = require('express');
const Router = express.Router();
const uid = require('rand-token').uid;
const moment = require('moment');

/**
 * Models
 */
const {
  userRefToken: refTokenModel,
  users: userModel,
  userPermission: permissionModel,
  teams: teamModel,
  dayOff: dayOffModel,
} = require('../../models');

/**
 * Configs
 */
const { USER_ID_LEN } = require('../../configs/config');

/**
 * Helpers
 */
const {
  handleSuccess,
  handleFailure
} = require('../../helpers/handleResponse');
const { genRefToken, verifyAccToken } = require('../../helpers/jwt');
const { standardizeObj } = require('../../helpers/standardize');
const {
  getIdFromToken
} = require('../../helpers/getUserInfo');

/**
 * Middlewares
 */
const userMustBeAdmin = require('../../middlewares/userMustBeAdmin');
const bodyMustNotEmpty = require('../../middlewares/bodyMustNotEmpty');

/**
 * ADD NEW User
 */
Router.post('/account', bodyMustNotEmpty, verifyAccToken, userMustBeAdmin, async (req, res) => {
  try {
    const userId = getIdFromToken(req.token_payload);
    if (!userId) throw { msg: 'USER_NOT_FOUND' };


    let userEntity = standardizeObj(req.body);

    // validate gender value
    const { fGender } = userEntity;
    if (
      (fGender || 3) &&
      !userModel.rawAttributes.fGender.values.includes(fGender)
    )
      throw { msg: 'INVALID_VALUES' };

    userEntity.fId = uid(USER_ID_LEN);
    // add foreign keys
    const { fPosition, fTeamId, fTypeId } = userEntity;
    if (fPosition) userEntity.positions_fId = fPosition;

    if (fTeamId) { userEntity.teams_fId = fTeamId; } 

    if (fTypeId) userEntity.userPermission_fId = fTypeId;

    const fYear = moment().year();

    const dayoffEntity = {
      fUserId: userEntity.fId,
      fYear,
      fYearTotal: userEntity.fDayOff,
      fYearUsed: 0,
      fYearRemaining: userEntity.fDayOff,
    }

    delete userEntity.fDayOff
    
    const dOff = await dayOffModel.add(dayoffEntity);
    const user = await userModel.add(userEntity);
    handleSuccess(res, { code: 201, user });
  } catch (err) {
    handleFailure(res, { err, route: req.originalUrl });
  }
});

/**
 * LOGIN user
 */
Router.post('/login', bodyMustNotEmpty, async (req, res) => {
  try {
    const { username, rawPwd } = req.body;
    if (!username || !rawPwd) throw { msg: 'MISSING_REQUIRED_FIELDS' };

    const user = await userModel.login({
      fUsername: username.toLowerCase(),
      rawPwd
    });
    if (!user) throw { msg: 'INVALID_USERNAME_PASSWORD' };

    const entity = user.get({ plain: true });
    const fRefToken = genRefToken();
    await refTokenModel.refresh({
      fUserId: entity.fId,
      fRefToken,
      users_fId: entity.fId // foreign key
    });

    const { fId: fUserId, fTypeId } = user;
    const permissions = await permissionModel.loadAll([], {
      where: { fId: fTypeId }
    });
    if (!permissions || permissions.length !== 1)
      throw { msg: 'NO_PERMISSION' };

    const { fUserType } = permissions[0].get({ plain: true });
    const accToken = await refTokenModel.genAccToken(fUserId, fUserType);

    handleSuccess(res, {
      access_token: accToken,
      refresh_token: fRefToken,
      user: {
        firstName: entity.fFirstName || '',
        lastName: entity.fLastName || '',
        typeName: fUserType || ''
      }
    });
  } catch (err) {
    handleFailure(res, { err, route: req.originalUrl });
  }
});

/**
 * GET new accessToken
 */
Router.get('/token', async (req, res) => {
  try {
    // validate refToken
    const fRefToken = req.headers['x-ref-token'];
    if (!fRefToken) throw { code: 401, msg: 'NO_REFRESH_TOKEN' };
    await refTokenModel.validateRefToken(fRefToken);
    // refToken is valid, gen & return new accToken
    const fUserId = await refTokenModel.findUserByRefToken(fRefToken);
    if (!fUserId) throw { msg: 'USER_NOT_FOUND' };

    const users = await userModel.loadAll(['fTypeId'], {
      where: { fId: fUserId }
    });
    if (!users || users.length !== 1) throw { msg: 'USER_NOT_FOUND' };

    const { fTypeId } = users[0].get({ plain: true });
    const permissions = await permissionModel.loadAll(['fUserType'], {
      where: { fId: fTypeId }
    });
    if (!permissions || permissions.length !== 1)
      throw { msg: 'NO_PERMISSION' };

    const { fUserType } = permissions[0].get({ plain: true });
    const accToken = await refTokenModel.genAccToken(fUserId, fUserType);
    handleSuccess(res, { access_token: accToken });
  } catch (err) {
    handleFailure(res, { err, route: req.originalUrl });
  }
});

module.exports = Router;
