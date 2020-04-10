# react-jupyter-widget-template

This repo holds the template for a Jupyter notebook extension that passes a JSON object to a React component that is then displayed as output in the notebook.

## JS Setup
```
cd js
npm install
npm run build
cd ..
```

*You need to setup the JS before the Python because it needs the bundled JS.*
## Python Setup
```
python setup.py develop
```
_You might need to also manually `pip install notebook`_

## Usage
```
jupyter notebook
```
- Open example.ipynb
- Run code block
