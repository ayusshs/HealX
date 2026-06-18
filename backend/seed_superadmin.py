from app import create_app
import app

app_instance = create_app()

with app_instance.app_context():
    from app.models.admin_user import AdminUser
    AdminUser.seed_superadmin()
