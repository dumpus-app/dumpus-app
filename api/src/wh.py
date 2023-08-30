import os
import requests

def send_internal_notification(payload):

    wh_url = os.getenv('WH_URL')

    if wh_url:
        requests.post(wh_url, json=payload)
