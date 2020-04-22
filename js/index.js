import JupyterReact from './jsWrapper';
import App from './src';

function load_ipython_extension () {
  requirejs([
    'base/js/namespace',
    'base/js/events',
  ], (Jupyter, events) => {
    JupyterReact.init(Jupyter, events, 'react.example', { components: App });
  });
}

export { load_ipython_extension };
