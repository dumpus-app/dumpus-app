import re


def test_worker_logs_the_run_but_never_the_link(submit, capfd):
    package = submit('full')

    out, err = capfd.readouterr()
    assert re.search(r'^dumpus-processor: \d+\.\d s, report: 0 issues, problems \[\]$', out, re.M)
    # The UPN in the link is the key of the blob.
    assert package.upn not in out + err
