import reducers from '../reducers';
import { createStore, applyMiddleware, compose } from 'redux';
import { fetchData } from '../actions';
import thunk from 'redux-thunk';

const store = createStore(reducers, compose(
  applyMiddleware(thunk),
  // https://github.com/zalmoxisus/redux-devtools-extension#22-advanced-store-setup
  window.devToolsExtension ? window.devToolsExtension() : f => f
));

store.dispatch(actions.fetchData());

export default store;
