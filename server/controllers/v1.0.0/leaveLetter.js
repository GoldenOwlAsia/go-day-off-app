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
    (toMonth && (isNaN(toMonth) || parseInt(toMonth) > 12 || parseInt(toMonth) < parseInt(fromMonth))))  
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
    const entity = standardizeObj(req.body.info);
    const { fUserId } = entity;
    const userId = getIdFromToken(req.token_payload);
    // only Admin can update everyone's
    if (fUserType !== 'Admin' && userId !== fUserId) throw { code: 401, msg: 'NO_PERMISSION' };

    const fId = req.body.id;
    if (!entity || Object.keys(entity).length < 1 || !fId) throw { msg: 'INVALID_VALUES' };

    const { fStatus, fFromDT, fToDT } = entity;
    // validate status value
    if (
      (fStatus || 3) &&
      !leaveLetterModel.rawAttributes.fStatus.values.includes(fStatus)
    )
      throw { msg: 'INVALID_VALUES' };

    // validate whether fromDT <= toDT
    if (fFromDT && fToDT && 
      new Date(fFromDT) > new Date(fToDT)) throw { msg: 'INVALID_VALUES' };

    const affected = await leaveLetterModel.modify(entity, { where: { fId, fUserId } });
    if (affected[0] < 1) throw { msg: 'LETTER_NOT_UPDATED' };

    handleSuccess(res, { leaveLetter: entity });
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

Router.get('/used-off-days', async (req, res) => {
  try {
    let { userId, month, year } = req.query;
    // only Admin can view all; others can view oneself's
    const fUserType = await getPermissionByToken(req.token_payload);
    if(fUserType !== 'Admin' && userId !== getIdFromToken(req.token_payload)) throw { code: 401, msg: 'NO_PERMISSION' };

    if(!userId || 
      (await getPermissionByToken(req.token_payload) !== 'Admin' && 
      userId !== getIdFromToken(req.token_payload))) throw { msg: 'INVALID_QUERY' };
    if(isNaN(month) || ![...Array(12).keys()].includes(+month - 1)) month = 12;
    if(isNaN(year) || (year > moment().get('year') || year < 2000)) year = moment().get('year');
    
    // counting used off days
    let numOffDays = 0;
    const endMonthDayOfFromDate = moment(`${month}-02-${year}`).endOf('month').format('DD');
    let fromDate = new Date(`01/01/${year}`);
    let toDate = new Date(`${month}/${endMonthDayOfFromDate}/${year}`);
    const { rawLeaveLetters } = await leaveLetterModel.countAll({},
      { where: { 
        fUserId: userId,
        fFromDT: { [Op.between]: [fromDate, toDate] },
        fStatus: LEAVING_LETTER_STATUS.APPROVED
      } });
    
    for(let i = 0; i < rawLeaveLetters.length; i++) {
      let { fFromDT, fToDT, fFromOpt } = rawLeaveLetters[i].get({ plain: true });
      // check if out of range
      if(fFromDT < fromDate) {
        fFromDT = fromDate
        fFromOpt = FROM_OPTION.ALLDAY;
      }
      if(fToDT > toDate) fToDT = toDate;
      // count all even weekends
      if(fFromOpt !== FROM_OPTION.ALLDAY) numOffDays += 0.5;
      else numOffDays += moment(fToDT).startOf('day').diff(moment(fFromDT).startOf('day'), 'days') + 1;
      
      // create an array of days to check for weekend
      // if fFromDT is same as fToDT, dataArray can't handle
      // so manually create an array containing 1 element (fFromDT)
      const datesArray = moment(fFromDT).startOf('day').isSame(moment(fToDT).startOf('day')) ? [moment(fFromDT).format('MM-DD-YYYY')] : dateArray.range(fFromDT, fToDT, 'MM-DD-YYYY');
      // exclude weekend & fFromDT & fToDT (already subtract above)
      for (let j = 0; j < datesArray.length; j++) {
        if (WEEKEND_ORDERS
          .includes(moment(datesArray[j]).day())) {
          numOffDays -= 1;
          datesArray.splice(j--, 1); // splice that day from array then update index j
        }
      }
    }

    handleSuccess(res, { numOffDays });
  }
  catch(err) {
    handleFailure(res, { err, route: req.originalUrl });
  }
})

module.exports = Router;
