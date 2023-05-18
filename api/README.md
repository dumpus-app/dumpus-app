# Dumpus API

API to handle Discord GDPR links sent from the Dumpus app.

## Requirements

* RabbitMQ (docker `rabbitmq:3.10-management`)
* Redis (docker `redis:6.2.7`)

### Start Celery workers

* Start flower worker to monitor the celery ones.
--> `celery --app tasks flower --port=5566`

* Start celery worker for packages.
--> `celery --app tasks worker --loglevel INFO --queues default --hostname worker-default@%h`

We will only use a single task that will handle the downloading and the parsing, as they have to be executed on the same server.

## Encoding/Decoding of saved packages

**Package ID** is MD5 hash of the full Discord link (UPN).
**Package encrypted data** is encryption using the Discord link as the key (UPN).

You therefore need to have the full Discord link to decode the package (to match the package ID **and** to decrypt the package data).

## Data processing

The goal is to have the most data processed in advanced, so we avoid CPU consuming API calls.


## API Endpoints

**NOTE: THESE ROUTES ARE NOT FINAL AT ALL AND WILL CHANGE WITHIN THE NEXT 5-6 DAYS**

### Package

* `POST /api/process/<package_link>`: Starts the processing of the package and returns the package ID.
* `GET /api/process/<package_id>/status`: Returns the status of the processing package.

### General stats

* `GET /api/data/<package_id>/about`: Returns information about the package (owner, date, version, etc.).
* `GET /api/data/<package_id>/user/<user_id>` : Returns the data for the given user. (only works if the user is the owner of the package)
* `GET /api/data/<package_id>/overview` : Returns the overview of the data for the given package.
* `GET /api/data/<package_id>/stats/<period>`: Returns the stats of the data for the given package.
    * `period`: `l4w`, `l1m`, `ly`, `lifetime` (last 4 weeks, last month, last year, lifetime)

### Top

* `GET /api/data/<package_id>/top/<type>/<period>`: Returns the top data for the given package.
    * `type`: `dms`, `guilds`, `channels`
* `GET /api/data/<package_id>/guild/<guild_id>/stats/<period>`: Returns the stats of the data for the given guild.
* `GET /api/data/<package_id>/dm/<dm_id>/stats/<period>`: Returns the stats of the data for the given dm.
* `GET /api/data/<package_id>/channel/<channel_id>/stats/<period>`: Returns the stats of the data for the given channel.
