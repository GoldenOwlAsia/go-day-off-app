import axios from "axios";
import { getCookie } from "tiny-cookie";

/**
 * Constants
 */
import { SERVER_HOST_DEV } from "../constants/api";
import { ACCESS_TOKEN_KEY } from "../constants/token";

/**
 * Helpers
 */
import { getUserId } from '../helpers/authHelpers';

// General header params for some methods
axios.defaults.headers.post['Content-Type'] = 'application/json';
axios.defaults.headers.patch['Content-Type'] = 'application/json';

export const getLeaveLetterDetails = id =>
  axios.get(`${SERVER_HOST_DEV}/leaveLetter/details?id=${id}`, {
    headers: {
      "x-access-token": getCookie(ACCESS_TOKEN_KEY)
    }
  });

export const getAllLeaveLetters = (page = 1, size = 10) =>
  axios.get(`${SERVER_HOST_DEV}/leaveLetter?page=${page}&size=${size}`, {
    headers: {
      "x-access-token": getCookie(ACCESS_TOKEN_KEY)
    }
  });

export const getMyLeaveLetters = (page = 1, size = 10, demandUserId = getUserId()) =>
  axios.get(`${SERVER_HOST_DEV}/leaveLetter/my-letters?userId=${demandUserId}&page=${page}&size=${size}`, {
    headers: {
      "x-access-token": getCookie(ACCESS_TOKEN_KEY)
    }
  });

export const createLeaveLetter = (letterEntity) => {
  return axios.post(`${SERVER_HOST_DEV}/leaveletter`, 
    {
      "absenceType": letterEntity.leaveType,
      "fromDT": letterEntity.startDate,
      "toDT": letterEntity.endDate,
      "status": 1,
      "substituteId": 'i53FItHeMK',
      "userId": getUserId(),
      "approver": letterEntity.approver,
      "reason": letterEntity.otherReason !== "" ? letterEntity.otherReason : letterEntity.reason
    },
    {
      headers: {
        'x-access-token': getCookie(ACCESS_TOKEN_KEY)
      }
    }
  )
}

export const updateLetterStatus = (letterId, userId, statusKey) => {
  return axios.patch(`${SERVER_HOST_DEV}/leaveletter`, 
  {
    "id": letterId,
    "info": {
      "status": statusKey,
      "userId": userId,
    },
  },
  {
    headers: {
      'x-access-token': getCookie(ACCESS_TOKEN_KEY)
    }
  })
}
