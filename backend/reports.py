import pandas as pd
from flask import Blueprint, request, jsonify
from models import db, RentaDevolucion, Vehiculo, TipoVehiculo, Cliente
from fpdf import FPDF
from flask import send_file
import io

reports_bp = Blueprint('reports_bp', __name__)

@reports_bp.route('/reporte-rentas', methods=['GET'])
def reporte_rentas():
    fecha_inicio = request.args.get('fecha_inicio')
    fecha_fin = request.args.get('fecha_fin')

    # Query SQLAlchemy
    query = db.session.query(
        RentaDevolucion.id.label('no_renta'),
        RentaDevolucion.fecha_renta,
        RentaDevolucion.monto_x_dia,
        RentaDevolucion.cantidad_dias,
        TipoVehiculo.descripcion.label('tipo_vehiculo')
    ).join(Vehiculo, RentaDevolucion.id_vehiculo == Vehiculo.id)\
     .join(TipoVehiculo, Vehiculo.id_tipo == TipoVehiculo.id)

    if fecha_inicio and fecha_fin:
        query = query.filter(RentaDevolucion.fecha_renta.between(fecha_inicio, fecha_fin))

    resultados = query.all()

    if not resultados:
        return jsonify([]), 200

    df = pd.DataFrame(resultados)
    
    # ingreso total por renta
    df['total_generado'] = df['monto_x_dia'] * df['cantidad_dias']

    df['fecha_renta'] = df['fecha_renta'].astype(str)

    return df.to_json(orient='records'), 200

@reports_bp.route('/reporte-rentas/exportar-pdf', methods=['GET'])
def exportar_pdf():
    fecha_inicio = request.args.get('fecha_inicio')
    fecha_fin = request.args.get('fecha_fin')

    # 1. Nueva consulta que trae Cliente, Vehículo y Días
    query = db.session.query(
        RentaDevolucion.id.label('no_renta'),
        RentaDevolucion.fecha_renta,
        RentaDevolucion.monto_x_dia,
        RentaDevolucion.cantidad_dias,
        Cliente.nombre.label('cliente'),
        Vehiculo.descripcion.label('vehiculo')
    ).join(Vehiculo, RentaDevolucion.id_vehiculo == Vehiculo.id)\
     .join(Cliente, RentaDevolucion.id_cliente == Cliente.id)

    if fecha_inicio and fecha_fin:
        query = query.filter(RentaDevolucion.fecha_renta.between(fecha_inicio, fecha_fin))

    resultados = query.all()

    # 2. Crear PDF en Horizontal (Landscape - 'L') para que quepan las columnas
    pdf = FPDF(orientation='L', unit='mm', format='A4')
    pdf.add_page()
    
    # Título principal
    pdf.set_font("Arial", style='B', size=16)
    pdf.cell(0, 10, txt="Reporte Detallado de Rentas - Sistema RentCar", ln=True, align='C')
    pdf.ln(5) 
    
    # 3. Nuevos encabezados con anchos ajustados
    pdf.set_font("Arial", style='B', size=11)
    pdf.cell(20, 10, txt="No.", border=1, align='C')
    pdf.cell(30, 10, txt="Fecha", border=1, align='C')
    pdf.cell(60, 10, txt="Cliente", border=1, align='C')
    pdf.cell(90, 10, txt="Vehiculo", border=1, align='C')
    pdf.cell(25, 10, txt="Dias", border=1, align='C')
    pdf.cell(40, 10, txt="Total (DOP)", border=1, align='C', ln=True) 
    
    # 4. Llenar los datos
    pdf.set_font("Arial", size=10)
    for r in resultados:
        total = float(r.monto_x_dia * r.cantidad_dias)
        
        # Recortar nombres muy largos para que no rompan la tabla
        cliente_nombre = (r.cliente[:25] + '..') if len(r.cliente) > 27 else r.cliente
        vehiculo_desc = (r.vehiculo[:45] + '..') if len(r.vehiculo) > 47 else r.vehiculo
        
        pdf.cell(20, 10, txt=str(r.no_renta), border=1, align='C')
        pdf.cell(30, 10, txt=str(r.fecha_renta), border=1, align='C')
        pdf.cell(60, 10, txt=cliente_nombre, border=1, align='L')
        pdf.cell(90, 10, txt=vehiculo_desc, border=1, align='L')
        pdf.cell(25, 10, txt=str(r.cantidad_dias), border=1, align='C')
        pdf.cell(40, 10, txt=f"${total:,.2f}", border=1, align='C', ln=True)
   
    pdf_buffer = io.BytesIO()
    pdf.output(pdf_buffer)
    pdf_buffer.seek(0)

    # Enviar al frontend
    return send_file(
        pdf_buffer, 
        as_attachment=True, 
        download_name='Reporte_Rentas_Detallado.pdf', 
        mimetype='application/pdf'
    )