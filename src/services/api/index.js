import ApiAddresses from './apiAddresses';
import axios from 'axios';
import store from '../../store';
import base64 from 'base-64';
import { actions as authActions } from '../../reducers/auth';
import { actions as notificationsActions } from '../../reducers/notifications';
import { makeFormData } from '../helpers/dataBuilder';

const getTokens = () => store.getState().auth.tokens;

const validateTokens = tokens => {
  if (tokens.access !== null && tokens.refresh !== null) {
    if (tokens.access.expiredIn < Date.now()) {
      return Promise.resolve(tokens.access.token);
    } else {
      if (tokens.refresh.expiredIn < Date.now()) {
        return getAccessToken(tokens.refresh.token)
          .then(response => {
            store.dispatch(authActions.setNewAccessToken(response.data));
            return response.data.token;
          })
          .catch(error => {
            store.dispatch(notificationsActions.requestFail(error));
          });
      }
    }
  }
};

const authRequest = (url, options = {}) => {
  const tokens = getTokens();
  return validateTokens(tokens)
    .then(accessToken => {
      return axios({
        ...options,
        url,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...options.headers
        }
      });
    })
    .catch(error => {
      store.dispatch(notificationsActions.requestFail(error));
    });
};

// USERS
export const signup = body =>
  axios({
    url: ApiAddresses.USERS_SIGNUP,
    method: 'POST',
    data: body
  });

export const signin = ({ email, password }) =>
  axios({
    url: ApiAddresses.USERS_SIGNIN,
    headers: {
      Authorization: `Basic ${base64.encode(`${email}:${password}`)}`
    },
    method: 'POST'
  });

export const getUser = () =>
  authRequest(ApiAddresses.GET_USER, { method: 'GET' });

export const updateUser = (userId, data) =>
  authRequest(ApiAddresses.UPDATE_USER(userId), {
    data,
    method: 'PUT'
  });

// TOKENS
export const checkRefreshToken = refreshToken =>
  axios({
    url: ApiAddresses.CHECK_REFRESH,
    headers: { Authorization: `Bearer ${refreshToken}` },
    method: 'GET'
  });

export const checkAccessToken = accessToken =>
  axios({
    url: ApiAddresses.CHECK_ACCESS,
    headers: { Authorization: `Bearer ${accessToken}` },
    method: 'GET'
  });

export const getAccessToken = refreshToken =>
  axios({
    url: ApiAddresses.GET_ACCESS_TOKEN,
    headers: { Authorization: `Bearer ${refreshToken}` },
    method: 'GET'
  });

// WORKERS
export const getAllWorkers = () => axios.get(ApiAddresses.GET_WORKERS);

export const createWorker = data =>
  authRequest(ApiAddresses.POST_WORKER, {
    data,
    method: 'POST'
  });

export const deleteWorker = (workerId, email, password) =>
  axios({
    url: ApiAddresses.DELETE_WORKER(workerId),
    headers: {
      Authorization: `Basic ${base64.encode(`${email}:${password}`)}`
    },
    method: 'PUT',
    data: makeFormData({ isActive: false })
  });

export const updateWorker = (workerId, data) =>
  authRequest(ApiAddresses.UPDATE_WORKER(workerId), {
    data,
    method: 'PUT'
  });
