# Copyright (c) 2026, DigiComply and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import now_datetime
import os
import json


class ArchiveStorage(Document):
    """
    Archive Storage Configuration

    Features:
    - Multiple storage backends (Local, S3, Azure, GCS, SFTP)
    - Tiered storage management
    - Compression and encryption options
    - Connection testing
    """

    def validate(self):
        """Validate storage configuration"""
        self.validate_storage_config()
        if self.is_default:
            self.clear_other_defaults()

    def validate_storage_config(self):
        """Validate storage-specific configuration"""
        if self.storage_type == "Local":
            if not self.local_path:
                frappe.throw("Local path is required for Local storage type")

        elif self.storage_type == "S3 Compatible":
            if not all([self.s3_endpoint, self.s3_bucket, self.s3_access_key, self.s3_secret_key]):
                frappe.throw("S3 endpoint, bucket, access key, and secret key are required")

        elif self.storage_type == "Azure Blob":
            if not all([self.azure_connection_string, self.azure_container]):
                frappe.throw("Azure connection string and container are required")

        elif self.storage_type == "Google Cloud Storage":
            if not all([self.gcs_project, self.gcs_bucket]):
                frappe.throw("GCS project and bucket are required")

        elif self.storage_type == "SFTP":
            if not all([self.sftp_host, self.sftp_username]):
                frappe.throw("SFTP host and username are required")
            if not (self.sftp_password or self.sftp_key):
                frappe.throw("Either SFTP password or SSH key is required")

    def clear_other_defaults(self):
        """Ensure only one default storage"""
        frappe.db.set_value(
            "Archive Storage",
            {"is_default": 1, "name": ["!=", self.name]},
            "is_default",
            0
        )

    def test_connection(self):
        """Test connection to storage backend"""
        try:
            if self.storage_type == "Local":
                success = self._test_local()
            elif self.storage_type == "S3 Compatible":
                success = self._test_s3()
            elif self.storage_type == "Azure Blob":
                success = self._test_azure()
            elif self.storage_type == "Google Cloud Storage":
                success = self._test_gcs()
            elif self.storage_type == "SFTP":
                success = self._test_sftp()
            else:
                success = False

            self.connection_status = "Connected" if success else "Failed"
            self.last_connection_test = now_datetime()
            self.last_error = None if success else "Connection test failed"
            self.save(ignore_permissions=True)

            return success

        except Exception as e:
            self.connection_status = "Failed"
            self.last_connection_test = now_datetime()
            self.last_error = str(e)[:500]
            self.save(ignore_permissions=True)
            return False

    def _test_local(self):
        """Test local storage"""
        if not os.path.exists(self.local_path):
            os.makedirs(self.local_path, exist_ok=True)

        # Test write permission
        test_file = os.path.join(self.local_path, ".connection_test")
        with open(test_file, "w") as f:
            f.write("test")
        os.remove(test_file)

        return True

    def _test_s3(self):
        """Test S3 compatible storage"""
        try:
            import boto3
            from botocore.config import Config

            client = boto3.client(
                "s3",
                endpoint_url=self.s3_endpoint,
                aws_access_key_id=self.s3_access_key,
                aws_secret_access_key=self.get_password("s3_secret_key"),
                region_name=self.s3_region or "us-east-1",
                config=Config(signature_version="s3v4")
            )

            # Test by listing bucket
            client.head_bucket(Bucket=self.s3_bucket)
            return True

        except ImportError:
            frappe.throw("boto3 library is required for S3 storage. Install with: pip install boto3")
        except Exception as e:
            raise e

    def _test_azure(self):
        """Test Azure Blob storage"""
        try:
            from azure.storage.blob import BlobServiceClient

            blob_service = BlobServiceClient.from_connection_string(
                self.get_password("azure_connection_string")
            )

            # Test by getting container properties
            container_client = blob_service.get_container_client(self.azure_container)
            container_client.get_container_properties()
            return True

        except ImportError:
            frappe.throw("azure-storage-blob library is required. Install with: pip install azure-storage-blob")
        except Exception as e:
            raise e

    def _test_gcs(self):
        """Test Google Cloud Storage"""
        try:
            from google.cloud import storage
            from google.oauth2 import service_account

            credentials = service_account.Credentials.from_service_account_info(
                json.loads(self.gcs_credentials)
            )

            client = storage.Client(
                project=self.gcs_project,
                credentials=credentials
            )

            # Test by getting bucket
            bucket = client.get_bucket(self.gcs_bucket)
            return True

        except ImportError:
            frappe.throw("google-cloud-storage library is required. Install with: pip install google-cloud-storage")
        except Exception as e:
            raise e

    def _test_sftp(self):
        """Test SFTP storage"""
        try:
            import paramiko

            ssh = paramiko.SSHClient()
            ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

            connect_kwargs = {
                "hostname": self.sftp_host,
                "port": self.sftp_port or 22,
                "username": self.sftp_username
            }

            if self.sftp_password:
                connect_kwargs["password"] = self.get_password("sftp_password")
            elif self.sftp_key:
                import io
                key_file = io.StringIO(self.sftp_key)
                pkey = paramiko.RSAKey.from_private_key(key_file)
                connect_kwargs["pkey"] = pkey

            ssh.connect(**connect_kwargs)
            sftp = ssh.open_sftp()

            # Test by listing directory
            if self.sftp_path:
                sftp.listdir(self.sftp_path)
            else:
                sftp.listdir(".")

            sftp.close()
            ssh.close()
            return True

        except ImportError:
            frappe.throw("paramiko library is required for SFTP. Install with: pip install paramiko")
        except Exception as e:
            raise e

    def get_storage_client(self):
        """Get storage client based on type"""
        if self.storage_type == "Local":
            return LocalStorageClient(self)
        elif self.storage_type == "S3 Compatible":
            return S3StorageClient(self)
        elif self.storage_type == "Azure Blob":
            return AzureStorageClient(self)
        elif self.storage_type == "Google Cloud Storage":
            return GCSStorageClient(self)
        elif self.storage_type == "SFTP":
            return SFTPStorageClient(self)
        else:
            frappe.throw(f"Unsupported storage type: {self.storage_type}")

    def update_stats(self):
        """Update storage statistics"""
        stats = frappe.db.sql("""
            SELECT
                COUNT(*) as document_count,
                COALESCE(SUM(file_size_bytes), 0) / 1073741824 as size_gb,
                MAX(archive_date) as last_archive
            FROM `tabDocument Archive`
            WHERE storage_location = %s
        """, self.name, as_dict=True)[0]

        self.document_count = stats.document_count
        self.current_size_gb = round(stats.size_gb or 0, 2)
        self.last_archive_date = stats.last_archive
        self.save(ignore_permissions=True)

    @staticmethod
    def get_default_storage():
        """Get the default storage location"""
        default = frappe.db.get_value(
            "Archive Storage",
            {"is_default": 1, "enabled": 1},
            "name"
        )

        if not default:
            # Try any enabled storage
            default = frappe.db.get_value(
                "Archive Storage",
                {"enabled": 1},
                "name"
            )

        return default


