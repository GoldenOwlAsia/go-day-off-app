const moment = require('moment');
const express = require('express');
const Router = express.Router();
const { Op } = require('sequelize');
const uid = require('rand-token').uid;
const dateArray = require('moment-array-dates');


/**
 * Models
 */
const {
  users: userModel,
  leaveLetters: leaveLetterModel,
  rejectedLetterDetail: rejectedLetterModel,
  dayOff: dayOffModel,
} = require('../../models');

/**
 * Configs
 */
const { LEAVING_FORM_ID_LEN } = require('../../configs/config');

/**
 * Middlewares
 */
const userMustBeAdmin = require('../../middlewares/userMustBeAdmin');
const bodyMustNotEmpty = require('../../middlewares/bodyMustNotEmpty');

/**
 * Helpers
 */
const { standardizeObj } = require('../../helpers/standardize');
import { sendLeaveRequestMail } from '../../helpers/mailingHelpers';
import { LEAVING_LETTER_STATUS } from '../../configs/constants';
const { handleSuccess, handleFailure } = require('../../helpers/handleResponse');
const { getIdFromToken, getPermissionByToken } = require('../../helpers/getUserInfo');

/**
 * Constants
 */
const { FROM_OPTION, DEFAULT_PAGE_ORDER, 
  DEFAULT_PAGE_SIZE, ALLOWED_PAGE_SIZE, WEEKEND_ORDERS, 
  ALLOWED_STATUS, DEFAULT_STATUS } = require('../../configs/constants');

/**
 *  Local helpers 
 */
const validatingQueryParams = ({ fromMonth, toMonth, fromYear, toYear }) => 
  !(((toYear && (isNaN(toYear) || parseInt(toYear) < parseInt(fromYear)) || 
    fromMonth && (isNaN(fromMonth) || parseInt(fromMonth) > 12)) || 
    (fromYear && (isNaN(fromYear))) ||
    (toMonth && (isNaN(toMonth) || parseInt(toMonth) > 12 || 
    (parseInt(toYear) === parseInt(fromYear) && parseInt(toMonth) < parseInt(fromMonth)))))  
  )

Router.get('/details', async (req, res) => {
  try {
    // others can view oneself's
    const fId = req.query.id;
    if (!fId) throw { msg: 'INVALID_QUERY' };

    // validate if userPermission is permitted
    const fUserType = await getPermissionByToken(req.token_payload);
    if (!fUserType) throw { code: 401, msg: 'NO_PERMISSION' };

    const letters = await leaveLetterModel.loadAll(['fUserId'], { where: { fId } });
    if (!letters || letters.length !== 1) throw { msg: 'LETTER_NOT_FOUND' };
  
    const userId = getIdFromToken(req.token_payload);
    const { fUserId } = letters[0].get({ plain: true });
    if (fUserType !== 'Admin' && userId !== fUserId) throw { code: 401, msg: 'NO_PERMISSION' };

    // only Admin can view everyone's
    const leaveLetters = await leaveLetterModel.loadAll([], { where: { fId } });
    if (!leaveLetters || leaveLetters.length !== 1) throw { msg: 'LETTER_NOT_FOUND' };

    // load substitute fullName
    let letter = leaveLetters[0].get({ plain: true });
    const { fApprover, fSubstituteId } = letter;
    // only Admin marked as approver in letter is able to view and approve it
    if (fUserType === 'Admin' && fApprover !== userId && fUserId !== userId) throw { code: 401, msg: 'NO_PERMISSION' };

    const users = await userModel.loadAll(['fFirstName', 'fLastName'], { where: { fId: fSubstituteId } });
    if (users.length) {
      const { fFirstName, fLastName } = users[0].get({ plain: true });
      letter.fFullName = fFirstName + ' ' + fLastName; 
    }

    //if rejected, load rejectType for more detail
    if (letter.fStatus === LEAVING_LETTER_STATUS.REJECTED) {
      const rejectedLetters = await rejectedLetterModel.loadAll(['fRejectType'], { where: { fLetterId: letter.fId }});
      if (rejectedLetters.length) {
        const { fRejectType } = rejectedLetters[0].get({ plain: true });
        letter.fRejectType = fRejectType;
      }
    }

    handleSuccess(res, { leaveLetter: letter });
  } catch (err) {
    handleFailure(res, { err, route: req.originalUrl });
  }
});

