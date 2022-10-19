# DDPE API V2

API to handle Discord GDPR links sent from the DDPE app.

## Requirements

* RabbitMQ (docker `rabbitmq:3.10-management`)
* Redis (docker `redis:6.2.7`)

### Start Celery workers

* Start flower worker to monitor the celery ones.
--> `celery -app tasks flower --port=5566`

* Start celery worker for downloads.
--> `celery -app tasks worker --loglevel INFO --queues default --hostname worker-default@%h`

* Start celery worker for package analyses.
--> `celery -app tasks worker --loglevel INFO --queues default --hostname worker-default@%h --concurrency 3`
