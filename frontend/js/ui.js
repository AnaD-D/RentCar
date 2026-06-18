// ==========================================
// LÓGICA UI
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. DASHBOARD
    if (document.getElementById('kpi-disponibles')) {
        cargarDashboard();
    }

    // 2. CATÁLOGOS (Marcas, Modelos, Tipos y Combustibles)
    if (document.getElementById('tabla-marcas')) {
        // Inicializar Marcas
        cargarMarcas();
        document.getElementById('form-marca').addEventListener('submit', guardarMarca);
        
        // Inicializar Modelos
        cargarModelos(); 
        llenarSelect('/marcas', 'marca-modelo');
        document.getElementById('form-modelo').addEventListener('submit', guardarModelo);

        // Inicializar Tipos de Vehículo
        cargarTipos();
        document.getElementById('form-tipo').addEventListener('submit', async (e) => {
            e.preventDefault();
            if (await API.post('/tipos_vehiculo', { descripcion: document.getElementById('desc-tipo').value })) {
                document.getElementById('form-tipo').reset();
                cargarTipos();
            }
        });

        // Inicializar Combustibles
        cargarCombustibles();
        document.getElementById('form-combustible').addEventListener('submit', async (e) => {
            e.preventDefault();
            if (await API.post('/combustibles', { descripcion: document.getElementById('desc-combustible').value })) {
                document.getElementById('form-combustible').reset();
                cargarCombustibles();
            }
        });
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

    // 5. EMPLEADOS (¡La sección que faltaba!)
    if (document.getElementById('form-empleado')) {
        cargarEmpleados();
        document.getElementById('form-empleado').addEventListener('submit', async (e) => {
            e.preventDefault();
            const data = {
                nombre: document.getElementById('emp-nombre').value,
                cedula: document.getElementById('emp-cedula').value,
                tanda_labor: document.getElementById('emp-tanda').value,
                porciento_comision: document.getElementById('emp-comision').value,
                fecha_ingreso: document.getElementById('emp-fecha').value
            };
            if (await API.post('/empleados', data)) {
                document.getElementById('form-empleado').reset();
                cargarEmpleados(); 
            }
        });
    }

    // 6. RENTAS E INSPECCIONES
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

    // 7. REPORTES
    if (document.getElementById('form-filtros')) {
        document.getElementById('form-filtros').addEventListener('submit', filtrarReportes);
    }
});

