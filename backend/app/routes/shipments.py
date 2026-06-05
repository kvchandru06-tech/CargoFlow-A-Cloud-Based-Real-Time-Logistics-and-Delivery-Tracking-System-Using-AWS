from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User, Shipment, TrackingHistory, Notification, DeliveryAgent
from app.services.pdf_generator import generate_invoice_pdf
from app.services.aws_sns import send_notification
from datetime import datetime, timedelta
import io

shipments_bp = Blueprint('shipments', __name__)


def calculate_cost(weight, priority, declared_value):
    base_rate = {'standard': 5.0, 'express': 12.0, 'overnight': 25.0}
    rate = base_rate.get(priority, 5.0)
    shipping = rate + (weight or 0) * 1.5
    insurance = (declared_value or 0) * 0.01
    return round(shipping, 2), round(insurance, 2), round(shipping + insurance, 2)


@shipments_bp.route('', methods=['GET'])
@jwt_required()
def list_shipments():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    status_filter = request.args.get('status')
    search = request.args.get('search', '').strip()

    if user.role == 'admin':
        query = Shipment.query
    elif user.role == 'agent':
        agent = user.agent_profile
        if not agent:
            return jsonify({'shipments': [], 'total': 0})
        query = Shipment.query.filter_by(agent_id=agent.id)
    else:
        query = Shipment.query.filter_by(sender_id=user_id)

    if status_filter:
        query = query.filter_by(status=status_filter)

    if search:
        query = query.filter(
            db.or_(
                Shipment.tracking_number.ilike(f'%{search}%'),
                Shipment.recipient_name.ilike(f'%{search}%'),
                Shipment.recipient_phone.ilike(f'%{search}%'),
                Shipment.delivery_city.ilike(f'%{search}%'),
                Shipment.pickup_city.ilike(f'%{search}%'),
                Shipment.description.ilike(f'%{search}%'),
            )
        )

    total = query.count()
    shipments = query.order_by(Shipment.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        'shipments': [s.to_dict() for s in shipments.items],
        'total': total,
        'page': page,
        'per_page': per_page,
        'pages': shipments.pages,
    })


@shipments_bp.route('', methods=['POST'])
@jwt_required()
def create_shipment():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    data = request.get_json()

    required = ['pickup_address', 'delivery_address', 'recipient_name', 'recipient_phone']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    priority = data.get('priority', 'standard')
    weight = float(data.get('weight', 1.0))
    declared_value = float(data.get('declared_value', 0.0))
    shipping_cost, insurance_cost, total_cost = calculate_cost(weight, priority, declared_value)

    # Estimated delivery
    days_map = {'standard': 5, 'express': 2, 'overnight': 1}
    est_days = days_map.get(priority, 5)
    estimated_delivery = datetime.utcnow() + timedelta(days=est_days)

    shipment = Shipment(
        sender_id=user_id,
        recipient_name=data.get('recipient_name'),
        recipient_email=data.get('recipient_email'),
        recipient_phone=data.get('recipient_phone'),
        pickup_address=data.get('pickup_address'),
        pickup_city=data.get('pickup_city'),
        pickup_state=data.get('pickup_state'),
        pickup_zip=data.get('pickup_zip'),
        pickup_country=data.get('pickup_country', 'USA'),
        delivery_address=data.get('delivery_address'),
        delivery_city=data.get('delivery_city'),
        delivery_state=data.get('delivery_state'),
        delivery_zip=data.get('delivery_zip'),
        delivery_country=data.get('delivery_country', 'USA'),
        package_type=data.get('package_type', 'parcel'),
        weight=weight,
        dimensions=data.get('dimensions'),
        description=data.get('description'),
        declared_value=declared_value,
        shipping_cost=shipping_cost,
        insurance_cost=insurance_cost,
        total_cost=total_cost,
        priority=priority,
        special_instructions=data.get('special_instructions'),
        estimated_delivery=estimated_delivery,
        scheduled_pickup=datetime.utcnow() + timedelta(hours=2),
    )

    db.session.add(shipment)
    db.session.flush()

    # Initial tracking entry
    history = TrackingHistory(
        shipment_id=shipment.id,
        status='pending',
        location=data.get('pickup_city', 'Origin'),
        description='Shipment order created and awaiting confirmation.',
        updated_by=user_id,
    )
    db.session.add(history)

    # Notification
    notif = Notification(
        user_id=user_id,
        shipment_id=shipment.id,
        title='Shipment Created',
        message=f'Your shipment {shipment.tracking_number} has been created successfully.',
        type='success',
    )
    db.session.add(notif)
    db.session.commit()

    # Try SNS notification
    try:
        send_notification(
            subject='Shipment Created - CargoFlow',
            message=f'Your shipment {shipment.tracking_number} has been created. Estimated delivery: {estimated_delivery.strftime("%b %d, %Y")}',
            email=user.email,
            phone=user.phone,
        )
    except Exception:
        pass

    return jsonify({'message': 'Shipment created', 'shipment': shipment.to_dict(include_history=True)}), 201