Router.get('/', userMustBeAdmin, async (req, res) => {
  try {
    // validating query params
    const currentYear = moment().get('year');

    let { 
    fromDay = '01', toDay = '31',
    fromMonth = '01', toMonth = '12',
    fromYear = currentYear, toYear = currentYear, 
    status = 0, page = DEFAULT_PAGE_ORDER, size = DEFAULT_PAGE_SIZE } = req.query;

    if(+size === 0) size = Number.MAX_SAFE_INTEGER;
    if(page < 1 || isNaN(page)) page = DEFAULT_PAGE_ORDER;
    if(!ALLOWED_PAGE_SIZE.includes(+size)) size = DEFAULT_PAGE_SIZE;
    if(isNaN(status) || !ALLOWED_STATUS.includes(+status)) status = DEFAULT_STATUS;
    if(!validatingQueryParams({ fromMonth, toMonth, fromYear, toYear })) throw { msg: 'INVALID_QUERY' };

    const userId = getIdFromToken(req.token_payload);
    const toDate = new Date(`${toMonth}/${toDay}/${toYear}`);
    const fromDate = new Date(`${fromMonth}/${fromDay}/${fromYear}`);
    const { rawLeaveLetters, count } = await leaveLetterModel.countAll([],
      { where: { 
        [Op.and]: [{ fFromDT: {[Op.lte]: toDate} }, { fToDT: { [Op.gte]: fromDate } }],
        fStatus: +status === 0 ? { [Op.ne]: null } : +status, 
        [Op.or]: [{ fUserId: userId }, { fApprover: userId }],
      }},
      { limit: +size },
      { offset: (page - 1) * size },
      { order: [['fStatus', 'ASC'], ['fRdt', 'ASC']] });
      
    const leaveLetters = [];
    await (async () => {
      for (let i = 0; i < rawLeaveLetters.length; i++) {
        const letter = rawLeaveLetters[i].get({ plain: true });
        const { fApprover, fUserId, fSubstituteId } = letter;

            //if rejected, load rejectType for more detail
        if (letter.fStatus === LEAVING_LETTER_STATUS.REJECTED) {
          const rejectedLetters = await rejectedLetterModel.loadAll(['fRejectType'], { where: { fLetterId: letter.fId }});
          if (rejectedLetters.length) {
            const { fRejectType } = rejectedLetters[0].get({ plain: true });
            letter.fRejectType = fRejectType;
          }
        }

        // user's fullName
        const users = await userModel.loadAll(['fFirstName', 'fLastName'], { where: { fId: fUserId } });
        if (users.length) {
          const { fFirstName, fLastName } = users[0].get({ plain: true });
          letter.fUserFullName = fFirstName + ' ' + fLastName;
        }

        // approver's fullName
        const approvers = await userModel.loadAll(['fFirstName', 'fLastName'], { where: { fId: fApprover } });
        if (approvers.length) {
          const { fFirstName, fLastName } = approvers[0].get({ plain: true });
          letter.fApproverFullName = fFirstName + " " + fLastName;
        }
        
        // substitute's fullName
        const substitutes = await userModel.loadAll(['fFirstName', 'fLastName'], { where: { fId: fSubstituteId } });
        if (substitutes.length) {
          const { fFirstName, fLastName } = substitutes[0].get({ plain: true });
          letter.fSubstituteFullName = fFirstName + " " + fLastName;
        }

        leaveLetters.push(letter);
      }
    })();

    handleSuccess(res, { leaveLetters, count: leaveLetters.length > 0 && count || 0 });
  } catch (err) {
    handleFailure(res, { err, route: req.originalUrl });
  }
});

