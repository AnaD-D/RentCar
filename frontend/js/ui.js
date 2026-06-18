// ==========================================
// LÓGICA UI
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. DASHBOARD
    if (document.getElementById('kpi-disponibles')) {
        cargarDashboard();
    }

    // 2. CATÁLOGOS
    if (document.getElementById('tabla-marcas')) {
        cargarMarcas();
        document.getElementById('form-marca').addEventListener('submit', guardarMarca);
        cargarModelos(); 
        llenarSelect('/marcas', 'marca-modelo'); // Llena el desplegable de marcas
        document.getElementById('form-modelo').addEventListener('submit', guardarModelo);
    }
    

    // 3. VEHÍCULOS
    if (document.getElementById('form-vehiculo')) {
        cargarVehiculos();
        llenarSelect('/marcas', 'marca-vehiculo');
        llenarSelect('/modelos', 'modelo-vehiculo');
        llenarSelect('/tipos_vehiculo', 'tipo-vehiculo');
        llenarSelect('/combustibles', 'combustible-vehiculo');
        document.getElementById('form-vehiculo').addEventListener('submit', guardarVehiculo);
    }

    // 4. CLIENTES
    if (document.getElementById('tabla-clientes')) {
        cargarClientes();
        document.getElementById('form-cliente').addEventListener('submit', guardarCliente);
    }

    // 5. RENTAS E INSPECCIONES
    if (document.getElementById('form-inspeccion')) {
        llenarSelect('/vehiculos', 'insp-vehiculo', true); 
        llenarSelect('/clientes', 'insp-cliente');
        llenarSelect('/empleados', 'insp-empleado');
        document.getElementById('form-inspeccion').addEventListener('submit', guardarInspeccion);
    }
    if (document.getElementById('form-renta')) {
        llenarSelect('/vehiculos', 'renta-vehiculo', true);
        llenarSelect('/clientes', 'renta-cliente');
        llenarSelect('/empleados', 'renta-empleado');
        document.getElementById('form-renta').addEventListener('submit', guardarRenta);
        document.getElementById('form-devolucion').addEventListener('submit', guardarDevolucion);
    }

    // 6. REPORTES
    if (document.getElementById('form-filtros')) {
        document.getElementById('form-filtros').addEventListener('submit', filtrarReportes);
    }
});

// FUNCIONES DEL DASHBOARD 
async function cargarDashboard() {
    const vehiculos = await API.get('/vehiculos');
    const reportes = await API.get('/reporte-rentas'); 

    if (vehiculos) {
        const disponibles = vehiculos.filter(v => v.estado === 'Disponible').length;
        document.getElementById('kpi-disponibles').innerText = disponibles;
    }
    if (reportes) {
        document.getElementById('kpi-rentas').innerText = reportes.length;
        const totalIngresos = reportes.reduce((sum, renta) => sum + renta.total_generado, 0);
        document.getElementById('kpi-ingresos').innerText = new Intl.NumberFormat('es-DO', {style: 'currency', currency: 'DOP'}).format(totalIngresos);
    }
}

// FUNCIONES DE CATÁLOGOS 
async function cargarMarcas() {
    const tbody = document.getElementById('tabla-marcas');
    const marcas = await API.get('/marcas');
    if (marcas) {
        tbody.innerHTML = marcas.map(m => `
            <tr><td>${m.id}</td><td class="fw-bold">${m.descripcion}</td><td><span class="badge ${m.estado ? 'bg-success':'bg-danger'}">${m.estado ? 'Activo':'Inactivo'}</span></td></tr>
        `).join('');
    }
}

async function guardarMarca(e) {
    e.preventDefault();
    const desc = document.getElementById('desc-marca').value;
    if (await API.post('/marcas', {descripcion: desc})) {
        document.getElementById('form-marca').reset();
        cargarMarcas();
    }
}

// FUNCIONES DE VEHÍCULOS
async function cargarVehiculos() {
    const tbody = document.getElementById('tabla-vehiculos');
    const vehiculos = await API.get('/vehiculos');
    if (vehiculos) {
        tbody.innerHTML = vehiculos.map(v => `
            <tr><td>${v.id}</td><td>${v.descripcion}</td><td>${v.no_placa}</td><td><span class="badge ${v.estado === 'Disponible' ? 'bg-success':'bg-warning'}">${v.estado}</span></td></tr>
        `).join('');
    }
}

async function guardarVehiculo(e) {
    e.preventDefault();
    const data = {
        descripcion: document.getElementById('desc-vehiculo').value,
        no_placa: document.getElementById('placa-vehiculo').value,
        no_chasis: document.getElementById('chasis-vehiculo').value,
        no_motor: document.getElementById('motor-vehiculo').value,
        id_marca: document.getElementById('marca-vehiculo').value,
        id_modelo: document.getElementById('modelo-vehiculo').value,
        id_tipo: document.getElementById('tipo-vehiculo').value,
        id_combustible: document.getElementById('combustible-vehiculo').value
    };
    if (await API.post('/vehiculos', data)) {
        alert("Vehículo registrado");
        location.reload();
    }
}

// FUNCIONES DE CLIENTES
async function cargarClientes() {
    const tbody = document.getElementById('tabla-clientes');
    const clientes = await API.get('/clientes');
    if (clientes) {
        tbody.innerHTML = clientes.map(c => `
            <tr><td>${c.id}</td><td>${c.nombre}</td><td>${c.cedula}</td><td>${c.tipo_persona}</td><td>RD$ ${parseFloat(c.limite_credito).toLocaleString()}</td><td><span class="badge bg-success">Activo</span></td></tr>
        `).join('');
    }
}

