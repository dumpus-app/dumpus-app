"""Golden files under `tests/golden/`: compared by default, rewritten with `UPDATE_GOLDEN=1`."""
import json
import os

from support.env import API_DIR

DIR = API_DIR / 'tests' / 'golden'
UPDATE = os.environ.get('UPDATE_GOLDEN') == '1'
# Where to write the full rows behind each golden, for eg. to diff two branches.
DUMP_DIR = os.environ.get('DUMPUS_GOLDEN_DUMP')


def dump_path(name):
    return os.path.join(DUMP_DIR, f'{name}.rows.json') if DUMP_DIR else None


def check(name, actual):
    path = DIR / f'{name}.json'
    text = json.dumps(actual, indent=2, sort_keys=True, ensure_ascii=False) + '\n'
    if UPDATE:
        path.write_text(text)
        return
    assert path.exists(), f'`tests/golden/{path.name}` is missing: run `UPDATE_GOLDEN=1 make test` to write it'
    assert json.loads(text) == json.loads(path.read_text()), f'output differs from `tests/golden/{path.name}`'
