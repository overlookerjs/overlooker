import React, { Component } from 'react';
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

React.render(
  <App/>,
  document.getElementById('root'),
);
