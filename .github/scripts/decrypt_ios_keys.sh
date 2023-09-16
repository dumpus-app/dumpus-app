#!/bin/sh

# --batch to prevent interactive command
# --yes to assume "yes" for questions
gpg --quiet --batch --yes --decrypt --passphrase="$APP_KEYS_SECRET_PASSPHRASE" \
--output ios/App/AuthKey.p8 ios/App/AuthKey.p8.gpg
