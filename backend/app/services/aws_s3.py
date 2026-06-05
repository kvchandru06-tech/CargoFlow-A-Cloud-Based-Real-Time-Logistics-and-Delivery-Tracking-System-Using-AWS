import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from flask import current_app
import logging

logger = logging.getLogger(__name__)


def get_s3_client():
    return boto3.client(
        's3',
        aws_access_key_id=current_app.config['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=current_app.config['AWS_SECRET_ACCESS_KEY'],
        region_name=current_app.config['AWS_REGION'],
    )


def upload_file_to_s3(file_obj, filename, folder='uploads', content_type=None):
    """Upload a file to S3 and return the public URL."""
    s3 = get_s3_client()
    bucket = current_app.config['AWS_S3_BUCKET']
    key = f"{folder}/{filename}"

    extra_args = {'ACL': 'public-read'}
    if content_type:
        extra_args['ContentType'] = content_type

    try:
        s3.upload_fileobj(file_obj, bucket, key, ExtraArgs=extra_args)
        region = current_app.config['AWS_REGION']
        url = f"https://{bucket}.s3.{region}.amazonaws.com/{key}"
        logger.info(f"Uploaded {key} to S3")
        return url
    except NoCredentialsError:
        logger.warning("AWS credentials not configured — S3 upload skipped")
        raise
    except ClientError as e:
        logger.error(f"S3 upload error: {e}")
        raise


def delete_file_from_s3(file_url):
    """Delete a file from S3 given its URL."""
    try:
        s3 = get_s3_client()
        bucket = current_app.config['AWS_S3_BUCKET']
        # Extract key from URL
        key = file_url.split(f"{bucket}.s3")[1].lstrip('/')
        key = key.split('amazonaws.com/')[-1]
        s3.delete_object(Bucket=bucket, Key=key)
        logger.info(f"Deleted {key} from S3")
    except Exception as e:
        logger.error(f"S3 delete error: {e}")


def generate_presigned_url(key, expiration=3600):
    """Generate a presigned URL for private S3 objects."""
    try:
        s3 = get_s3_client()
        bucket = current_app.config['AWS_S3_BUCKET']
        url = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket, 'Key': key},
            ExpiresIn=expiration,
        )
        return url
    except Exception as e:
        logger.error(f"Presigned URL error: {e}")
        return None
