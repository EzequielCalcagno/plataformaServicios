// src/screens/Account.tsx
import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ImageSourcePropType,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { ApiError } from '../utils/http';
import { getCurrentUser } from '../services/user.client';
import { useSession } from '../context/SessionContext';

import { Screen } from '../components/Screen';
import { Card } from '../components/Card';
import { Divider } from '../components/Divider';
import { Loading } from './Loading';
import { Error } from './Error';
import { AppModal } from '../components/AppModal';
import { COLORS } from '../styles/theme';
import { formatMemberSince } from '../utils/date';

interface Props {
  navigation: any; // Replace 'any' with the correct type if available (e.g., StackNavigationProp)
}

interface ProfileVM {
  fullName: string;
  photoUrl: string | null;
  registerDate?: string;
  isVerified?: boolean;
  isProfessional: boolean;
}

type RowItem = {
  key: string;
  label: string;
  leftIcon: ImageSourcePropType;
  rightIcon?: ImageSourcePropType;
  rightText?: string;
  onPress?: () => void;
};

export default function Account({ navigation }: Props) {
  const { logout } = useSession();
  const [profile, setProfile] = useState<ProfileVM | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Modals
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const rows = React.useMemo<RowItem[]>(
    () => [
      {
        key: 'settings',
        label: 'Configuración de la cuenta',
        leftIcon: require('../../assets/icons/cuenta/configuracion.png'),
        rightIcon: require('../../assets/icons/cuenta/flechaDerecha.png'),
        onPress: () => setShowConfigModal(true),
      },
      {
        key: 'edit',
        label: 'Editar perfil',
        leftIcon: require('../../assets/icons/cuenta/editar.png'),
        rightIcon: require('../../assets/icons/cuenta/flechaDerecha.png'),
        onPress: () => navigation.navigate('EditProfile'),
      },
      {
        key: 'add-service',
        label: 'Agregar servicio',
        leftIcon: require('../../assets/icons/cuenta/crear.png'),
        rightIcon: require('../../assets/icons/cuenta/flechaDerecha.png'),
        onPress: () => navigation.navigate('AddService'),
      },
      {
        key: 'language',
        label: 'Idioma',
        leftIcon: require('../../assets/icons/cuenta/idioma.png'),
        rightText: 'Español',
        onPress: () => {}, // abrir modal más adelante
      },
      {
        key: 'help',
        label: 'Obtén ayuda',
        leftIcon: require('../../assets/icons/cuenta/ayuda.png'),
        rightIcon: require('../../assets/icons/cuenta/flechaDerecha.png'),
        onPress: () => setShowHelpModal(true),
      },
      {
        key: 'privacy',
        label: 'Privacidad',
        leftIcon: require('../../assets/icons/cuenta/privacidad.png'),
        rightIcon: require('../../assets/icons/cuenta/flechaDerecha.png'),
        onPress: () => setShowPrivacyModal(true),
      },
    ],
    [],
  );

  useFocusEffect(
    useCallback(() => {
      const loadProfile = async () => {
        try {
          const data = await getCurrentUser();

          const profileVm: ProfileVM = {
            fullName: `${data.nombre ?? 'Usuario'} ${data.apellido ?? ''}`.trim(),
            photoUrl: data.foto_url ?? null,
            isProfessional: data.id_rol === 1, // ajustá si cambia el mapping
            isVerified: data.verificado,
            registerDate: data.fecha_registro,
          };

          setProfile(profileVm);
        } catch (err) {
          console.error('Error cargando perfil en Account:', err);
          if (err instanceof ApiError && err.status === 401) {
            // manejar error de no autorizado si es necesario
          }
        } finally {
          setLoadingProfile(false);
        }
      };

      loadProfile();
    }, [navigation]),
  );

  const handleLogout = async () => {
    await logout();
  };

  // ========= Renders principales =========
  if (loadingProfile) {
    return <Loading message="Cargando tu cuenta…" />;
  }

  if (!profile) {
    return (
      <Error
        title="No se pudo cargar la cuenta"
        message="Revisa tu conexión o vuelve a iniciar sesión."
        actionLabel="Reintentar"
        onAction={() => navigation.replace('Account')}
      />
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header: título + campana */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Perfil</Text>

          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.bellBtn}
            onPress={() => setShowNotifyModal(true)}
          >
            <Image
              source={require('../../assets/icons/cuenta/notificacion.png')}
              style={styles.iconNotification}
              resizeMode="contain"
            />
            <View style={styles.bellDot} />
          </TouchableOpacity>
        </View>

        {/* Card perfil */}
        <Card style={styles.profileCard}>
          {profile.photoUrl ? (
            <Image source={{ uri: profile.photoUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>
                {profile.fullName?.[0]?.toUpperCase() || 'U'}
              </Text>
            </View>
          )}

          <Text style={styles.profileName}>{profile.fullName}</Text>
          <Text style={styles.profileType}>{profile.isProfessional ? 'Profesional' : 'Usuario'}</Text>
          <Text style={styles.profileRegisterDate}>
            {profile.registerDate ? `Miembro desde ${formatMemberSince(profile.registerDate)}` : ''}
          </Text>
        </Card>

        {/* Card promo */}
        {!profile.isProfessional && (
          // TODO: HACER EL REGISTRO PARA PROFESIONALES
          <Card
            style={styles.convertirseContainer}
            withShadow
            onPress={() => navigation.navigate('Register', { isProfessional: true })}
          >
            <Image
              source={require('../../assets/icons/cuenta/convertirseProfesional.png')}
              style={styles.convertirseIcon}
              resizeMode="contain"
            />

            <View style={styles.convertirseTextContainer}>
              <Text style={styles.convertirseTitle}>Conviértete en profesional</Text>
              <Text style={styles.convertirseText}>
                Empieza a ofrecer tus servicios y genera ingresos adicionales, ¡es muy sencillo!
              </Text>
            </View>
          </Card>
        )}

        {/* Lista */}
        <View style={styles.listCard}>
          {rows.map((item, idx) => (
            <View key={item.key}>
              <TouchableOpacity activeOpacity={0.8} style={styles.row} onPress={item.onPress}>
                <View style={styles.rowLeft}>
                  <Image source={item.leftIcon} style={styles.icon} resizeMode="contain" />
                </View>

                <Text style={styles.rowText}>{item.label}</Text>

                {item.rightText ? <Text style={styles.rowRightText}>{item.rightText}</Text> : null}

                {item.rightIcon ? (
                  <View style={styles.rowRight}>
                    <Image source={item.rightIcon} style={styles.rightIcon} resizeMode="contain" />
                  </View>
                ) : null}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <Divider />

        {/* Logout como item */}
        <View style={styles.row}>
          <TouchableOpacity activeOpacity={0.8} style={styles.row} onPress={handleLogout}>
            <View style={styles.rowLeft}>
              <Image
                source={require('../../assets/icons/cuenta/cerrarSesion.png')}
                style={styles.icon}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.rowText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>

        {/* Modals */}
        <AppModal
          visible={showNotifyModal}
          title="Notificaciones"
          text="Aquí podrás ver tus notificaciones próximamente."
          onClose={() => setShowNotifyModal(false)}
        />
        <AppModal
          visible={showConfigModal}
          title="Configuración de la cuenta"
          text="Aquí podrás ajustar las preferencias de tu cuenta próximamente."
          onClose={() => setShowConfigModal(false)}
        />
        <AppModal
          visible={showHelpModal}
          title="Obtén ayuda"
          text="Si necesitas asistencia, por favor contacta a nuestro equipo de soporte a través del correo soporte@ejemplo.com"
          onClose={() => setShowHelpModal(false)}
        />
        <AppModal
          visible={showPrivacyModal}
          title="Privacidad"
          text="Tu información se utiliza únicamente para ofrecerte los servicios de la plataforma. No compartimos tus datos con terceros sin tu consentimiento."
          onClose={() => setShowPrivacyModal(false)}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 30,
  },

  icon: {
    width: 24,
    height: 24,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  bellBtn: {
    position: 'relative',
    padding: 8,
    backgroundColor: COLORS.bgLightGrey,
    borderRadius: 24,
  },
  bellDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primaryBrilliant,
  },
  iconNotification: {
    width: 18,
    height: 18,
  },

  profileCard: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 24,
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    backgroundColor: COLORS.bgLightGrey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  profileType: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  profileRegisterDate: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },

  convertirseContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  convertirseIcon: {
    width: 42,
    height: 60,
    marginRight: 12,
  },
  convertirseTextContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  convertirseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  convertirseText: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },

  listCard: {
    borderRadius: 12,
    marginVertical: 24,
    gap: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  rowText: {
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 10,
    flex: 1,
  },
  rowLeft: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowRight: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowRightText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 8,
  },
  rightIcon: {
    width: 16,
    height: 16,
  },

  // Location styles
  locationsList: {
    marginTop: 8,
  },
  locationItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
    flexShrink: 1,
  },
  locationChipSelected: {
    backgroundColor: '#dbeafe',
  },
  locationChipText: {
    fontSize: 12,
    color: '#374151',
  },
  locationDeleteBtn: {
    marginLeft: 8,
    padding: 4,
  },
});
