"""密码哈希：PBKDF2-SHA256，无需额外依赖。"""
import hashlib
import hmac
import os

PREFIX = "pbkdf2_sha256"
ITERATIONS = 260000


def hash_password(password):
    salt = os.urandom(16).hex()
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), bytes.fromhex(salt), ITERATIONS
    ).hex()
    return f"{PREFIX}${ITERATIONS}${salt}${digest}"


def verify_password(password, stored):
    try:
        algo, iterations, salt, digest = stored.split("$")
        if algo != PREFIX:
            return False
        expected = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            bytes.fromhex(salt),
            int(iterations),
        ).hex()
        return hmac.compare_digest(expected, digest)
    except (ValueError, TypeError, AttributeError):
        return False
