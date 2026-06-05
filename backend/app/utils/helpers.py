from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from app.models import User


def role_required(*roles):
    """Decorator to restrict access by role."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            user_id = get_jwt_identity()
            user = User.query.get(user_id)
            if not user or user.role not in roles:
                return jsonify({'error': f'Access restricted to: {", ".join(roles)}'}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def paginate_query(query, page, per_page):
    """Helper to paginate a SQLAlchemy query."""
    paginated = query.paginate(page=page, per_page=per_page, error_out=False)
    return {
        'items': paginated.items,
        'total': paginated.total,
        'page': paginated.page,
        'pages': paginated.pages,
        'per_page': paginated.per_page,
    }
