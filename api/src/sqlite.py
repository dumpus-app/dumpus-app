import sqlite3
import tempfile
import gzip

import random
import datetime

def export_sqlite_to_bin(cur, conn):
    # make database smaller
    cur.execute('VACUUM;')

    conn.commit()

    # creating a temporary file is the only way to get a file-like object from sqlite3 (the format the client expects)
    with tempfile.NamedTemporaryFile() as tempf:
        with sqlite3.connect('file:' + tempf.name + '?mode=rwc', uri=True) as disk_db:
            conn.backup(disk_db)

        tempf.seek(0)
        sqlite_buffer = tempf.read()

        zipped_buffer = gzip.compress(sqlite_buffer)

        conn.close()

        return (zipped_buffer)
    

def create_new_empty_database():
    conn = sqlite3.connect(':memory:')
    cur = conn.cursor()

    cur.execute('''
        CREATE TABLE activity (
            event_name TEXT NOT NULL,
            day TEXT NOT NULL,
            hour INTEGER,
            occurence_count INTEGER NOT NULL,
            associated_dm_user_id TEXT,
            associated_channel_id TEXT,
            associated_guild_id TEXT,
            PRIMARY KEY (event_name, day, hour, associated_channel_id, associated_guild_id)
        )
    ''')

    cur.execute('''
        CREATE TABLE dm_channels_data (
            channel_id TEXT NOT NULL,
            dm_user_id TEXT NOT NULL,
            user_name TEXT NOT NULL,
            display_name TEXT,
            user_avatar_url TEXT,
            total_message_count INTEGER NOT NULL,
            total_voice_channel_duration INTEGER NOT NULL,
            sentiment_score REAL NOT NULL,
            PRIMARY KEY (channel_id)
        )
    ''')

    cur.execute('''
        CREATE TABLE guild_channels_data (
            channel_id TEXT NOT NULL,
            channel_name TEXT NOT NULL,
            guild_id TEXT NOT NULL,
            total_message_count INTEGER NOT NULL,
            total_voice_channel_duration INTEGER NOT NULL,
            PRIMARY KEY (channel_id)
        )
    ''')

    cur.execute('''
        CREATE TABLE guilds (
            guild_id TEXT NOT NULL,
            guild_name TEXT NOT NULL,
            total_message_count INTEGER NOT NULL,
            PRIMARY KEY (guild_id)
        )
    ''')

    cur.execute('''
        CREATE TABLE payments (
            payment_id TEXT NOT NULL,
            payment_date TEXT NOT NULL,
            payment_amount INTEGER NOT NULL,
            payment_currency TEXT NOT NULL,
            payment_description TEXT NOT NULL,
            PRIMARY KEY (payment_id)
        )
    ''')

    cur.execute('''
        CREATE TABLE voice_sessions (
            channel_id TEXT NOT NULL,
            guild_id TEXT,
            duration_mins INTEGER NOT NULL,
            started_date TEXT NOT NULL,
            ended_date TEXT NOT NULL,
            PRIMARY KEY (channel_id, started_date)
        )
    ''')

    cur.execute('''
        CREATE TABLE package_data (
            package_id TEXT NOT NULL,
            package_version TEXT NOT NULL,
            
            package_owner_name TEXT NOT NULL,
            package_owner_display_name TEXT,
            package_owner_avatar_url TEXT
        )
    ''')

    return (conn, cur)

