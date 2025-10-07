import React, { useState, useEffect, useMemo } from 'react';
import { LogOut, LayoutGrid, Users, Calendar, MapPin, Search, CalendarCheck, BookOpenCheck } from 'lucide-react'; 

// URL base de tu backend (Asegúrate de cambiar esto si la URL de tu servidor es diferente)
const BASE_URL = 'http://localhost:3000/api'; 
const AUTH_URL = 'http://localhost:3000'; 

// Bloques de hora fijos y días de la semana
const TIME_SLOTS = [1, 2, 3, 4, 5, 6];
const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

// --- CONFIGURACIÓN DE PERSONALIZACIÓN ---
const CENTER_NAME = "IES El Almijar"; 

// Función de utilidad para formatear fechas
const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date)) return 'N/A';
    // Formato YYYY-MM-DD para input[type="date"]
    if (dateString.length === 10 && dateString.includes('-')) return dateString; 
    
    // Formato DD/MM/YYYY para display
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

// --- COMPONENTE PRINCIPAL ---

const App = () => {
  const { modal, customAlert, customConfirm, closeModal, handleConfirm } = useAlert();
  const [user, setUser] = useState(null); 
  const [view, setView] = useState('login');
  const [authMode, setAuthMode] = useState('login');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      if (user.esAdmin) {
        setView('admin');
      } else {
        setView('user');
      }
    } else {
      setView('login');
    }
    const timer = setTimeout(() => setMessage(''), 5000);
    return () => clearTimeout(timer);
  }, [user, message]);


  // --- Funciones de Autenticación (Login / Register) ---

  const handleAuth = async (credentials) => {
    const endpoint = authMode === 'login' ? `${AUTH_URL}/login` : `${AUTH_URL}/register`;
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok && authMode === 'login') {
        setUser(data.user);
        setMessage(`¡Bienvenido, ${data.user.nombre}!`);
      } else if (response.ok && authMode === 'register') {
        setMessage('Registro exitoso. ¡Ahora puedes iniciar sesión!');
        setAuthMode('login');
      } else {
        setMessage(`Error: ${data.error || 'Algo salió mal en la autenticación.'}`);
      }
    } catch (error) {
      setMessage('Error de conexión con el servidor.');
      console.error('Auth Error:', error);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setMessage('Sesión cerrada correctamente.');
    setView('login');
  };
  
  // --- Renderizado de Vistas ---

  const renderView = () => {
    switch (view) {
      case 'user':
        return <UserDashboard user={user} BASE_URL={BASE_URL} handleLogout={handleLogout} setMessage={setMessage} />;
      case 'admin':
        return <AdminDashboard user={user} BASE_URL={BASE_URL} handleLogout={handleLogout} setMessage={setMessage} />;
      case 'login':
      default:
        return <AuthForm onAuth={handleAuth} authMode={authMode} setAuthMode={setAuthMode} />;
    }
  };

  return (
    // CONTENEDOR PRINCIPAL: Flex, centrado y con padding para el móvil.
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 sm:p-6 font-inter">
      {/* HEADER: Se asegura que el ancho máximo sea consistente con el body y está centrado. */}
      <header className="w-full max-w-6xl py-6 bg-white shadow-xl rounded-xl mb-6">
        
        {/* CABECERA PERSONALIZADA SIN LOGO - Centrado */}
        <div className="text-center border-b pb-4 mb-4 mx-6"> 
            <h1 className="text-3xl font-extrabold text-gray-800">
                {CENTER_NAME}
            </h1>
        </div>

        <div className="text-center">
            <h2 className="text-xl font-bold text-indigo-700">
                Sistema de Gestión y Reservas de Aulas
            </h2>
            <p className="text-sm text-gray-500 mt-1">
                {user ? `Usuario: ${user.nombre} (${user.esAdmin ? 'Administrador' : 'Profesor/Empleado'})` : 'Inicie sesión para continuar'}
            </p>
        </div>
      </header>
      
      {/* Sistema de Mensajes de Estado */}
      {message && (
        <div className={`p-3 mb-4 w-full max-w-6xl rounded-lg shadow-md text-sm font-medium 
          ${message.includes('Error') || message.includes('Atención') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* CONTENIDO PRINCIPAL: Se asegura el mismo ancho máximo que el header */}
      <main className="w-full max-w-6xl flex justify-center">
        {renderView()}
      </main>
      
      <CustomModal modal={modal} closeModal={closeModal} handleConfirm={handleConfirm} />
    </div>
  );
};


// --- UTILITY: Manejo de errores de alerts en iframe ---
const useAlert = () => {
    const [modal, setModal] = useState({ visible: false, message: '', onConfirm: null });
    
    const customAlert = (message) => {
        setModal({ visible: true, message, onConfirm: null });
    };

    const customConfirm = (message, onConfirm) => {
        setModal({ visible: true, message, onConfirm });
    };

    const closeModal = () => {
        setModal({ visible: false, message: '', onConfirm: null });
    };

    const handleConfirm = () => {
        if (modal.onConfirm) {
            modal.onConfirm();
        }
        closeModal();
    };

    return { customAlert, customConfirm, modal, closeModal, handleConfirm };
};

// --- COMPONENTE: MODAL PERSONALIZADO ---
const CustomModal = ({ modal, closeModal, handleConfirm }) => {
    if (!modal.visible) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full">
                <p className="text-gray-800 font-medium mb-4">{modal.message}</p>
                <div className="flex justify-end space-x-3">
                    {modal.onConfirm && (
                        <button
                            onClick={closeModal}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                        >
                            Cancelar
                        </button>
                    )}
                    <button
                        onClick={modal.onConfirm ? handleConfirm : closeModal}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
                    >
                        {modal.onConfirm ? 'Confirmar' : 'Aceptar'}
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- COMPONENTE: Formulario de Autenticación (Mantenido igual) ---

const AuthForm = ({ onAuth, authMode, setAuthMode }) => {
  const [usuario, setUsuario] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [nombre, setNombre] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAuth({ usuario, contraseña, nombre });
  };

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        {authMode === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4 flex flex-col">
        {authMode === 'register' && (
          <input
            type="text"
            placeholder="Nombre Completo"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            required={authMode === 'register'}
          />
        )}
        <input
          type="text"
          placeholder="Usuario"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={contraseña}
          onChange={(e) => setContraseña(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
        
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white p-3 rounded-lg font-semibold hover:bg-indigo-700 transition duration-200 shadow-md"
        >
          {authMode === 'login' ? 'Acceder' : 'Crear Cuenta'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
          className="text-sm text-indigo-600 hover:text-indigo-800 transition duration-200"
        >
          {authMode === 'login' ? '¿No tienes cuenta? Regístrate aquí.' : '¿Ya tienes cuenta? Inicia Sesión.'}
        </button>
      </div>
    </div>
  );
};


// --------------------------------------------------------
// --- SUB-COMPONENTE: BÚSQUEDA Y RESERVA DE AULAS ---
// --------------------------------------------------------

const ReservationSearchAndBooking = ({ user, BASE_URL, setMessage }) => {
    const { modal, customAlert, customConfirm, closeModal, handleConfirm } = useAlert();
    const [searchDate, setSearchDate] = useState(formatDate(new Date().toISOString().split('T')[0])); // Default to today in YYYY-MM-DD
    const [availability, setAvailability] = useState([]); // List of available slots
    const [isLoading, setIsLoading] = useState(false);

    // Mapeo de bloques a horas (solo para visualización)
    const blockTimes = {
        1: '8:00 - 9:30', 2: '9:30 - 11:00', 3: '11:00 - 12:30',
        4: '13:00 - 14:30', 5: '14:30 - 16:00', 6: '16:00 - 17:30'
    };


    const fetchAvailability = async (e) => {
        if (e) e.preventDefault();
        if (!searchDate) {
            setMessage('Atención: Debes seleccionar una fecha.', true);
            return;
        }

        setIsLoading(true);
        // GET /api/reservations/availability/:date
        try {
            const response = await fetch(`${BASE_URL}/reservations/availability/${searchDate}`);
            const data = await response.json();

            if (response.ok) {
                setAvailability(data);
                setMessage(`Disponibilidad cargada para el ${formatDate(searchDate)}.`);
            } else {
                setMessage(`Error: ${data.error || 'No se pudo cargar la disponibilidad.'}`);
                setAvailability([]);
            }
        } catch (error) {
            setMessage('Error de conexión al buscar disponibilidad.');
        } finally {
            setIsLoading(false);
        }
    };
    
    // Función para crear una reserva
    const handleBook = (idAula, nombreAula, bloque) => {
        const confirmBooking = async () => {
            setIsLoading(true);
            const bookingData = {
                idUsuario: user._id, // ID del usuario autenticado
                idAula,
                fecha: searchDate, // Fecha seleccionada
                bloque,
            };

            try {
                // POST /api/reservations
                const response = await fetch(`${BASE_URL}/reservations`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bookingData),
                });
                const data = await response.json();

                if (response.ok) {
                    setMessage(data.message);
                    fetchAvailability(); // Recargar la disponibilidad para actualizar la vista
                } else {
                    setMessage(`Error al reservar: ${data.error || 'Reserva fallida.'}`);
                }
            } catch (error) {
                setMessage('Error de conexión al intentar reservar.');
            } finally {
                setIsLoading(false);
            }
        };

        customConfirm(`¿Deseas confirmar la reserva del aula ${nombreAula} en el Bloque ${bloque} (${blockTimes[bloque]}) para el ${formatDate(searchDate)}?`, confirmBooking);
    };

    return (
        <div className="space-y-6 relative">
            <CustomModal modal={modal} closeModal={closeModal} handleConfirm={handleConfirm} />
            {isLoading && (
                 <div className="absolute inset-0 bg-white bg-opacity-75 flex justify-center items-center z-10 rounded-xl">
                    <p className="text-xl font-semibold text-indigo-600">Buscando disponibilidad...</p>
                 </div>
            )}
            
            {/* Formulario de Búsqueda */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold mb-4 text-indigo-700 flex items-center"><Search className="w-5 h-5 mr-2"/> Buscar Disponibilidad por Fecha</h3>
                <form onSubmit={fetchAvailability} className="flex flex-col md:flex-row gap-4">
                    <input
                        type="date"
                        value={searchDate}
                        onChange={(e) => setSearchDate(e.target.value)}
                        className="p-3 border rounded-lg flex-grow"
                        min={new Date().toISOString().split('T')[0]} // No permitir fechas pasadas
                        required
                    />
                    <button
                        type="submit"
                        className="bg-green-600 text-white p-3 rounded-lg font-semibold hover:bg-green-700 transition"
                        disabled={isLoading}
                    >
                        Buscar Aulas Disponibles
                    </button>
                </form>
            </div>

            {/* Resultados de Disponibilidad */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold mb-4">Aulas y Bloques Disponibles</h3>
                
                {availability.length === 0 && !isLoading ? (
                    <p className="text-center text-gray-500 p-4">Selecciona una fecha y busca para ver los bloques libres.</p>
                ) : (
                    <div className="space-y-6">
                        {availability.map(aula => (
                            <div key={aula.idAula} className="p-4 border border-indigo-100 rounded-lg bg-indigo-50">
                                <h4 className="text-lg font-bold text-indigo-800 mb-2 flex items-center"><MapPin className="w-4 h-4 mr-2"/> {aula.nombre}</h4>
                                <div className="flex flex-wrap gap-2">
                                    {aula.bloquesDisponibles.map(bloque => (
                                        <div key={bloque} className="bg-white border rounded-lg p-2 shadow-sm flex flex-col items-center justify-between min-w-[120px]">
                                            <span className="text-sm font-semibold text-gray-700">Bloque {bloque}</span>
                                            <span className="text-xs text-gray-500 mb-2">{blockTimes[bloque]}</span>
                                            <button
                                                onClick={() => handleBook(aula.idAula, aula.nombre, bloque)}
                                                className="w-full px-2 py-1 text-xs font-medium bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
                                                disabled={isLoading}
                                            >
                                                Reservar
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                {aula.bloquesDisponibles.length === 0 && (
                                    <p className="text-sm text-gray-500">No hay bloques disponibles en esta aula.</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};


// ----------------------------------------------------
// --- SUB-COMPONENTE: MIS RESERVAS Y CANCELACIÓN ---
// ----------------------------------------------------

const MyReservations = ({ user, BASE_URL, setMessage }) => {
    const { modal, customConfirm, closeModal, handleConfirm } = useAlert();
    const [reservations, setReservations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchUserReservations = async () => {
        setIsLoading(true);
        // GET /api/reservations/user/:idUsuario
        try {
            const response = await fetch(`${BASE_URL}/reservations/user/${user._id}`);
            const data = await response.json();

            if (response.ok) {
                // Ordenar de más cercana a más lejana
                setReservations(data.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)));
            } else {
                setMessage(`Error al cargar tus reservas: ${data.error || 'No se pudo conectar.'}`);
            }
        } catch (error) {
            setMessage('Error de conexión al cargar tus reservas.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUserReservations();
    }, [user._id]);


    const handleCancelReservation = (reservationId, aulaNombre, fecha, bloque) => {
        const confirmCancel = async () => {
            setIsLoading(true);
            try {
                // DELETE /api/reservations/:idReserva
                const response = await fetch(`${BASE_URL}/reservations/${reservationId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idUsuario: user._id }), // ID del usuario para verificación
                });
                const data = await response.json();
                
                if (response.ok) {
                    setMessage(data.message);
                    fetchUserReservations(); // Recargar la lista
                } else {
                    setMessage(`Error al cancelar: ${data.error}`);
                }
            } catch (error) {
                setMessage('Error de conexión al cancelar la reserva.');
            } finally {
                setIsLoading(false);
            }
        };

        customConfirm(`¿Estás seguro de que quieres CANCELAR la reserva del aula ${aulaNombre} (Bloque ${bloque}) para el ${formatDate(fecha)}?`, confirmCancel);
    };

    // Mapeo de bloques a horas (solo para visualización)
    const blockTimes = {
        1: '8:00 - 9:30', 2: '9:30 - 11:00', 3: '11:00 - 12:30',
        4: '13:00 - 14:30', 5: '14:30 - 16:00', 6: '16:00 - 17:30'
    };

    return (
        <div className="space-y-6 relative">
            <CustomModal modal={modal} closeModal={closeModal} handleConfirm={handleConfirm} />
            {isLoading && (
                 <div className="absolute inset-0 bg-white bg-opacity-75 flex justify-center items-center z-10 rounded-xl">
                    <p className="text-xl font-semibold text-indigo-600">Cargando tus reservas...</p>
                 </div>
            )}
            
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold mb-4 text-indigo-700 flex items-center"><CalendarCheck className="w-5 h-5 mr-2"/> Mis Reservas Activas ({reservations.length})</h3>
                
                {reservations.length === 0 && !isLoading ? (
                    <p className="text-center text-gray-500 p-4">No tienes reservas activas. Utiliza el buscador para empezar.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aula</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bloque</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horario</th>
                                    <th className="px-4 py-2"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {reservations.map(res => (
                                    <tr key={res._id} className="hover:bg-red-50/50 transition">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-indigo-600">
                                            {res.idAula ? res.idAula.nombre : 'Aula [Eliminada]'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{formatDate(res.fecha)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{res.bloque}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{blockTimes[res.bloque]}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right">
                                            <button
                                                onClick={() => handleCancelReservation(res._id, res.idAula.nombre, res.fecha, res.bloque)}
                                                className="px-3 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                                                disabled={isLoading}
                                            >
                                                Cancelar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};


// ----------------------------------------------------
// --- COMPONENTE: Panel de Usuario/Profesor ---
// ----------------------------------------------------

const UserDashboard = ({ user, BASE_URL, handleLogout, setMessage }) => {
    // Estado para manejar la sub-vista del usuario: buscar o ver mis reservas
    const [userView, setUserView] = useState('search'); 

    const navigation = [
        { key: 'search', name: 'Buscar y Reservar Aulas', Icon: Search },
        { key: 'myReservations', name: 'Mis Reservas', Icon: BookOpenCheck },
    ];

    const renderUserView = () => {
        switch (userView) {
            case 'search':
                return <ReservationSearchAndBooking user={user} BASE_URL={BASE_URL} setMessage={setMessage} />;
            case 'myReservations':
                return <MyReservations user={user} BASE_URL={BASE_URL} setMessage={setMessage} />;
            default:
                return null;
        }
    };

    return (
        <div className="w-full bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-2xl font-bold text-indigo-700">Panel de {user.nombre}</h2>
                <button 
                    onClick={handleLogout}
                    className="bg-red-500 text-white p-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition duration-200 flex items-center"
                >
                    <LogOut className="w-4 h-4 mr-1"/> Cerrar Sesión
                </button>
            </div>
            
            <div className="flex border-b overflow-x-auto">
                {navigation.map(item => (
                    <button
                        key={item.key}
                        onClick={() => setUserView(item.key)}
                        className={`p-3 font-medium transition duration-200 flex-shrink-0 flex items-center ${
                            userView === item.key 
                                ? 'border-b-4 border-indigo-600 text-indigo-600 bg-indigo-50' 
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <item.Icon className="w-5 h-5 mr-2"/>
                        {item.name}
                    </button>
                ))}
            </div>

            <div className="p-6">
                {renderUserView()}
            </div>
        </div>
    );
};


// ----------------------------------------------------
// --- COMPONENTES ADMIN ---
// ----------------------------------------------------

const ClassroomManager = ({ user, BASE_URL, setMessage }) => {
    const { modal, customAlert, customConfirm, closeModal, handleConfirm } = useAlert();
    const [classrooms, setClassrooms] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        _id: null,
        nombre: '',
        capacidad: '',
        equipamiento: '',
        esSUM: false,
        ocupacionFija: {},
    });

    const fetchClassrooms = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${BASE_URL}/reservations/classrooms`); 
            const data = await response.json();
            
            if (response.ok) {
                setClassrooms(data);
            } else {
                setMessage(`Error al cargar aulas: ${data.error}`);
            }
        } catch (error) {
            setMessage('Error de conexión al cargar aulas. Asegúrate que el Backend está corriendo.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchClassrooms();
    }, []);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        setIsLoading(true);
        const method = formData._id ? 'PUT' : 'POST';
        const url = formData._id ? `${BASE_URL}/admin/classrooms/${formData._id}` : `${BASE_URL}/admin/classrooms`;

        const dataToSend = {
            ...formData,
            equipamiento: formData.equipamiento ? formData.equipamiento.split(',').map(e => e.trim()) : [],
            idAdmin: user._id, 
            capacidad: parseInt(formData.capacidad, 10),
        };
        
        if (method === 'PUT') delete dataToSend.nombre;

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend),
            });
            const data = await response.json();

            if (response.ok) {
                setMessage(data.message);
                setIsEditing(false);
                resetForm();
                fetchClassrooms(); 
            } else {
                setMessage(`Error: ${data.error || 'No se pudo guardar el aula.'}`);
            }
        } catch (error) {
            setMessage('Error de conexión al guardar el aula.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (classroom) => {
        setIsEditing(true);
        setFormData({
            ...classroom,
            equipamiento: classroom.equipamiento ? classroom.equipamiento.join(', ') : '',
        });
    };
    
    const handleDelete = (id) => {
        const confirmDelete = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${BASE_URL}/admin/classrooms/${id}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ idAdmin: user._id }), 
                });
                const data = await response.json();
                
                if (response.ok) {
                    setMessage(data.message);
                    fetchClassrooms();
                } else {
                    setMessage(`Error al eliminar: ${data.error}`);
                }
            } catch (error) {
                setMessage('Error de conexión al eliminar aula.');
            } finally {
                setIsLoading(false);
            }
        };

        customConfirm(`¿Estás seguro de que quieres eliminar el aula ${id}? Esto no se puede deshacer.`, confirmDelete);
    };

    const resetForm = () => {
        setIsEditing(false);
        setFormData({ _id: null, nombre: '', capacidad: '', equipamiento: '', esSUM: false, ocupacionFija: {} });
    };

    const handleToggleOccupancy = (day, slot) => {
        setFormData(prev => {
            const newOccupacion = { ...prev.ocupacionFija };
            const daySlots = newOccupacion[day] || [];
            
            if (daySlots.includes(slot)) {
                newOccupacion[day] = daySlots.filter(s => s !== slot);
                if (newOccupacion[day].length === 0) {
                    delete newOccupacion[day]; 
                }
            } else {
                newOccupacion[day] = [...daySlots, slot].sort((a, b) => a - b);
            }

            return { ...prev, ocupacionFija: newOccupacion };
        });
    };


    return (
        <div className="space-y-8 relative">
            <CustomModal modal={modal} closeModal={closeModal} handleConfirm={handleConfirm} />
            {isLoading && (
                 <div className="absolute inset-0 bg-white bg-opacity-75 flex justify-center items-center z-10 rounded-xl">
                    <p className="text-xl font-semibold text-indigo-600">Cargando...</p>
                 </div>
            )}
            
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold mb-4 text-indigo-700 flex items-center"><MapPin className="w-5 h-5 mr-2"/>
                    {isEditing ? `Editar Aula: ${formData.nombre}` : 'Crear Nueva Aula'}
                </h3>
                
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                            type="text"
                            name="nombre"
                            placeholder="Nombre del Aula (ej: A201)"
                            value={formData.nombre}
                            onChange={handleInputChange}
                            className="p-3 border rounded-lg"
                            required
                            disabled={isEditing} 
                        />
                        <input
                            type="number"
                            name="capacidad"
                            placeholder="Capacidad (número)"
                            value={formData.capacidad}
                            onChange={handleInputChange}
                            className="p-3 border rounded-lg"
                            required
                        />
                        <input
                            type="text"
                            name="equipamiento"
                            placeholder="Equipamiento (separar por comas)"
                            value={formData.equipamiento}
                            onChange={handleInputChange}
                            className="p-3 border rounded-lg"
                        />
                    </div>

                    <div className="flex items-center space-x-4">
                        <input
                            type="checkbox"
                            name="esSUM"
                            id="esSUM"
                            checked={formData.esSUM}
                            onChange={handleInputChange}
                            className="h-5 w-5 text-indigo-600 rounded"
                        />
                        <label htmlFor="esSUM" className="text-gray-700">Aula es SUM (Salón de Usos Múltiples)</label>
                    </div>

                    <div className="p-4 bg-gray-50 border rounded-lg">
                        <h4 className="font-semibold mb-3">Ocupación Fija Semanal</h4>
                        <p className="text-sm text-gray-500 mb-2">Marca los bloques de hora (1 a 6) que están permanentemente ocupados cada semana.</p>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <th className="px-3 py-2">Día</th>
                                        {TIME_SLOTS.map(slot => (
                                            <th key={slot} className="px-3 py-2 text-center">Bloque {slot}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {DAYS_OF_WEEK.map(day => (
                                        <tr key={day}>
                                            <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{day}</td>
                                            {TIME_SLOTS.map(slot => (
                                                <td key={slot} className="px-3 py-2 whitespace-nowrap text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleOccupancy(day, slot)}
                                                        className={`w-8 h-8 rounded transition duration-150 flex items-center justify-center text-sm font-bold ${
                                                            formData.ocupacionFija[day] && formData.ocupacionFija[day].includes(slot)
                                                                ? 'bg-red-500 text-white hover:bg-red-600'
                                                                : 'bg-green-100 text-green-700 border border-green-300 hover:bg-green-200'
                                                        }`}
                                                        title={formData.ocupacionFija[day] && formData.ocupacionFija[day].includes(slot) ? 'Ocupado Fijo' : 'Disponible'}
                                                    >
                                                        {formData.ocupacionFija[day] && formData.ocupacionFija[day].includes(slot) ? 'OCP' : ''}
                                                    </button>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400 transition"
                        >
                            {isEditing ? 'Cancelar Edición' : 'Limpiar'}
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
                            disabled={isLoading}
                        >
                            {isEditing ? 'Guardar Cambios' : 'Crear Aula'}
                        </button>
                    </div>
                </form>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold mb-4">Aulas Existentes ({classrooms.length})</h3>
                <div className="space-y-4">
                    {isLoading && classrooms.length === 0 ? (
                        <p className="text-center text-gray-500">Cargando aulas...</p>
                    ) : (
                        classrooms.map(classroom => (
                            <div key={classroom._id} className="p-4 border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition duration-150 flex flex-col md:flex-row justify-between items-start md:items-center">
                                <div>
                                    <p className="text-lg font-semibold text-gray-800">
                                        {classroom.nombre} {classroom.esSUM && <span className="text-xs font-medium text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">SUM</span>}
                                    </p>
                                    <p className="text-sm text-gray-600">Capacidad: {classroom.capacidad} | Equipamiento: {classroom.equipamiento && classroom.equipamiento.length > 0 ? classroom.equipamiento.join(', ') : 'N/A'}</p>
                                </div>
                                <div className="mt-3 md:mt-0 space-x-2">
                                    <button
                                        onClick={() => handleEdit(classroom)}
                                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(classroom._id)}
                                        className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};


const HolidayManager = ({ user, BASE_URL, setMessage }) => {
    const { modal, customConfirm, closeModal, handleConfirm } = useAlert();
    const [holidays, setHolidays] = useState([]);
    const [newHoliday, setNewHoliday] = useState({ fecha: '', descripcion: '' });
    const [isLoading, setIsLoading] = useState(false);

    const fetchHolidays = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${BASE_URL}/admin/calendar`);
            const data = await response.json();
            if (response.ok) {
                setHolidays(data.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)));
            } else {
                setMessage(`Error al cargar festivos: ${data.error || 'No se pudo conectar.'}`);
            }
        } catch (error) {
            setMessage('Error de conexión al cargar festivos.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHolidays();
    }, []);

    const handleAddHoliday = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const dataToSend = {
            ...newHoliday,
            idAdmin: user._id, 
        };

        try {
            const response = await fetch(`${BASE_URL}/admin/calendar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend),
            });
            const data = await response.json();

            if (response.ok) {
                setMessage(data.message);
                setNewHoliday({ fecha: '', descripcion: '' });
                fetchHolidays(); 
            } else {
                setMessage(`Error: ${data.error || 'No se pudo añadir el festivo.'}`);
            }
        } catch (error) {
            setMessage('Error de conexión al añadir festivo.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteHoliday = (fecha) => {
        const confirmDelete = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${BASE_URL}/admin/calendar`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fecha, idAdmin: user._id }), 
                });
                const data = await response.json();
                
                if (response.ok) {
                    setMessage(data.message);
                    fetchHolidays();
                } else {
                    setMessage(`Error al eliminar: ${data.error}`);
                }
            } catch (error) {
                setMessage('Error de conexión al eliminar festivo.');
            } finally {
                setIsLoading(false);
            }
        };

        customConfirm(`¿Deseas eliminar el festivo del ${formatDate(fecha)}?`, confirmDelete);
    };

    return (
        <div className="space-y-8 relative">
            <CustomModal modal={modal} closeModal={closeModal} handleConfirm={handleConfirm} />
            {isLoading && (
                 <div className="absolute inset-0 bg-white bg-opacity-75 flex justify-center items-center z-10 rounded-xl">
                    <p className="text-xl font-semibold text-indigo-600">Cargando...</p>
                 </div>
            )}

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold mb-4 text-indigo-700 flex items-center"><Calendar className="w-5 h-5 mr-2"/> Añadir Día Festivo/No Laborable</h3>
                <form onSubmit={handleAddHoliday} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                            type="date"
                            value={newHoliday.fecha}
                            onChange={(e) => setNewHoliday(prev => ({ ...prev, fecha: e.target.value }))}
                            className="p-3 border rounded-lg"
                            required
                        />
                        <input
                            type="text"
                            placeholder="Descripción (ej: Fiesta Nacional)"
                            value={newHoliday.descripcion}
                            onChange={(e) => setNewHoliday(prev => ({ ...prev, descripcion: e.target.value }))}
                            className="p-3 border rounded-lg md:col-span-2"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-green-600 text-white p-3 rounded-lg font-semibold hover:bg-green-700 transition"
                        disabled={isLoading}
                    >
                        Añadir Festivo
                    </button>
                </form>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold mb-4">Festivos Registrados ({holidays.length})</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {holidays.map(holiday => (
                        <div key={holiday._id || holiday.fecha} className="p-3 border border-gray-100 rounded-lg shadow-sm flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-gray-800">{formatDate(holiday.fecha)}</p>
                                <p className="text-sm text-gray-600">{holiday.descripcion}</p>
                            </div>
                            <button
                                onClick={() => handleDeleteHoliday(holiday.fecha)}
                                className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                                disabled={isLoading}
                            >
                                Eliminar
                            </button>
                        </div>
                    ))}
                    {holidays.length === 0 && !isLoading && (
                        <p className="text-center text-gray-500 p-4">No hay días festivos registrados.</p>
                    )}
                </div>
            </div>
        </div>
    );
};


const ConsolidatedReservationsView = ({ user, BASE_URL, setMessage }) => {
    const [reservations, setReservations] = useState([]);
    const [dates, setDates] = useState({ startDate: '', endDate: '' });
    const [isLoading, setIsLoading] = useState(false);

    const fetchReservations = async () => {
        if (!dates.startDate || !dates.endDate) {
            setMessage('Atención: Por favor, selecciona un rango de fechas.', true);
            return;
        }

        setIsLoading(true);
        try {
            const params = new URLSearchParams(dates);
            // La ruta en el backend es una POST porque requiere autenticación de admin en el body (user._id)
            const response = await fetch(`${BASE_URL}/admin/reservations/calendar?${params.toString()}`, {
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idAdmin: user._id }), 
            });
            const data = await response.json();
            
            if (response.ok) {
                setReservations(data);
                setMessage(`Se encontraron ${data.length} reservas en el rango seleccionado.`);
            } else {
                setMessage(`Error al cargar reservas: ${data.error || 'No se pudo conectar.'}`);
                setReservations([]);
            }
        } catch (error) {
            setMessage('Error de conexión al buscar reservas.');
        } finally {
            setIsLoading(false);
        }
    };

    const formattedReservations = useMemo(() => {
        return reservations.map(res => ({
            ...res,
            fecha: formatDate(res.fecha),
            aulaNombre: res.idAula ? res.idAula.nombre : 'Aula Eliminada',
            usuarioNombre: res.idUsuario ? res.idUsuario.nombre : 'Usuario Eliminado',
            bloque: res.bloque,
        }));
    }, [reservations]);


    return (
        <div className="space-y-8 relative">
            {isLoading && (
                 <div className="absolute inset-0 bg-white bg-opacity-75 flex justify-center items-center z-10 rounded-xl">
                    <p className="text-xl font-semibold text-indigo-600">Cargando...</p>
                 </div>
            )}
            
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold mb-4 text-indigo-700 flex items-center"><Users className="w-5 h-5 mr-2"/> Buscar Reservas por Rango de Fechas</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <input
                        type="date"
                        value={dates.startDate}
                        onChange={(e) => setDates(prev => ({ ...prev, startDate: e.target.value }))}
                        className="p-3 border rounded-lg"
                        placeholder="Fecha de inicio"
                        required
                    />
                    <input
                        type="date"
                        value={dates.endDate}
                        onChange={(e) => setDates(prev => ({ ...prev, endDate: e.target.value }))}
                        className="p-3 border rounded-lg"
                        placeholder="Fecha de fin"
                        required
                    />
                    <button
                        onClick={fetchReservations}
                        className="bg-indigo-600 text-white p-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
                        disabled={isLoading || !dates.startDate || !dates.endDate}
                    >
                        Buscar Reservas
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold mb-4">Detalle de Reservas</h3>
                {formattedReservations.length === 0 && !isLoading ? (
                    <p className="text-center text-gray-500 p-4">Utiliza el formulario superior para buscar reservas en un rango de fechas.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bloque</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aula</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reservado Por</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {formattedReservations.map((res, index) => (
                                    <tr key={res._id || index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{res.fecha}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{res.bloque}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{res.aulaNombre}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{res.usuarioNombre}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};


const AdminDashboard = ({ user, BASE_URL, handleLogout, setMessage }) => {
    const [adminView, setAdminView] = useState('aulas'); 

    const navigation = [
        { key: 'aulas', name: 'Gestor de Aulas', Icon: MapPin },
        { key: 'calendario', name: 'Gestor de Festivos', Icon: Calendar },
        { key: 'reservas', name: 'Vista Consolidada', Icon: Users },
    ];

    const renderAdminView = () => {
        switch (adminView) {
            case 'aulas':
                return <ClassroomManager user={user} BASE_URL={BASE_URL} setMessage={setMessage} />;
            case 'calendario':
                return <HolidayManager user={user} BASE_URL={BASE_URL} setMessage={setMessage} />;
            case 'reservas':
                return <ConsolidatedReservationsView user={user} BASE_URL={BASE_URL} setMessage={setMessage} />;
            default:
                return null;
        }
    };

    return (
        <div className="w-full bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-2xl font-bold text-indigo-700">Panel de Administrador</h2>
                <button 
                    onClick={handleLogout}
                    className="bg-red-500 text-white p-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition duration-200 flex items-center"
                >
                    <LogOut className="w-4 h-4 mr-1"/> Cerrar Sesión
                </button>
            </div>
            
            <div className="flex border-b overflow-x-auto">
                {navigation.map(item => (
                    <button
                        key={item.key}
                        onClick={() => setAdminView(item.key)}
                        className={`p-3 font-medium transition duration-200 flex-shrink-0 flex items-center ${
                            adminView === item.key 
                                ? 'border-b-4 border-indigo-600 text-indigo-600 bg-indigo-50' 
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        <item.Icon className="w-5 h-5 mr-2"/>
                        {item.name}
                    </button>
                ))}
            </div>

            <div className="p-6">
                {renderAdminView()}
            </div>
        </div>
    );
};


export default App;
