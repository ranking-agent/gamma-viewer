# Gamma Viewer

Upload a Translator standard message into a jupyter notebook and view it in a useful analytic user interface.

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