def generate_demo_database():

    (conn, cur) = create_new_empty_database()

    activity_query = '''
        INSERT INTO activity
        (event_name, day, hour, occurence_count, associated_channel_id, associated_guild_id)
        VALUES (?, ?, ?, ?, ?, ?);
    '''

    dm_user_query = '''
        INSERT INTO dm_channels_data
        (channel_id, dm_user_id, user_name, display_name, user_avatar_url, total_message_count, total_voice_channel_duration, sentiment_score)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    '''

    guild_channel_query = '''
        INSERT INTO guild_channels_data
        (channel_id, guild_id, channel_name, total_message_count, total_voice_channel_duration)
        VALUES (?, ?, ?, ?, ?);
    '''

    guild_query = '''
        INSERT INTO guilds
        (guild_id, guild_name, total_message_count)
        VALUES (?, ?, ?);
    '''

    payment_query = '''
        INSERT INTO payments
        (payment_id, payment_date, payment_amount, payment_currency, payment_description)
        VALUES (?, ?, ?, ?, ?);
    '''

    voice_session_query = '''
        INSERT INTO voice_sessions
        (channel_id, guild_id, duration_mins, started_date, ended_date)
        VALUES (?, ?, ?, ?, ?);
    '''

    colors = ["Red", "Blue", "Green", "Yellow", "Purple", "Pink", "Black", "White", "Gold", "Silver"]
    animals = ["Lion", "Tiger", "Bear", "Wolf", "Eagle", "Hawk", "Fox", "Cat", "Dog", "Snake"]

    def generate_username():
        color = random.choice(colors)
        animal = random.choice(animals)
        random_num = random.randint(0, 1000)
        return f"{color}{animal}{random_num}"
    
    def generate_random_18_digit_id():
        id = ""
        for i in range(0, 18):
            id += str(random.randint(0, 9))
        return id

    dm_user_data = []

    for i in range(0, 100):
        username = generate_username()
        lowercase_username = username.lower()
        channel_id = generate_random_18_digit_id()
        user_id = generate_random_18_digit_id()
        tag = str(random.randint(0, 5))
        score = random.uniform(0, 1)
        total_msg_count = random.randint(0, 1000)
        total_voice_channel_duration = random.randint(0, 10)
        data = (channel_id, user_id, lowercase_username, username, f'https://cdn.discordapp.com/embed/avatars/{tag}.png', total_msg_count, total_voice_channel_duration, score)
        dm_user_data.append(data)
        cur.execute(dm_user_query, data)

    guild_data = []

    for i in range(0, 100):
        guild_id = generate_random_18_digit_id()
        guild_name = f"{generate_username()}'s server"
        total_msg_count = random.randint(0, 1000)
        data = (guild_id, guild_name, total_msg_count)
        guild_data.append(data)
        cur.execute(guild_query, data)

    guild_channel_data = []

    for i in range(0, 100):
        channel_id = generate_random_18_digit_id()
        guild_id = random.choice(guild_data)[0]
        channel_name = f"#{generate_username()}"
        total_msg_count = random.randint(0, 1000)
        total_voice_channel_duration = random.randint(0, 10)
        data = (channel_id, guild_id, channel_name, total_msg_count, total_voice_channel_duration)
        guild_channel_data.append(data)
        cur.execute(guild_channel_query, data)

    for i in range(0, 1000):
        event_name = random.choice(["message_sent", "guild_joined"])
        if event_name == "message_sent":
            is_dm = random.choice([True, False])
            if is_dm:
                user = random.choice(dm_user_data)
                associated_channel_id = user[0]
            else:
                guild_channel = random.choice(guild_channel_data)
                associated_channel_id = guild_channel[0]
                associated_guild_id = guild_channel[1]
        else:
            associated_channel_id = None
            associated_guild_id = generate_random_18_digit_id()
        # random day between 2021 and now
        day = datetime.date(random.randint(2021, datetime.datetime.now().year), random.randint(1, 12), random.randint(1, 28))
        hour = random.randint(0, 23)
        occurence_count = random.randint(0, 100)
        data = (event_name, day, hour, occurence_count, associated_channel_id, associated_guild_id)
        cur.execute(activity_query, data)

    cur.execute('''
        INSERT INTO package_data
        (package_id, package_version, package_owner_name, package_owner_display_name, package_owner_avatar_url)
        VALUES (?, ?, ?, ?, ?);
    ''', ('demo', '0.1.0', 'wumpus', 'Wumpus', 'https://cdn.discordapp.com/embed/avatars/0.png'))

    conn.commit()

    binary_data = export_sqlite_to_bin(cur, conn)

    return binary_data
