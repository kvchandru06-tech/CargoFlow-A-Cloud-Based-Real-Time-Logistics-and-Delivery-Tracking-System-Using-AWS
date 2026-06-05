from app import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import uuid


def generate_uuid():
    return str(uuid.uuid4())


def generate_tracking_number():
    import random, string
    prefix = "CGF"
    suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=9))
    return f"{prefix}{suffix}"


# ─── Users ────────────────────────────────────────────────────────────────────

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    phone = db.Column(db.String(20))
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='customer')  # admin | customer | agent
    is_active = db.Column(db.Boolean, default=True)
    avatar_url = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    shipments_as_sender = db.relationship('Shipment', foreign_keys='Shipment.sender_id', backref='sender', lazy='dynamic')
    shipments_as_recipient = db.relationship('Shipment', foreign_keys='Shipment.recipient_id', backref='recipient', lazy='dynamic')
    notifications = db.relationship('Notification', backref='user', lazy='dynamic')
    agent_profile = db.relationship('DeliveryAgent', backref='user', uselist=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'phone': self.phone,
            'role': self.role,
            'is_active': self.is_active,
            'avatar_url': self.avatar_url,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


# ─── Delivery Agents ──────────────────────────────────────────────────────────

class DeliveryAgent(db.Model):
    __tablename__ = 'delivery_agents'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    vehicle_type = db.Column(db.String(50))  # bike | van | truck
    vehicle_number = db.Column(db.String(30))
    license_number = db.Column(db.String(50))
    current_location = db.Column(db.String(200))
    is_available = db.Column(db.Boolean, default=True)
    rating = db.Column(db.Float, default=5.0)
    total_deliveries = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    assigned_shipments = db.relationship('Shipment', backref='agent', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user': self.user.to_dict() if self.user else None,
            'vehicle_type': self.vehicle_type,
            'vehicle_number': self.vehicle_number,
            'license_number': self.license_number,
            'current_location': self.current_location,
            'is_available': self.is_available,
            'rating': self.rating,
            'total_deliveries': self.total_deliveries,
        }


# ─── Shipments ────────────────────────────────────────────────────────────────

class Shipment(db.Model):
    __tablename__ = 'shipments'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    tracking_number = db.Column(db.String(20), unique=True, nullable=False, default=generate_tracking_number)

    # Parties
    sender_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    recipient_id = db.Column(db.String(36), db.ForeignKey('users.id'))
    agent_id = db.Column(db.String(36), db.ForeignKey('delivery_agents.id'))

    # Recipient info (for non-registered recipients)
    recipient_name = db.Column(db.String(120))
    recipient_email = db.Column(db.String(120))
    recipient_phone = db.Column(db.String(20))

    # Addresses
    pickup_address = db.Column(db.String(300), nullable=False)
    pickup_city = db.Column(db.String(100))
    pickup_state = db.Column(db.String(100))
    pickup_zip = db.Column(db.String(20))
    pickup_country = db.Column(db.String(100), default='USA')

    delivery_address = db.Column(db.String(300), nullable=False)
    delivery_city = db.Column(db.String(100))
    delivery_state = db.Column(db.String(100))
    delivery_zip = db.Column(db.String(20))
    delivery_country = db.Column(db.String(100), default='USA')

    # Package details
    package_type = db.Column(db.String(50))  # document | parcel | freight
    weight = db.Column(db.Float)  # kg
    dimensions = db.Column(db.String(100))  # LxWxH cm
    description = db.Column(db.Text)
    declared_value = db.Column(db.Float, default=0.0)

    # Pricing
    shipping_cost = db.Column(db.Float, default=0.0)
    insurance_cost = db.Column(db.Float, default=0.0)
    total_cost = db.Column(db.Float, default=0.0)
    payment_status = db.Column(db.String(20), default='pending')  # pending | paid | refunded

    # Status
    status = db.Column(db.String(30), default='pending')
    # pending | confirmed | picked_up | in_transit | out_for_delivery | delivered | failed | cancelled

    priority = db.Column(db.String(20), default='standard')  # standard | express | overnight

    # Scheduling
    scheduled_pickup = db.Column(db.DateTime)
    estimated_delivery = db.Column(db.DateTime)
    actual_delivery = db.Column(db.DateTime)

    # Files
    invoice_url = db.Column(db.String(500))
    proof_of_delivery_url = db.Column(db.String(500))

    # Notes
    special_instructions = db.Column(db.Text)
    delivery_notes = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    tracking_history = db.relationship('TrackingHistory', backref='shipment', lazy='dynamic', order_by='TrackingHistory.timestamp')
    notifications = db.relationship('Notification', backref='shipment', lazy='dynamic')

    def to_dict(self, include_history=False):
        data = {
            'id': self.id,
            'tracking_number': self.tracking_number,
            'sender_id': self.sender_id,
            'sender': self.sender.to_dict() if self.sender else None,
            'agent_id': self.agent_id,
            'recipient_name': self.recipient_name,
            'recipient_email': self.recipient_email,
            'recipient_phone': self.recipient_phone,
            'pickup_address': self.pickup_address,
            'pickup_city': self.pickup_city,
            'pickup_state': self.pickup_state,
            'pickup_zip': self.pickup_zip,
            'pickup_country': self.pickup_country,
            'delivery_address': self.delivery_address,
            'delivery_city': self.delivery_city,
            'delivery_state': self.delivery_state,
            'delivery_zip': self.delivery_zip,
            'delivery_country': self.delivery_country,
            'package_type': self.package_type,
            'weight': self.weight,
            'dimensions': self.dimensions,
            'description': self.description,
            'declared_value': self.declared_value,
            'shipping_cost': self.shipping_cost,
            'insurance_cost': self.insurance_cost,
            'total_cost': self.total_cost,
            'payment_status': self.payment_status,
            'status': self.status,
            'priority': self.priority,
            'scheduled_pickup': self.scheduled_pickup.isoformat() if self.scheduled_pickup else None,
            'estimated_delivery': self.estimated_delivery.isoformat() if self.estimated_delivery else None,
            'actual_delivery': self.actual_delivery.isoformat() if self.actual_delivery else None,
            'invoice_url': self.invoice_url,
            'proof_of_delivery_url': self.proof_of_delivery_url,
            'special_instructions': self.special_instructions,
            'delivery_notes': self.delivery_notes,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_history:
            data['tracking_history'] = [h.to_dict() for h in self.tracking_history]
        return data


# ─── Tracking History ─────────────────────────────────────────────────────────

class TrackingHistory(db.Model):
    __tablename__ = 'tracking_history'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    shipment_id = db.Column(db.String(36), db.ForeignKey('shipments.id'), nullable=False)
    status = db.Column(db.String(30), nullable=False)
    location = db.Column(db.String(200))
    description = db.Column(db.Text)
    updated_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'shipment_id': self.shipment_id,
            'status': self.status,
            'location': self.location,
            'description': self.description,
            'updated_by': self.updated_by,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
        }


# ─── Notifications ────────────────────────────────────────────────────────────

class Notification(db.Model):
    __tablename__ = 'notifications'

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    shipment_id = db.Column(db.String(36), db.ForeignKey('shipments.id'))
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(30), default='info')  # info | success | warning | error
    is_read = db.Column(db.Boolean, default=False)
    channel = db.Column(db.String(20), default='in_app')  # in_app | email | sms
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'shipment_id': self.shipment_id,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'is_read': self.is_read,
            'channel': self.channel,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
