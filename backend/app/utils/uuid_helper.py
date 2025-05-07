import os
import time
import uuid

# taken from https://github.com/0xShamil/uuidv7-python/blob/master/src/uuid7/generator.py
def uuid7() -> uuid.UUID:
    timestamp = int(time.time() * 1000).to_bytes(6, byteorder='big')
    rand_bytes = bytearray(os.urandom(10))

    rand_bytes[0] = (rand_bytes[0] & 0x0F) | 0x70  # Version 7
    rand_bytes[2] = (rand_bytes[2] & 0x3F) | 0x80  # Variant RFC 4122

    return uuid.UUID(bytes=timestamp + rand_bytes)

if __name__ == "__main__":
    print('uuid v7 b:',uuid7())
