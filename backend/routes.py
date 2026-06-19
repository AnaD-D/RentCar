from flask import Blueprint, jsonify, request
from models import db, Marca, TipoVehiculo, TipoCombustible, Modelo, Vehiculo, Cliente, Empleado, Inspeccion, RentaDevolucion
from datetime import datetime
from utils import validar_cedula_dominicana

api_bp = Blueprint('api_bp', __name__)

# GESTIÓN DE MARCAS
@api_bp.route('/marcas', methods=['GET'])
def get_marcas():
    marcas = Marca.query.all()
    resultado = [{"id": m.id, "descripcion": m.descripcion, "estado": m.estado} for m in marcas]
    return jsonify(resultado), 200

@api_bp.route('/marcas', methods=['POST'])
def create_marca():
    datos = request.get_json()
    if 'descripcion' not in datos or not datos['descripcion'].strip():
        return jsonify({"error": "La descripción es obligatoria"}), 400

    nueva_marca = Marca(descripcion=datos['descripcion'], estado=datos.get('estado', True))
    db.session.add(nueva_marca)
    db.session.commit()
    return jsonify({"mensaje": "Marca guardada exitosamente", "id": nueva_marca.id}), 201

@api_bp.route('/marcas/<int:id>', methods=['DELETE'])
def delete_marca(id):
    marca = Marca.query.get(id)
    if not marca: return jsonify({"error": "Marca no encontrada"}), 404
    try:
        db.session.delete(marca)
        db.session.commit()
        return jsonify({"mensaje": "Marca eliminada exitosamente"}), 200
    except Exception:
        db.session.rollback()
        return jsonify({"error": "No puedes eliminar esta marca porque tiene modelos o vehículos asociados."}), 400


# GESTIÓN DE TIPOS DE VEHÍCULO
@api_bp.route('/tipos_vehiculo', methods=['GET'])
def get_tipos():
    tipos = TipoVehiculo.query.all()
    return jsonify([{"id": t.id, "descripcion": t.descripcion, "estado": t.estado} for t in tipos]), 200

@api_bp.route('/tipos_vehiculo', methods=['POST'])
def create_tipo():
    datos = request.get_json()
    nuevo_tipo = TipoVehiculo(descripcion=datos['descripcion'], estado=datos.get('estado', True))
    db.session.add(nuevo_tipo)
    db.session.commit()
    return jsonify({"mensaje": "Tipo de vehículo guardado", "id": nuevo_tipo.id}), 201

@api_bp.route('/tipos_vehiculo/<int:id>', methods=['DELETE'])
def delete_tipo(id):
    item = TipoVehiculo.query.get(id)
    try:
        db.session.delete(item)
        db.session.commit()
        return jsonify({"mensaje": "Eliminado"}), 200
    except:
        db.session.rollback()
        return jsonify({"error": "No se puede eliminar porque está en uso."}), 400


# GESTIÓN DE COMBUSTIBLES
@api_bp.route('/combustibles', methods=['GET'])
def get_combustibles():
    combustibles = TipoCombustible.query.all()
    return jsonify([{"id": c.id, "descripcion": c.descripcion, "estado": c.estado} for c in combustibles]), 200

@api_bp.route('/combustibles', methods=['POST'])
def create_combustible():
    datos = request.get_json()
    nuevo_combustible = TipoCombustible(descripcion=datos['descripcion'], estado=datos.get('estado', True))
    db.session.add(nuevo_combustible)
    db.session.commit()
    return jsonify({"mensaje": "Combustible guardado", "id": nuevo_combustible.id}), 201

@api_bp.route('/combustibles/<int:id>', methods=['DELETE'])
def delete_combustible(id):
    item = TipoCombustible.query.get(id)
    try:
        db.session.delete(item)
        db.session.commit()
        return jsonify({"mensaje": "Eliminado"}), 200
    except:
        db.session.rollback()
        return jsonify({"error": "No se puede eliminar porque está en uso."}), 400

# GESTIÓN DE MODELOS
@api_bp.route('/modelos', methods=['GET'])
def get_modelos():
    modelos = Modelo.query.all()
    return jsonify([{"id": m.id, "id_marca": m.id_marca, "descripcion": m.descripcion, "estado": m.estado} for m in modelos]), 200

@api_bp.route('/modelos', methods=['POST'])
def create_modelo():
    datos = request.get_json()
    nuevo = Modelo(id_marca=datos['id_marca'], descripcion=datos['descripcion'], estado=datos.get('estado', True))
    db.session.add(nuevo)
    db.session.commit()
    return jsonify({"mensaje": "Modelo guardado", "id": nuevo.id}), 201

