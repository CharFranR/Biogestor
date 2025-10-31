import React from 'react';
import axios from 'axios';
import { Card } from '../../shared/card/card';
import { BarraLateral } from '../../shared/barraLateral/barraLateral';
import { BarraArriba } from '../../shared/barraAriiba/barraArriba';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  perfil: {
    aprobado: boolean;
  };
}

interface DashboardStats {
  etapasActivas: number;
  reportesGenerados: number;
  lecturasHoy?: number;
}

// Styled Components
const DashboardContainer = styled.div`
  display: flex;
  height: 100vh;
  background-color: #f8f9fa;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
`;

const ContentArea = styled.div`
  padding: 24px;
  flex: 1;
`;

const ProfileContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 24px;
`;

const Avatar = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  font-weight: 600;
  margin-right: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const UserInfo = styled.div`
  flex: 1;
  
  h3 {
    margin: 0 0 0.5rem 0;
    color: #2d3748;
    font-size: 1.5rem;
    font-weight: 600;
  }
  
  p {
    margin: 0 0 0.5rem 0;
    color: #718096;
    font-size: 1rem;
  }
`;

const RoleBadge = styled.span`
  background-color: #fffaf0;
  color: #dd6b20;
  border: 1px solid #dd6b20;
  padding: 0.4rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  display: inline-block;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const UserDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const DetailItem = styled.div`
  p {
    margin: 0.25rem 0;
    font-size: 0.9rem;
  }
  
  .label {
    color: #718096;
    font-weight: 500;
  }
  
  .value {
    color: #2d3748;
    font-weight: 600;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled(Card)`
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`;

const StatContent = styled.div`
  display: flex;
  align-items: center;
`;

const StatIcon = styled.div<{ bgColor: string; color: string }>`
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background-color: ${props => props.bgColor};
  color: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1.2rem;
  font-size: 1.5rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const StatInfo = styled.div`
  flex: 1;
`;

const StatValue = styled.h2`
  margin: 0;
  font-size: 2.2rem;
  color: #2d3748;
  font-weight: 700;
`;

const StatLabel = styled.p`
  margin: 0.25rem 0 0 0;
  color: #718096;
  font-size: 0.95rem;
  font-weight: 500;
`;

const WelcomeSection = styled(Card)`
  margin-bottom: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  
  h2 {
    margin: 0 0 0.5rem 0;
    font-size: 1.8rem;
    font-weight: 600;
  }
  
  p {
    margin: 0;
    opacity: 0.9;
    font-size: 1.1rem;
  }
`;

const SectionTitle = styled.h2`
  color: #2d3748;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
`;

export const Dashboard: React.FC = () => {
  const [sidebarAbierta, setSidebarAbierta] = useState(true);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const location = useLocation();

  // Datos del usuario reales desde backend
  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      try {
        const resp = await axios.get('/api/usuario/actual/');
        if (mounted) setUserData(resp.data as UserProfile);
      } catch (e: any) {
        // Si no autenticado, redirigir a login
        if (e?.response?.status === 401) {
          window.location.href = '/login';
        }
      }
    };
    const fetchStats = async () => {
      try {
        const resp = await axios.get('/api/dashboard/stats/');
        if (mounted) setStats(resp.data as DashboardStats);
      } catch (e) {
        // Silenciar por ahora; podemos mostrar fallback si hace falta
      }
    };
    fetchUser();
    fetchStats();
    return () => { mounted = false; };
  }, []);

  // Get current view name based on route
  const getCurrentViewName = () => {
    switch (location.pathname) {
      case '/perfil':
        return 'Perfil';
      case '/permisos':
        return 'Permisos';
      case '/sensores':
        return 'Sensores';
      case '/reportes':
        return 'Reportes';
      case '/calculadora':
        return 'Calculadora de Productos';
      case '/asistente':
        return 'Asistente Virtual';
      case '/documentacion':
        return 'Documentación Técnica';
      default:
        return 'Sensores';
    }
  };

  // Fallback por si aún no carga
  const safeStats: DashboardStats = stats || { etapasActivas: 0, reportesGenerados: 0 };

  // Función para obtener las iniciales del usuario
  const getUserInitials = () => {
    if (!userData) return 'US';
    return `${userData.first_name.charAt(0)}${userData.last_name.charAt(0)}`.toUpperCase();
  };

  // Función para obtener el nombre completo
  const getFullName = () => {
    if (!userData) return 'Usuario';
    return `${userData.first_name} ${userData.last_name}`;
  };

  return (
    <DashboardContainer>
      <BarraLateral abierta={sidebarAbierta} />

      <MainContent>
        <BarraArriba
          vistaActual={getCurrentViewName()}
          onToggleSidebar={() => setSidebarAbierta(!sidebarAbierta)}
        />
        
        <ContentArea>
          {/* Mensaje de Bienvenida */}
          <WelcomeSection>
            <h2>¡Bienvenido de nuevo, {userData?.first_name}!</h2>
            <p>Aquí tienes un resumen de tu actividad y perfil en el sistema.</p>
          </WelcomeSection>

          {/* Perfil de Usuario */}
          <SectionTitle>Mi Perfil</SectionTitle>
          <Card>
            <ProfileContainer>
              <Avatar>{getUserInitials()}</Avatar>
              <UserInfo>
                <h3>{getFullName()}</h3>
                <p>{userData?.email}</p>
                <RoleBadge>Colaborador</RoleBadge>
                
                <UserDetails>
                  <DetailItem>
                    <p className="label">Usuario</p>
                    <p className="value">{userData?.username}</p>
                  </DetailItem>
                  <DetailItem>
                    <p className="label">Estado de cuenta</p>
                    <p className="value">
                      {userData?.perfil.aprobado ? 'Verificada' : 'Pendiente de verificación'}
                    </p>
                  </DetailItem>
                </UserDetails>
              </UserInfo>
            </ProfileContainer>
          </Card>

          {/* Estadísticas */}
          <SectionTitle>Resumen General</SectionTitle>
          <StatsGrid>
            <StatCard>
              <StatContent>
                <StatIcon bgColor="#e0f2f1" color="#26a69a">
                  <i className="fas fa-microchip"></i>
                </StatIcon>
                <StatInfo>
                  <StatValue>{safeStats.etapasActivas}</StatValue>
                  <StatLabel>Etapas Activas</StatLabel>
                </StatInfo>
              </StatContent>
            </StatCard>

            <StatCard>
              <StatContent>
                <StatIcon bgColor="#e3f2fd" color="#42a5f5">
                  <i className="fas fa-file-alt"></i>
                </StatIcon>
                <StatInfo>
                  <StatValue>{safeStats.reportesGenerados}</StatValue>
                  <StatLabel>Reportes Generados</StatLabel>
                </StatInfo>
              </StatContent>
            </StatCard>
          </StatsGrid>
        </ContentArea>
      </MainContent>
    </DashboardContainer>
  );
};