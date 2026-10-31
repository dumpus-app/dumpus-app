"""The SQLite the worker makes from each synthetic package, pinned under `tests/golden/`.

Regenerate with `UPDATE_GOLDEN=1 make test` and review the diff. To see the
rows behind a changed hash, run with `DUMPUS_GOLDEN_DUMP=<dir>` on both sides
and diff the dumps.
"""
import pytest

from support import blobs, golden, packages


@pytest.mark.parametrize('name', sorted(packages.CATALOG))
def test_worker_output_matches_golden(name, submit, client, stored):
    package = submit(name)
    status = client.get(f'/process/{package.package_id}/status', headers=package.auth).get_json()

    if status['isDataAvailable']:
        actual = {'outcome': 'PROCESSED', **blobs.summarize(stored(package), dump_to=golden.dump_path(name))}
    else:
        actual = {'outcome': 'ERRORED', 'errorMessageCode': status['errorMessageCode']}
    golden.check(name, actual)
