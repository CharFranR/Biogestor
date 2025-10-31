import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Button from "@mui/material/Button";
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from "@mui/material/DialogTitle";
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import { Boton, ContenidoBoton } from '../Boton/boton';
import { userService } from '../../services/userService';
import { User, TabPanelProps, Permission } from '../../types';

interface PestañaProps {
    tab1: string;
    tab2: string;
}

interface TiposUsuarios {
  usuariosAprobados: User[];
  usuariosNoAprobados: User[];
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export default function BasicTabs(props: PestañaProps & TiposUsuarios) {
  const [value, setValue] = React.useState(0);
  const {tab1, tab2, usuariosAprobados, usuariosNoAprobados} = props;

  // Estado para controlar qué diálogo está abierto
  const [usuarioDialogAbierto, setUsuarioDialogAbierto] = React.useState<number | null>(null);
  const [usuarioPermisosDialogAbierto, setUsuarioPermisosDialogAbierto] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [permisosLoading, setPermisosLoading] = React.useState(false);
  const [permisos, setPermisos] = React.useState<Permission[]>([]);
  const [permisosActualizados, setPermisosActualizados] = React.useState<{[key: string]: boolean}>({});
  
  // ✅ NUEVO: Estado para verificar permisos del usuario actual
  const [usuarioActualPuedeAprobar, setUsuarioActualPuedeAprobar] = React.useState(false);
  const [usuarioActualPuedeGestionarPermisos, setUsuarioActualPuedeGestionarPermisos] = React.useState(false);

  // ✅ NUEVO: Verificar permisos al cargar el componente
  React.useEffect(() => {
    const verificarPermisosUsuarioActual = async () => {
      try {
        const currentUser = await userService.getCurrentUser();
        const currentUserPermissions = await userService.getUserPermissions(currentUser.id);
        
        const puedeAprobar = currentUserPermissions.permisos.some(
          (p: Permission) => p.codename === 'AprobarUsuarios' && p.granted
        );
        
        const puedeGestionarPermisos = currentUserPermissions.permisos.some(
          (p: Permission) => p.codename === 'AprobarUsuarios' && p.granted
        );
        
        setUsuarioActualPuedeAprobar(puedeAprobar);
        setUsuarioActualPuedeGestionarPermisos(puedeGestionarPermisos);
        
        console.log('Usuario actual puede aprobar:', puedeAprobar);
        console.log('Usuario actual puede gestionar permisos:', puedeGestionarPermisos);
      } catch (error) {
        console.error('Error al verificar permisos:', error);
      }
    };
    
    verificarPermisosUsuarioActual();
  }, []);

  const handleClickOpen = (usuarioId: number) => {
    // ✅ VERIFICAR permisos antes de abrir diálogo
    if (!usuarioActualPuedeAprobar) {
      alert('No tienes permisos para aprobar usuarios');
      return;
    }
    setUsuarioDialogAbierto(usuarioId);
  };

  const handleClickOpenPermisos = async (usuarioId: number) => {
    // ✅ VERIFICAR permisos antes de abrir diálogo de permisos
    if (!usuarioActualPuedeGestionarPermisos) {
      alert('No tienes permisos para gestionar permisos');
      return;
    }
    
    setUsuarioPermisosDialogAbierto(usuarioId);
    setPermisosLoading(true);
    
    try {
      const response = await userService.getUserPermissions(usuarioId);
      console.log('Respuesta permisos:', response);
      
      if (response.permisos && Array.isArray(response.permisos)) {
        setPermisos(response.permisos);
        
        const permisosIniciales: {[key: string]: boolean} = {};
        response.permisos.forEach(permiso => {
          permisosIniciales[permiso.codename] = permiso.granted;
        });
        setPermisosActualizados(permisosIniciales);
      } else {
        console.error('Formato de permisos inesperado:', response);
      }
      
    } catch (error) {
      console.error('Error al cargar permisos:', error);
      const permisosEjemplo: Permission[] = [
        { id: '1', codename: 'AprobarUsuarios', name: 'Aprobar Usuarios', granted: false },
        { id: '2', codename: 'VerReportes', name: 'Ver Reportes', granted: false },
        { id: '3', codename: 'GenerarReportes', name: 'Generar Reportes', granted: false },
        { id: '7', codename: 'VerDashboard', name: 'Ver Dashboard', granted: false },
        { id: '8', codename: 'VerInventario', name: 'Ver Inventario', granted: false },
        { id: '9', codename: 'ModificarInventario', name: 'Modificar Inventario', granted: false },
      ];
      
      setPermisos(permisosEjemplo);
      
      const permisosIniciales: {[key: string]: boolean} = {};
      permisosEjemplo.forEach(permiso => {
        permisosIniciales[permiso.codename] = permiso.granted;
      });
      setPermisosActualizados(permisosIniciales);
    } finally {
      setPermisosLoading(false);
    }
  };

  const handleClose = () => {
    setUsuarioDialogAbierto(null);
  };

  const handleClosePermisos = () => {
    setUsuarioPermisosDialogAbierto(null);
    setPermisos([]);
    setPermisosActualizados({});
  };

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleAprobar = async () => {
    if (!usuarioSeleccionado) return;

    // ✅ DOBLE VERIFICACIÓN de permisos
    if (!usuarioActualPuedeAprobar) {
      alert('No tienes permisos para aprobar usuarios');
      return;
    }

    setLoading(true);
    try {
      await userService.approveUser(usuarioSeleccionado.id);
      console.log("El usuario ha sido aprobado");
      alert('Usuario aprobado correctamente');
      handleClose();
      // Recargar la página para ver cambios
      window.location.reload();
    } catch (error: any) {
      console.error("Error al aprobar usuario:", error);
      alert(error.message || 'Error al aprobar usuario');
    } finally {
      setLoading(false);
    }
  };

  const handlePermisoChange = (permisoCodename: string, granted: boolean) => {
    setPermisosActualizados(prev => ({
      ...prev,
      [permisoCodename]: granted
    }));
  };

  const handleGuardarPermisos = async () => {
    if (!usuarioPermisosSeleccionado) return;

    // ✅ VERIFICAR permisos antes de guardar
    if (!usuarioActualPuedeGestionarPermisos) {
      alert('No tienes permisos para gestionar permisos');
      return;
    }

    setPermisosLoading(true);
    try {
      await userService.updateUserPermissions(usuarioPermisosSeleccionado.id, permisos.map(permiso => ({
        ...permiso,
        granted: permisosActualizados[permiso.codename] || false
      })));
      console.log('Permisos actualizados:', permisosActualizados);
      
      alert('Permisos actualizados correctamente');
      handleClosePermisos();
      // Recargar para ver cambios
      window.location.reload();
    } catch (error) {
      console.error('Error al actualizar permisos:', error);
      alert('Error al actualizar permisos');
    } finally {
      setPermisosLoading(false);
    }
  };

  // Encontrar el usuario que tiene el diálogo abierto
  const usuarioSeleccionado = usuariosNoAprobados.find(u => u.id === usuarioDialogAbierto);
  const usuarioPermisosSeleccionado = usuariosAprobados.find(u => u.id === usuarioPermisosDialogAbierto);

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
          <Tab label={tab1} {...a11yProps(0)} />
          <Tab label={tab2} {...a11yProps(1)} />
        </Tabs>
      </Box>
      
      <CustomTabPanel value={value} index={0}>
        <div>
          {usuariosAprobados.map(usuario => (
            <div key={usuario.id} style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
              <Button 
                variant="outlined" 
                onClick={() => handleClickOpenPermisos(usuario.id)}
                style={{ margin: '5px' }}
                disabled={!usuarioActualPuedeGestionarPermisos} // ✅ Deshabilitar si no tiene permisos
              >
                <strong>{usuario.first_name} {usuario.last_name}</strong> - {usuario.email}
                {!usuarioActualPuedeGestionarPermisos && " (Sin permisos)"}
              </Button>
            </div>
          ))}
        </div>
      </CustomTabPanel>
      
      <CustomTabPanel value={value} index={1}>
        <div>
          {usuariosNoAprobados.map(usuario => (
            <div key={usuario.id}>
              <Button 
                variant="outlined" 
                onClick={() => handleClickOpen(usuario.id)}
                style={{ margin: '5px' }}
                disabled={!usuarioActualPuedeAprobar} // ✅ Deshabilitar si no tiene permisos
              >
                {usuario.first_name} {usuario.last_name}
                {!usuarioActualPuedeAprobar && " (Sin permisos)"}
              </Button>
            </div>
          ))}
        </div>
      </CustomTabPanel>

      {/* Dialog para aprobar usuarios pendientes */}
      <Dialog
        open={usuarioDialogAbierto !== null}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"¿Aprobar Usuario?"}
        </DialogTitle>
        <DialogContent>
          {usuarioSeleccionado && (
            <>
              <p><strong>Nombre:</strong> {usuarioSeleccionado.first_name} {usuarioSeleccionado.last_name}</p>
              <p><strong>Email:</strong> {usuarioSeleccionado.email}</p>
              <p><strong>Usuario:</strong> {usuarioSeleccionado.username}</p>

              <ContenidoBoton>
                {usuarioActualPuedeAprobar ? (
                  <Boton 
                    label={loading ? 'Aprobando...' : 'Aprobar'} 
                    color='#fafafa' 
                    sinMovimiento={true} 
                    onClick={handleAprobar}
                    disabled={loading}
                  />
                ) : (
                  <p style={{ color: 'red', padding: '10px' }}>No tienes permisos para aprobar usuarios</p>
                )}
                <Boton 
                  label='Cancelar' 
                  color='#fafafa' 
                  sinMovimiento={true}
                  onClick={handleClose}
                />
              </ContenidoBoton>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para gestionar permisos de usuarios aprobados */}
      <Dialog
        open={usuarioPermisosDialogAbierto !== null}
        onClose={handleClosePermisos}
        aria-labelledby="permisos-dialog-title"
        aria-describedby="permisos-dialog-description"
        maxWidth="md"
        fullWidth
      >
        <DialogTitle id="permisos-dialog-title">
          {"Gestión de Permisos"}
        </DialogTitle>
        <DialogContent>
          {usuarioPermisosSeleccionado && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <p><strong>Usuario:</strong> {usuarioPermisosSeleccionado.first_name} {usuarioPermisosSeleccionado.last_name}</p>
                <p><strong>Email:</strong> {usuarioPermisosSeleccionado.email}</p>
                <p><strong>Username:</strong> {usuarioPermisosSeleccionado.username}</p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3>Permisos:</h3>
                {permisosLoading ? (
                  <div>Cargando permisos...</div>
                ) : usuarioActualPuedeGestionarPermisos ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {permisos.map(permiso => (
                      <FormControlLabel
                        key={permiso.id}
                        control={
                          <Switch
                            checked={permisosActualizados[permiso.codename] || false}
                            onChange={(e) => handlePermisoChange(permiso.codename, e.target.checked)}
                            color="primary"
                          />
                        }
                        label={permiso.name}
                      />
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'red' }}>No tienes permisos para gestionar permisos</p>
                )}
              </div>

              <ContenidoBoton>
                {usuarioActualPuedeGestionarPermisos ? (
                  <Boton 
                    label={permisosLoading ? 'Guardando...' : 'Guardar Cambios'} 
                    color='#fafafa' 
                    sinMovimiento={true} 
                    onClick={handleGuardarPermisos}
                    disabled={permisosLoading}
                  />
                ) : null}
                <Boton 
                  label='Cancelar' 
                  color='#fafafa' 
                  sinMovimiento={true}
                  onClick={handleClosePermisos}
                />
              </ContenidoBoton>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}