@api_bp.route('/modelos/<int:id>', methods=['DELETE'])
def delete_modelo(id):
    item = Modelo.query.get(id)
    try:
        db.session.delete(item)
        db.session.commit()
        return jsonify({"mensaje": "Eliminado"}), 200
    except:
        db.session.rollback()
        return jsonify({"error": "No se puede eliminar porque está en uso."}), 400

# GESTIÓN DE VEHÍCULOS
@api_bp.route('/vehiculos', methods=['GET'])
def get_vehiculos():
    vehiculos = Vehiculo.query.all()
    return jsonify([{
        "id": v.id, "descripcion": v.descripcion, "no_chasis": v.no_chasis,
        "no_motor": v.no_motor, "no_placa": v.no_placa, "id_tipo": v.id_tipo,
        "id_marca": v.id_marca, "id_modelo": v.id_modelo, "id_combustible": v.id_combustible,
        "estado": v.estado
    } for v in vehiculos]), 200

@api_bp.route('/vehiculos', methods=['POST'])
def create_vehiculo():
    datos = request.get_json()
    nuevo = Vehiculo(
        descripcion=datos['descripcion'], no_chasis=datos['no_chasis'],
        no_motor=datos['no_motor'], no_placa=datos['no_placa'],
        id_tipo=datos['id_tipo'], id_marca=datos['id_marca'],
        id_modelo=datos['id_modelo'], id_combustible=datos['id_combustible'],
        estado=datos.get('estado', 'Disponible')
    )
    db.session.add(nuevo)
    db.session.commit()
    return jsonify({"mensaje": "Vehículo registrado", "id": nuevo.id}), 201

@api_bp.route('/vehiculos/<int:id>', methods=['DELETE'])
def delete_vehiculo(id):
    item = Vehiculo.query.get(id)
    try:
        db.session.delete(item)
        db.session.commit()
        return jsonify({"mensaje": "Eliminado"}), 200
    except:
        db.session.rollback()
        return jsonify({"error": "No se puede eliminar porque está en uso en rentas o inspecciones."}), 400

# GESTIÓN DE CLIENTES
@api_bp.route('/clientes', methods=['GET'])
def get_clientes():
    clientes = Cliente.query.all()
    return jsonify([{
        "id": c.id, "nombre": c.nombre, "cedula": c.cedula,
        "no_tarjeta_cr": c.no_tarjeta_cr, "limite_credito": float(c.limite_credito),
        "tipo_persona": c.tipo_persona, "estado": c.estado
    } for c in clientes]), 200

@api_bp.route('/clientes', methods=['POST'])
def create_cliente():
    datos = request.get_json()
    
    if not validar_cedula_dominicana(datos['cedula']):
        return jsonify({"error": "La cédula introducida no es válida."}), 400
    
    nuevo = Cliente(
        nombre=datos['nombre'], cedula=datos['cedula'],
        no_tarjeta_cr=datos['no_tarjeta_cr'], limite_credito=datos['limite_credito'],
        tipo_persona=datos['tipo_persona'], estado=datos.get('estado', True)
    )
    db.session.add(nuevo)
    db.session.commit()
    return jsonify({"mensaje": "Cliente registrado", "id": nuevo.id}), 201

@api_bp.route('/clientes/<int:id>', methods=['DELETE'])
def delete_cliente(id):
    item = Cliente.query.get(id)
    try:
        db.session.delete(item)
        db.session.commit()
        return jsonify({"mensaje": "Eliminado"}), 200
    except:
        db.session.rollback()
        return jsonify({"error": "No se puede eliminar porque este cliente ya tiene rentas registradas."}), 400

# GESTIÓN DE EMPLEADOS
@api_bp.route('/empleados', methods=['GET'])
def get_empleados():
    empleados = Empleado.query.all()
    return jsonify([{
        "id": e.id, "nombre": e.nombre, "cedula": e.cedula,
        "tanda_labor": e.tanda_labor, "porciento_comision": float(e.porciento_comision),
        "fecha_ingreso": e.fecha_ingreso.strftime('%Y-%m-%d'), "estado": e.estado
    } for e in empleados]), 200

