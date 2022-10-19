from tasks import handle_package


# implement API

# then use
handle_package.apply_async(
    args=['click.discord link'],
    queue='default'
)
# to start processing a package
