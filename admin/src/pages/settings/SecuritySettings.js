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
  CircularProgress,
  Alert,
  Slider,
  IconButton,
  InputAdornment,
  Tooltip
} from '@mui/material';
import { 
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Info as InfoIcon
} from '@mui/icons-material';

/**
 * 보안 설정 컴포넌트
 * 시스템 보안 관련 설정을 관리
 * 
 * @param {Object} props
 * @param {Object} props.settings - 보안 설정 데이터
 * @param {Function} props.onSave - 설정 저장 콜백
 * @param {boolean} props.saving - 저장 중 여부
 */
export const SecuritySettings = ({ settings, onSave, saving }) => {
  const defaultSettings = {
    // 인증 설정
    twoFactorAuth: false,
    twoFactorAuthType: 'app',
    twoFactorAuthRequired: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    
    // 비밀번호 정책
    passwordPolicy: true,
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSymbols: true,
    passwordExpiryDays: 90,
    passwordHistoryCount: 5,
    
    // API 보안
    apiRateLimit: 100,
    apiJwtSecret: '****************************************',
    apiJwtExpiry: 24,
    apiKeyExpiryDays: 180,
    
    // 트랜잭션 보안
    transactionConfirmation: true,
    transactionConfirmationType: 'email',
    transactionConfirmationThreshold: 100,
    transactionWhitelistEnabled: false,
    
    // 다른 보안 설정
    ipWhitelisting: false,
    captchaEnabled: true,
    captchaType: 'recaptcha',
    captchaSiteKey: process.env.REACT_APP_RECAPTCHA_SITE_KEY,
    captchaSecretKey: process.env.REACT_APP_RECAPTCHA_SECRET_KEY,
    encryptUserData: true,
    encryptionType: 'aes256'
  };

  // 현재 설정 또는 기본값 사용
  const [formData, setFormData] = useState({
    ...defaultSettings,
    ...(settings || {})
  });

  // 패스워드 필드 보기/숨기기 상태
  const [showApiJwtSecret, setShowApiJwtSecret] = useState(false);
  const [showCaptchaSecretKey, setShowCaptchaSecretKey] = useState(false);

  // 새 API JWT 시크릿 생성
  const generateJwtSecret = () => {
    // 랜덤 문자열 생성 (실제 프로덕션에서는 더 강력한 방법 사용 필요)
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+';
    let result = '';
    const length = 40;
    
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    setFormData({
      ...formData,
      apiJwtSecret: result
    });
  };

  // 입력 변경 핸들러
  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // 슬라이더 변경 핸들러
  const handleSliderChange = (name) => (e, newValue) => {
    setFormData({
      ...formData,
      [name]: newValue
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
        보안 설정
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        시스템의 보안 설정을 관리합니다.
      </Typography>

      <Alert severity="warning" sx={{ mb: 3 }}>
        보안 설정을 변경하면 사용자의 로그인 및 시스템 접근에 영향을 줄 수 있습니다. 신중하게 변경하세요.
      </Alert>

      <Grid container spacing={3}>
        {/* 인증 설정 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                인증 설정
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="twoFactorAuth"
                        checked={formData.twoFactorAuth}
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label="2단계 인증 활성화"
                  />
                </Grid>
                
                {formData.twoFactorAuth && (
                  <>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth margin="normal">
                        <InputLabel>2단계 인증 방식</InputLabel>
                        <Select
                          name="twoFactorAuthType"
                          value={formData.twoFactorAuthType}
                          onChange={handleChange}
                          label="2단계 인증 방식"
                        >
                          <MenuItem value="app">인증 앱 (TOTP)</MenuItem>
                          <MenuItem value="sms">SMS</MenuItem>
                          <MenuItem value="email">이메일</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            name="twoFactorAuthRequired"
                            checked={formData.twoFactorAuthRequired}
                            onChange={handleChange}
                            color="primary"
                          />
                        }
                        label="모든 사용자에게 2단계 인증 필수화"
                      />
                    </Grid>
                  </>
                )}
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ width: '100%', mt: 2 }}>
                    <Typography id="session-timeout-slider" gutterBottom>
                      세션 타임아웃: {formData.sessionTimeout}분
                    </Typography>
                    <Slider
                      value={formData.sessionTimeout}
                      onChange={handleSliderChange('sessionTimeout')}
                      aria-labelledby="session-timeout-slider"
                      valueLabelDisplay="auto"
                      step={5}
                      marks
                      min={5}
                      max={120}
                    />
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="최대 로그인 시도 횟수"
                    name="maxLoginAttempts"
                    type="number"
                    value={formData.maxLoginAttempts}
                    onChange={handleChange}
                    margin="normal"
                    InputProps={{ inputProps: { min: 1, max: 10 } }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="계정 잠금 기간 (분)"
                    name="lockoutDuration"
                    type="number"
                    value={formData.lockoutDuration}
                    onChange={handleChange}
                    margin="normal"
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 비밀번호 정책 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                비밀번호 정책
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="passwordPolicy"
                        checked={formData.passwordPolicy}
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label="비밀번호 정책 활성화"
                  />
                </Grid>
                
                {formData.passwordPolicy && (
                  <>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="최소 비밀번호 길이"
                        name="passwordMinLength"
                        type="number"
                        value={formData.passwordMinLength}
                        onChange={handleChange}
                        margin="normal"
                        InputProps={{ inputProps: { min: 6, max: 32 } }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            name="passwordRequireUppercase"
                            checked={formData.passwordRequireUppercase}
                            onChange={handleChange}
                            color="primary"
                          />
                        }
                        label="대문자 포함 필수"
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            name="passwordRequireLowercase"
                            checked={formData.passwordRequireLowercase}
                            onChange={handleChange}
                            color="primary"
                          />
                        }
                        label="소문자 포함 필수"
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            name="passwordRequireNumbers"
                            checked={formData.passwordRequireNumbers}
                            onChange={handleChange}
                            color="primary"
                          />
                        }
                        label="숫자 포함 필수"
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            name="passwordRequireSymbols"
                            checked={formData.passwordRequireSymbols}
                            onChange={handleChange}
                            color="primary"
                          />
                        }
                        label="특수문자 포함 필수"
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="비밀번호 만료 기간 (일)"
                        name="passwordExpiryDays"
                        type="number"
                        value={formData.passwordExpiryDays}
                        onChange={handleChange}
                        margin="normal"
                        InputProps={{ inputProps: { min: 0 } }}
                        helperText="0으로 설정하면 만료되지 않음"
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="비밀번호 기록 개수"
                        name="passwordHistoryCount"
                        type="number"
                        value={formData.passwordHistoryCount}
                        onChange={handleChange}
                        margin="normal"
                        InputProps={{ inputProps: { min: 0, max: 24 } }}
                        helperText="새 비밀번호 설정 시 이전 비밀번호 재사용 방지 횟수"
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* API 보안 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                API 보안
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="API 요청 제한 (분당)"
                    name="apiRateLimit"
                    type="number"
                    value={formData.apiRateLimit}
                    onChange={handleChange}
                    margin="normal"
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="API JWT 만료 시간 (시간)"
                    name="apiJwtExpiry"
                    type="number"
                    value={formData.apiJwtExpiry}
                    onChange={handleChange}
                    margin="normal"
                    InputProps={{ inputProps: { min: 1, max: 720 } }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="API 키 만료 기간 (일)"
                    name="apiKeyExpiryDays"
                    type="number"
                    value={formData.apiKeyExpiryDays}
                    onChange={handleChange}
                    margin="normal"
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="API JWT 시크릿"
                    name="apiJwtSecret"
                    type={showApiJwtSecret ? 'text' : 'password'}
                    value={formData.apiJwtSecret}
                    onChange={handleChange}
                    margin="normal"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowApiJwtSecret(!showApiJwtSecret)}
                            edge="end"
                          >
                            {showApiJwtSecret ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                          <IconButton
                            onClick={generateJwtSecret}
                            edge="end"
                            color="primary"
                          >
                            <RefreshIcon />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    helperText="JWT 토큰 서명에 사용되는 비밀키입니다. 갱신 버튼을 눌러 새로 생성할 수 있습니다."
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 트랜잭션 보안 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                트랜잭션 보안
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="transactionConfirmation"
                        checked={formData.transactionConfirmation}
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label="트랜잭션 확인 활성화"
                  />
                </Grid>
                
                {formData.transactionConfirmation && (
                  <>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth margin="normal">
                        <InputLabel>트랜잭션 확인 방식</InputLabel>
                        <Select
                          name="transactionConfirmationType"
                          value={formData.transactionConfirmationType}
                          onChange={handleChange}
                          label="트랜잭션 확인 방식"
                        >
                          <MenuItem value="email">이메일</MenuItem>
                          <MenuItem value="sms">SMS</MenuItem>
                          <MenuItem value="2fa">2단계 인증 앱</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="트랜잭션 확인 임계값 (CTA)"
                        name="transactionConfirmationThreshold"
                        type="number"
                        value={formData.transactionConfirmationThreshold}
                        onChange={handleChange}
                        margin="normal"
                        InputProps={{ inputProps: { min: 0 } }}
                        helperText="이 금액 이상의 트랜잭션에 대해 확인이 필요합니다. 0으로 설정하면 모든 트랜잭션에 대해 확인합니다."
                      />
                    </Grid>
                  </>
                )}
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="transactionWhitelistEnabled"
                        checked={formData.transactionWhitelistEnabled}
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label="트랜잭션 화이트리스트 활성화"
                  />
                  <Tooltip title="트랜잭션 화이트리스트를 활성화하면 승인된 주소로만 트랜잭션이 가능합니다.">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 기타 보안 설정 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                기타 보안 설정
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="ipWhitelisting"
                        checked={formData.ipWhitelisting}
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label="IP 화이트리스팅 활성화"
                  />
                  <Tooltip title="IP 화이트리스팅을 활성화하면 승인된 IP 주소에서만 관리자 패널에 접근이 가능합니다.">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="captchaEnabled"
                        checked={formData.captchaEnabled}
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label="CAPTCHA 활성화"
                  />
                </Grid>
                
                {formData.captchaEnabled && (
                  <>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth margin="normal">
                        <InputLabel>CAPTCHA 유형</InputLabel>
                        <Select
                          name="captchaType"
                          value={formData.captchaType}
                          onChange={handleChange}
                          label="CAPTCHA 유형"
                        >
                          <MenuItem value="recaptcha">Google reCAPTCHA</MenuItem>
                          <MenuItem value="hcaptcha">hCaptcha</MenuItem>
                          <MenuItem value="custom">커스텀 CAPTCHA</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="CAPTCHA 사이트 키"
                        name="captchaSiteKey"
                        value={formData.captchaSiteKey}
                        onChange={handleChange}
                        margin="normal"
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="CAPTCHA 시크릿 키"
                        name="captchaSecretKey"
                        type={showCaptchaSecretKey ? 'text' : 'password'}
                        value={formData.captchaSecretKey}
                        onChange={handleChange}
                        margin="normal"
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowCaptchaSecretKey(!showCaptchaSecretKey)}
                                edge="end"
                              >
                                {showCaptchaSecretKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </>
                )}
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="encryptUserData"
                        checked={formData.encryptUserData}
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label="사용자 데이터 암호화"
                  />
                </Grid>
                
                {formData.encryptUserData && (
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>암호화 유형</InputLabel>
                      <Select
                        name="encryptionType"
                        value={formData.encryptionType}
                        onChange={handleChange}
                        label="암호화 유형"
                      >
                        <MenuItem value="aes256">AES-256</MenuItem>
                        <MenuItem value="aes192">AES-192</MenuItem>
                        <MenuItem value="aes128">AES-128</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                )}
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

export default SecuritySettings;