// FUNCIONES DEL DASHBOARD 
// --- FUNCIONES DEL DASHBOARD ---
async function cargarDashboard() {
    // 1. KPI: Vehículos Disponibles
    const vehiculos = await API.get('/vehiculos');
    if (vehiculos) {
        const disponibles = vehiculos.filter(v => v.estado === 'Disponible').length;
        document.getElementById('kpi-disponibles').innerText = disponibles;
    }

    // 2. KPI: Ingresos Totales
    const reporte = await API.get('/reporte-rentas');
    if (reporte) {
        // Agregamos parseFloat() para obligar a JS a hacer matemática pura
        const ingresosTotales = reporte.reduce((sum, r) => sum + parseFloat(r.total_generado), 0);
        
        // Formateamos con comas y siempre mostrando 2 decimales
        document.getElementById('kpi-ingresos').innerText = `RD$ ${ingresosTotales.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // 3. KPI: Rentas Activas y Tabla Dinámica
    const rentas = await API.get('/rentas');
    const tbody = document.getElementById('tabla-ultimas-rentas');
    
    if (rentas && rentas.length > 0) {
        // Filtrar estrictamente las "Activas" para que el número baje cuando devuelvas un auto
        const activas = rentas.filter(r => r.estado === 'Activa').length;
        document.getElementById('kpi-rentas').innerText = activas;

        // Voltear el arreglo para ver las más recientes primero y tomar solo las últimas 5
        const ultimas = rentas.reverse().slice(0, 5);
        
        tbody.innerHTML = ultimas.map(r => `
            <tr>
                <td class="fw-bold">#${r.id}</td>
                <td>${r.cliente}</td>
                <td>${r.vehiculo}</td>
                <td>${r.fecha_renta}</td>
                <td><span class="badge ${r.estado === 'Activa' ? 'bg-primary' : 'bg-success'}">${r.estado}</span></td>
            </tr>
        `).join('');
    } else {
        document.getElementById('kpi-rentas').innerText = '0';
        if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay transacciones registradas.</td></tr>';
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
    tbody.innerHTML = marcas.map(m => `
            <tr>
                <td>${m.id}</td>
                <td class="fw-bold">${m.descripcion}</td>
                <td><span class="badge ${m.estado ? 'bg-success':'bg-danger'}">${m.estado ? 'Activo':'Inactivo'}</span></td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="eliminarMarca(${m.id})">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
}

async function eliminarMarca(id) {
    if (confirm("¿Estás segura de que deseas eliminar esta marca?")) {
        const respuesta = await API.delete(`/marcas/${id}`);
        if (respuesta) {
            cargarMarcas(); 
        }
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
    if (!tbody) return;
    const vehiculos = await API.get('/vehiculos');
    if (vehiculos && vehiculos.length > 0) {
        tbody.innerHTML = vehiculos.map(v => `
            <tr>
                <td>${v.id}</td>
                <td class="fw-bold">${v.descripcion}</td>
                <td>${v.no_placa}</td>
                <td>${v.no_chasis}</td>
                <td>${v.no_motor}</td>
                <td><span class="badge ${v.estado === 'Disponible' ? 'bg-success' : 'bg-warning'}">${v.estado}</span></td>
                <td><button class="btn btn-sm btn-danger" onclick="eliminarRegistro('/vehiculos', ${v.id}, cargarVehiculos)"><i class="fa-solid fa-trash"></i></button></td>
            </tr>
        `).join('');
    } else {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay vehículos registrados.</td></tr>';
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
    if (!tbody) return;
    
    const clientes = await API.get('/clientes');
    
    if (clientes && clientes.length > 0) {
        tbody.innerHTML = clientes.map(c => `
            <tr>
                <td>${c.id}</td>
                <td class="fw-bold">${c.nombre}</td>
                <td>${c.cedula}</td>
                <td>${c.tipo_persona}</td>
                <td>RD$ ${parseFloat(c.limite_credito).toLocaleString()}</td>
                <td><span class="badge ${c.estado ? 'bg-success':'bg-danger'}">${c.estado ? 'Activo':'Inactivo'}</span></td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="eliminarRegistro('/clientes', ${c.id}, cargarClientes)">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } else {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No hay clientes registrados.</td></tr>';
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

// FUNCIONES DE CATÁLOGOS (MODELOS)
async function cargarModelos() {
    const tbody = document.getElementById('tabla-modelos');
    if (!tbody) return;
    
    const modelos = await API.get('/modelos');
    
    if (modelos && modelos.length > 0) {
        tbody.innerHTML = modelos.map(m => `
            <tr>
                <td>${m.id}</td>
                <td>${m.id_marca}</td>
                <td class="fw-bold">${m.descripcion}</td>
                <td><span class="badge ${m.estado ? 'bg-success':'bg-danger'}">${m.estado ? 'Activo':'Inactivo'}</span></td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="eliminarRegistro('/modelos', ${m.id}, cargarModelos)">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } else {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay modelos registrados.</td></tr>';
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

// TIPOS DE VEHÍCULOS Y COMBUSTIBLES
if (document.getElementById('tabla-tipos')) {
    cargarTablaSimple('/tipos_vehiculo', 'tabla-tipos');
    document.getElementById('form-tipo').addEventListener('submit', async (e) => {
        e.preventDefault();
        await API.post('/tipos_vehiculo', { descripcion: document.getElementById('desc-tipo').value });
        location.reload();
    });

    cargarTablaSimple('/combustibles', 'tabla-combustibles');
    document.getElementById('form-combustible').addEventListener('submit', async (e) => {
        e.preventDefault();
        await API.post('/combustibles', { descripcion: document.getElementById('desc-combustible').value });
        location.reload();
    });
}

// FUNCIONES DE EMPLEADOS
if (document.getElementById('form-empleado')) {
    cargarTablaSimple('/empleados', 'tabla-empleados'); 
    document.getElementById('form-empleado').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            nombre: document.getElementById('emp-nombre').value,
            cedula: document.getElementById('emp-cedula').value,
            tanda_labor: document.getElementById('emp-tanda').value,
            porciento_comision: document.getElementById('emp-comision').value,
            fecha_ingreso: document.getElementById('emp-fecha').value
        };
        if (await API.post('/empleados', data)) {
            alert('Empleado registrado exitosamente');
            location.reload();
        }
    });
}

async function cargarEmpleados() {
    const tbody = document.getElementById('tabla-empleados');
    if (!tbody) return;
    const empleados = await API.get('/empleados');
    if (empleados && empleados.length > 0) {
        tbody.innerHTML = empleados.map(e => `
            <tr>
                <td>${e.id}</td>
                <td class="fw-bold">${e.nombre}</td>
                <td>${e.cedula}</td>
                <td>${e.tanda_labor}</td>
                <td>${e.porciento_comision}%</td>
                <td>${e.fecha_ingreso}</td>
                <td><span class="badge ${e.estado ? 'bg-success' : 'bg-danger'}">Activo</span></td>
                <td><button class="btn btn-sm btn-danger" onclick="eliminarRegistro('/empleados', ${e.id}, cargarEmpleados)"><i class="fa-solid fa-trash"></i></button></td>
            </tr>
        `).join('');
    } else {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">No hay empleados registrados.</td></tr>';
    }
}

// Gestión de Empleados
if (document.getElementById('form-empleado')) {
    cargarEmpleados(); // 
    
    document.getElementById('form-empleado').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            nombre: document.getElementById('emp-nombre').value,
            cedula: document.getElementById('emp-cedula').value,
            tanda_labor: document.getElementById('emp-tanda').value,
            porciento_comision: document.getElementById('emp-comision').value,
            fecha_ingreso: document.getElementById('emp-fecha').value
        };
        if (await API.post('/empleados', data)) {
            document.getElementById('form-empleado').reset();
            cargarEmpleados(); 
        }
    });
}

