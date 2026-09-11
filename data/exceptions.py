"""
Custom exceptions for the IMD data layer.

These exceptions allow the backend to handle IMD-specific failures
gracefully without exposing raw HTTP or parsing errors.
"""


class IMDError(Exception):
    """Base exception for all IMD data layer errors."""
    pass


class IMDConnectionError(IMDError):
    """Raised when the IMD server cannot be reached (network/DNS/timeout)."""
    pass


class IMDHTTPError(IMDError):
    """Raised when IMD returns a non-2xx HTTP status code."""

    def __init__(self, status_code: int, message: str = ""):
        self.status_code = status_code
        super().__init__(f"IMD returned HTTP {status_code}: {message}")


class IMDParseError(IMDError):
    """Raised when IMD returns a response that cannot be parsed as JSON."""
    pass


class IMDDataError(IMDError):
    """Raised when IMD returns valid JSON but with unexpected/missing fields."""
    pass
