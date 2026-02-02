import os
import binascii
from Crypto.Cipher import AES
from Crypto.Util.Padding import unpad, pad

# Must match web/lib/crypto.ts
ENCRYPTION_KEY = os.getenv('ENCRYPTION_KEY', '12345678901234567890123456789012')
KEY_BYTES = ENCRYPTION_KEY.encode('utf-8')

def decrypt_email(encrypted_text):
    if not encrypted_text or ':' not in encrypted_text:
        return encrypted_text
        
    try:
        parts = encrypted_text.split(':')
        iv = binascii.unhexlify(parts[0])
        ct = binascii.unhexlify(parts[1])
        
        cipher = AES.new(KEY_BYTES, AES.MODE_CBC, iv=iv)
        pt = unpad(cipher.decrypt(ct), AES.block_size)
        return pt.decode('utf-8')
    except Exception as e:
        print(f"Decryption error: {e}")
        return encrypted_text # Fallback to original

def encrypt_email(text):
    if not text:
        return text
    
    try:
        iv = os.urandom(16)
        cipher = AES.new(KEY_BYTES, AES.MODE_CBC, iv=iv)
        ct_bytes = cipher.encrypt(pad(text.encode('utf-8'), AES.block_size))
        
        iv_hex = binascii.hexlify(iv).decode('utf-8')
        ct_hex = binascii.hexlify(ct_bytes).decode('utf-8')
        return f"{iv_hex}:{ct_hex}"
    except Exception as e:
        print(f"Encryption error: {e}")
        return text
