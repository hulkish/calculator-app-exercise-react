import React from 'react';
import ReactDOM from 'react-dom';
import AppRoot from 'containers/app-root';
import { Provider } from 'react-redux';
import { configureStore } from './store';

const store = configureStore();

ReactDOM.render(
  <Provider store={store}>
    <AppRoot />
  </Provider>,
  document.getElementById('root')
);
