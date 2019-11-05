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

  componentDidMount() {
    performance.mark('overlooker.metrics.mark:react.mounted');
  }

  handleClick() {
    performance.mark('overlooker.metrics.duration.start:timeout');

    setTimeout(() => {
      this.setState({ opened: true });

      performance.mark('overlooker.metrics.duration.end:timeout');
    }, 500)
  }

  render() {
    return (
      <div className={styles.root}>
        <h2>
          Header
        </h2>
        <button className={styles.button} onClick={() => this.handleClick()}>
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

document.addEventListener('DOMContentLoaded', () => {
    performance.mark('overlooker.metrics.duration.start:render');

    ReactDom.render(<App/>, document.getElementById('app'));

    performance.mark('overlooker.metrics.duration.end:render');
  }
);

