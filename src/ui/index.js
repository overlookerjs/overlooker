import React, { Component, Fragment } from 'react';
import styles from './components/styles.css';

export class App extends Component {
  constructor(props) {
    super(props);
  }

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
