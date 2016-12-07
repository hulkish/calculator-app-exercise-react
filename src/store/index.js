import rootReducer from '../reducers';
import { createStore } from 'redux';

function configureStore(initialState) {
  return createStore(rootReducer, initialState);
}

export { configureStore };
