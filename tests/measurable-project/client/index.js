import React, { Component } from 'react';
import ReactDom from 'react-dom';
import styles from './styles.css';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      opened: false
    };
  }

  render() {
    return (
      <div className={styles.root}>
        <h2>
          Header
        </h2>
        <button className={styles.button} onClick={() => setTimeout(() => this.setState({ opened: true }), 500)}>
          test button
        </button>
        <div className={styles.hero} id='hero-element'>Hero content</div>
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

