# Copyright (c) 2024, DigiComply and contributors
# License: MIT

"""
DigiComply API Module

This module provides API integrations for DigiComply:
- FTA API for TRN validation
"""

from digicomply.digicomply.api.fta_api import (
    validate_trn_with_fta,
    validate_trn_format,
    bulk_validate_trns,
    get_fta_settings
)

__all__ = [
    "validate_trn_with_fta",
    "validate_trn_format",
    "bulk_validate_trns",
    "get_fta_settings"
]
