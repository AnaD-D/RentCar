class Config:
    # crear y llamar la base de datos SQLite
    SQLALCHEMY_DATABASE_URI = 'sqlite:///rentcar.db'
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False