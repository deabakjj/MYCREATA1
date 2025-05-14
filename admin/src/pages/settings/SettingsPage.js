import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Divider, 
  Tabs, 
  Tab, 
  CircularProgress 
} from '@mui/material';
import { 
  Settings as SettingsIcon, 
  Lan as LanIcon, 
  Security as SecurityIcon, 
  Notifications as NotificationsIcon, 
  Palette as PaletteIcon, 
  IntegrationInstructions as IntegrateIcon 
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';

import { GeneralSettings } from './GeneralSettings';
import { BlockchainSettings } from './BlockchainSettings';
import { SecuritySettings } from './SecuritySettings';
import { NotificationSettings } from './NotificationSettings';
import { AppearanceSettings } from './AppearanceSettings';
import { IntegrationSettings } from './IntegrationSettings';

import { useAuth } from '../../context/AuthContext';
import { fetchSettings, updateSettings } from '../../services/settingsService';

/**
 * 관리자 패널 설정 페이지
 * Nest 플랫폼의 다양한 설정을 관리할 수 있는 페이지
 */
const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useAuth();

  // 설정 로드
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const data = await fetchSettings();
        setSettings(data);
      } catch (error) {
        console.error('Failed to load settings:', error);
        enqueueSnackbar('설정을 불러오는 데 실패했습니다.', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, [enqueueSnackbar]);

  // 탭 변경 핸들러
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // 설정 저장 핸들러
  const handleSaveSettings = async (section, updatedSettings) => {
    try {
      setSaving(true);
      
      // 전체 설정 중 특정 섹션만 업데이트
      const newSettings = {
        ...settings,
        [section]: {
          ...settings[section],
          ...updatedSettings
        }
      };
      
      await updateSettings(section, updatedSettings);
      setSettings(newSettings);
      
      enqueueSnackbar('설정이 저장되었습니다.', { variant: 'success' });
    } catch (error) {
      console.error('Failed to save settings:', error);
      enqueueSnackbar('설정 저장에 실패했습니다.', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          시스템 설정
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Nest 플랫폼의 전반적인 설정을 관리합니다.
        </Typography>
      </Box>

      <Paper elevation={3}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="settings tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<SettingsIcon />} label="일반" />
            <Tab icon={<LanIcon />} label="블록체인" />
            <Tab icon={<SecurityIcon />} label="보안" />
            <Tab icon={<NotificationsIcon />} label="알림" />
            <Tab icon={<PaletteIcon />} label="디자인" />
            <Tab icon={<IntegrateIcon />} label="연동" />
          </Tabs>
        </Box>
        
        <Divider />
        
        <Box sx={{ p: 3 }}>
          {/* 일반 설정 */}
          {activeTab === 0 && (
            <GeneralSettings 
              settings={settings?.general} 
              onSave={(updatedSettings) => handleSaveSettings('general', updatedSettings)}
              saving={saving}
            />
          )}
          
          {/* 블록체인 설정 */}
          {activeTab === 1 && (
            <BlockchainSettings 
              settings={settings?.blockchain} 
              onSave={(updatedSettings) => handleSaveSettings('blockchain', updatedSettings)}
              saving={saving}
            />
          )}
          
          {/* 보안 설정 */}
          {activeTab === 2 && (
            <SecuritySettings 
              settings={settings?.security} 
              onSave={(updatedSettings) => handleSaveSettings('security', updatedSettings)}
              saving={saving}
            />
          )}
          
          {/* 알림 설정 */}
          {activeTab === 3 && (
            <NotificationSettings 
              settings={settings?.notifications} 
              onSave={(updatedSettings) => handleSaveSettings('notifications', updatedSettings)}
              saving={saving}
            />
          )}
          
          {/* 디자인 설정 */}
          {activeTab === 4 && (
            <AppearanceSettings 
              settings={settings?.appearance} 
              onSave={(updatedSettings) => handleSaveSettings('appearance', updatedSettings)}
              saving={saving}
            />
          )}
          
          {/* 연동 설정 */}
          {activeTab === 5 && (
            <IntegrationSettings 
              settings={settings?.integrations} 
              onSave={(updatedSettings) => handleSaveSettings('integrations', updatedSettings)}
              saving={saving}
            />
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default SettingsPage;
