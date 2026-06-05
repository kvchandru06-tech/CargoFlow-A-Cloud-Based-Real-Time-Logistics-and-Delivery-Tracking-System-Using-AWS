from flask import Blueprint, jsonify
from app.models import Shipment, TrackingHistory

tracking_bp = Blueprint('tracking', __name__)


@tracking_bp.route('/<tracking_number>', methods=['GET'])
def track_shipment(tracking_number):
    """Public endpoint — no auth required."""
    shipment = Shipment.query.filter_by(tracking_number=tracking_number.upper()).first()

    if not shipment:
        return jsonify({'error': 'Tracking number not found'}), 404

    history = TrackingHistory.query.filter_by(shipment_id=shipment.id)\
        .order_by(TrackingHistory.timestamp.asc()).all()

    status_steps = [
        'pending', 'confirmed', 'picked_up',
        'in_transit', 'out_for_delivery', 'delivered'
    ]

    current_step = status_steps.index(shipment.status) if shipment.status in status_steps else 0

    return jsonify({
        'tracking_number': shipment.tracking_number,
        'status': shipment.status,
        'current_step': current_step,
        'total_steps': len(status_steps),
        'status_steps': status_steps,
        'pickup_address': f"{shipment.pickup_city}, {shipment.pickup_state}",
        'delivery_address': f"{shipment.delivery_city}, {shipment.delivery_state}",
        'recipient_name': shipment.recipient_name,
        'package_type': shipment.package_type,
        'weight': shipment.weight,
        'priority': shipment.priority,
        'estimated_delivery': shipment.estimated_delivery.isoformat() if shipment.estimated_delivery else None,
        'actual_delivery': shipment.actual_delivery.isoformat() if shipment.actual_delivery else None,
        'created_at': shipment.created_at.isoformat() if shipment.created_at else None,
        'history': [h.to_dict() for h in history],
    })
