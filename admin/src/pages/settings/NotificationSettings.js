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
  Chip,
  Paper,
  ListItem,
  ListItemText,
  List,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

/**
 * 알림 설정 컴포넌트
 * 시스템 알림 관련 설정을 관리
 * 
 * @param {Object} props
 * @param {Object} props.settings - 알림 설정 데이터
 * @param {Function} props.onSave - 설정 저장 콜백
 * @param {boolean} props.saving - 저장 중 여부
 */
export const NotificationSettings = ({ settings, onSave, saving }) => {
  const defaultSettings = {
    // 이메일 알림 설정
    emailNotifications: true,
    emailFrom: 'noreply@nest.platform',
    emailSubjectPrefix: '[Nest] ',
    emailSignature: '감사합니다.\nNest 플랫폼 팀',
    
    // 알림 유형별 활성화 설정
    notifyNewUser: true,
    notifyPasswordReset: true,
    notifyLoginAttempt: false,
    notifyNewNFT: true,
    notifyLevelUp: true,
    notifyReward: true,
    notifyMission: true,
    notifyTransaction: true,
    notifyFailedTransaction: true,
    notifyAdminAction: true,
    
    // 푸시 알림 설정
    pushNotifications: true,
    pushForMobile: true,
    pushForDesktop: true,
    pushNotificationsVapidKey: process.env.REACT_APP_PUSH_VAPID_KEY,
    
    // SMTP 설정
    smtpEnabled: true,
    smtpHost: 'smtp.example.com',
    smtpPort: 587,
    smtpSecure: true,
    smtpUsername: 'smtp_user',
    smtpPassword: '********',
    
    // SMS 설정
    smsEnabled: true,
    smsProvider: 'twilio',
    smsAccountSid: process.env.REACT_APP_TWILIO_ACCOUNT_SID,
    smsAuthToken: '********',
    smsFromNumber: '+1234567890',
    
    // 알림 템플릿
    templates: [
      { id: 1, name: 'welcome_email', subject: '환영합니다!', body: '{{name}}님, Nest 플랫폼에 가입하신 것을 환영합니다.' },
      { id: 2, name: 'password_reset', subject: '비밀번호 재설정', body: '{{name}}님, 비밀번호 재설정 요청이 있었습니다.' },
      { id: 3, name: 'new_nft_minted', subject: '새 NFT 발행 알림', body: '{{name}}님, 새 NFT가 발행되었습니다.' }
    ]
  };

  // 현재 설정 또는 기본값 사용
  const [formData, setFormData] = useState({
    ...defaultSettings,
    ...(settings || {})
  });

  // 템플릿 편집 다이얼로그 상태
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);

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

  // 템플릿 편집 다이얼로그 열기
  const handleOpenTemplateDialog = (template) => {
    setCurrentTemplate(template ? { ...template } : { 
      id: Math.max(0, ...formData.templates.map(t => t.id)) + 1,
      name: '', 
      subject: '', 
      body: '' 
    });
    setTemplateDialogOpen(true);
  };

  // 템플릿 저장
  const handleSaveTemplate = () => {
    const isNewTemplate = !formData.templates.find(t => t.id === currentTemplate.id);
    
    setFormData({
      ...formData,
      templates: isNewTemplate 
        ? [...formData.templates, currentTemplate]
        : formData.templates.map(t => t.id === currentTemplate.id ? currentTemplate : t)
    });
    
    setTemplateDialogOpen(false);
  };

  // 템플릿 삭제
  const handleDeleteTemplate = (id) => {
    setFormData({
      ...formData,
      templates: formData.templates.filter(t => t.id !== id)
    });
  };

  // 템플릿 편집
  const handleTemplateChange = (e) => {
    const { name, value } = e.target;
    setCurrentTemplate({
      ...currentTemplate,
      [name]: value
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Typography variant="h6" gutterBottom>
        알림 설정
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        사용자와 관리자에게 전송되는 알림에 관한 설정을 관리합니다.
      </Typography>

      <Grid container spacing={3}>
        {/* 이메일 알림 설정 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                이메일 알림 설정
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="emailNotifications"
                        checked={formData.emailNotifications}
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label="이메일 알림 활성화"
                  />
                </Grid>
                
                {formData.emailNotifications && (
                  <>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="발신자 이메일"
                        name="emailFrom"
                        value={formData.emailFrom}
                        onChange={handleChange}
                        margin="normal"
                        type="email"
                        required
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="이메일 제목 접두사"
                        name="emailSubjectPrefix"
                        value={formData.emailSubjectPrefix}
                        onChange={handleChange}
                        margin="normal"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="이메일 서명"
                        name="emailSignature"
                        value={formData.emailSignature}
                        onChange={handleChange}
                        margin="normal"
                        multiline
                        rows={3}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* SMTP 설정 */}
        {formData.emailNotifications && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  SMTP 설정
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          name="smtpEnabled"
                          checked={formData.smtpEnabled}
                          onChange={handleChange}
                          color="primary"
                        />
                      }
                      label="SMTP 활성화"
                    />
                  </Grid>
                  
                  {formData.smtpEnabled && (
                    <>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="SMTP 호스트"
                          name="smtpHost"
                          value={formData.smtpHost}
                          onChange={handleChange}
                          margin="normal"
                          required
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="SMTP 포트"
                          name="smtpPort"
                          value={formData.smtpPort}
                          onChange={handleChange}
                          margin="normal"
                          type="number"
                          required
                          InputProps={{ inputProps: { min: 1, max: 65535 } }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <FormControlLabel
                          control={
                            <Switch
                              name="smtpSecure"
                              checked={formData.smtpSecure}
                              onChange={handleChange}
                              color="primary"
                            />
                          }
                          label="SSL/TLS 보안 연결 사용"
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="SMTP 사용자 이름"
                          name="smtpUsername"
                          value={formData.smtpUsername}
                          onChange={handleChange}
                          margin="normal"
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="SMTP 비밀번호"
                          name="smtpPassword"
                          value={formData.smtpPassword}
                          onChange={handleChange}
                          margin="normal"
                          type="password"
                        />
                      </Grid>
                    </>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* 푸시 알림 설정 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                푸시 알림 설정
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="pushNotifications"
                        checked={formData.pushNotifications}
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label="푸시 알림 활성화"
                  />
                </Grid>
                
                {formData.pushNotifications && (
                  <>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            name="pushForMobile"
                            checked={formData.pushForMobile}
                            onChange={handleChange}
                            color="primary"
                          />
                        }
                        label="모바일 푸시 알림"
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            name="pushForDesktop"
                            checked={formData.pushForDesktop}
                            onChange={handleChange}
                            color="primary"
                          />
                        }
                        label="데스크톱 푸시 알림"
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="VAPID 공개 키"
                        name="pushNotificationsVapidKey"
                        value={formData.pushNotificationsVapidKey}
                        onChange={handleChange}
                        margin="normal"
                        helperText="웹 푸시 알림을 위한 VAPID 공개 키"
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* SMS 설정 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                SMS 설정
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="smsEnabled"
                        checked={formData.smsEnabled}
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label="SMS 알림 활성화"
                  />
                </Grid>
                
                {formData.smsEnabled && (
                  <>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth margin="normal">
                        <InputLabel>SMS 제공업체</InputLabel>
                        <Select
                          name="smsProvider"
                          value={formData.smsProvider}
                          onChange={handleChange}
                          label="SMS 제공업체"
                        >
                          <MenuItem value="twilio">Twilio</MenuItem>
                          <MenuItem value="aws_sns">AWS SNS</MenuItem>
                          <MenuItem value="nexmo">Nexmo</MenuItem>
                          <MenuItem value="custom">커스텀</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    
                    {formData.smsProvider === 'twilio' && (
                      <>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Account SID"
                            name="smsAccountSid"
                            value={formData.smsAccountSid}
                            onChange={handleChange}
                            margin="normal"
                            required
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Auth Token"
                            name="smsAuthToken"
                            value={formData.smsAuthToken}
                            onChange={handleChange}
                            margin="normal"
                            type="password"
                            required
                          />
                        </Grid>
                        
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="발신 전화번호"
                            name="smsFromNumber"
                            value={formData.smsFromNumber}
                            onChange={handleChange}
                            margin="normal"
                            required
                            helperText="국제 형식으로 입력 (예: +821012345678)"
                          />
                        </Grid>
                      </>
                    )}
                  </>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 알림 유형별 설정 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                알림 유형별 설정
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="notifyNewUser"
                        checked={formData.notifyNewUser}
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label="새 사용자 등록 알림"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="notifyPasswordReset"
                        checked={formData.notifyPasswordReset}
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label="비밀번호 재설정 알림"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="notifyLoginAttempt"
                        checked={formData.notifyLoginAttempt}
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label="로그인 시도 알림"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="notifyNewNFT"
                        checked={formData.notifyNewNFT}
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label="새 NFT 발행 알림"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="notifyLevelUp"
                        checked={formData.notifyLevelUp}
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label="레벨 업 알림"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="notifyReward"
                        checked={formData.notifyReward}
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label="보상 지급 알림"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="notifyMission"
                        checked={formData.notifyMission}
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label="미션 관련 알림"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="notifyTransaction"
                        checked={formData.notifyTransaction}
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label="트랜잭션 처리 알림"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="notifyFailedTransaction"
                        checked={formData.notifyFailedTransaction}
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label="실패한 트랜잭션 알림"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        name="notifyAdminAction"
                        checked={formData.notifyAdminAction}
                        onChange={handleChange}
                        color="primary"
                      />
                    }
                    label="관리자 작업 알림"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* 알림 템플릿 */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  알림 템플릿
                </Typography>
                <Button 
                  variant="outlined" 
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenTemplateDialog(null)}
                >
                  템플릿 추가
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <List>
                {formData.templates.length === 0 ? (
                  <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                    <Typography color="textSecondary">
                      등록된 템플릿이 없습니다. 새 템플릿을 추가하세요.
                    </Typography>
                  </Paper>
                ) : (
                  formData.templates.map((template) => (
                    <Paper key={template.id} sx={{ mb: 2 }}>
                      <ListItem
                        secondaryAction={
                          <Box>
                            <IconButton 
                              edge="end" 
                              onClick={() => handleOpenTemplateDialog(template)}
                              sx={{ mr: 1 }}
                              color="primary"
                            >
                              <AddIcon />
                            </IconButton>
                            <IconButton 
                              edge="end" 
                              onClick={() => handleDeleteTemplate(template.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        }
                      >
                        <ListItemText
                          primary={
                            <Box display="flex" alignItems="center">
                              <Typography variant="subtitle2">{template.name}</Typography>
                              <Chip 
                                size="small" 
                                label={template.subject} 
                                sx={{ ml: 2 }} 
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={template.body}
                          secondaryTypographyProps={{
                            style: {
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '500px'
                            }
                          }}
                        />
                      </ListItem>
                    </Paper>
                  ))
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 템플릿 편집 다이얼로그 */}
      <Dialog 
        open={templateDialogOpen} 
        onClose={() => setTemplateDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {currentTemplate?.id ? '템플릿 편집' : '새 템플릿 추가'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="템플릿 식별자"
                name="name"
                value={currentTemplate?.name || ''}
                onChange={handleTemplateChange}
                required
                helperText="템플릿을 식별하는 고유 키 (예: welcome_email)"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="이메일 제목"
                name="subject"
                value={currentTemplate?.subject || ''}
                onChange={handleTemplateChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="템플릿 내용"
                name="body"
                value={currentTemplate?.body || ''}
                onChange={handleTemplateChange}
                multiline
                rows={10}
                required
                helperText="변수는 {{variable_name}} 형식으로 사용할 수 있습니다. (예: {{name}})"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTemplateDialogOpen(false)}>취소</Button>
          <Button 
            onClick={handleSaveTemplate} 
            variant="contained" 
            color="primary"
            disabled={!currentTemplate?.name || !currentTemplate?.subject || !currentTemplate?.body}
          >
            저장
          </Button>
        </DialogActions>
      </Dialog>

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

export default NotificationSettings;
