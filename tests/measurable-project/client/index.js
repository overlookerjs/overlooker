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
    performance.mark('overlooker.metrics.mark:react.mounted');
  }

  async handleClick() {
    performance.mark('overlooker.metrics.duration.start:handle.click');

    const { Input } = await import('./sub-module.js');

    setTimeout(() => {
      this.setState({
        content: (
          <Fragment>
            <Input/>
            <Input/>
            <img id="loaded-image" src={require('./loaded-image.png')}/>
          </Fragment>
        )
      });

      performance.mark('overlooker.metrics.duration.end:handle.click');
    }, 500);
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
          this.state.content
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

