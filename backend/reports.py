import pandas as pd
from flask import Blueprint, request, jsonify
from models import db, RentaDevolucion, Vehiculo, TipoVehiculo
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

    # Crear PDF
    pdf = FPDF()
    pdf.add_page()
    
    pdf.set_font("Arial", style='B', size=16)
    pdf.cell(0, 10, txt="Reporte de Rentas - Sistema RentCar", ln=True, align='C')
    pdf.ln(5) 
    
    pdf.set_font("Arial", style='B', size=12)
    pdf.cell(30, 10, txt="No. Renta", border=1, align='C')
    pdf.cell(40, 10, txt="Fecha", border=1, align='C')
    pdf.cell(60, 10, txt="Tipo Vehiculo", border=1, align='C')
    pdf.cell(50, 10, txt="Total (DOP)", border=1, align='C', ln=True) 
    
    pdf.set_font("Arial", size=12)
    for r in resultados:
        total = float(r.monto_x_dia * r.cantidad_dias)
        pdf.cell(30, 10, txt=str(r.no_renta), border=1, align='C')
        pdf.cell(40, 10, txt=str(r.fecha_renta), border=1, align='C')
        pdf.cell(60, 10, txt=r.tipo_vehiculo, border=1, align='C')
        pdf.cell(50, 10, txt=f"${total:,.2f}", border=1, align='C', ln=True)
   
    pdf_buffer = io.BytesIO()
    pdf.output(pdf_buffer)
    pdf_buffer.seek(0)

    # Enviar al frontend
    return send_file(
        pdf_buffer, 
        as_attachment=True, 
        download_name='Reporte_Rentas.pdf', 
        mimetype='application/pdf'
    )