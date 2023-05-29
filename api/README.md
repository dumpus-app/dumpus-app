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

* `POST /process`: Starts the processing of the package and returns the package ID with the decryption key.
    * body: JSON object containg a `package_link` property with the discord.click link. 
* `GET /process/<package_id>/status`: Returns the status of the processing package.
* `GET /process/<package_id>/data`: Returns the package data in SQLite format.
* `POST /delete/<package_id>`: Deletes the package from the database.

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
