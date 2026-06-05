from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User, Shipment, TrackingHistory
from app.services.aws_s3 import upload_file_to_s3
import os
import uuid

uploads_bp = Blueprint('uploads', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'pdf'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@uploads_bp.route('/proof/<shipment_id>', methods=['POST'])
@jwt_required()
def upload_proof(shipment_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if user.role not in ['agent', 'admin']:
        return jsonify({'error': 'Not authorized'}), 403

    shipment = Shipment.query.get(shipment_id)
    if not shipment:
        return jsonify({'error': 'Shipment not found'}), 404

    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400

    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"proof_{shipment.tracking_number}_{uuid.uuid4().hex[:8]}.{ext}"

    # Try S3 upload, fall back to local
    try:
        file_url = upload_file_to_s3(file, filename, folder='delivery-proofs')
    except Exception:
        # Local fallback
        upload_folder = current_app.config['UPLOAD_FOLDER']
        local_path = os.path.join(upload_folder, filename)
        file.save(local_path)
        file_url = f"/uploads/{filename}"

    shipment.proof_of_delivery_url = file_url
    if shipment.status != 'delivered':
        shipment.status = 'delivered'
        history = TrackingHistory(
            shipment_id=shipment.id,
            status='delivered',
            description='Delivery proof uploaded. Shipment marked as delivered.',
            updated_by=user_id,
        )
        db.session.add(history)

    db.session.commit()

    return jsonify({
        'message': 'Proof uploaded successfully',
        'file_url': file_url,
        'shipment': shipment.to_dict(),
    })


@uploads_bp.route('/avatar', methods=['POST'])
@jwt_required()
def upload_avatar():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)

    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if not allowed_file(file.filename):
        return jsonify({'error': 'File type not allowed'}), 400

    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"avatar_{user_id}_{uuid.uuid4().hex[:8]}.{ext}"

    try:
        file_url = upload_file_to_s3(file, filename, folder='avatars')
    except Exception:
        upload_folder = current_app.config['UPLOAD_FOLDER']
        local_path = os.path.join(upload_folder, filename)
        file.save(local_path)
        file_url = f"/uploads/{filename}"

    user.avatar_url = file_url
    db.session.commit()

    return jsonify({'message': 'Avatar uploaded', 'avatar_url': file_url})
