import React, { Component } from 'react';
import Calculator from 'components/calculator';
import './app-root.scss';

class AppRoot extends Component {
  render() {
    return (
      <div className="container is-fluid">
        <header className="header is-text-center">
          <h1 className="title is-center">React Calculator</h1>
        </header>

        <Calculator />
      </div>
    );
  }
}

export default AppRoot;