class LocalStorageClient:
    """Local file system storage client"""

    def __init__(self, config):
        self.config = config
        self.base_path = config.local_path

    def store(self, content, path):
        full_path = os.path.join(self.base_path, path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)

        with open(full_path, "wb") as f:
            f.write(content)

        return full_path

    def retrieve(self, path):
        full_path = os.path.join(self.base_path, path)
        with open(full_path, "rb") as f:
            return f.read()

    def delete(self, path):
        full_path = os.path.join(self.base_path, path)
        if os.path.exists(full_path):
            os.remove(full_path)


class S3StorageClient:
    """S3 compatible storage client"""

    def __init__(self, config):
        self.config = config
        self._init_client()

    def _init_client(self):
        import boto3
        from botocore.config import Config

        self.client = boto3.client(
            "s3",
            endpoint_url=self.config.s3_endpoint,
            aws_access_key_id=self.config.s3_access_key,
            aws_secret_access_key=self.config.get_password("s3_secret_key"),
            region_name=self.config.s3_region or "us-east-1",
            config=Config(signature_version="s3v4")
        )
        self.bucket = self.config.s3_bucket

    def store(self, content, path):
        key = f"{self.config.s3_prefix or ''}{path}".lstrip("/")
        self.client.put_object(Bucket=self.bucket, Key=key, Body=content)
        return f"s3://{self.bucket}/{key}"

    def retrieve(self, path):
        key = f"{self.config.s3_prefix or ''}{path}".lstrip("/")
        response = self.client.get_object(Bucket=self.bucket, Key=key)
        return response["Body"].read()

    def delete(self, path):
        key = f"{self.config.s3_prefix or ''}{path}".lstrip("/")
        self.client.delete_object(Bucket=self.bucket, Key=key)


