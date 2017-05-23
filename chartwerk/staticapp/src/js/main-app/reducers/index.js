import * as types from '../constants/actions';
import _ from 'lodash';


export default (state, action) => {
  const initialState = {
    data: null,
  };

  if (typeof state === 'undefined') {
    return initialState;
  }

  let nextState = _.assign({}, state);

  switch (action.type) {
    case types.ACTION_CONSTANT:
      nextState.data = action.payload;
      return nextState;
    default:
      return state;
  }
};