@api_bp.route('/empleados', methods=['POST'])
def create_empleado():
    datos = request.get_json()
    fecha = datetime.strptime(datos['fecha_ingreso'], '%Y-%m-%d').date()
    nuevo = Empleado(
        nombre=datos['nombre'], cedula=datos['cedula'],
        tanda_labor=datos['tanda_labor'], porciento_comision=datos['porciento_comision'],
        fecha_ingreso=fecha, estado=datos.get('estado', True)
    )
    db.session.add(nuevo)
    db.session.commit()
    return jsonify({"mensaje": "Empleado registrado", "id": nuevo.id}), 201

@api_bp.route('/empleados/<int:id>', methods=['DELETE'])
def delete_empleado(id):
    item = Empleado.query.get(id)
    try:
        db.session.delete(item)
        db.session.commit()
        return jsonify({"mensaje": "Eliminado"}), 200
    except:
        db.session.rollback()
        return jsonify({"error": "No se puede eliminar porque está en uso."}), 400

# INSPECCIONES Y RENTAS
@api_bp.route('/inspecciones', methods=['POST'])
def create_inspeccion():
    datos = request.get_json()
    fecha = datetime.strptime(datos['fecha'], '%Y-%m-%d').date()
    nueva = Inspeccion(
        id_vehiculo=datos['id_vehiculo'], id_cliente=datos['id_cliente'], id_empleado=datos['id_empleado'],
        tiene_ralladuras=datos['tiene_ralladuras'], cantidad_combustible=datos['cantidad_combustible'],
        tiene_goma_repuesto=datos['tiene_goma_repuesto'], tiene_gato=datos['tiene_gato'],
        tiene_roturas_cristal=datos['tiene_roturas_cristal'], estado_gomas=datos['estado_gomas'],
        fecha=fecha, estado=datos.get('estado', True)
    )
    db.session.add(nueva)
    db.session.commit()
    return jsonify({"mensaje": "Inspección guardada exitosamente", "id": nueva.id}), 201

@api_bp.route('/rentas', methods=['GET'])
def get_todas_rentas():
    rentas = db.session.query(
        RentaDevolucion.id,
        RentaDevolucion.fecha_renta,
        RentaDevolucion.estado,
        Cliente.nombre.label('cliente'),
        Vehiculo.descripcion.label('vehiculo')
    ).join(Cliente, RentaDevolucion.id_cliente == Cliente.id)\
     .join(Vehiculo, RentaDevolucion.id_vehiculo == Vehiculo.id).all()
    
    return jsonify([{
        "id": r.id,
        "fecha_renta": r.fecha_renta.strftime('%Y-%m-%d'),
        "cliente": r.cliente,
        "vehiculo": r.vehiculo,
        "estado": r.estado
    } for r in rentas]), 200

@api_bp.route('/rentas', methods=['POST'])
def create_renta():
    datos = request.get_json()
    vehiculo = Vehiculo.query.get(datos['id_vehiculo'])
    
    if not vehiculo or vehiculo.estado != 'Disponible':
        return jsonify({"error": "El vehículo no está disponible para renta"}), 400
        
    fecha_r = datetime.strptime(datos['fecha_renta'], '%Y-%m-%d').date()
    
    nueva_renta = RentaDevolucion(
        id_empleado=datos['id_empleado'], id_vehiculo=datos['id_vehiculo'], id_cliente=datos['id_cliente'],
        fecha_renta=fecha_r, fecha_devolucion=None, monto_x_dia=datos['monto_x_dia'],
        cantidad_dias=datos['cantidad_dias'], comentario=datos.get('comentario', ''),
        estado='Activa'
    )
    vehiculo.estado = 'Rentado'
    
    db.session.add(nueva_renta)
    db.session.commit()
    return jsonify({"mensaje": "Renta procesada con éxito", "no_renta": nueva_renta.id}), 201

@api_bp.route('/rentas/<int:id>/devolucion', methods=['PUT'])
def procesar_devolucion(id):
    datos = request.get_json()
    renta = RentaDevolucion.query.get(id)
    
    if not renta or renta.estado != 'Activa':
        return jsonify({"error": "La renta no existe o ya ha sido completada"}), 404
        
    fecha_d = datetime.strptime(datos['fecha_devolucion'], '%Y-%m-%d').date()
    renta.fecha_devolucion = fecha_d
    renta.estado = 'Completada'
    
    vehiculo = Vehiculo.query.get(renta.id_vehiculo)
    if vehiculo:
        vehiculo.estado = 'Disponible'
        
    db.session.commit()
    return jsonify({"mensaje": "Devolución procesada y vehículo liberado"}), 200