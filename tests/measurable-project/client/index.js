import React, { Component } from 'react';
import ReactDom from 'react-dom';
import styles from './styles.css';

class App extends Component {
  state = {
    opened: false
  };

  render() {
    return (
      <div className={styles.root}>
        <h2>
          Header
        </h2>
        <button onClick={() => this.setState({ opened: true })}>
        </button>
        {
          this.state.opened && <img id="loaded-image" src={require('./loaded-image.png')}/>
        }
      </div>
    );
  }
}

document.addEventListener('DOMContentLoaded', () =>
  ReactDom.render(<App/>, document.getElementById('app'))
);

