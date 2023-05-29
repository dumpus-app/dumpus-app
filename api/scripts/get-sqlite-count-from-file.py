import base64
import gzip
import json
from io import BytesIO
import sqlite3

# Open and load the json file
with open('res.txt', 'r') as f:
    db = json.load(f)

# Get the data property
data = db['data']
# Decode the base64 data
decoded_data = base64.b64decode(data)

# Unzip the data
buffer = BytesIO(decoded_data)
with gzip.GzipFile(fileobj=buffer) as f:
    unzipped_data = f.read()

# Convert the bytes to a string
unzipped_data_str = unzipped_data.decode('utf-8')

# Connect to an in-memory SQLite database
conn = sqlite3.connect(':memory:')

# Create a cursor object
c = conn.cursor()

# Execute the SQL commands
c.executescript(unzipped_data_str)

while True:
    # Accept a command from the user
    command = input("Enter a SQL command: ")

    # If the user enters "exit", break the loop
    if command.lower() == "exit":
        break

    # Execute the command and fetch the results
    c.execute(command)
    rows = c.fetchall()

    # Print the results
    for row in rows:
        print(row)