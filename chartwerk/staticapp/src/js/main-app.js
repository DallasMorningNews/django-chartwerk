import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import App from './main-app/containers/App';
import store from './main-app/stores/';

const MyApp = () =>
  <Provider store={store}>
    <App />
  </Provider>;

ReactDOM.render(
  <MyApp />,
  document.getElementById('react-app')
);
