require('es6-promise').polyfill();

import fetch from 'isomorphic-fetch';
import * as types from '../constants/actions.js';

export const actionCreator = payload => ({
  type: types.ACTION_CONSTANT,
  payload,
});

export function fetchData() {
  return dispatch => fetch('http://my.api')
    .then(
      response => response.json()
    )
    .then(
      data => {
        dispatch(actionCreator(data));
      }
    )
    .catch(error => {
      console.log('API ERROR', error);
      console.log('ERROR STACK', error.stack);
    });
}
