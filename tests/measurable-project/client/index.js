import React, { Component } from 'react';
import ReactDom from 'react-dom';
import styles from './styles.css';

class App extends Component {
  render() {
    return (
      <div className={styles.root}>
        <h2>
          Header
        </h2>
      </div>
    );
  }
}

document.addEventListener('DOMContentLoaded', () =>
  ReactDom.render(<App/>, document.getElementById('app'))
);

