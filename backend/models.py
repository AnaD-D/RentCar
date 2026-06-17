from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

#Tablas maestras

class TipoVehiculo(db.Model):
    __tablename__ ="tipos_vehiculos"
    id = db.Column(db.Integer, primary_key= True)
    descripcion = db.Column(db.String(100), nullable= True)
    estado = db.Column(db.Boolean,default = True)

    # 1 a muchos
    vehiculos = db.relationship('Vehiculo', backref='tipo_vehiculo', lazy=True)

class Marca(db.Model):
    __tablename__ = 'marcas'
    id = db.Column(db.Integer, primary_key=True)
    descripcion = db.Column(db.String(100), nullable=False)
    estado = db.Column(db.Boolean, default=True)
    
    modelos = db.relationship('Modelo', backref='marca', lazy=True)
    vehiculos = db.relationship('Vehiculo', backref='marca_vehiculo', lazy=True)

class Modelo(db.Model):
    __tablename__ = 'modelos'
    id = db.Column(db.Integer, primary_key=True)
    id_marca = db.Column(db.Integer, db.ForeignKey('marcas.id'), nullable=False)
    descripcion = db.Column(db.String(100), nullable=False)
    estado = db.Column(db.Boolean, default=True)
    
    vehiculos = db.relationship('Vehiculo', backref='modelo_vehiculo', lazy=True)

class TipoCombustible(db.Model):
    __tablename__ = 'tipos_combustible'
    id = db.Column(db.Integer, primary_key=True)
    descripcion = db.Column(db.String(100), nullable=False)
    estado = db.Column(db.Boolean, default=True)
    
    vehiculos = db.relationship('Vehiculo', backref='tipo_combustible_vehiculo', lazy=True)

class Cliente(db.Model):
    __tablename__ = 'clientes'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(150), nullable=False)
    cedula = db.Column(db.String(20), unique=True, nullable=False)
    no_tarjeta_cr = db.Column(db.String(20), nullable=False)
    limite_credito = db.Column(db.Numeric(12, 2), nullable=False) 
    tipo_persona = db.Column(db.String(50), nullable=False) # Física o Jurídica
    estado = db.Column(db.Boolean, default=True)

    inspecciones = db.relationship('Inspeccion', backref='cliente_inspeccion', lazy=True)
    rentas = db.relationship('RentaDevolucion', backref='cliente_renta', lazy=True)

class Empleado(db.Model):
    __tablename__ = 'empleados'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(150), nullable=False)
    cedula = db.Column(db.String(20), unique=True, nullable=False)
    tanda_labor = db.Column(db.String(50), nullable=False)
    porciento_comision = db.Column(db.Numeric(5, 2), nullable=False) 
    fecha_ingreso = db.Column(db.Date, nullable=False)
    estado = db.Column(db.Boolean, default=True)

    inspecciones = db.relationship('Inspeccion', backref='empleado_inspeccion_rel', lazy=True)
    rentas = db.relationship('RentaDevolucion', backref='empleado_renta', lazy=True)


class Vehiculo(db.Model):
    __tablename__ = 'vehiculos'
    id = db.Column(db.Integer, primary_key=True)
    descripcion = db.Column(db.String(200), nullable=False)
    no_chasis = db.Column(db.String(100), unique=True, nullable=False)
    no_motor = db.Column(db.String(100), unique=True, nullable=False)
    no_placa = db.Column(db.String(20), unique=True, nullable=False)
 
    id_tipo = db.Column(db.Integer, db.ForeignKey('tipos_vehiculos.id'), nullable=False)
    id_marca = db.Column(db.Integer, db.ForeignKey('marcas.id'), nullable=False)
    id_modelo = db.Column(db.Integer, db.ForeignKey('modelos.id'), nullable=False)
    id_combustible = db.Column(db.Integer, db.ForeignKey('tipos_combustible.id'), nullable=False)
    
    estado = db.Column(db.String(50), default='Disponible') 
    
    inspecciones = db.relationship('Inspeccion', backref='vehiculo_inspeccion', lazy=True)
    rentas = db.relationship('RentaDevolucion', backref='vehiculo_renta', lazy=True)

class Inspeccion(db.Model):
    __tablename__ = 'inspecciones'
    id = db.Column(db.Integer, primary_key=True) 
    
    id_vehiculo = db.Column(db.Integer, db.ForeignKey('vehiculos.id'), nullable=False)
    id_cliente = db.Column(db.Integer, db.ForeignKey('clientes.id'), nullable=False)
    id_empleado = db.Column(db.Integer, db.ForeignKey('empleados.id'), nullable=False)
    
    tiene_ralladuras = db.Column(db.Boolean, nullable=False)
    cantidad_combustible = db.Column(db.String(50), nullable=False) # 1/4, 1/2, 3/4, Lleno
    tiene_goma_repuesto = db.Column(db.Boolean, nullable=False)
    tiene_gato = db.Column(db.Boolean, nullable=False)
    tiene_roturas_cristal = db.Column(db.Boolean, nullable=False)
    estado_gomas = db.Column(db.String(200), nullable=False) # para guardar JSON o texto
    fecha = db.Column(db.Date, nullable=False)
    estado = db.Column(db.Boolean, default=True)

class RentaDevolucion(db.Model):
    __tablename__ = 'rentas_devoluciones'
    id = db.Column(db.Integer, primary_key=True) 
    id_empleado = db.Column(db.Integer, db.ForeignKey('empleados.id'), nullable=False)
    id_vehiculo = db.Column(db.Integer, db.ForeignKey('vehiculos.id'), nullable=False)
    id_cliente = db.Column(db.Integer, db.ForeignKey('clientes.id'), nullable=False)

    fecha_renta = db.Column(db.Date, nullable=False)
    fecha_devolucion = db.Column(db.Date, nullable=True) #nulo hasta que el cliente devuelva el vehículo
    monto_x_dia = db.Column(db.Numeric(10, 2), nullable=False)
    cantidad_dias = db.Column(db.Integer, nullable=False)
    comentario = db.Column(db.Text, nullable=True)
    estado = db.Column(db.String(50), default='Activa')