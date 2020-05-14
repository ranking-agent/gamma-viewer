# How To Make A Release

```bash
mkdir release
cd release
rm -rf gamma-viewer

git clone git@github.com:ranking-agent/gamma-viewer.git
cd gamma-viewer
```

You may also want to consider making a fresh environment.
```bash
python -m venv ~/.venv/gamma_viewer
source ~/.venv/gamma_viewer/bin/activate
pip install -e .
```

You need to have setuptools, wheel, and twine installed via pip.

## Release on PyPi
Make sure you bump the version number
```bash
git clean -dfx
python setup.py sdist bdist_wheel
twine upload dist/*
```
Then make a pull request with the bumped version as well as make a release tag