import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from flask import current_app
import logging

logger = logging.getLogger(__name__)


def get_sns_client():
    return boto3.client(
        'sns',
        aws_access_key_id=current_app.config['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=current_app.config['AWS_SECRET_ACCESS_KEY'],
        region_name=current_app.config['AWS_REGION'],
    )


def send_notification(subject, message, email=None, phone=None):
    """
    Send notification via AWS SNS.
    Falls back gracefully if AWS is not configured.
    """
    topic_arn = current_app.config.get('AWS_SNS_TOPIC_ARN', '')

    if not topic_arn:
        logger.info(f"[SNS Mock] Subject: {subject} | Message: {message}")
        return True

    try:
        sns = get_sns_client()

        # Publish to topic (subscribers get notified)
        sns.publish(
            TopicArn=topic_arn,
            Subject=subject,
            Message=message,
        )
        logger.info(f"SNS notification sent: {subject}")

        # Direct SMS if phone provided
        if phone:
            try:
                sns.publish(
                    PhoneNumber=phone,
                    Message=f"CargoFlow: {message}",
                )
            except Exception as e:
                logger.warning(f"SMS send failed: {e}")

        return True

    except NoCredentialsError:
        logger.warning("AWS credentials not configured — SNS notification skipped")
        return False
    except ClientError as e:
        logger.error(f"SNS error: {e}")
        return False
    except Exception as e:
        logger.error(f"Notification error: {e}")
        return False


def subscribe_email(email):
    """Subscribe an email to the SNS topic."""
    topic_arn = current_app.config.get('AWS_SNS_TOPIC_ARN', '')
    if not topic_arn:
        return False

    try:
        sns = get_sns_client()
        sns.subscribe(
            TopicArn=topic_arn,
            Protocol='email',
            Endpoint=email,
        )
        return True
    except Exception as e:
        logger.error(f"SNS subscribe error: {e}")
        return False