async function cargarTipos() {
    const tbody = document.getElementById('tabla-tipos');
    const datos = await API.get('/tipos_vehiculo');
    if (datos && datos.length > 0) {
        tbody.innerHTML = datos.map(t => `
            <tr>
                <td>${t.id}</td>
                <td class="fw-bold">${t.descripcion}</td>
                <td><span class="badge ${t.estado ? 'bg-success':'bg-danger'}">Activo</span></td>
                <td><button class="btn btn-sm btn-danger" onclick="eliminarRegistro('/tipos_vehiculo', ${t.id}, cargarTipos)"><i class="fa-solid fa-trash"></i></button></td>
            </tr>
        `).join('');
    } else {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No hay registros.</td></tr>';
    }
}

async function cargarCombustibles() {
    const tbody = document.getElementById('tabla-combustibles');
    const datos = await API.get('/combustibles');
    if (datos && datos.length > 0) {
        tbody.innerHTML = datos.map(c => `
            <tr>
                <td>${c.id}</td>
                <td class="fw-bold">${c.descripcion}</td>
                <td><span class="badge ${c.estado ? 'bg-success':'bg-danger'}">Activo</span></td>
                <td><button class="btn btn-sm btn-danger" onclick="eliminarRegistro('/combustibles', ${c.id}, cargarCombustibles)"><i class="fa-solid fa-trash"></i></button></td>
            </tr>
        `).join('');
    } else {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center">No hay registros.</td></tr>';
    }
}

async function eliminarRegistro(endpoint, id, funcionRecargar) {
    if (confirm("¿Estás segura de que deseas eliminar este registro?")) {
        const respuesta = await API.delete(`${endpoint}/${id}`);
        if (respuesta) {
            funcionRecargar(); 
        }
    }
}