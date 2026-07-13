import { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import { buscarProveedor, obtenerProveedorPorId } from '../services/providers.service';
import { listarPorGrupo } from '../services/documentos.service';
import ModalDocumento from '../components/ModalDocumento';
import { Lock } from 'lucide-react';

const colors = {
	bg: '#f3f4f6',
	card: '#ffffff',
	border: '#e5e7eb',
	text: '#111827',
	textMuted: '#6b7280',
	primary: '#2563eb',
	primaryHover: '#1d4ed8',
	amber: '#f59e0b',
	amberHover: '#d97706',
	success: '#059669',
	successBg: '#d1fae5',
	danger: '#dc2626',
	dangerBg: '#fee2e2',
};

const styles = {
	card: {
		background: colors.card,
		border: `1px solid ${colors.border}`,
		borderRadius: '12px',
		padding: '24px',
		boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
	},
	title: {
		fontSize: '22px',
		fontWeight: 700,
		color: colors.text,
		margin: '0 0 20px 0',
	},
	sectionTitle: {
		fontSize: '17px',
		fontWeight: 700,
		color: colors.text,
		margin: '24px 0 16px 0',
	},
	radioRow: {
		display: 'flex',
		gap: '24px',
		marginBottom: '16px',
	},
	radioLabel: {
		display: 'flex',
		alignItems: 'center',
		gap: '6px',
		fontSize: '14px',
		color: colors.text,
		cursor: 'pointer',
	},
	searchRow: {
		display: 'flex',
		gap: '10px',
	},
	input: {
		flex: 1,
		maxWidth: '320px',
		padding: '9px 12px',
		border: `1px solid ${colors.border}`,
		borderRadius: '8px',
		fontSize: '14px',
		color: colors.text,
		outline: 'none',
	},
	btnPrimary: {
		background: colors.primary,
		color: '#fff',
		border: 'none',
		borderRadius: '8px',
		padding: '9px 18px',
		fontSize: '14px',
		fontWeight: 600,
		cursor: 'pointer',
	},
	btnAmber: {
		background: colors.amber,
		color: '#fff',
		border: 'none',
		borderRadius: '8px',
		padding: '9px 18px',
		fontSize: '14px',
		fontWeight: 600,
		cursor: 'pointer',
	},
	btnGhost: {
		background: '#fff',
		color: colors.text,
		border: `1px solid ${colors.border}`,
		borderRadius: '8px',
		padding: '9px 16px',
		fontSize: '14px',
		fontWeight: 600,
		cursor: 'pointer',
	},
	btnGhostActive: {
		background: colors.primary,
		color: '#fff',
		border: `1px solid ${colors.primary}`,
		borderRadius: '8px',
		padding: '9px 16px',
		fontSize: '14px',
		fontWeight: 600,
		cursor: 'pointer',
	},
	table: {
		width: '100%',
		borderCollapse: 'collapse',
		marginTop: '16px',
	},
	th: {
		textAlign: 'left',
		padding: '12px 16px',
		fontSize: '13px',
		fontWeight: 600,
		color: colors.textMuted,
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
	infoBlock: {
		marginTop: '20px',
		marginBottom: '20px',
		display: 'grid',
		gap: '6px',
	},
	infoLine: {
		fontSize: '14px',
		color: colors.text,
		margin: 0,
	},
	divider: {
		border: 'none',
		borderTop: `1px solid ${colors.border}`,
		margin: '20px 0',
	},
	tabsRow: {
		display: 'flex',
		gap: '10px',
		marginBottom: '20px',
		flexWrap: 'wrap',
	},
	rowActions: {
		display: 'flex',
		gap: '8px',
	},
	linkBtn: {
		background: colors.primary,
		color: '#fff',
		border: 'none',
		borderRadius: '6px',
		padding: '6px 14px',
		fontSize: '13px',
		fontWeight: 600,
		cursor: 'pointer',
	},
	linkBtnAmber: {
		background: colors.amber,
		color: '#fff',
		border: 'none',
		borderRadius: '6px',
		padding: '6px 14px',
		fontSize: '13px',
		fontWeight: 600,
		cursor: 'pointer',
	},
	linkBtnDisabled: {
		background: '#f3f4f6',
		color: '#9ca3af',
		border: '1px solid #e5e7eb',
		borderRadius: '6px',
		padding: '6px 14px',
		fontSize: '13px',
		fontWeight: 600,
		cursor: 'not-allowed',
		display: 'inline-flex',
		alignItems: 'center',
		gap: '6px',
		boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
	},
};

const responsiveCSS = `
    @media (max-width: 640px) {
        .documentos-card { padding: 16px !important; }
        .documentos-search-row { flex-direction: column; align-items: stretch !important; }
        .documentos-search-row input { max-width: 100% !important; }
    }
    .table-scroll {
        width: 100%;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
    }
    .table-scroll table {
        min-width: 560px;
    }
`;

export default function DocumentsPage() {
	const [tipoBusqueda, setTipoBusqueda] = useState('DOCUMENTO');
	const [valorBusqueda, setValorBusqueda] = useState('');
	const [proveedores, setProveedores] = useState([]);
	const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
	
	const [grupoSeleccionado, setGrupoSeleccionado] = useState('DOC_NOR');
	const [documentos, setDocumentos] = useState([]);

	const [modalDocumentoVisible, setModalDocumentoVisible] = useState(false);
	const [modoDocumento, setModoDocumento] = useState('NUEVO');
	const [documentoSeleccionado, setDocumentoSeleccionado] = useState(null);

	const usuarioRaw = localStorage.getItem('usuario');
	const usuarioLogueado = usuarioRaw ? JSON.parse(usuarioRaw) : null;
	const esProveedor = usuarioLogueado?.rol_codigo === 'PROVEEDOR';
	const esConsultor = usuarioLogueado?.rol_codigo === 'CONSULTOR'; // 👁️ Rol Consultor detectado[cite: 11]
	const miProveedorId = usuarioLogueado?.proveedor_id;

	useEffect(() => {
		const inicializarProveedor = async () => {
			if ((esProveedor || esConsultor) && miProveedorId) {
				try {
					const infoFicha = await obtenerProveedorPorId(miProveedorId);
					setProveedorSeleccionado(infoFicha);
					await cargarDocumentos(miProveedorId, grupoSeleccionado);
				} catch (error) {
					console.error("Error cargando documentos de entidad:", error);
				}
			}
		};
		inicializarProveedor();
	}, [esProveedor, esConsultor, miProveedorId]);

	const buscar = async () => {
		try {
			const data = await buscarProveedor(tipoBusqueda, valorBusqueda);
			if (tipoBusqueda === 'DOCUMENTO') {
				setProveedorSeleccionado(data);
				setProveedores([]);
				await cargarDocumentos(data.proveedor_id, grupoSeleccionado);
			} else {
				setProveedores(data);
				setProveedorSeleccionado(null);
			}
		} catch (error) {
			alert(error.response?.data?.message || error.message);
		}
	};

	const cargarDocumentos = async (proveedorId, group) => {
		try {
			const data = await listarPorGrupo(proveedorId, group);
			setDocumentos(data);
		} catch (error) {
			console.error(error);
		}
	};

	const grupos = [
		{ codigo: 'DOC_NOR', nombre: 'Doc. Normativos' },
		{ codigo: 'DOC_EXT_NOR', nombre: 'Doc. Extra Normativos' },
		{ codigo: 'DOC_REQ_ESTATAL', nombre: 'Doc. Req. Estatal' },
		{ codigo: 'DOC_OTROS', nombre: 'Doc. Otros' },
	];

	// 🔒 CONTROL EN CALIENTE DE LA SESIÓN[cite: 11]
	const usuarioRawFresco = localStorage.getItem('usuario');
	const usuarioLogueadoFresco = usuarioRawFresco ? JSON.parse(usuarioRawFresco) : null;
	const bloqueadoPorAdminEnSesion = usuarioLogueadoFresco?.primer_ingreso === 'L';

	const rawRegistro = proveedorSeleccionado?.cod_estado_registro || proveedorSeleccionado?.COD_ESTADO_REGISTRO || 'B';
	const rawEdicion = proveedorSeleccionado?.cod_estado_edicion || proveedorSeleccionado?.COD_ESTADO_EDICION || 'L';

	const estadoRegistro = String(rawRegistro).trim().toUpperCase();
	const estadoEdicion = String(rawEdicion).trim().toUpperCase();

	// Permite editar si es Admin, Proveedor Habilitado u Observado (Excluye tajantemente al Consultor)[cite: 11]
	const puedeEditarGubernamental = !esConsultor && (!esProveedor || (
		!bloqueadoPorAdminEnSesion && 
		(estadoRegistro === 'B' || estadoRegistro === 'O' || estadoEdicion === 'H')
	));

	return (
		<MainLayout>
			<style>{responsiveCSS}</style>
			<div className="documentos-card" style={styles.card}>

				<h2 style={styles.title}>Documentos</h2>

				{(!esProveedor || esConsultor) && (
					<>
						<div style={styles.radioRow}>
							<label style={styles.radioLabel}>
								<input type="radio" checked={tipoBusqueda === 'DOCUMENTO'} onChange={() => setTipoBusqueda('DOCUMENTO')} />
								Documento
							</label>

							<label style={styles.radioLabel}>
								<input type="radio" checked={tipoBusqueda === 'RAZON'} onChange={() => setTipoBusqueda('RAZON')} />
								Razón Social
							</label>
						</div>

						<div className="documentos-search-row" style={styles.searchRow}>
							<input
								style={styles.input}
								value={valorBusqueda}
								onChange={(e) => setValorBusqueda(e.target.value)}
								placeholder="Valor búsqueda"
							/>
							<button style={styles.btnPrimary} onClick={buscar}>Buscar</button>
						</div>

						{proveedores.length > 0 && (
							<div className="table-scroll">
								<table style={styles.table}>
									<thead>
										<tr>
											<th style={styles.th}>Documento</th>
											<th style={styles.th}>Razón Social</th>
											<th style={styles.th}>Acción</th>
										</tr>
									</thead>
									<tbody>
										{proveedores.map(item => (
											<tr key={item.proveedor_id}>
												<td style={styles.td}>{item.nro_documento}</td>
												<td style={styles.td}>
													{item.razon_social || `${item.nombre || ''} ${item.apellido_paterno || ''} ${item.apellido_materno || ''}`}
												</td>
												<td style={styles.td}>
													<button
														style={styles.linkBtn}
														onClick={async () => {
															setProveedorSeleccionado(item);
															await cargarDocumentos(item.proveedor_id, grupoSeleccionado);
														}}
													>
														Seleccionar
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</>
				)}

				{proveedorSeleccionado && (
					<>
						<div style={styles.infoBlock}>
							<p style={styles.infoLine}>
								<b>Razón Social:</b>{' '}
								{proveedorSeleccionado.razon_social || `${proveedorSeleccionado.nombre || ''} ${proveedorSeleccionado.apellido_paterno || ''} ${proveedorSeleccionado.apellido_materno || ''}`}
							</p>
							<p style={styles.infoLine}>
								<b>CIIU:</b>{' '}
								{proveedorSeleccionado.ciiu}
								{' - '}
								{proveedorSeleccionado.descripcion_ciiu || 'ACTIVIDAD ECONÓMICA'}
							</p>
							<p style={styles.infoLine}>
								<b>UBIGEO:</b>{' '}
								{proveedorSeleccionado.ubigeo}
								{' - '}
								{proveedorSeleccionado.departamento}
								{' / '}
								{proveedorSeleccionado.provincia}
								{' / '}
								{proveedorSeleccionado.ciudad || proveedorSeleccionado.distrito}
							</p>
						</div>

						<hr style={styles.divider} />

						<h3 style={styles.sectionTitle}>Documentos del Proveedor</h3>

						<div style={styles.tabsRow}>
							{grupos.map(g => (
								<button
									key={g.codigo}
									style={grupoSeleccionado === g.codigo ? styles.btnGhostActive : styles.btnGhost}
									onClick={async () => {
										setGrupoSeleccionado(g.codigo);
										await cargarDocumentos(proveedorSeleccionado.proveedor_id, g.codigo);
									}}
								>
									{g.nombre}
								</button>
							))}
						</div>

						{/*  REGLA: Si es CONSULTOR, el botón de agregar NO se renderiza en lo absoluto */}
						{!esConsultor && (
							<button
								style={styles.btnPrimary}
								onClick={() => {
									setDocumentoSeleccionado(null);
									setModoDocumento('NUEVO');
									setModalDocumentoVisible(true);
								}}
							>
								Agregar Documento
							</button>
						)}

						<div className="table-scroll">
							<table style={styles.table}>
								<thead>
									<tr>
										<th style={styles.th}>Tipo Documento</th>
										<th style={styles.th}>Alcance</th>
										<th style={styles.th}>Fecha Vigencia</th>
										<th style={styles.th}>Estado</th>
										<th style={styles.th}>Acciones</th>
									</tr>
								</thead>
								<tbody>
									{documentos.length === 0 ? (
										<tr>
											<td colSpan={5} style={{ ...styles.td, textAlign: 'center', color: colors.textMuted, padding: '24px' }}>
												No se encontraron documentos registrados en este grupo.
											</td>
										</tr>
									) : documentos.map(item => (
										<tr key={item.documento_id}>
											<td style={styles.td}>
												{item.descripcion_tipo_documento || item.tipo_documento || item.tipo_documento_id}
											</td>
											<td style={styles.td}>{item.descripcion_alcance}</td>
											<td style={styles.td}>
												{new Date(item.fecha_vigencia).toLocaleDateString('es-PE')}
											</td>
											<td style={styles.td}>
												<span style={styles.badge(item.estado_documento === 'V')}>
													{item.estado_documento === 'V' ? 'VIGENTE' : 'VENCIDO'}
												</span>
											</td>
											<td style={styles.td}>
												<div style={styles.rowActions}>
													<button
														style={styles.linkBtn}
														onClick={() => {
															setDocumentoSeleccionado(item);
															setModoDocumento('VER');
															setModalDocumentoVisible(true);
														}}
													>
														Ver
													</button>

													{/* REGLA: Si es CONSULTOR, el botón de editar desaparece. Si es otro rol restringido, se muestra con candado */}
													{!esConsultor && (
														puedeEditarGubernamental ? (
															<button
																style={styles.linkBtnAmber}
																onClick={() => {
																	setDocumentoSeleccionado(item);
																	setModoDocumento('EDITAR');
																	setModalDocumentoVisible(true);
																}}
															>
																Editar
															</button>
														) : (
															<button
																style={styles.linkBtnDisabled}
																onClick={() => alert("La edición de expedientes guardados se encuentra BLOQUEADA. Solicite la habilitación al Administrador.")}
															>
																<Lock size={13} />
																Editar
															</button>
														)
													)}
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</>
				)}

				{modalDocumentoVisible && (
					<ModalDocumento
						visible={true}
						modo={modoDocumento}
						documento={documentoSeleccionado}
						proveedorId={proveedorSeleccionado?.proveedor_id}
						grupoDocumento={grupoSeleccionado}
						onClose={() => setModalDocumentoVisible(false)}
						onSuccess={async () => {
							await cargarDocumentos(
								proveedorSeleccionado.proveedor_id,
								grupoSeleccionado
							);
						}}
					/>
				)}
			</div>
		</MainLayout>
	);
}