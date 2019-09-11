import axios from 'axios';
import { getCookie } from 'tiny-cookie';
import { SERVER_HOST_DEV } from '../constants/api';
import { ACCESS_TOKEN_KEY } from '../constants/token';

//Global headers configurations
axios.defaults.headers.post['Content-Type'] = 'application/json';

export const getProfile = (id, cancelToken = undefined) => {
  return axios.get(`${SERVER_HOST_DEV}/user/profile?id=${id}`, {
    headers: {
      'x-access-token': getCookie(ACCESS_TOKEN_KEY)
    },
    cancelToken
  });
};

export const createNewUser = (userEntity, cancelToken = undefined) => {
  return axios.post(
    `${SERVER_HOST_DEV}/auth/account`,
    {
      ...userEntity
    },
    {
      headers: {
        'x-access-token': getCookie(ACCESS_TOKEN_KEY)
      },
      cancelToken
    }
  );
};

export const checkPassword = (userId, password) => {
  return axios.post(
    `${SERVER_HOST_DEV}/user/checkPassword`,
    {
      userId,
      password
    },
    {
      headers: {
        'x-access-token': getCookie(ACCESS_TOKEN_KEY)
      }
    }
  )
}

export const updatePassword = (userId, password) => {
  return axios.put(
    `${SERVER_HOST_DEV}/user/changePassword`,
    {
      userId,
      password
    },
    {
      headers: {
        'x-access-token': getCookie(ACCESS_TOKEN_KEY)
      }
    }
  )
}

export const updateProfile = (userId, profileEntity, cancelToken = undefined) => {
  let parsedEntity = {
    firstName: profileEntity.fFirstName,
    lastName: profileEntity.fLastName,
    phone: profileEntity.fPhone,
    email: profileEntity.fEmail,
    gender: profileEntity.fGender,
    teamId: profileEntity.fTeamId,
    position: profileEntity.fPosition,
  };
  console.log(`TCL: updateProfile -> parsedEntity`, parsedEntity)
  
  return axios.patch(
    `${SERVER_HOST_DEV}/user/profile`,
    {
      id: userId,
      info: {
        ...parsedEntity
      }
    },
    {
      headers: {
        'x-access-token': getCookie(ACCESS_TOKEN_KEY)
      },
      cancelToken
    }
  );
};

//
export const getAllApprover = (cancelToken = undefined) => {
  return axios.get(`${SERVER_HOST_DEV}/user/approver`, {
    headers: {
      'x-access-token': getCookie(ACCESS_TOKEN_KEY)
    },
    cancelToken
  });
};

export const getAllInformTo = (cancelToken = undefined) => {
  return axios.get(`${SERVER_HOST_DEV}/user/team-leader`, {
    headers: {
      'x-access-token': getCookie(ACCESS_TOKEN_KEY)
    },
    cancelToken
  });
};

export const getAllSubsitutes = (cancelToken = undefined) => {
  return axios.get(`${SERVER_HOST_DEV}/user/substitutes`, {
    headers: {
      'x-access-token': getCookie(ACCESS_TOKEN_KEY)
    },
    cancelToken
  });
};

export const getAllSubsitutesByUserId = (userId, cancelToken = undefined) => {
  return axios.get(`${SERVER_HOST_DEV}/user/substitutes?id=${userId}`, {
    headers: {
      'x-access-token': getCookie(ACCESS_TOKEN_KEY)
    }
  });
};

export const getUsersList = (size = 10, page = 1, cancelToken = undefined) => 
  axios.get(`${SERVER_HOST_DEV}/user?page=${page}&size=${size}`, {
    headers: {
      'x-access-token': getCookie(ACCESS_TOKEN_KEY)
    },
    cancelToken
});