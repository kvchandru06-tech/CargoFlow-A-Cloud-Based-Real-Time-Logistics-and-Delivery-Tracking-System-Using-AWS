from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User, Shipment, DeliveryAgent, TrackingHistory
from sqlalchemy import func
from datetime import datetime, timedelta

admin_bp = Blueprint('admin', __name__)


def require_admin():
    from flask_jwt_extended import get_jwt_identity
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or user.role != 'admin':
        return None, (jsonify({'error': 'Admin access required'}), 403)
    return user, None


@admin_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    user, err = require_admin()
    if err:
        return err

    # Counts
    total_shipments = Shipment.query.count()
    active_deliveries = Shipment.query.filter(
        Shipment.status.in_(['confirmed', 'picked_up', 'in_transit', 'out_for_delivery'])
    ).count()
    delivered_today = Shipment.query.filter(
        Shipment.status == 'delivered',
        Shipment.actual_delivery >= datetime.utcnow().replace(hour=0, minute=0, second=0)
    ).count()
    total_customers = User.query.filter_by(role='customer').count()
    total_agents = User.query.filter_by(role='agent').count()
    pending_shipments = Shipment.query.filter_by(status='pending').count()

    # Revenue
    total_revenue = db.session.query(func.sum(Shipment.total_cost)).scalar() or 0

    # Shipments by status
    status_counts = db.session.query(
        Shipment.status, func.count(Shipment.id)
    ).group_by(Shipment.status).all()

    # Last 7 days shipments
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    daily_shipments = db.session.query(
        func.date(Shipment.created_at).label('date'),
        func.count(Shipment.id).label('count')
    ).filter(Shipment.created_at >= seven_days_ago)\
     .group_by(func.date(Shipment.created_at))\
     .order_by(func.date(Shipment.created_at))\
     .all()

    # Shipments by priority
    priority_counts = db.session.query(
        Shipment.priority, func.count(Shipment.id)
    ).group_by(Shipment.priority).all()

    # Recent shipments
    recent_shipments = Shipment.query.order_by(Shipment.created_at.desc()).limit(10).all()

    # Top agents
    top_agents = db.session.query(DeliveryAgent)\
        .order_by(DeliveryAgent.total_deliveries.desc()).limit(5).all()

    return jsonify({
        'stats': {
            'total_shipments': total_shipments,
            'active_deliveries': active_deliveries,
            'delivered_today': delivered_today,
            'total_customers': total_customers,
            'total_agents': total_agents,
            'pending_shipments': pending_shipments,
            'total_revenue': round(total_revenue, 2),
        },
        'status_distribution': [{'status': s, 'count': c} for s, c in status_counts],
        'daily_shipments': [{'date': str(d), 'count': c} for d, c in daily_shipments],
        'priority_distribution': [{'priority': p, 'count': c} for p, c in priority_counts],
        'recent_shipments': [s.to_dict() for s in recent_shipments],
        'top_agents': [a.to_dict() for a in top_agents],
    })


@admin_bp.route('/agents', methods=['GET'])
@jwt_required()
def list_agents():
    user, err = require_admin()
    if err:
        return err

    agents = DeliveryAgent.query.all()
    return jsonify({'agents': [a.to_dict() for a in agents]})


@admin_bp.route('/reports', methods=['GET'])
@jwt_required()
def reports():
    user, err = require_admin()
    if err:
        return err

    period = request.args.get('period', '30')  # days
    days = int(period)
    start_date = datetime.utcnow() - timedelta(days=days)

    shipments = Shipment.query.filter(Shipment.created_at >= start_date).all()

    total_revenue = sum(s.total_cost for s in shipments)
    delivered = [s for s in shipments if s.status == 'delivered']
    failed = [s for s in shipments if s.status == 'failed']

    delivery_rate = (len(delivered) / len(shipments) * 100) if shipments else 0

    # Daily revenue breakdown for chart
    daily_revenue = db.session.query(
        func.date(Shipment.created_at).label('date'),
        func.count(Shipment.id).label('count'),
        func.sum(Shipment.total_cost).label('revenue')
    ).filter(Shipment.created_at >= start_date)\
     .group_by(func.date(Shipment.created_at))\
     .order_by(func.date(Shipment.created_at))\
     .all()

    # Priority breakdown
    priority_counts = db.session.query(
        Shipment.priority, func.count(Shipment.id)
    ).filter(Shipment.created_at >= start_date)\
     .group_by(Shipment.priority).all()

    return jsonify({
        'period_days': days,
        'total_shipments': len(shipments),
        'delivered': len(delivered),
        'failed': len(failed),
        'delivery_rate': round(delivery_rate, 1),
        'total_revenue': round(total_revenue, 2),
        'avg_revenue_per_shipment': round(total_revenue / len(shipments), 2) if shipments else 0,
        'daily_revenue': [
            {'date': str(d), 'count': c, 'revenue': round(float(r or 0), 2)}
            for d, c, r in daily_revenue
        ],
        'priority_breakdown': [
            {'priority': p, 'count': c} for p, c in priority_counts
        ],
    })
