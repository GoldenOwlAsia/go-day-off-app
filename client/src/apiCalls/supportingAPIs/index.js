import axios from 'axios';
import { getCookie } from 'tiny-cookie';
import { SERVER_HOST_DEV } from '../../constants/api';
import { ACCESS_TOKEN_KEY } from '../../constants/token';

export const getAllTeams = (cancelSourceToken) => {
  return axios.get(`${SERVER_HOST_DEV}/team`, {
    headers: {
      'x-access-token': getCookie(ACCESS_TOKEN_KEY)
    },
    cancelToken: cancelSourceToken,
  });
};

export const getAllPositions = (cancelSourceToken) => {
  return axios.get(`${SERVER_HOST_DEV}/position`, {
    headers: {
      'x-access-token': getCookie(ACCESS_TOKEN_KEY)
    },
    cancelToken: cancelSourceToken,
  });
};

