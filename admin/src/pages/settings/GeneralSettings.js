import React, { useState } from 'react';
import {
  Typography,
  Box,
  TextField,
  FormControl,
  FormControlLabel,
  Switch,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';

/**
 * 일반 설정 컴포넌트
 * 플랫폼의 기본적인 설정을 관리
 * 
 * @param {Object} props
 * @param {Object} props.settings - 일반 설정 데이터
 * @param {Function} props.onSave - 설정 저장 콜백
 * @param {boolean} props.saving - 저장 중 여부
 */
export const GeneralSettings = ({ settings, onSave, saving }) => {
  const defaultSettings = {
    platformName: 'Nest Platform',
    adminEmail: 'admin@nest.platform',
    supportEmail: 'support@nest.platform',
    language: 'ko',
    timezone: 'Asia/Seoul',
    maintenanceMode: false,
    userRegistration: true,
    defaultUserLevel: 1,
    termsUrl: 'https://nest.platform/terms',
    privacyUrl: 'https://nest.platform/privacy',
    maxUploadSize: 10,
    fileTypes: 'jpg,jpeg,png,gif,pdf,doc,docx'
  };

  // 현재 설정 또는 기본값 사용
  const [formData, setFormData] = useState({
    ...defaultSettings,
    ...(settings || {})
  });

  // 입력 변경 핸들러
  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // 폼 제출 핸들러
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Typography variant="h6" gutterBottom>
        일반 설정
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        플랫폼의 기본적인 설정을 관리합니다.
      </Typography>

      <Grid container spacing={3}>
        {/* 플랫폼 정보 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                플랫폼 정보
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="플랫폼 이름"
                    name="platformName"
                    value={formData.platformName}
                    onChange={handleChange}
                    margin="normal"
                    required
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="관리자 이메일"
                    name="adminEmail"
                    type="email"
                    value={formData.adminEmail}
                    onChange={handleChange}
                    margin="normal"
                    required
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="지원 이메일"
                    name="supportEmail"
                    type="email"
                    value={formData.supportEmail}
                    onChange={handleChange}
                    margin="normal"
                    required
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>기본 언어</InputLabel>
                    <Select
                      name="language"
                      value={formData.language}
                      onChange={handleChange}
                      label="기본 언어"
                    >
                      <MenuItem value="ko">한국어</MenuItem>
                      <MenuItem value="en">영어</MenuItem>
                      <MenuItem value="ja">일본어</MenuItem>
                      <MenuItem value="zh">중국어</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>타임존</InputLabel>
                    <Select
                      name="timezone"
                      value={formData.timezone}
                      onChange={handleChange}
                      label="타임존"
                    >
                      <MenuItem value="Asia/Seoul">아시아/서울 (GMT+9)</MenuItem>
                      <MenuItem value="America/New_York">미국/뉴욕 (GMT-5)</MenuItem>
                      <MenuItem value="Europe/London">유럽/런던 (GMT+0)</MenuItem>
                      <MenuItem value="Asia/Tokyo">아시아/도쿄 (GMT+9)</MenuItem>
                      <MenuItem value="Australia/Sydney">호주/시드니 (GMT+11)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 사용자 설정 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                사용자 설정
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="userRegistration"
                        checked={formData.userRegistration}
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label="사용자 등록 허용"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="maintenanceMode"
                        checked={formData.maintenanceMode}
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label="유지보수 모드"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>기본 사용자 레벨</InputLabel>
                    <Select
                      name="defaultUserLevel"
                      value={formData.defaultUserLevel}
                      onChange={handleChange}
                      label="기본 사용자 레벨"
                    >
                      <MenuItem value={1}>레벨 1 (초보자)</MenuItem>
                      <MenuItem value={2}>레벨 2 (일반)</MenuItem>
                      <MenuItem value={3}>레벨 3 (전문가)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 법적 정보 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                법적 정보
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="이용약관 URL"
                    name="termsUrl"
                    value={formData.termsUrl}
                    onChange={handleChange}
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="개인정보처리방침 URL"
                    name="privacyUrl"
                    value={formData.privacyUrl}
                    onChange={handleChange}
                    margin="normal"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 파일 업로드 설정 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                파일 업로드 설정
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="최대 업로드 크기 (MB)"
                    name="maxUploadSize"
                    type="number"
                    value={formData.maxUploadSize}
                    onChange={handleChange}
                    margin="normal"
                    InputProps={{ inputProps: { min: 1, max: 100 } }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="허용된 파일 유형 (쉼표로 구분)"
                    name="fileTypes"
                    value={formData.fileTypes}
                    onChange={handleChange}
                    margin="normal"
                    helperText="쉼표로 구분된 파일 확장자 목록 (예: jpg,png,pdf)"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 저장 버튼 */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          startIcon={saving ? <CircularProgress size={24} color="inherit" /> : <SaveIcon />}
          disabled={saving}
        >
          {saving ? '저장 중...' : '설정 저장'}
        </Button>
      </Box>
    </form>
  );
};

export default GeneralSettings;
