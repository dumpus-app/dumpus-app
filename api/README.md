# DDPE API V2

API to handle Discord GDPR links sent from the DDPE app.

## Requirements

* RabbitMQ (docker `rabbitmq:3.10-management`)
* Redis (docker `redis:6.2.7`)

### Start Celery workers

* Start flower worker to monitor the celery ones.
--> `celery --app tasks flower --port=5566`

* Start celery worker for downloads.
--> `celery --app tasks worker --loglevel INFO --queues default --hostname worker-default@%h`

* Start celery worker for package analyses.
--> `celery --app tasks worker --loglevel INFO --queues packages --hostname worker-analysis@%h --concurrency 3`

### Encoding/Decoding of saved packages

**Package ID** is MD5 hash of the full Discord link (UPN).
**Package encrypted data** is encryption using the Discord link as the key (UPN).

You therefore need to have the full Discord link to decode the package (to match the package ID **and** to decrypt the package data).
