from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity
)
from app import db
from app.models import User, DeliveryAgent
from datetime import datetime

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    required = ['name', 'email', 'password']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400

    if User.query.filter_by(email=data['email'].lower()).first():
        return jsonify({'error': 'Email already registered'}), 409

    role = data.get('role', 'customer')
    if role not in ['customer', 'agent']:
        role = 'customer'

    user = User(
        name=data['name'],
        email=data['email'].lower(),
        phone=data.get('phone'),
        role=role,
    )
    user.set_password(data['password'])
    db.session.add(user)
    db.session.flush()

    # Create agent profile if role is agent
    if role == 'agent':
        agent = DeliveryAgent(
            user_id=user.id,
            vehicle_type=data.get('vehicle_type', 'bike'),
            vehicle_number=data.get('vehicle_number', ''),
            license_number=data.get('license_number', ''),
        )
        db.session.add(agent)

    db.session.commit()

    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)

    return jsonify({
        'message': 'Registration successful',
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token,
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=data['email'].lower()).first()

    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401

    if not user.is_active:
        return jsonify({'error': 'Account is deactivated'}), 403

    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)

    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token,
    })


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    access_token = create_access_token(identity=user_id)
    return jsonify({'access_token': access_token})


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    user_data = user.to_dict()
    if user.role == 'agent' and user.agent_profile:
        user_data['agent_profile'] = user.agent_profile.to_dict()

    return jsonify({'user': user_data})


@auth_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()

    if 'name' in data:
        name = data['name'].strip()
        if not name:
            return jsonify({'error': 'Name cannot be empty'}), 400
        user.name = name

    # Allow setting or clearing phone
    if 'phone' in data:
        user.phone = data['phone'].strip() or None

    if 'password' in data and data['password']:
        if len(data['password']) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        user.set_password(data['password'])

    user.updated_at = datetime.utcnow()
    db.session.commit()

    user_data = user.to_dict()
    if user.role == 'agent' and user.agent_profile:
        user_data['agent_profile'] = user.agent_profile.to_dict()

    return jsonify({'message': 'Profile updated', 'user': user_data})


@auth_bp.route('/users', methods=['GET'])
@jwt_required()
def list_users():
    user_id = get_jwt_identity()
    current_user = User.query.get(user_id)
    if not current_user or current_user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    role_filter = request.args.get('role')
    query = User.query
    if role_filter:
        query = query.filter_by(role=role_filter)

    users = query.order_by(User.created_at.desc()).all()
    return jsonify({'users': [u.to_dict() for u in users]})


@auth_bp.route('/users/<user_id>/toggle', methods=['PUT'])
@jwt_required()
def toggle_user(user_id):
    current_id = get_jwt_identity()
    current_user = User.query.get(current_id)
    if not current_user or current_user.role != 'admin':
        return jsonify({'error': 'Admin access required'}), 403

    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    user.is_active = not user.is_active
    db.session.commit()
    return jsonify({'message': f'User {"activated" if user.is_active else "deactivated"}', 'user': user.to_dict()})
