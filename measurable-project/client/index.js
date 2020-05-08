import React, { Component, Fragment } from 'react';
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
    performance.mark('overlooker.metrics.timing:react.mounted');
  }

  async handleClick() {
    performance.mark('overlooker.metrics.duration.start:handle.click');

    const { Input } = await import('./sub-module.js');

    setTimeout(() => {
      this.setState({
        content: (
          <Fragment>
            <div className={styles.hero} id={'action-hero-layer'}>Action hero content</div>
            <Input />
            <Input />
            <img id="loaded-image" src={require('./loaded-image.png')} elementtiming={'timing-action-image'} />
          </Fragment>
        )
      });

      performance.mark('overlooker.metrics.duration.end:handle.click');
    }, 500);
  }

  render() {
    return (
      <div className={styles.root}>
        <h2 elementtiming={'timing-header'}>
          Header
        </h2>
        <button className={styles.button} onClick={() => this.handleClick()} elementtiming={'button.std'}>
          test button
        </button>
        <button className={styles.button} onClick={() => this.handleClick()} elementtiming={'button.with-span'}>
          <span>
          <span>test button</span>
          </span>
        </button>
        <div elementtiming={'some-text'}>
          some text
        </div>
        <div className={styles.hero} id={'hero-layer'}>Hero content</div>
        {
          this.state.content
        }
      </div>
    );
  }
}

document.addEventListener('DOMContentLoaded', () => {
    performance.mark('overlooker.metrics.duration.start:render');

    ReactDom.render(<App />, document.getElementById('app'));

    performance.mark('overlooker.metrics.duration.end:render');
  }
);

