import { useEffect, useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { obtenerProveedores, obtenerProveedorPorId, crearProveedor } from '../services/providers.service';
import { obtenerDepartamentos, obtenerProvincias, obtenerDistritos } from '../services/ubigeos.service';
import { obtenerCatalogo } from '../services/catalogos.service';
import ModalProveedor from '../components/ModalProveedor';
import ModalVerProveedor from '../components/ModalVerProveedor';

const colors = {
    card: '#ffffff',
    border: '#e5e7eb',
    text: '#111827',
    textMuted: '#6b7280',
    primary: '#2563eb',
    amber: '#f59e0b',
    success: '#166534',
    successBg: '#dcfce7',
    danger: '#991b1b',
    dangerBg: '#fee2e2',
};

const styles = {
    heading: {
        fontSize: '24px',
        fontWeight: 700,
        color: colors.text,
        margin: 0,
    },
    card: {
        background: colors.card,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    },
    toolbarRow: {
        display: 'flex',
        alignItems: 'stretch',
        gap: '24px',
        flexWrap: 'wrap',
    },
    toolbarSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        flex: 1,
        minWidth: '260px',
    },
    toolbarLabel: {
        fontSize: '13px',
        fontWeight: 700,
        color: colors.text,
        margin: 0,
    },
    toolbarDivider: {
        width: '1px',
        background: colors.border,
        alignSelf: 'stretch',
    },
    searchInput: {
        width: '100%',
        padding: '10px 12px',
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        fontSize: '14px',
        color: colors.text,
        outline: 'none',
        boxSizing: 'border-box',
    },
    btnPrimary: {
        background: colors.primary,
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 20px',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    th: {
        textAlign: 'left',
        padding: '12px 16px',
        fontSize: '13px',
        fontWeight: 700,
        color: colors.text,
        borderBottom: `1px solid ${colors.border}`,
        background: '#f9fafb',
    },
    td: {
        padding: '14px 16px',
        fontSize: '14px',
        color: colors.text,
        borderBottom: `1px solid ${colors.border}`,
    },
    badge: (ok) => ({
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 700,
        background: ok ? colors.successBg : colors.dangerBg,
        color: ok ? colors.success : colors.danger,
    }),
    rowActions: {
        display: 'flex',
        gap: '8px',
    },
    linkBtn: {
        background: colors.primary,
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        padding: '7px 14px',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
    },
    linkBtnAmber: {
        background: colors.amber,
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        padding: '7px 14px',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'pointer',
    },
    linkBtnDisabled: {
        background: '#d1d5db',
        color: '#9ca3af',
        border: 'none',
        borderRadius: '6px',
        padding: '7px 14px',
        fontSize: '13px',
        fontWeight: 600,
        cursor: 'not-allowed',
    },
    emptyState: {
        padding: '32px 16px',
        textAlign: 'center',
        color: colors.textMuted,
        fontSize: '14px',
    },
    labelForm: {
        display: 'block',
        marginBottom: '5px',
        fontWeight: '600',
        fontSize: '14px',
        color: colors.text
    },
    inputForm: {
        width: '100%',
        padding: '10px',
        border: '1px solid #D1D5DB',
        borderRadius: '6px',
        marginBottom: '15px',
        boxSizing: 'border-box'
    }
};