Router.post('/', bodyMustNotEmpty, async (req, res) => {
  try {
    const id = uid(LEAVING_FORM_ID_LEN);
    const entity = standardizeObj({ ...req.body, id });
    const { fStatus, fFromDT, fToDT } = entity;

    // validate status value
    if (
      (fStatus || 3) &&
      !leaveLetterModel.rawAttributes.fStatus.values.includes(fStatus)
    )
      throw { msg: 'INVALID_VALUES' };

    // validate whether fromDT <= toDT
    if (fFromDT && fToDT && new Date(fFromDT) > new Date(fToDT) ) {
      throw { msg: 'INVALID_VALUES' };
    }

    // add foreign keys
    const { fUserId, fAbsenceType, fApprover } = entity;
    entity.users_fId = fUserId;
    entity.users_fId1 = fUserId;
    entity.approver_fId = fApprover;
    entity.absenceTypes_fId = fAbsenceType;

    entity.fFromDT = moment.utc(fFromDT).toDate();
    entity.fToDT = moment.utc(fToDT).toDate();
    const leaveLetter = await leaveLetterModel.add(entity);

    //Send email
    let { fInformTo } = entity;
    console.log(`LeaveLetter Controller -> req Entities`, entity);
    sendLeaveRequestMail({ leaveLetter, fInformTo }, (success, data) => {
      if (success) {
        const { accepted, rejected, response, messageId } = data;
        console.log(`[SUCCESS] - Email has been sent.`);
        console.log(`-> Accepted : `, accepted);
        console.log(`-> Rejected : `, rejected);
        console.log(`-> Response : `, response);
        console.log(`-> MessageId: `, messageId);
      } else {
        console.log(`[FAIL] - Email can't be sent`);
        console.log(`-> Err response: `, data);
      }
    });

    handleSuccess(res, { code: 201, leaveLetter });
  } catch (err) {
    handleFailure(res, { err, route: req.originalUrl });
  }
});

Router.patch('/', bodyMustNotEmpty, async (req, res) => {
  try {
    // validate if userPermission is permitted
    const fUserType = await getPermissionByToken(req.token_payload);
    if (!fUserType) throw { code: 401, msg: 'NO_PERMISSION' };

    // others can update oneself's
    const queryEntity = standardizeObj(req.body.info);
    const { fUserId, fStatus } = queryEntity;
    const userId = getIdFromToken(req.token_payload);

    // only Admin can update everyone's
    if (fUserType !== 'Admin' && userId !== fUserId) throw { code: 401, msg: 'NO_PERMISSION' };

    const fId = req.body.id;
    if (!queryEntity || Object.keys(queryEntity).length < 1 || !fId) throw { msg: 'INVALID_VALUES' };

    const lLEntity = await leaveLetterModel.loadAll({ fFromDT, fFromOpt, fToDT, fToOpt }, 
      { where: { fId }});

    const { fFromDT, fFromOpt, fToDT, fToOpt } = lLEntity[0];
    // validate status value
    if (
      (fStatus || 3) &&
      !leaveLetterModel.rawAttributes.fStatus.values.includes(fStatus)
    )
      throw { msg: 'INVALID_VALUES' };
 
    let fromDate = moment(fFromDT).local();
    let toDate = moment(fToDT).local();

    // validate whether fromDT <= toDT
    if (fromDate && toDate && fromDate > toDate)
     throw { msg: 'INVALID_VALUES' };

    if ( fStatus === 2 ) {
      const selectedYear = moment(fromDate).year();
      const dOEntity = await dayOffModel.loadAll({ fYearRemaining }, {where: { fUserId, fYear: selectedYear }});
      const { fYearRemaining, fYearUsed } = dOEntity[0];  

      let useDays = 0;

      if (fromDate.isSame(toDate, 'date')) {
        if (fFromOpt === 'allday') {
          useDays = 1;
        } else {
          useDays = 0.5;
        }
      }
      else
      {

        fFromOpt === 'afternoon' ? useDays += 0.5 : useDays += 1;
        console.log("TCL: useDays", useDays);
        fToOpt === 'morning' ? useDays += 0.5 : useDays += 1;
        console.log("TCL: useDays", useDays);
    
        fromDate.add(1, 'day');
        console.log("TCL: fromDate", fromDate);

        while (fromDate.isBefore(toDate, 'date')) {
          let fromDay = fromDate.day();
          if (fromDay !== 6 && fromDay !== 0) {
            useDays += 1;
          }
          console.log("TCL: useDays", useDays)
          fromDate.add(1, 'day');
          console.log("TCL: fromDate", fromDate)
        } 
      }

      console.log("TCL: fYearRemaining", fYearRemaining)

      if (useDays > fYearRemaining) throw { msg: 'REMAINING_DAY-OFF_NOT_ENOUGH' }
      
      const dayOffAffected = await dayOffModel.modify({
        fYearRemaining: fYearRemaining - useDays, 
        fYearUsed: fYearUsed + useDays }, 
        { where: { fUserId, fYear: selectedYear } });

      if (dayOffAffected.length < 1) throw { msg: 'LETTER_NOT_UPDATED' };
    }
    
    const affected = await leaveLetterModel.modify(queryEntity, { where: { fId, fUserId } });
    if (affected[0] < 1) throw { msg: 'LETTER_NOT_UPDATED' };

    handleSuccess(res, { leaveLetter: queryEntity });
  } catch (err) {
    handleFailure(res, { err, route: req.originalUrl });
  }
});