async function guardarCliente(e) {
    e.preventDefault();
    const data = {
        nombre: document.getElementById('nombre-cliente').value,
        cedula: document.getElementById('cedula-cliente').value,
        no_tarjeta_cr: document.getElementById('tarjeta-cliente').value,
        tipo_persona: document.getElementById('tipo-persona-cliente').value,
        limite_credito: document.getElementById('limite-cliente').value
    };
    if (await API.post('/clientes', data)) {
        document.getElementById('form-cliente').reset();
        cargarClientes();
    }
}

// FUNCIONES DE RENTAS E INSPECCIONES
async function guardarInspeccion(e) {
    e.preventDefault();
    const data = {
        id_vehiculo: document.getElementById('insp-vehiculo').value,
        id_cliente: document.getElementById('insp-cliente').value,
        id_empleado: document.getElementById('insp-empleado').value,
        tiene_ralladuras: document.getElementById('insp-ralladuras').checked,
        tiene_roturas_cristal: document.getElementById('insp-cristal').checked,
        tiene_gato: document.getElementById('insp-gato').checked,
        tiene_goma_repuesto: document.getElementById('insp-repuesto').checked,
        cantidad_combustible: document.getElementById('insp-combustible').value,
        estado_gomas: document.getElementById('insp-gomas').value,
        fecha: document.getElementById('insp-fecha').value
    };
    if (await API.post('/inspecciones', data)) alert("Inspección registrada con éxito.");
}

async function guardarRenta(e) {
    e.preventDefault();
    const data = {
        id_vehiculo: document.getElementById('renta-vehiculo').value,
        id_cliente: document.getElementById('renta-cliente').value,
        id_empleado: document.getElementById('renta-empleado').value,
        monto_x_dia: document.getElementById('renta-monto').value,
        cantidad_dias: document.getElementById('renta-dias').value,
        fecha_renta: document.getElementById('renta-fecha').value,
        comentario: document.getElementById('renta-comentario').value
    };
    const res = await API.post('/rentas', data);
    if (res) alert("Renta #" + res.no_renta + " iniciada.");
}

async function guardarDevolucion(e) {
    e.preventDefault();
    const id = document.getElementById('dev-id').value;
    const data = {
        fecha_devolucion: document.getElementById('dev-fecha').value,
        comentario: document.getElementById('dev-comentario').value
    };
    const res = await API.put(`/rentas/${id}/devolucion`, data);
    if (res) alert(res.mensaje || res.error);
}

// FUNCIONES DE REPORTES 
async function filtrarReportes(e) {
    e.preventDefault();
    const inicio = document.getElementById('filtro-inicio').value;
    const fin = document.getElementById('filtro-fin').value;
    document.getElementById('btn-exportar-pdf').href = `${BASE_URL}/reporte-rentas/exportar-pdf?fecha_inicio=${inicio}&fecha_fin=${fin}`;
    const datos = await API.get(`/reporte-rentas?fecha_inicio=${inicio}&fecha_fin=${fin}`);
    const tbody = document.getElementById('tabla-reportes');
    if (datos && datos.length > 0) {
        tbody.innerHTML = datos.map(r => `
            <tr><td>${r.no_renta}</td><td>${r.fecha_renta}</td><td>${r.tipo_vehiculo}</td><td>RD$ ${r.monto_x_dia}</td><td>${r.cantidad_dias}</td><td class="text-end fw-bold">RD$ ${r.total_generado.toLocaleString()}</td></tr>
        `).join('');
    } else {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">Sin resultados.</td></tr>';
    }
}

// LLENAR SELECTS
async function llenarSelect(endpoint, selectId, soloDisponibles = false) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const datos = await API.get(endpoint);
    if (datos) {
        datos.forEach(item => {
            if (soloDisponibles && item.estado !== 'Disponible') return;
            const opt = document.createElement('option');
            opt.value = item.id;
            opt.textContent = item.descripcion || item.nombre;
            select.appendChild(opt);
        });
    }
}

// --- FUNCIONES DE CATÁLOGOS (MODELOS) ---
async function cargarModelos() {
    const tbody = document.getElementById('tabla-modelos');
    const modelos = await API.get('/modelos');
    
    if (modelos && modelos.length > 0) {
        tbody.innerHTML = modelos.map(m => `
            <tr>
                <td>${m.id}</td>
                <td>${m.id_marca}</td>
                <td class="fw-bold">${m.descripcion}</td>
                <td><span class="badge ${m.estado ? 'bg-success':'bg-danger'}">${m.estado ? 'Activo':'Inactivo'}</span></td>
            </tr>
        `).join('');
    } else {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">No hay modelos registrados.</td></tr>';
    }
}

async function guardarModelo(e) {
    e.preventDefault(); 
    
    const idMarca = document.getElementById('marca-modelo').value;
    const descripcion = document.getElementById('desc-modelo').value;

    const nuevoModelo = {
        id_marca: parseInt(idMarca),
        descripcion: descripcion,
        estado: true
    };

    if (await API.post('/modelos', nuevoModelo)) {
        document.getElementById('form-modelo').reset(); 
        cargarModelos(); 
    }
}