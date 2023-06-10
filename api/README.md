# Dumpus API

API to extract statistics from the Discord Data Packages (GDPR packages). This API is completely open-source, self-hostable and documented.

## Architecture Documentation

Because a picture is worth a thousand words, you will find a diagram of the Dumpus architecture below.  

It has been adapted to meet the following constraints:
* users' Discord Data Package must be **entirely** encrypted on the server side.
* the encryption key must **always** remain on the client side, and must **never** be stored on the server side.
* Discord Data Package processing must be **fast** and **scalable**.

In short, Dumpus admins, or users providing their own Dumpus instance, must **never** have access to users' Discord Data Packages, even if the server is compromised.

A Discord Data Package download link consists of a **UPN KEY**. It is therefore possible to download the Discord Data Package from the UPN KEY.
```
https://click.discord.com/ls/click?upn={UPN_KEY}
```

Thus:
* a Discord Data Package identifier is created from a function that hashes the package's UPN KEY (called `package_id`).
* when a Discord Data Package is to be stored in a database, it is encrypted with its UPN KEY.
* when the client queries the server, it must always provide its UPN KEY to prove that it is the owner of the Discord Data Package, and to enable the server to return the decrypted data (if the client makes a data request).

![architecture](./architecture.png)

### Start a custom instance

Anyone can host their own Dumpus instance. The official Dumpus client can then be configured to use it.

To do this, two Dockerfiles are required:

* `Dockerfile.api`: contains the API shown in blue on the diagram above. Only one instance is required. It must be accessible from a URL that must be entered in the official Dumpus client.

* `Dockerfile.worker`: contains the code used to process Discord data packets. Multiple instances can be launched, but a single instance is sufficient for personal use.

You'll also need a PostgreSQL database and a Redis database. The two Docker containers above will need two environment variables to run:
```
POSTGRES_URL=postgresql://<user>:<password>@<host>:<port>/<database>
REDIS_URL=redis://<host>:<port>
```

The `Dockerfile.flower` is used to launch an instance of Flower, a web interface for monitoring workers. It is not necessary to launch this instance for personal use.

## API Documentation

One header is required for all the requests except the `POST /process` one:
```
Authorization: Bearer <UPN_KEY>
```

### Process a package

* `POST /process`

Request:
```js
{
    "package_link": "https://click.discord.com/ls/click?upn=<UPN_KEY>"
}
```

Response:
```js
{
    "isAccepted": true, // whether or not the package has been accepted for processing (if false, the error message will be in errorMessageCode)
    "packageId": "a1b2c3d4e5f6g7h8i9j0", // the package ID

    "errorMessageCode": null // if an error occurs, the error message code will show up here
}
```

Current error message codes:
* `INVALID_LINK`: the link provided is not a valid Discord Data Package link.

Note: if the package was already processed previously, the API will not return a specific response. You will see that the isDataAvailable will be true in the first status response.

### Fetch a package status

* `GET /process/<package_id>/status`

Response:
```js
{
    "isDataAvailable": false, // whether or not the data is available (meaning the processing is ended)

    "isUpgraded": false, // whether or not the user has paid for the "queue skip" feature
    "errorMessageCode": null, // if an error occurs, the error message code will show up here

    "isProcessing": true, // whether or not the package is still being processed
    "processingStep": "messages", // the current processing step
    "processingQueuePosition": {
        "user": 12, // will decrease until 0
        "total": 230, // will change
        "userWhenStarted": 20, // will not change
        "totalWhenStarted": 200 // will not change
    }
}
```

Current error message codes:
* `UNKNOWN_PACKAGE_ID`: for some reason, you are asking for the status of a package that does not exist in the database.
* `SERVER_ERROR`: an unknown error occurred on the server side. Please contact us on GitHub or Discord.
* `UNAUTHORIZED`: the UPN KEY provided in the Authorization header is not valid.
* `EXPIRED_LINK`: the link provided is a valid Discord Data Package link, but it has expired.

### Fetch a package data

* `GET /process/<package_id>/data`

Response: the Discord Data Package SQLite database (GZIP of the binary SQLite file), decrypted.

Status codes:
* `200`: the data is available and has been returned.
* `401`: the UPN KEY provided in the Authorization header is not valid.
* `404`: unknown package ID.

### Delete a package (and abort the processing)

* `DELETE /process/<package_id>`

Response:
```js
{
    "isDeleted": true, // whether or not the package has been deleted
    "errorMessageCode": null // if an error occurs, the error message code will show up here
}
```

Current error message codes:
* `UNKNOWN_PACKAGE_ID`: for some reason, you are asking for the status of a package that does not exist in the database.
* `UNAUTHORIZED`: the UPN KEY provided in the Authorization header is not valid.

### SQLite Database Documentation

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

* Server does not respond after `POST /process`. Try to remove this property from the celeryconfig.py file.
```
broker_use_ssl={
    'ssl_cert_reqs': None
}
```

* API server is crashing and say that Postgres is not supported.  
Make sure that your PostgreSQL server URL starts with **postgresql://** and not **postgres://**, which is no longer supported by SQLAlchemy.