Router.get('/my-letters', async (req, res) => {
  try {
    // Check permission
    const userId = getIdFromToken(req.token_payload);
    const demandUserId = req.query.userId;
    if (!userId || !demandUserId) throw { msg: 'USER_NOT_FOUND' };
    const userType = await getPermissionByToken(req.token_payload);
    // only Admin can view all; others can view oneself's
    if(userId !== demandUserId && userType !== 'Admin') throw { code: 401, msg: 'NO_PERMISSION' };

    let { page = DEFAULT_PAGE_ORDER, size = DEFAULT_PAGE_SIZE } = req.query;
    if(page < 1 || isNaN(page)) page = DEFAULT_PAGE_ORDER;
    if(!ALLOWED_PAGE_SIZE.includes(+size)) size = DEFAULT_PAGE_SIZE;
    if(+size === 0) size = Number.MAX_SAFE_INTEGER;

    const { rawLeaveLetters, count } = await leaveLetterModel.countAll([],
      { where: { 
        fUserId: demandUserId,
        [Op.or]: [{ fUserId: userId }, { fApprover: userId }]
      }},
      { limit: +size },
      { offset: (page - 1) * size },
      { order: [['fStatus', 'ASC'], ['fRdt', 'ASC']] });

    const leaveLetters = [];
    await (async () => {
      for (let i = 0; i < rawLeaveLetters.length; i++) {
        const letter = rawLeaveLetters[i].get({ plain: true });
        const { fApprover, fUserId, fSubstituteId } = letter;

        // user's fullName
        const users = await userModel.loadAll(["fFirstName", "fLastName"], {
          where: { fId: fUserId }
        });
        if (users.length) {
          const { fFirstName, fLastName } = users[0].get({ plain: true });
          letter.fUserFullName = fFirstName + " " + fLastName;
        }
        // approver's fullName
        const approvers = await userModel.loadAll(["fFirstName", "fLastName"], {
          where: { fId: fApprover }
        });
        if (approvers.length) {
          const { fFirstName, fLastName } = approvers[0].get({ plain: true });
          letter.fApproverFullName = fFirstName + " " + fLastName;
        }
        // substitute's fullName
        const substitutes = await userModel.loadAll(["fFirstName", "fLastName"], {
          where: { fId: fSubstituteId }
        });
        if (substitutes.length) {
          const { fFirstName, fLastName } = substitutes[0].get({ plain: true });
          letter.fSubstituteFullName = fFirstName + " " + fLastName;
        }

        leaveLetters.push(letter);
      }
    })();

    handleSuccess(res, { success: true, leaveLetters, count: leaveLetters.length > 0 && count || 0 });
  } catch (err) {
    handleFailure(res, { err, route: req.originalUrl });
  }
});

Router.get('/filter', async (req, res) => {
  try {
    // validating query params
    const currentYear = moment().get('year');

    let { userId,
      fromDay = '01', toDay = '31',
      fromMonth = '01', toMonth = '12',
      fromYear = currentYear, toYear = currentYear, status = 0,
      page = DEFAULT_PAGE_ORDER, size = DEFAULT_PAGE_SIZE } = req.query;

    // if(toYear > currentYear) toYear = currentYear;
    if(isNaN(page) || !ALLOWED_PAGE_SIZE.includes(+size)) size = DEFAULT_PAGE_SIZE;
    if(+size === 0) size = Number.MAX_SAFE_INTEGER;
    if(isNaN(status) || !ALLOWED_STATUS.includes(+status)) status = DEFAULT_STATUS;
    if(!validatingQueryParams({ fromMonth, toMonth, fromYear, toYear })) throw { msg: 'INVALID_QUERY' };
      
    // only Admin can export all; others can export oneself's
    const fUserType = await getPermissionByToken(req.token_payload);
    if(fUserType !== 'Admin' && userId !== getIdFromToken(req.token_payload)) throw { code: 401, msg: 'NO_PERMISSION' };

    const toDate = new Date(`${toMonth}/${toDay}/${toYear}`);
    const fromDate = new Date(`${fromMonth}/${fromDay}/${fromYear}`);
    const { rawLeaveLetters: leaveLetters, count } = await leaveLetterModel.countAll([],
      { where: { 
          fUserId: userId,
          [Op.and]: [{ fFromDT: {[Op.lte]: toDate} }, { fToDT: { [Op.gte]: fromDate } }],
          fStatus: +status === 0 ? { [Op.ne]: null } : +status,
          fApprover: (userId === getIdFromToken(req.token_payload)) ? { [Op.ne]: null } : getIdFromToken(req.token_payload),
      }},
      { limit: +size },
      { offset: (page - 1) * size },
      { order: [['fStatus', 'ASC'], ['fRdt', 'ASC']] });

    handleSuccess(res, { leaveLetters, count: leaveLetters.length && count || 0 });
  } catch(err) {
    handleFailure(res, { err, route: req.originalUrl });
  }
});

