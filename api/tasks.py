from distutils.command.config import config
from celery import Celery, chain

# Download File
import requests

# Read JSON
import orjson

# Unzip
from zipfile import ZipFile
from io import TextIOWrapper

app = Celery(config_source='celeryconfig')

@app.task(bind=True)
def download_file(self, url, file_path):
    with requests.get(url, stream=True, timeout=(5.0, 30.0)) as r:
        r.raise_for_status()
        with open(file_path, 'wb') as f:
            total_length = int(r.headers.get('content-length'))
            dl = 0
            for chunk in r.iter_content(chunk_size=8192):
                dl += len(chunk)
                percent = round(dl / total_length) * 100
                if percent % 10 == 0:
                    self.update_state(state='PROGRESS', meta={'percent': percent})
                f.write(chunk)
    return file_path

@app.task()
def read_analytics_file(file_path):
    analytics_line_count = 0
    with ZipFile(file_path) as zip:
        for file_name in zip.namelist():
            if file_name == 'activity/analytics/events-2022-00000-of-00001.json':
                    for line in TextIOWrapper(zip.open(file_name)):
                        json = orjson.loads(line)
                        # count
                        analytics_line_count += 1
            else:
                continue
    return analytics_line_count

@app.task
def handle_package(url):
    ch = chain(download_file.si(url, 'test.zip').set(queue='default'), read_analytics_file.si('test.zip').set(queue='packages'))
    ch()

# todo
# verify that file exists before reading
# split tasks into smaller tasks