export default function ProvidersPage() {
    const [proveedores, setProveedores] = useState([]);
    const [filtro, setFiltro] = useState('');
    
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConsultaVisible, setModalConsultaVisible] = useState(false);
    const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
    const [proveedorEditar, setProveedorEditar] = useState(null);

    const usuarioRaw = localStorage.getItem('usuario');
    const usuarioLogueado = usuarioRaw ? JSON.parse(usuarioRaw) : null;
    
    const esAdmin = usuarioLogueado?.rol_codigo === 'ADMIN';
    const esProveedor = usuarioLogueado?.rol_codigo === 'PROVEEDOR';
    const esConsultor = usuarioLogueado?.rol_codigo === 'CONSULTOR'; 
    const miProveedorId = usuarioLogueado?.proveedor_id;

    const [form, setForm] = useState({
        tipo_documento: '06',
        nro_documento: '',
        nombre: '',
        apellido_paterno: '',
        apellido_materno: '',
        razon_social: '',
        representante_legal: '',
        correo: '',
        telefono: '',
        departamento: '',
        provincia: '',
        ciudad: '',
        ubigeo: '',
        direccion: '', 
        ciiu: '',
        calificacion: 'R',
        status: 'A'
    });

    const [departamentos, setDepartamentos] = useState([]);
    const [provincias, setProvincias] = useState([]);
    const [ciudades, setCiudades] = useState([]);
    const [ciius, setCiius] = useState([]);

    // EFFECT 1: Control de sesión y listado general basado en el filtro por Razón Social
    useEffect(() => {
        verificarYCargarProveedores();
    }, [filtro]);

    // EFFECT 2: Carga de catálogos iniciales (se carga siempre para poder traducir
    // códigos como el CIIU a su descripción en cualquier vista, no solo en el autoregistro)
    useEffect(() => {
        cargarInicialForm();
    }, []);

    const verificarYCargarProveedores = async () => {
        try {
            const paramsCache = `?_cb=${new Date().getTime()}`;
            
            if (esProveedor) {
                if (miProveedorId) {
                    const miFichaUnica = await obtenerProveedorPorId(miProveedorId);
                    if (miFichaUnica) {
                        setProveedores([miFichaUnica]);
                        return;
                    }
                }

                const data = await obtenerProveedores(paramsCache);
                if (data && data.length > 0) {
                    const miFichaReal = data.find(p => 
                        (p.correo && p.correo.toLowerCase() === usuarioLogueado?.username?.toLowerCase() + '@gmail.com') ||
                        (p.proveedor && p.proveedor.toLowerCase().includes(usuarioLogueado?.username?.toLowerCase()))
                    );

                    if (miFichaReal) {
                        setProveedores([miFichaReal]);

                        const usuarioCorregido = {
                            ...usuarioLogueado,
                            proveedor_id: miFichaReal.proveedor_id || miFichaReal.PROVEEDOR_ID,
                            // Conserva el bloqueo de edición 'L' si ya venía impuesto desde el inicio
                            primer_ingreso: usuarioLogueado?.primer_ingreso === 'L' ? 'L' : 'N'
                        };
                        localStorage.setItem('usuario', JSON.stringify(usuarioCorregido));
                        window.location.reload();
                    }
                }
            } else {
                const data = await obtenerProveedores(paramsCache);
                setProveedores(data);
            }
        } catch(error){
            console.error("Error al cargar proveedores:", error);
        }
    };

    const cargarInicialForm = async () => {
        try {
            const [resDeps, resCiiu] = await Promise.allSettled([
                obtenerDepartamentos(),
                obtenerCatalogo('0002', 'CODIGO_CIIU_SUNAT')
            ]);
            
            if (resDeps.status === 'fulfilled') {
                const rawDeps = resDeps.value?.data || resDeps.value || [];
                setDepartamentos(Array.isArray(rawDeps) ? rawDeps : []);
            }

            if (resCiiu.status === 'fulfilled') {
                const rawCiiu = resCiiu.value?.data || resCiiu.value || [];
                setCiius(Array.isArray(rawCiiu) ? rawCiiu : []); 
            }
        } catch (error) {
            console.error("Error crítico al inicializar el formulario:", error);
        }
    };

    const handleDepartamentoChange = async (e) => {
        const depName = e.target.value; 
        setForm(prev => ({ ...prev, departamento: depName, provincia: '', ciudad: '', ubigeo: '' }));
        setProvincias([]);
        setCiudades([]);
        if (depName) {
            try {
                const res = await obtenerProvincias(depName);
                const data = res?.data || res || [];
                setProvincias(Array.isArray(data) ? data : []);
            } catch (err) { console.error(err); }
        }
    };

    const handleProvinciaChange = async (e) => {
        const provName = e.target.value; 
        setForm(prev => ({ ...prev, provincia: provName, ciudad: '', ubigeo: '' }));
        setCiudades([]);
        if (provName) {
            try {
                const res = await obtenerDistritos(form.departamento, provName);
                const data = res?.data || res || [];
                setCiudades(Array.isArray(data) ? data : []);
            } catch (err) { console.error(err); }
        }
    };

    const handleDistritoChange = (e) => {
        const selectedValue = e.target.value; 
        
        const distObjeto = ciudades.find(c => 
            (c.ubigeo_inei || c.UBIGEO_INEI || c.ubigeo_reniec || c.id || '').toString() === selectedValue.toString()
        );
        const nombreDistrito = distObjeto?.distrito || distObjeto?.DISTRITO || distObjeto?.name || selectedValue;

        setForm(prev => ({ 
            ...prev, 
            ciudad: nombreDistrito, 
            ubigeo: selectedValue    
        }));
    };

    const guardarAutoregistro = async (e) => {
        e.preventDefault();
        try {
            // Para persona natural (DNI / Carnet de Extranjería) no se captura razón social,
            // por lo que se construye a partir de nombre y apellidos para no enviarla vacía
            // (esto era lo que provocaba el error al grabar).
            const razonSocialFinal = esEmpresa
                ? form.razon_social
                : `${form.nombre} ${form.apellido_paterno} ${form.apellido_materno}`.trim();

            const res = await crearProveedor({
                ...form,
                razon_social: razonSocialFinal,
                // El representante legal solo aplica a empresas (RUC)
                representante_legal: esEmpresa ? form.representante_legal : '',
                create_by: usuarioLogueado.usuario_id,
                usuario_id: usuarioLogueado.usuario_id
            });

            const nuevoProveedorId = res?.proveedor_id || res?.data?.proveedor_id;

            if (nuevoProveedorId) {
                const usuarioActualizado = {
                    ...usuarioLogueado,
                    proveedor_id: nuevoProveedorId,
                    // 💡 CONTROL DE PERMISO: Conserva 'L' si estaba bloqueado por el administrador global
                    primer_ingreso: usuarioLogueado?.primer_ingreso === 'L' ? 'L' : 'N'
                };
                localStorage.setItem('usuario', JSON.stringify(usuarioActualizado));
                alert('Ficha corporativa registrada correctamente. Ingresando al panel de control.');
                window.location.reload();
            } else {
                alert('Ficha registrada correctamente. Reinicie sesión para actualizar sus accesos.');
                localStorage.removeItem('usuario'); 
                window.location.replace('/'); 
            }
        } catch (error) {
            alert(error.response?.data?.message || error.message);
        }
    };

    const proveedoresFiltrados = proveedores.filter(
        item => (item.proveedor || '').toLowerCase().includes(filtro.toLowerCase())
    );

    const consultarProveedor = async (proveedorId) => {
        try {
            const data = await obtenerProveedorPorId(proveedorId);
            setProveedorSeleccionado(data);
            setModalConsultaVisible(true);
        } catch (error) { console.error(error); }
    };

    const usuarioRawFresco = localStorage.getItem('usuario');
    const usuarioLogueadoFresco = usuarioRawFresco ? JSON.parse(usuarioRawFresco) : null;

    // El backend solo maneja "primer_ingreso" en SEG_USUARIO: se pone en 'N' automáticamente
    // al autoregistrarse (ver proveedores.repository.js -> crear). No existen columnas
    // cod_estado_registro / cod_estado_edicion en MAE_PROVEEDOR. Una vez registrada la ficha
    // ('N') queda bloqueada para el propio proveedor hasta que un administrador la habilite
    // explícitamente (primer_ingreso = 'H').
    const puedeEditarFichaCompleta = !esConsultor && (!esProveedor || usuarioLogueadoFresco?.primer_ingreso === 'H');

    const editarProveedor = async (proveedorId) => {
        if (esConsultor) {
            alert("Acceso denegado: El rol CONSULTOR solo cuenta con permisos de lectura.");
            return;
        }
        if (esProveedor && !puedeEditarFichaCompleta) {
            alert("La edición de la Ficha Informativa se encuentra BLOQUEADA. Solicite la habilitación al Administrador.");
            return;
        }
        try {
            const data = await obtenerProveedorPorId(proveedorId);
            setProveedorEditar(data);
            setModalVisible(true);
        } catch (error) { console.error(error); }
    };

    const esEmpresa = form.tipo_documento === '06';

    return (
        <MainLayout>
            <style>{`
                @media (max-width: 700px) {
                    .toolbar-divider { display: none; }
                    .toolbar-section { min-width: 100% !important; }
                }
                .table-scroll {
                    width: 100%;
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                }
                .table-scroll table {
                    min-width: 720px;
                }
                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                    gap: 20px;
                    margin-bottom: 20px;
                }
            `}</style>

            {esProveedor && !miProveedorId ? (
                /* CASO A: FORMULARIO DE AUTOREGISTRO */
                <div style={{ maxWidth: '850px', margin: '0 auto', padding: '10px 0' }}>
                    <div style={{ marginBottom: '25px' }}>
                        <h1 style={styles.heading}>Completar Ficha de Proveedor</h1>
                        <p style={{ color: colors.textMuted, margin: '5px 0 0 0', fontSize: '14px' }}>
                            Por favor, registre la información oficial de su entidad para habilitar sus accesos dentro de la plataforma.
                        </p>
                    </div>

                    <form onSubmit={guardarAutoregistro} style={styles.card}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <label style={styles.labelForm}>Tipo Documento *</label>
                                <select style={styles.inputForm} value={form.tipo_documento} onChange={e => setForm({...form, tipo_documento: e.target.value})}>
                                    <option value="06">RUC</option>
                                    <option value="01">DNI</option>
                                    <option value="04">Carnet de Extranjería</option>
                                </select>
                            </div>
                            <div>
                                <label style={styles.labelForm}>Nro Documento *</label>
                                <input required type="text" style={styles.inputForm} value={form.nro_documento} onChange={e => setForm({...form, nro_documento: e.target.value})} />
                            </div>
                        </div>

                        {esEmpresa ? (
                            <div style={{ marginBottom: '15px' }}>
                                <label style={styles.labelForm}>Razón Social *</label>
                                <input required type="text" style={styles.inputForm} value={form.razon_social} onChange={e => setForm({...form, razon_social: e.target.value})} />
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={styles.labelForm}>Nombre *</label>
                                    <input required type="text" style={styles.inputForm} value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} />
                                </div>
                                <div>
                                    <label style={styles.labelForm}>Apellido Paterno *</label>
                                    <input required type="text" style={styles.inputForm} value={form.apellido_paterno} onChange={e => setForm({...form, apellido_paterno: e.target.value})} />
                                </div>
                                <div>
                                    <label style={styles.labelForm}>Apellido Materno *</label>
                                    <input required type="text" style={styles.inputForm} value={form.apellido_materno} onChange={e => setForm({...form, apellido_materno: e.target.value})} />
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <label style={styles.labelForm}>Correo Contacto *</label>
                                <input required type="email" style={styles.inputForm} value={form.correo} onChange={e => setForm({...form, correo: e.target.value})} />
                            </div>
                            <div>
                                <label style={styles.labelForm}>Teléfono *</label>
                                <input required type="text" style={styles.inputForm} value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} />
                            </div>
                        </div>

                        {esEmpresa && (
                            <div style={{ marginBottom: '15px' }}>
                                <label style={styles.labelForm}>Representante Legal *</label>
                                <input required type="text" style={styles.inputForm} value={form.representante_legal} onChange={e => setForm({...form, representante_legal: e.target.value})} />
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                            <div>
                                <label style={styles.labelForm}>Departamento *</label>
                                <select required style={styles.inputForm} value={form.departamento} onChange={handleDepartamentoChange}>
                                    <option value="">Seleccione</option>
                                    {departamentos.map((d, index) => {
                                        const name = d?.departamento || d?.DEPARTAMENTO || d?.name || d?.nombre;
                                        return <option key={index} value={name}>{name}</option>;
                                    })}
                                </select>
                            </div>
                            <div>
                                <label style={styles.labelForm}>Provincia *</label>
                                <select required style={styles.inputForm} value={form.provincia} onChange={handleProvinciaChange}>
                                    <option value="">Seleccione</option>
                                    {provincias.map((p, index) => {
                                        const name = p?.provincia || p?.PROVINCIA || p?.name || p?.nombre;
                                        return <option key={index} value={name}>{name}</option>;
                                    })}
                                </select>
                            </div>
                            <div>
                                <label style={styles.labelForm}>Distrito / Ciudad *</label>
                                <select required style={styles.inputForm} value={form.ubigeo} onChange={handleDistritoChange}>
                                    <option value="">Seleccione</option>
                                    {ciudades.map((c, index) => {
                                        const id = c?.ubigeo_inei || c?.UBIGEO_INEI || c?.ubigeo_reniec || c?.codigo || c?.id;
                                        const name = c?.distrito || c?.DISTRITO || c?.name || c?.nombre;
                                        return <option key={index} value={id}>{name}</option>;
                                    })}
                                </select>
                            </div>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={styles.labelForm}>Dirección *</label>
                            <input required type="text" style={styles.inputForm} value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})} />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={styles.labelForm}>Actividad Económica (CIIU) *</label>
                            <select required style={styles.inputForm} value={form.ciiu} onChange={e => setForm({...form, ciiu: e.target.value})}>
                                <option value="">Seleccione Actividad</option>
                                {ciius.map((c, index) => {
                                    const obj = Object.keys(c).reduce((acc, key) => {
                                        acc[key.toLowerCase()] = c[key];
                                        return acc;
                                    }, {});

                                    const code = obj.codigo_valor || obj.ciiu || obj.id_ciiu || obj.nro_ciiu || obj.code || obj.codigo || obj.id_catalogo;
                                    const label = obj.label || obj.descripcion || obj.nombre || obj.actividad || obj.descripcion_ciiu;
                                    
                                    return <option key={index} value={code}>{code} - {label}</option>;
                                })}
                            </select>
                        </div>

                        <button type="submit" style={{ ...styles.btnPrimary, width: '100%', padding: '12px' }}>
                            Guardar Ficha Informativa
                        </button>
                    </form>
                </div>
            ) : (esProveedor && miProveedorId) ? (
                /* CASO B: PROVEEDOR LOGUEADO CON EMPRESA ASIGNADA (VISTA INDIVIDUAL) */
                <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '10px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: `1px solid ${colors.border}`, paddingBottom: '20px' }}>
                        <div>
                            <h1 style={styles.heading}>Bienvenido</h1>
                            <p style={{ color: colors.textMuted, margin: '5px 0 0 0', fontSize: '14px' }}>
                                Bienvenido al panel corporativo exclusivo para el seguimiento de la ficha informativa.
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            {puedeEditarFichaCompleta ? (
                                <button style={styles.linkBtnAmber} onClick={() => editarProveedor(proveedores[0]?.proveedor_id || proveedores[0]?.PROVEEDOR_ID)}>
                                    Modificar Ficha
                                </button>
                            ) : (
                                <button style={styles.linkBtnDisabled} onClick={() => alert("La edición de la Ficha Informativa se encuentra BLOQUEADA. Solicite la habilitación al Administrador.")}>
                                    Modificar Ficha (Bloqueado)
                                </button>
                            )}
                            <span style={styles.badge((proveedores[0]?.status || proveedores[0]?.STATUS) === 'A')}>
                                {(proveedores[0]?.status || proveedores[0]?.STATUS) === 'A' ? 'ACTIVO' : 'INACTIVO'}
                            </span>
                        </div>
                    </div>

                    <div style={styles.card}>
                        <h3 style={{ margin: '0 0 25px 0', fontSize: '16px', fontWeight: '700', color: colors.text, borderBottom: `1px solid ${colors.border}`, paddingBottom: '10px' }}>
                            Información del Proveedor
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: colors.textMuted, fontWeight: '700' }}>TIPO DOCUMENTO</label>
                                <div style={{ padding: '8px 0', fontSize: '14px', fontWeight: '500', color: colors.text }}>{proveedores[0]?.descripcion_tipo_documento || proveedores[0]?.tipo_documento}</div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: colors.textMuted, fontWeight: '700' }}>NÚMERO DE DOCUMENTO</label>
                                <div style={{ padding: '8px 0', fontSize: '14px', fontWeight: '500', color: colors.text }}>{proveedores[0]?.nro_documento}</div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: colors.textMuted, fontWeight: '700' }}>TELÉFONO</label>
                                <div style={{ padding: '8px 0', fontSize: '14px', fontWeight: '500', color: colors.text }}>{proveedores[0]?.telefono || 'No registrado'}</div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: colors.textMuted, fontWeight: '700' }}>CORREO ELECTRÓNICO</label>
                                <div style={{ padding: '8px 0', fontSize: '14px', fontWeight: '500', color: colors.text, wordBreak: 'break-all' }}>{proveedores[0]?.correo || 'No registrado'}</div>
                            </div>
                        </div>

                        {/* Identidad: RUC → Razón Social | DNI/CE → Nombres */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px', borderTop: `1px solid ${colors.border}`, paddingTop: '20px', marginTop: '5px', marginBottom: '5px' }}>
                            {(proveedores[0]?.tipo_documento === '06') ? (
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', fontSize: '11px', color: colors.textMuted, fontWeight: '700' }}>RAZÓN SOCIAL</label>
                                    <div style={{ padding: '8px 0', fontSize: '14px', fontWeight: '500', color: colors.text }}>{proveedores[0]?.razon_social || 'No registrada'}</div>
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', color: colors.textMuted, fontWeight: '700' }}>NOMBRE</label>
                                        <div style={{ padding: '8px 0', fontSize: '14px', fontWeight: '500', color: colors.text }}>{proveedores[0]?.nombre || 'No registrado'}</div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', color: colors.textMuted, fontWeight: '700' }}>APELLIDO PATERNO</label>
                                        <div style={{ padding: '8px 0', fontSize: '14px', fontWeight: '500', color: colors.text }}>{proveedores[0]?.apellido_paterno || 'No registrado'}</div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', color: colors.textMuted, fontWeight: '700' }}>APELLIDO MATERNO</label>
                                        <div style={{ padding: '8px 0', fontSize: '14px', fontWeight: '500', color: colors.text }}>{proveedores[0]?.apellido_materno || 'No registrado'}</div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px', borderTop: `1px solid ${colors.border}`, paddingTop: '20px', marginTop: '15px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: colors.textMuted, fontWeight: '700' }}>ACTIVIDAD ECONÓMICA (CIIU)</label>
                                <div style={{ padding: '8px 0', fontSize: '14px', fontWeight: '500', color: colors.text }}>{proveedores[0]?.ciiu ? `${proveedores[0].ciiu} - ${proveedores[0]?.descripcion_ciiu || ''}` : 'No especificada'}</div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: colors.textMuted, fontWeight: '700' }}>DEPARTAMENTO</label>
                                <div style={{ padding: '8px 0', fontSize: '14px', fontWeight: '500', color: colors.text }}>{proveedores[0]?.departamento || 'No registrado'}</div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: colors.textMuted, fontWeight: '700' }}>PROVINCIA</label>
                                <div style={{ padding: '8px 0', fontSize: '14px', fontWeight: '500', color: colors.text }}>{proveedores[0]?.provincia || 'No registrado'}</div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', color: colors.textMuted, fontWeight: '700' }}>DISTRITO / CIUDAD</label>
                                <div style={{ padding: '8px 0', fontSize: '14px', fontWeight: '500', color: colors.text }}>{proveedores[0]?.ciudad || 'No registrado'}</div>
                            </div>
                        </div>

                        <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '20px', marginTop: '15px' }}>
                            <label style={{ display: 'block', fontSize: '11px', color: colors.textMuted, fontWeight: '700' }}>DIRECCIÓN</label>
                            <div style={{ padding: '8px 0', fontSize: '14px', color: colors.text, fontWeight: '500' }}>{proveedores[0]?.direccion || 'Sin dirección registrada'}</div>
                        </div>
                    </div>
                </div>
            ) : (
                /* CASO C: VISTA PANEL GENERAL PARA ADMINISTRADORES Y CONSULTORES GLOBAL */
                <>
                    <h1 style={styles.heading}>Proveedores</h1>

                    <div style={{ ...styles.card, marginTop: '20px' }}>
                        <div style={styles.toolbarRow}>
                            <div style={styles.toolbarSection}>
                                <p style={styles.toolbarLabel}>Búsqueda por Razón Social</p>
                                <div style={styles.searchControls}>
                                    <input
                                        type="text"
                                        value={filtro}
                                        onChange={(e) => setFiltro(e.target.value)}
                                        placeholder="Ingrese el nombre de la empresa..."
                                        style={styles.searchInput}
                                    />
                                </div>
                            </div>

                            {esAdmin && (
                                <>
                                    <div style={styles.toolbarDivider} />
                                    <div style={styles.toolbarSection}>
                                        <p style={styles.toolbarLabel}>Acciones de Registro</p>
                                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                            <button style={styles.btnPrimary} onClick={() => setModalVisible(true)}>
                                                + Nuevo Proveedor
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div style={{ ...styles.card, marginTop: '20px', padding: 0, overflowX: 'auto' }}>
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Tipo Documento</th>
                                    <th style={styles.th}>Nro Documento</th>
                                    <th style={styles.th}>Razón Social</th>
                                    <th style={styles.th}>Actividad Económica</th>
                                    <th style={styles.th}>Estado Documentos</th>
                                    <th style={styles.th}>Estado</th>
                                    <th style={styles.th}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {proveedoresFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={styles.emptyState}>No se encontraron proveedores.</td>
                                    </tr>
                                ) : proveedoresFiltrados.map(item => {
                                    const tieneVencidos = Number(item.doc_vencidos) > 0;
                                    const esActivo = item.status === 'A';

                                    return (
                                        <tr key={item.proveedor_id}>
                                            <td style={styles.td}>{item.tipo_documento}</td>
                                            <td style={styles.td}>{item.nro_documento}</td>
                                            <td style={styles.td}>{item.proveedor}</td>
                                            <td style={styles.td}>{item.actividad_economica}</td>
                                            <td style={styles.td}>
                                                <span style={styles.badge(!tieneVencidos)}>
                                                    {tieneVencidos ? 'VENCIDOS' : 'VIGENTES'}
                                                </span>
                                            </td>
                                            <td style={styles.td}>
                                                <span style={styles.badge(esActivo)}>
                                                    {esActivo ? 'ACTIVO' : 'INACTIVO'}
                                                </span>
                                            </td>
                                            <td style={styles.td}>
                                                <div style={styles.rowActions}>
                                                    <button style={styles.linkBtn} onClick={() => consultarProveedor(item.proveedor_id)}>
                                                        Ver
                                                    </button>
                                                    {esAdmin && (
                                                        <button style={styles.linkBtnAmber} onClick={() => editarProveedor(item.proveedor_id)}>
                                                            Editar
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            <ModalProveedor
                visible={modalVisible}
                proveedorEditar={proveedorEditar}
                onClose={() => {
                    setModalVisible(false);
                    setProveedorEditar(null);
                }}
                onSuccess={verificarYCargarProveedores}
            />

            <ModalVerProveedor
                visible={modalConsultaVisible}
                proveedor={proveedorSeleccionado}
                onClose={() => setModalConsultaVisible(false)}
            />
        </MainLayout>
    );
}