from app import create_app, db
from flask import send_from_directory
import os

app = create_app(os.environ.get('FLASK_ENV', 'development'))

# Serve locally uploaded files (fallback when AWS S3 is not configured)
@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    upload_folder = app.config['UPLOAD_FOLDER']
    return send_from_directory(upload_folder, filename)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        print("✅ Database tables created")
    app.run(host='0.0.0.0', port=5000, debug=True)
