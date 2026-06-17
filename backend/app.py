from flask import Flask
from flask_cors import CORS
from sqlalchemy import event
from sqlalchemy.engine import Engine

from config import Config
from models import db
from routes import api_bp

def create_app():
    app = Flask(__name__)
    
    app.config.from_object(Config)
    
    CORS(app)
   
    db.init_app(app)
    
    app.register_blueprint(api_bp, url_prefix='/api')
    
    @event.listens_for(Engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    with app.app_context():
        db.create_all()
        
    return app
    
# ejecutar servidor 
if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)