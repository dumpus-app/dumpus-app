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

Why not encrypt the whole package? We need to perform many computations on the data (depending on the asked period of time, etc.) thanks to optimized SQL queries, and we can't do that if the data is encrypted. Therefore, we only encrypt the sensitive data, and we keep the non-sensitive data in plain text.

## API Endpoints

**NOTE: THESE ROUTES ARE NOT FINAL AT ALL AND WILL CHANGE WITHIN THE NEXT 5-6 DAYS**

Header required for each request: `Authorization`: `Bearer <upn>`

* `POST /api/process`: Starts the processing of the package and returns the package ID with the decryption key. (WITHOUT AUTHORIZATION HEADER)
    * body: JSON object containg a `package_link` property with the discord.click link. 
* `GET /api/process/<package_id>/status`: Returns the status of the processing package.
* `GET /api/process/<package_id>/database`: Returns the package data in SQLite format.

### Database

#### Statistics

Most "number" statistics are stored in a single table, `activity`.

For instance, this query will retrieve the number of messages sent in 2022:

```sql
SELECT SUM(count_this_day) FROM activity WHERE day > '2022' AND event_name = 'message_sent';
```

This is used in the overview and the statistics section (but also for some graphs).

#### Guilds, Channels, DMs

```sql
SELECT name, avatar_url FROM guilds
```

## Troubleshooting

* Server does not respond after `POST /api/process`. Try to remove this property from the celeryconfig.py file.
```
broker_use_ssl={
    'ssl_cert_reqs': None
}
```