/**
 * fromMonth, fromYear, toMonth, toYear, status
 */

Router.get('/calendar-off-day', async (req, res) => {
  try {
    //validating query params
    const currentDate = moment().get('year');
    let { month = currentDate.get('month'), year = currentDate.get('year'),
      status = LEAVING_LETTER_STATUS.APPROVED 
    } = req.query;
    
    console.log(`TCL: status`, status)

    const userId = getIdFromToken(req.token_payload);
    if (!userId) throw { msg: 'NO_TOKEN' }
    if (isNaN(status) || !ALLOWED_STATUS.includes(+status)) 
    status = DEFAULT_STATUS;
    
    console.log(`TCL: status`, status)
    
    const firstDayOfMonth = month < 10 ? moment.utc(`0${month}-01-${year}`) : moment.utc(`${month}-01-${year}`);
    const lastDayOfMonth = moment.utc(firstDayOfMonth).set('date', firstDayOfMonth.daysInMonth());

    const lettersInMonth = await leaveLetterModel.loadAll([], {
      where: {
        fUserId: userId,
        fStatus: +status === 0 ? { [Op.ne]: null } : status,
        fFromDT: { [Op.between]: [firstDayOfMonth.toDate(), lastDayOfMonth.toDate()] },
        fToDT: { [Op.between]: [firstDayOfMonth.toDate(), lastDayOfMonth.toDate()] },
      }
    })
    console.log('PASS 1')
    const letterFromLastMonth = await leaveLetterModel.loadAll([], {
      where: {
        fUserId: userId,
        fStatus: +status === 0 ? { [Op.ne]: null } : status,
        fFromDT: { [Op.lt]: firstDayOfMonth.toDate() },
        fToDT: { [Op.between]: [firstDayOfMonth.toDate(), lastDayOfMonth.toDate()] },
      }
    })
    console.log('PASS 2')

    const letterFromNextMonth = await leaveLetterModel.loadAll([], {
      where: {
        fUserId: userId,
        fStatus: +status === 0 ? { [Op.ne]: null } : status,
        fFromDT: { [Op.between]: [firstDayOfMonth.toDate(), lastDayOfMonth.toDate()] },
        fToDT: { [Op.gt]: lastDayOfMonth.toDate() },
      }
    })

    console.log('PASS 3')

    handleSuccess(res, { leaveLetters: [...letterFromLastMonth ,...lettersInMonth, ...letterFromNextMonth] });
  }
  catch (err){
    handleFailure(res, { err, route: req.originalUrl });
  }
})

Router.post('/send-email', async (req, res) => {
  try {
    const userId = getIdFromToken(req.token_payload);
    if (!userId) throw { msg: 'USER_NOT_FOUND' };

    sendLeaveRequestMail((success, data) => {
      if (success) {
        console.log(`send-mail -> success info: `, data);
        handleSuccess(res, {
          data,
          msg: 'Email has been sent'
        });
      } else {
        console.log(`send-mail -> error info: `, data);
        handleFailure(res, {
          data,
          msg: `Can't send email!`
        });
      }
    });
  } catch (err) {
    console.log(`send-email -> catch(err): `, err);
    handleFailure(res, { err, route: req.originalUrl });
  }
});

module.exports = Router;
