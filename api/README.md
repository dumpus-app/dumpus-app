# Dumpus API

API to extract statistics from the Discord Data Packages (GDPR packages). This API is completely open-source, self-hostable and documented.

## Table of Contents

* [Architecture Documentation](#architecture-documentation)
* [Self-hosting](#self-hosting)
* [Deploy to AWS](#deploy-to-aws)
* [API Documentation](#api-documentation)
* [Troubleshooting](#troubleshooting)

## Architecture Documentation

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

## Self-hosting

Anyone can host their own Dumpus instance. The official Dumpus client can then be configured to use it.

The worker no longer runs as a separate Celery process — set `QUEUE_BACKEND=sync` and the API processes packages inline on the request thread (good enough at small volume), or set `QUEUE_BACKEND=sqs` to dispatch to AWS SQS (used by the Lambda deployment).

* clone <https://github.com/dumpus-app/dumpus-api>
* easy way: `cp .env.example .env`, fill it in, then `make up`
* manual:
    - install requirements with pip
    - start a PostgreSQL server
    - fill the .env file with your PostgreSQL creds
    - start the API: `QUEUE_BACKEND=sync waitress-serve --port=5000 app:app`

By default, Dumpus API will only treat zip files sent from `https://discord.click`. You can specify a `DL_ZIP_WHITELISTED_DOMAINS` environment variable to add other allowed domains.

## Deploy to AWS

A Terraform stack under `infra/terraform/` provisions a serverless deployment of the API on AWS:

| Component        | AWS service              |
| ---------------- | ------------------------ |
| API              | Lambda (container image) behind API Gateway HTTP API |
| Worker           | Lambda triggered by SQS                              |
| Database         | RDS Postgres in private subnets                      |
| Outbound NAT     | fck-nat instance (NAT Gateway replacement)           |
| Secrets          | Secrets Manager + Lambda env                         |
| TLS / DNS        | ACM cert + Route53 alias to API Gateway              |
| CI               | GitHub OIDC role; build → ECR → `update-function-code` |

### Bootstrap

1. Create a public Route53 hosted zone for your domain and point your registrar's nameservers at it.
2. `cp infra/terraform/terraform.tfvars.example infra/terraform/terraform.tfvars` and fill in `discord_secret`, `domain_name`, `github_repository`, region, etc.
3. `cd infra/terraform && terraform init && terraform apply`.
   This single apply does everything: a `null_resource` pushes a placeholder image (the public AWS Lambda Python base) into ECR with the `:bootstrap` tag, then the Lambda functions are created against that placeholder. Requires `docker` and `aws` CLI on the apply host.
4. Set the GitHub repo secret `AWS_DEPLOY_ROLE_ARN` from `terraform output -raw github_deploy_role_arn`. From here on, every push to `main` builds the real image in CI and rolls both Lambdas — no more local builds needed.

### Day-to-day deploys

Push to `main` → `.github/workflows/deploy.yml` builds the container, pushes to ECR tagged with the git SHA, and rolls both Lambdas via OIDC. No long-lived AWS keys in GitHub.

### Operations

```bash
aws logs tail /aws/lambda/<name-prefix>-<env>-api --follow
aws logs tail /aws/lambda/<name-prefix>-<env>-worker --follow
aws sqs receive-message --queue-url "$(terraform output -raw sqs_dlq_url)"
```

Things to keep in mind:

- **API cold start** is a few seconds while pandas imports. Invisible on the async submit/poll flow; use provisioned concurrency if a sync endpoint must be sub-second.
- **Worker `/tmp` cap** defaults to 5GB (max 10GB). Bump `worker_ephemeral_storage_mb` if users upload very large Discord exports.
- **Worker timeout** is 15 min (Lambda hard cap). Failures land in the DLQ after one retry.
- **fck-nat is a single instance.** Switch to a managed NAT Gateway if you need the extra availability — at the cost of a much higher fixed monthly bill.

## API Documentation

One header is required for all the requests except the `POST /process` one:
```
Authorization: Bearer <UPN_KEY>
```

### Process a package

* `POST /process`

Request body:
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

    "isErrored": false, // whether or not an error occurred during the processing
    "errorMessageCode": null, // if an error occurs, the error message code will show up here

    "isProcessing": true, // whether or not the package is still being processed
    "processingStep": "messages", // the current processing step
    "processingQueuePosition": {
        "premiumQueueTotal": 20, // the number of premium packages in the queue
        "standardQueueTotal": 300, // the number of standard packages in the queue
        "premiumQueueUser": null, // the number of premium packages in the queue before the user's package
        "standardQueueUser": 63, // the number of standard packages in the queue before the user's package
        "standardWhenJoined": 150, // the number of standard packages in the queue when the user's package joined the queue
        "premiumWhenJoined": 10 // the number of premium packages in the queue when the user's package joined the queue
    }
}
```

Current error message codes:
* `UNKNOWN_PACKAGE_ID`: for some reason, you are asking for the status of a package that does not exist in the database.
* `UNKNOWN_ERROR`: an unknown error occurred on the server side. Please contact us on GitHub or Discord.
* `UNAUTHORIZED`: the UPN KEY provided in the Authorization header is not valid.
* `EXPIRED_LINK`: the link provided is a valid Discord Data Package link, but it has expired.

Available steps:
* `LOCKED`: the package is locked, meaning it is waiting for a worker to process it. It can still be aborted by calling the DELETE endpoint.
* `DOWNLOADING`: the package is being downloaded from Discord's servers.
* `ANALYZING`: the package is being analyzed to determine the number of messages, channels, etc.
* `PROCESSED`: the package has been processed and the data is available.

### Fetch a package data

* `GET /process/<package_id>/data`

Response: the Discord Data Package SQLite database (GZIP of the binary SQLite file), decrypted.

Status codes:
* `200`: the data is available and has been returned.
* `401`: the UPN KEY provided in the Authorization header is not valid.
* `404`: unknown package ID.

### Fetch a package user

* `GET /process/<package_id>/user/<user_id>`

Response:
```json
{
    "avatar_url": "https://cdn.discordapp.com/avatars/422820341791064085/af0c1960a90d98e69bce68d206b56c9a.png",
    "display_name": "Androz",
    "user_id": "422820341791064085"
}
```

Status codes:
* `200`: the data is available and has been returned.
* `401`: the UPN KEY provided in the Authorization header is not valid, or the package does not exist.
* `404`: unknown user ID.
* `500`: an error occurred while fetching the data (can often happen).
* `429`: you are being rate limited. Wait 500ms and send the request again.

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

### [SQLite Database Documentation can be found here](./docs/sqlite_database_structure.md)

## Troubleshooting

* API server is crashing and says that Postgres is not supported.
Make sure that your PostgreSQL server URL starts with **postgresql://** and not **postgres://**, which is no longer supported by SQLAlchemy.
