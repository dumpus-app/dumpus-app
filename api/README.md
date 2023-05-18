# DDPE API V2

API to handle Discord GDPR links sent from the DDPE app.

## Requirements

* RabbitMQ (docker `rabbitmq:3.10-management`)
* Redis (docker `redis:6.2.7`)

### Start Celery workers

* Start flower worker to monitor the celery ones.
--> `celery --app tasks flower --port=5566`

* Start celery worker for packages.
--> `celery --app tasks worker --loglevel INFO --queues default --hostname worker-default@%h`

We will only use a single task that will handle the downloading and the parsing, as they have to be executed on the same server.

### Encoding/Decoding of saved packages

**Package ID** is MD5 hash of the full Discord link (UPN).
**Package encrypted data** is encryption using the Discord link as the key (UPN).

You therefore need to have the full Discord link to decode the package (to match the package ID **and** to decrypt the package data).

### Data processing

The goal is to have the most data processed in advanced, so we avoid CPU consuming API calls.
