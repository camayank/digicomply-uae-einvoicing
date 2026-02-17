# Copyright (c) 2024, DigiComply and contributors
# License: MIT

"""
DigiComply API Module

This module provides API integrations for DigiComply:
- FTA API for TRN validation
- ASP Connector Framework for e-invoicing integrations
"""

from digicomply.digicomply.api.fta_api import (
    validate_trn_with_fta,
    validate_trn_format,
    bulk_validate_trns,
    get_fta_settings
)

from digicomply.digicomply.api.connector_framework import (
    ConnectorFramework,
    run_sync,
    execute_sync_schedule,
    get_connection_status,
    get_dashboard_data
)

__all__ = [
    # FTA API
    "validate_trn_with_fta",
    "validate_trn_format",
    "bulk_validate_trns",
    "get_fta_settings",
    # Connector Framework
    "ConnectorFramework",
    "run_sync",
    "execute_sync_schedule",
    "get_connection_status",
    "get_dashboard_data"
]
