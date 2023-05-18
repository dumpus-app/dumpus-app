import os

broker_url=os.getenv('REDIS_URL')
task_ignore_result=True
broker_use_ssl={
    'ssl_cert_reqs': None
}