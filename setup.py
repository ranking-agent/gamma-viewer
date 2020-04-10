"""Setup Jupyter notebook react extension."""
from setuptools import setup
from setuptools.command.develop import develop as _develop
from notebook.nbextensions import install_nbextension
from notebook.services.config import ConfigManager
import os

extension_dir = os.path.join(os.path.dirname(__file__), "pack", "static")


class develop(_develop):
    """Install notebook extension."""

    def run(self):
        """Install and enable notebook extension."""
        _develop.run(self)
        install_nbextension(extension_dir, symlink=True,
                            overwrite=True, user=False, destination="pack",
                            sys_prefix=True)
        cm = ConfigManager()
        cm.update('notebook', {"load_extensions": {"pack/bundle": True}})


setup(
    name='react-jupyter-widget-template',
    cmdclass={'develop': develop},
    version='0.0.1',
    description='An example wrapper around react components for use in jupyter notebooks',
    url='https://gitlab.com/covar/react-jupyter-widget-template',
    author='Max Wang',
    author_email='max@covar.com',
    license='MIT',
    packages=['pack'],
    zip_safe=False,
    data_files=[('share/jupyter/nbextensions/pack', ['pack/static/bundle.js'])],
    install_requires=[
        "ipython",
        "jupyter-react",
        "ipywidgets"
    ]
)
