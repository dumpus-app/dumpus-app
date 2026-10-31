"""How the worker runs dumpus-processor (`tasks.process_with_go`): which exit
codes save the database, which fail the package, and what reaches the logs.

Everywhere else the suite runs the real binary; here a stand-in fails, hangs
or skips the report on purpose."""
import json
import re
import sys

import pytest

from support import blobs, env, golden
from support.shapes import errored_package, new_package, webhooks

STEPS_UNTIL_ANALYZING = ['LOCKED', 'DOWNLOADING', 'ANALYZING']


def stand_in(tmp_path, body):
    """An executable that runs `body` as Python, with the real binary's path in `REAL`."""
    path = tmp_path / 'stand-in' / 'dumpus-processor'
    path.parent.mkdir()
    path.write_text(f'#!{sys.executable}\nimport subprocess, sys, time\nREAL = {env.PROCESSOR!r}\n{body}\n')
    path.chmod(0o755)
    return path


def status_row(postgres):
    (row,) = postgres.rows('SELECT is_errored, error_message_code, error_message_traceback FROM package_process_status')
    return row


def test_worker_logs_the_run_but_never_the_link(submit, capfd):
    package = submit('full')

    out, err = capfd.readouterr()
    assert re.search(r'^dumpus-processor: \d+\.\d s, report: 0 issues, problems \[\]$', out, re.M)
    # The UPN in the link is the key of the blob.
    assert package.upn not in out + err


def test_database_without_its_report_is_saved(submit, postgres, stored, capfd, monkeypatch, tmp_path):
    # Exit 4: the database is written, the report isn't.
    monkeypatch.setenv('DUMPUS_PROCESSOR', str(stand_in(tmp_path, """
args = sys.argv[1:]
at = args.index('--report')
del args[at:at + 2]
code = subprocess.call([REAL, *args])
sys.exit(4 if code == 0 else code)""")))

    package = submit('full')

    assert postgres.steps(package.package_id) == [*STEPS_UNTIL_ANALYZING, 'PROCESSED']
    assert re.search(r'^dumpus-processor: \d+\.\d s, report: not written$', capfd.readouterr().out, re.M)
    expected = json.loads((golden.DIR / 'full.json').read_text())
    assert {'outcome': 'PROCESSED', **blobs.summarize(stored(package))} == expected


@pytest.mark.parametrize('code', [1, 2, 64])
def test_failed_run_errors_as_unknown_error_and_its_output_stays_out_of_the_logs(
        code, submit, postgres, upstream, capfd, monkeypatch, tmp_path):
    marker = 'what the processor printed, which can quote the package'
    monkeypatch.setenv('DUMPUS_PROCESSOR', str(stand_in(tmp_path, f"""
print({marker!r})
print({marker!r}, file=sys.stderr)
sys.exit({code})""")))

    package = submit('full')

    row = status_row(postgres)
    assert (row['is_errored'], row['error_message_code']) == (True, 'UNKNOWN_ERROR')
    assert f'Exception: dumpus-processor exited {code}' in row['error_message_traceback']
    assert postgres.steps(package.package_id) == STEPS_UNTIL_ANALYZING
    assert webhooks(upstream) == [new_package(package.package_id), errored_package(package.package_id, 'UNKNOWN_ERROR')]
    out, err = capfd.readouterr()
    assert marker not in out + err + row['error_message_traceback']


def test_missing_binary_errors_as_unknown_error(submit, postgres, monkeypatch, tmp_path):
    monkeypatch.setenv('DUMPUS_PROCESSOR', str(tmp_path / 'nowhere' / 'dumpus-processor'))

    package = submit('full')

    row = status_row(postgres)
    assert (row['is_errored'], row['error_message_code']) == (True, 'UNKNOWN_ERROR')
    assert 'FileNotFoundError' in row['error_message_traceback']
    assert postgres.steps(package.package_id) == STEPS_UNTIL_ANALYZING


def test_run_past_the_timeout_is_stopped_and_errors_as_unknown_error(api, submit, postgres, monkeypatch, tmp_path):
    assert api.tasks.PROCESSOR_TIMEOUT_SECONDS == 600
    monkeypatch.setattr(api.tasks, 'PROCESSOR_TIMEOUT_SECONDS', 1)
    monkeypatch.setenv('DUMPUS_PROCESSOR', str(stand_in(tmp_path, 'time.sleep(60)')))

    package = submit('full')

    row = status_row(postgres)
    assert (row['is_errored'], row['error_message_code']) == (True, 'UNKNOWN_ERROR')
    assert 'subprocess.TimeoutExpired' in row['error_message_traceback']
    assert postgres.steps(package.package_id) == STEPS_UNTIL_ANALYZING
