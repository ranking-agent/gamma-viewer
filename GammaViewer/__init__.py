"""Initialize jupyter nb extension path."""
from .gamma_viewer import GammaViewer


def _jupyter_nbextension_paths():
    return [{
        'section': 'notebook',
        'src': 'static',
        'dest': 'GammaViewer',
        'require': 'GammaViewer/extension'
    }]
