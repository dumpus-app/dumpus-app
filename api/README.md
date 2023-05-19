# Dumpus API

API to handle Discord GDPR links sent from the Dumpus app.

Table:
* [Requirements](#requirements)
* [Data encryption](#data-encryption)
* [API Endpoints](#api-endpoints)
    * [Package](#package)
    * [General stats](#general-stats)
    * [Top](#top)

## Requirements

* RabbitMQ (docker `rabbitmq:3.10-management`)
* Redis (docker `redis:6.2.7`)

### Start Celery workers

* Start flower worker to monitor the celery ones.
--> `celery --app tasks flower --port=5566`

* Start celery worker for packages.
--> `celery --app tasks worker --loglevel INFO --queues default --hostname worker-default@%h`

We will only use a single task that will handle the downloading and the parsing, as they have to be executed on the same server.

## Data encryption

Security is the key here. Dumpus splits the package data in two parts, sensitive (encrypted) and non-sensitive data.

**Package ID** is the MD5 hash of the full Discord link (UPN), used to identify the package in the database.  
**Package sensitive data** is encrypted on the server side using the Discord link as the key (UPN).

**Sensitive Data**:
* First 10 messages of each text channel (including content)

**Non-sensitive Data**:
* User information (username, discriminator, avatar, etc.)
* General statistics (guild count, top hours, etc.)
* Top guilds, channels and DMs (name, message count, etc.)

The Discord link is **NEVER** stored in the database. Therefore, you always need to specify the full Discord link when making a request to the API, as it is the only way to decrypt the sensitive data.

## API Endpoints

**NOTE: THESE ROUTES ARE NOT FINAL AT ALL AND WILL CHANGE WITHIN THE NEXT 5-6 DAYS**

Header required for each request: `Authorization`: `Bearer <upn>`

### Package

* `POST /api/process`: Starts the processing of the package and returns the package ID with the decryption key. (WITHOUT AUTHORIZATION HEADER)
    * body: JSON object containg a `package_link` property with the discord.click link. 
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