class AzureStorageClient:
    """Azure Blob storage client"""

    def __init__(self, config):
        self.config = config
        self._init_client()

    def _init_client(self):
        from azure.storage.blob import BlobServiceClient

        self.blob_service = BlobServiceClient.from_connection_string(
            self.config.get_password("azure_connection_string")
        )
        self.container = self.config.azure_container

    def store(self, content, path):
        key = f"{self.config.azure_prefix or ''}{path}".lstrip("/")
        blob_client = self.blob_service.get_blob_client(self.container, key)
        blob_client.upload_blob(content, overwrite=True)
        return f"azure://{self.container}/{key}"

    def retrieve(self, path):
        key = f"{self.config.azure_prefix or ''}{path}".lstrip("/")
        blob_client = self.blob_service.get_blob_client(self.container, key)
        return blob_client.download_blob().readall()

    def delete(self, path):
        key = f"{self.config.azure_prefix or ''}{path}".lstrip("/")
        blob_client = self.blob_service.get_blob_client(self.container, key)
        blob_client.delete_blob()


class GCSStorageClient:
    """Google Cloud Storage client"""

    def __init__(self, config):
        self.config = config
        self._init_client()

    def _init_client(self):
        from google.cloud import storage
        from google.oauth2 import service_account

        credentials = service_account.Credentials.from_service_account_info(
            json.loads(self.config.gcs_credentials)
        )

        self.client = storage.Client(
            project=self.config.gcs_project,
            credentials=credentials
        )
        self.bucket = self.client.get_bucket(self.config.gcs_bucket)

    def store(self, content, path):
        blob = self.bucket.blob(path)
        blob.upload_from_string(content)
        return f"gs://{self.config.gcs_bucket}/{path}"

    def retrieve(self, path):
        blob = self.bucket.blob(path)
        return blob.download_as_bytes()

    def delete(self, path):
        blob = self.bucket.blob(path)
        blob.delete()


class SFTPStorageClient:
    """SFTP storage client"""

    def __init__(self, config):
        self.config = config

    def _get_connection(self):
        import paramiko

        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

        connect_kwargs = {
            "hostname": self.config.sftp_host,
            "port": self.config.sftp_port or 22,
            "username": self.config.sftp_username
        }

        if self.config.sftp_password:
            connect_kwargs["password"] = self.config.get_password("sftp_password")
        elif self.config.sftp_key:
            import io
            key_file = io.StringIO(self.config.sftp_key)
            pkey = paramiko.RSAKey.from_private_key(key_file)
            connect_kwargs["pkey"] = pkey

        ssh.connect(**connect_kwargs)
        return ssh, ssh.open_sftp()

    def store(self, content, path):
        ssh, sftp = self._get_connection()
        full_path = f"{self.config.sftp_path or '.'}/{path}"

        # Create directory if needed
        dir_path = os.path.dirname(full_path)
        try:
            sftp.stat(dir_path)
        except FileNotFoundError:
            sftp.mkdir(dir_path)

        with sftp.file(full_path, "wb") as f:
            f.write(content)

        sftp.close()
        ssh.close()
        return full_path

    def retrieve(self, path):
        ssh, sftp = self._get_connection()
        full_path = f"{self.config.sftp_path or '.'}/{path}"

        with sftp.file(full_path, "rb") as f:
            content = f.read()

        sftp.close()
        ssh.close()
        return content

    def delete(self, path):
        ssh, sftp = self._get_connection()
        full_path = f"{self.config.sftp_path or '.'}/{path}"
        sftp.remove(full_path)
        sftp.close()
        ssh.close()


@frappe.whitelist()
def test_storage_connection(storage_name):
    """Test connection to a storage location"""
    storage = frappe.get_doc("Archive Storage", storage_name)
    success = storage.test_connection()

    return {
        "success": success,
        "status": storage.connection_status,
        "error": storage.last_error
    }


@frappe.whitelist()
def get_storage_stats(storage_name):
    """Get storage statistics"""
    storage = frappe.get_doc("Archive Storage", storage_name)
    storage.update_stats()

    return {
        "document_count": storage.document_count,
        "current_size_gb": storage.current_size_gb,
        "max_size_gb": storage.max_size_gb,
        "last_archive_date": storage.last_archive_date,
        "usage_percent": round((storage.current_size_gb / storage.max_size_gb) * 100, 1) if storage.max_size_gb else 0
    }