@shipments_bp.route('/<shipment_id>', methods=['GET'])
@jwt_required()
def get_shipment(shipment_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    shipment = Shipment.query.get(shipment_id)

    if not shipment:
        return jsonify({'error': 'Shipment not found'}), 404

    # Access control
    if user.role == 'customer' and shipment.sender_id != user_id:
        return jsonify({'error': 'Access denied'}), 403

    if user.role == 'agent':
        agent = user.agent_profile
        if not agent or shipment.agent_id != agent.id:
            return jsonify({'error': 'Access denied'}), 403

    return jsonify({'shipment': shipment.to_dict(include_history=True)})


@shipments_bp.route('/<shipment_id>/status', methods=['PUT'])
@jwt_required()
def update_status(shipment_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    shipment = Shipment.query.get(shipment_id)

    if not shipment:
        return jsonify({'error': 'Shipment not found'}), 404

    if user.role == 'customer':
        return jsonify({'error': 'Not authorized'}), 403

    if user.role == 'agent':
        agent = user.agent_profile
        if not agent or shipment.agent_id != agent.id:
            return jsonify({'error': 'Not authorized'}), 403

    data = request.get_json()
    new_status = data.get('status')

    valid_statuses = ['pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'cancelled']
    if new_status not in valid_statuses:
        return jsonify({'error': 'Invalid status'}), 400

    old_status = shipment.status
    shipment.status = new_status

    if new_status == 'delivered':
        shipment.actual_delivery = datetime.utcnow()
        if shipment.agent_id:
            agent = DeliveryAgent.query.get(shipment.agent_id)
            if agent:
                agent.total_deliveries += 1

    shipment.updated_at = datetime.utcnow()

    # Tracking history
    history = TrackingHistory(
        shipment_id=shipment.id,
        status=new_status,
        location=data.get('location', ''),
        description=data.get('description', f'Status updated to {new_status}'),
        updated_by=user_id,
    )
    db.session.add(history)

    # Notify sender
    status_messages = {
        'confirmed': 'Your shipment has been confirmed and will be picked up soon.',
        'picked_up': 'Your shipment has been picked up by our delivery agent.',
        'in_transit': 'Your shipment is in transit.',
        'out_for_delivery': 'Your shipment is out for delivery today.',
        'delivered': 'Your shipment has been delivered successfully.',
        'failed': 'Delivery attempt failed. We will retry.',
        'cancelled': 'Your shipment has been cancelled.',
    }

    if new_status in status_messages:
        notif = Notification(
            user_id=shipment.sender_id,
            shipment_id=shipment.id,
            title=f'Shipment {new_status.replace("_", " ").title()}',
            message=status_messages[new_status],
            type='success' if new_status == 'delivered' else 'info',
        )
        db.session.add(notif)

    db.session.commit()

    # SNS
    try:
        sender = User.query.get(shipment.sender_id)
        if sender and new_status in status_messages:
            send_notification(
                subject=f'CargoFlow: Shipment {new_status.replace("_", " ").title()}',
                message=f'Tracking #{shipment.tracking_number}: {status_messages[new_status]}',
                email=sender.email,
                phone=sender.phone,
            )
    except Exception:
        pass

    return jsonify({'message': 'Status updated', 'shipment': shipment.to_dict(include_history=True)})


@shipments_bp.route('/<shipment_id>/assign', methods=['PUT'])
@jwt_required()
def assign_agent(shipment_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    shipment = Shipment.query.get(shipment_id)
    if not shipment:
        return jsonify({'error': 'Shipment not found'}), 404

    data = request.get_json()
    agent_id = data.get('agent_id')
    agent = DeliveryAgent.query.get(agent_id)
    if not agent:
        return jsonify({'error': 'Agent not found'}), 404

    shipment.agent_id = agent_id
    shipment.status = 'confirmed'
    shipment.updated_at = datetime.utcnow()

    history = TrackingHistory(
        shipment_id=shipment.id,
        status='confirmed',
        location=shipment.pickup_city or 'Warehouse',
        description=f'Shipment assigned to delivery agent {agent.user.name}.',
        updated_by=user_id,
    )
    db.session.add(history)

    # Notify agent
    notif = Notification(
        user_id=agent.user_id,
        shipment_id=shipment.id,
        title='New Delivery Assigned',
        message=f'You have been assigned shipment {shipment.tracking_number}.',
        type='info',
    )
    db.session.add(notif)
    db.session.commit()

    return jsonify({'message': 'Agent assigned', 'shipment': shipment.to_dict()})


@shipments_bp.route('/<shipment_id>/invoice', methods=['GET'])
@jwt_required()
def download_invoice(shipment_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    shipment = Shipment.query.get(shipment_id)

    if not shipment:
        return jsonify({'error': 'Shipment not found'}), 404

    if user.role == 'customer' and shipment.sender_id != user_id:
        return jsonify({'error': 'Access denied'}), 403

    pdf_buffer = generate_invoice_pdf(shipment)
    return send_file(
        io.BytesIO(pdf_buffer),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f'invoice_{shipment.tracking_number}.pdf'
    )


@shipments_bp.route('/<shipment_id>', methods=['DELETE'])
@jwt_required()
def cancel_shipment(shipment_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    shipment = Shipment.query.get(shipment_id)

    if not shipment:
        return jsonify({'error': 'Shipment not found'}), 404

    if user.role == 'customer' and shipment.sender_id != user_id:
        return jsonify({'error': 'Access denied'}), 403

    if shipment.status in ['delivered', 'cancelled']:
        return jsonify({'error': 'Cannot cancel this shipment'}), 400

    shipment.status = 'cancelled'
    shipment.updated_at = datetime.utcnow()

    history = TrackingHistory(
        shipment_id=shipment.id,
        status='cancelled',
        description='Shipment cancelled.',
        updated_by=user_id,
    )
    db.session.add(history)
    db.session.commit()

    return jsonify({'message': 'Shipment cancelled'})
