# Gamma Viewer

Upload a Translator standard message into a jupyter notebook and view it in a useful analytic user interface.

## Installation
```bash
pip install gamma-viewer
```

## Local Setup
Activate your python environment of choice.
This package also requires you have nodejs and npm installed.
```bash
git clone git@github.com:ranking-agent/gamma-viewer.git
cd gamma-viewer
pip install -e .
jupyter nbextension install --py --symlink --sys-prefix gamma_viewer
jupyter nbextension enable --py --sys-prefix gamma_viewer

jupyter notebook
```

## Usage
```python
    from gamma_viewer import GammaViewer
    from IPython.display import display
    import json

    with open('translator_standard_message.json', 'r') as f:
        res = json.load(f)

    view = GammaViewer(props={"data":res})
    display(view)
```