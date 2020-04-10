"""Initialize jupyter nb extension path."""
from .pyWrapper import PyWrapper


def _jupyter_nbextension_paths():
    return [{
        'section': 'notebook',
        'src': 'static',
        'dest': 'pack',
        'require': 'pack/bundle'
    }]
