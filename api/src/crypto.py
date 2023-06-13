from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding
from cryptography.hazmat.backends import default_backend

import hashlib

import os

def encrypt_sqlite_data(sqlite_buffer, auth_upn):

    # Compute the SHA-256 hash of auth_upn, which gives a fixed-size key of 32 bytes
    fixed_size_upn = hashlib.sha256(auth_upn.encode()).digest()

    # Initialize an initialization vector for CBC mode encryption
    iv = os.urandom(16)

    # Prepare the encryptor
    cipher = Cipher(algorithms.AES(fixed_size_upn), modes.CBC(iv), backend=default_backend())
    encryptor = cipher.encryptor()

    # Add padding to make the size a multiple of 128 bits
    padder = padding.PKCS7(128).padder()
    padded_data = padder.update(sqlite_buffer) + padder.finalize()

    # Encrypt the data
    encrypted_data = encryptor.update(padded_data) + encryptor.finalize()

    return (encrypted_data, iv)

def decrypt_sqlite_data(encrypted_data, iv, auth_upn):

    fixed_size_upn = hashlib.sha256(auth_upn.encode()).digest()

    iv = bytes.fromhex(iv[1:])

    # Prepare the decryptor
    cipher = Cipher(algorithms.AES(fixed_size_upn), modes.CBC(iv), backend=default_backend())
    decryptor = cipher.decryptor()

    # Decrypt the data
    decrypted_data = decryptor.update(encrypted_data) + decryptor.finalize()

    # Remove the padding
    unpadder = padding.PKCS7(128).unpadder()
    unpadded_data = unpadder.update(decrypted_data) + unpadder.finalize()

    return unpadded_data
