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
  RadioGroup,
  Radio,
  Slider,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import { 
  Save as SaveIcon,
  FileUpload as FileUploadIcon,
  Refresh as RefreshIcon,
  ColorLens as ColorLensIcon,
  FormatSize as FormatSizeIcon,
  Image as ImageIcon
} from '@mui/icons-material';
import { SketchPicker } from 'react-color';

/**
 * 앱 외관 설정 컴포넌트
 * 앱 UI 디자인 관련 설정을 관리
 * 
 * @param {Object} props
 * @param {Object} props.settings - 외관 설정 데이터
 * @param {Function} props.onSave - 설정 저장 콜백
 * @param {boolean} props.saving - 저장 중 여부
 */
export const AppearanceSettings = ({ settings, onSave, saving }) => {
  const defaultSettings = {
    // 테마 설정
    theme: 'light',
    customTheme: false,
    primaryColor: '#1976d2',
    secondaryColor: '#dc004e',
    accentColor: '#4caf50',
    errorColor: '#f44336',
    warningColor: '#ff9800',
    infoColor: '#2196f3',
    successColor: '#4caf50',
    backgroundColor: '#ffffff',
    cardBackgroundColor: '#f7f7f7',
    textColor: '#424242',
    
    // 글꼴 설정
    fontFamily: 'Noto Sans KR, sans-serif',
    fontSize: 16,
    lineHeight: 1.5,
    enableCustomFont: false,
    customFontUrl: '',
    customFontFamily: '',
    
    // 로고 및 이미지 설정
    logoUrl: '/assets/images/logo.png',
    logoAlt: 'Nest 로고',
    faviconUrl: '/assets/images/favicon.ico',
    useSplashScreen: true,
    splashScreenDuration: 3,
    splashScreenUrl: '/assets/images/splash.png',
    
    // 레이아웃 설정
    navigationStyle: 'sidebar',
    sidebarCollapsible: true,
    sidebarWidth: 240,
    contentMaxWidth: 1200,
    cardBorderRadius: 8,
    buttonBorderRadius: 4,
    useBoxShadows: true,
    shadowIntensity: 2,
    
    // 애니메이션 설정
    enableAnimations: true,
    animationSpeed: 300,
    reduceMotion: false,
    
    // 반응형 설정
    mobileBreakpoint: 600,
    tabletBreakpoint: 960,
    useAdaptiveLayout: true
  };

  // 현재 설정 또는 기본값 사용
  const [formData, setFormData] = useState({
    ...defaultSettings,
    ...(settings || {})
  });

  // 컬러 피커 상태
  const [colorPickerState, setColorPickerState] = useState({
    open: false,
    currentColor: ''
  });

  // 활성 탭
  const [activeTab, setActiveTab] = useState(0);

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

  // 탭 변경 핸들러
  const handleTabChange = (e, newValue) => {
    setActiveTab(newValue);
  };

  // 컬러 피커 열기
  const handleColorPickerOpen = (colorName) => {
    setColorPickerState({
      open: true,
      currentColor: colorName
    });
  };

  // 컬러 변경 핸들러
  const handleColorChange = (color) => {
    setFormData({
      ...formData,
      [colorPickerState.currentColor]: color.hex
    });
  };

  // 폼 제출 핸들러
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  // 기본값으로 초기화
  const handleResetToDefaults = () => {
    if (window.confirm('모든 디자인 설정을 기본값으로 초기화하시겠습니까?')) {
      setFormData({ ...defaultSettings });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          앱 외관 설정
        </Typography>
        <Button
          variant="outlined"
          color="error"
          startIcon={<RefreshIcon />}
          onClick={handleResetToDefaults}
          sx={{ mb: 1 }}
        >
          기본값으로 초기화
        </Button>
      </Box>
      
      <Typography variant="body2" color="textSecondary" paragraph>
        사용자에게 보여지는 앱의 디자인 및 UI 요소들을 설정합니다.
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab icon={<ColorLensIcon />} label="테마" />
          <Tab icon={<FormatSizeIcon />} label="글꼴" />
          <Tab icon={<ImageIcon />} label="로고/이미지" />
          <Tab label="레이아웃" />
          <Tab label="애니메이션" />
        </Tabs>
      </Paper>

      {/* 테마 설정 */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  테마 설정
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl component="fieldset">
                      <Typography variant="subtitle2" gutterBottom>
                        기본 테마
                      </Typography>
                      <RadioGroup
                        name="theme"
                        value={formData.theme}
                        onChange={handleChange}
                      >
                        <FormControlLabel
                          value="light"
                          control={<Radio />}
                          label="라이트 모드"
                        />
                        <FormControlLabel
                          value="dark"
                          control={<Radio />}
                          label="다크 모드"
                        />
                        <FormControlLabel
                          value="auto"
                          control={<Radio />}
                          label="시스템 설정 따르기"
                        />
                      </RadioGroup>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          name="customTheme"
                          checked={formData.customTheme}
                          onChange={handleChange}
                          color="primary"
                        />
                      }
                      label="커스텀 테마 사용"
                    />
                  </Grid>
                </Grid>
                
                {formData.customTheme && (
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={12} md={3}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => handleColorPickerOpen('primaryColor')}
                        sx={{
                          backgroundColor: formData.primaryColor,
                          color: '#ffffff',
                          '&:hover': {
                            backgroundColor: formData.primaryColor,
                            opacity: 0.9
                          },
                          height: '56px'
                        }}
                      >
                        Primary
                      </Button>
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => handleColorPickerOpen('secondaryColor')}
                        sx={{
                          backgroundColor: formData.secondaryColor,
                          color: '#ffffff',
                          '&:hover': {
                            backgroundColor: formData.secondaryColor,
                            opacity: 0.9
                          },
                          height: '56px'
                        }}
                      >
                        Secondary
                      </Button>
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => handleColorPickerOpen('accentColor')}
                        sx={{
                          backgroundColor: formData.accentColor,
                          color: '#ffffff',
                          '&:hover': {
                            backgroundColor: formData.accentColor,
                            opacity: 0.9
                          },
                          height: '56px'
                        }}
                      >
                        Accent
                      </Button>
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => handleColorPickerOpen('errorColor')}
                        sx={{
                          backgroundColor: formData.errorColor,
                          color: '#ffffff',
                          '&:hover': {
                            backgroundColor: formData.errorColor,
                            opacity: 0.9
                          },
                          height: '56px'
                        }}
                      >
                        Error
                      </Button>
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => handleColorPickerOpen('warningColor')}
                        sx={{
                          backgroundColor: formData.warningColor,
                          color: '#ffffff',
                          '&:hover': {
                            backgroundColor: formData.warningColor,
                            opacity: 0.9
                          },
                          height: '56px'
                        }}
                      >
                        Warning
                      </Button>
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => handleColorPickerOpen('infoColor')}
                        sx={{
                          backgroundColor: formData.infoColor,
                          color: '#ffffff',
                          '&:hover': {
                            backgroundColor: formData.infoColor,
                            opacity: 0.9
                          },
                          height: '56px'
                        }}
                      >
                        Info
                      </Button>
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => handleColorPickerOpen('successColor')}
                        sx={{
                          backgroundColor: formData.successColor,
                          color: '#ffffff',
                          '&:hover': {
                            backgroundColor: formData.successColor,
                            opacity: 0.9
                          },
                          height: '56px'
                        }}
                      >
                        Success
                      </Button>
                    </Grid>
                    
                    <Grid item xs={12} md={3}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => handleColorPickerOpen('textColor')}
                        sx={{
                          backgroundColor: formData.textColor,
                          color: '#ffffff',
                          '&:hover': {
                            backgroundColor: formData.textColor,
                            opacity: 0.9
                          },
                          height: '56px'
                        }}
                      >
                        Text
                      </Button>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => handleColorPickerOpen('backgroundColor')}
                        sx={{
                          backgroundColor: formData.backgroundColor,
                          color: formData.textColor,
                          border: '1px solid #ccc',
                          '&:hover': {
                            backgroundColor: formData.backgroundColor,
                            opacity: 0.9
                          },
                          height: '56px'
                        }}
                      >
                        Background
                      </Button>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => handleColorPickerOpen('cardBackgroundColor')}
                        sx={{
                          backgroundColor: formData.cardBackgroundColor,
                          color: formData.textColor,
                          border: '1px solid #ccc',
                          '&:hover': {
                            backgroundColor: formData.cardBackgroundColor,
                            opacity: 0.9
                          },
                          height: '56px'
                        }}
                      >
                        Card Background
                      </Button>
                    </Grid>
                    
                    {colorPickerState.open && (
                      <Grid item xs={12} sx={{ mt: 2 }}>
                        <Paper elevation={3} sx={{ p: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            {colorPickerState.currentColor.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} 선택
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <SketchPicker
                              color={formData[colorPickerState.currentColor]}
                              onChange={handleColorChange}
                              disableAlpha
                            />
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                            <Button 
                              variant="contained"
                              onClick={() => setColorPickerState({ open: false, currentColor: '' })}
                            >
                              완료
                            </Button>
                          </Box>
                        </Paper>
                      </Grid>
                    )}
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* 글꼴 설정 */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  글꼴 설정
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>기본 글꼴</InputLabel>
                      <Select
                        name="fontFamily"
                        value={formData.fontFamily}
                        onChange={handleChange}
                        label="기본 글꼴"
                      >
                        <MenuItem value="Noto Sans KR, sans-serif">Noto Sans KR</MenuItem>
                        <MenuItem value="Nanum Gothic, sans-serif">나눔고딕</MenuItem>
                        <MenuItem value="Spoqa Han Sans Neo, sans-serif">스포카 한 산스</MenuItem>
                        <MenuItem value="Pretendard, sans-serif">프리텐다드</MenuItem>
                        <MenuItem value="Roboto, sans-serif">Roboto</MenuItem>
                        <MenuItem value="Arial, sans-serif">Arial</MenuItem>
                        <MenuItem value="Helvetica, sans-serif">Helvetica</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          name="enableCustomFont"
                          checked={formData.enableCustomFont}
                          onChange={handleChange}
                          color="primary"
                        />
                      }
                      label="커스텀 글꼴 사용"
                    />
                  </Grid>
                  
                  {formData.enableCustomFont && (
                    <>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="커스텀 글꼴 URL"
                          name="customFontUrl"
                          value={formData.customFontUrl}
                          onChange={handleChange}
                          margin="normal"
                          placeholder="https://fonts.googleapis.com/css2?family=..."
                          helperText="Google Fonts 또는 서버에 호스팅된 폰트 URL"
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="커스텀 글꼴 패밀리 이름"
                          name="customFontFamily"
                          value={formData.customFontFamily}
                          onChange={handleChange}
                          margin="normal"
                          placeholder="My Custom Font, sans-serif"
                          helperText="CSS에서 사용할 폰트 패밀리 이름"
                        />
                      </Grid>
                    </>
                  )}
                  
                  <Grid item xs={12} md={6}>
                    <Box sx={{ width: '100%', mt: 2 }}>
                      <Typography id="font-size-slider" gutterBottom>
                        기본 글꼴 크기: {formData.fontSize}px
                      </Typography>
                      <Slider
                        value={formData.fontSize}
                        onChange={handleSliderChange('fontSize')}
                        aria-labelledby="font-size-slider"
                        valueLabelDisplay="auto"
                        step={1}
                        marks
                        min={12}
                        max={24}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Box sx={{ width: '100%', mt: 2 }}>
                      <Typography id="line-height-slider" gutterBottom>
                        줄 간격: {formData.lineHeight}
                      </Typography>
                      <Slider
                        value={formData.lineHeight}
                        onChange={handleSliderChange('lineHeight')}
                        aria-labelledby="line-height-slider"
                        valueLabelDisplay="auto"
                        step={0.1}
                        marks
                        min={1}
                        max={2.5}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* 로고 및 이미지 설정 */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  로고 및 이미지 설정
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="로고 URL"
                      name="logoUrl"
                      value={formData.logoUrl}
                      onChange={handleChange}
                      margin="normal"
                      helperText="메인 로고 이미지 경로"
                    />
                    <Button
                      variant="outlined"
                      startIcon={<FileUploadIcon />}
                      sx={{ mt: 1 }}
                    >
                      로고 업로드
                    </Button>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="로고 대체 텍스트"
                      name="logoAlt"
                      value={formData.logoAlt}
                      onChange={handleChange}
                      margin="normal"
                      helperText="접근성을 위한 로고 설명"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="파비콘 URL"
                      name="faviconUrl"
                      value={formData.faviconUrl}
                      onChange={handleChange}
                      margin="normal"
                      helperText="브라우저 탭에 표시되는 아이콘 (.ico, .png)"
                    />
                    <Button
                      variant="outlined"
                      startIcon={<FileUploadIcon />}
                      sx={{ mt: 1 }}
                    >
                      파비콘 업로드
                    </Button>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          name="useSplashScreen"
                          checked={formData.useSplashScreen}
                          onChange={handleChange}
                          color="primary"
                        />
                      }
                      label="스플래시 화면 사용"
                    />
                  </Grid>
                  
                  {formData.useSplashScreen && (
                    <>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="스플래시 화면 URL"
                          name="splashScreenUrl"
                          value={formData.splashScreenUrl}
                          onChange={handleChange}
                          margin="normal"
                          helperText="앱 로드 시 표시되는 스플래시 이미지"
                        />
                        <Button
                          variant="outlined"
                          startIcon={<FileUploadIcon />}
                          sx={{ mt: 1 }}
                        >
                          스플래시 이미지 업로드
                        </Button>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Box sx={{ width: '100%', mt: 2 }}>
                          <Typography id="splash-duration-slider" gutterBottom>
                            스플래시 화면 표시 시간: {formData.splashScreenDuration}초
                          </Typography>
                          <Slider
                            value={formData.splashScreenDuration}
                            onChange={handleSliderChange('splashScreenDuration')}
                            aria-labelledby="splash-duration-slider"
                            valueLabelDisplay="auto"
                            step={0.5}
                            marks
                            min={1}
                            max={5}
                          />
                        </Box>
                      </Grid>
                    </>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* 레이아웃 설정 */}
      {activeTab === 3 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  레이아웃 설정
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth margin="normal">
                      <InputLabel>내비게이션 스타일</InputLabel>
                      <Select
                        name="navigationStyle"
                        value={formData.navigationStyle}
                        onChange={handleChange}
                        label="내비게이션 스타일"
                      >
                        <MenuItem value="sidebar">사이드바</MenuItem>
                        <MenuItem value="topbar">상단바</MenuItem>
                        <MenuItem value="both">상단바 + 사이드바</MenuItem>
                        <MenuItem value="minimal">최소화</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          name="sidebarCollapsible"
                          checked={formData.sidebarCollapsible}
                          onChange={handleChange}
                          color="primary"
                        />
                      }
                      label="사이드바 접기 가능"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Box sx={{ width: '100%', mt: 2 }}>
                      <Typography id="sidebar-width-slider" gutterBottom>
                        사이드바 너비: {formData.sidebarWidth}px
                      </Typography>
                      <Slider
                        value={formData.sidebarWidth}
                        onChange={handleSliderChange('sidebarWidth')}
                        aria-labelledby="sidebar-width-slider"
                        valueLabelDisplay="auto"
                        step={10}
                        marks
                        min={180}
                        max={320}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Box sx={{ width: '100%', mt: 2 }}>
                      <Typography id="content-width-slider" gutterBottom>
                        컨텐츠 최대 너비: {formData.contentMaxWidth}px
                      </Typography>
                      <Slider
                        value={formData.contentMaxWidth}
                        onChange={handleSliderChange('contentMaxWidth')}
                        aria-labelledby="content-width-slider"
                        valueLabelDisplay="auto"
                        step={100}
                        marks
                        min={800}
                        max={1920}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Box sx={{ width: '100%', mt: 2 }}>
                      <Typography id="card-radius-slider" gutterBottom>
                        카드 모서리 반경: {formData.cardBorderRadius}px
                      </Typography>
                      <Slider
                        value={formData.cardBorderRadius}
                        onChange={handleSliderChange('cardBorderRadius')}
                        aria-labelledby="card-radius-slider"
                        valueLabelDisplay="auto"
                        step={1}
                        marks
                        min={0}
                        max={16}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Box sx={{ width: '100%', mt: 2 }}>
                      <Typography id="button-radius-slider" gutterBottom>
                        버튼 모서리 반경: {formData.buttonBorderRadius}px
                      </Typography>
                      <Slider
                        value={formData.buttonBorderRadius}
                        onChange={handleSliderChange('buttonBorderRadius')}
                        aria-labelledby="button-radius-slider"
                        valueLabelDisplay="auto"
                        step={1}
                        marks
                        min={0}
                        max={24}
                      />
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          name="useBoxShadows"
                          checked={formData.useBoxShadows}
                          onChange={handleChange}
                          color="primary"
                        />
                      }
                      label="그림자 효과 사용"
                    />
                  </Grid>
                  
                  {formData.useBoxShadows && (
                    <Grid item xs={12} md={6}>
                      <Box sx={{ width: '100%', mt: 2 }}>
                        <Typography id="shadow-intensity-slider" gutterBottom>
                          그림자 강도: {formData.shadowIntensity}
                        </Typography>
                        <Slider
                          value={formData.shadowIntensity}
                          onChange={handleSliderChange('shadowIntensity')}
                          aria-labelledby="shadow-intensity-slider"
                          valueLabelDisplay="auto"
                          step={1}
                          marks
                          min={0}
                          max={5}
                        />
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* 애니메이션 설정 */}
      {activeTab === 4 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  애니메이션 설정
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          name="enableAnimations"
                          checked={formData.enableAnimations}
                          onChange={handleChange}
                          color="primary"
                        />
                      }
                      label="애니메이션 활성화"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          name="reduceMotion"
                          checked={formData.reduceMotion}
                          onChange={handleChange}
                          color="primary"
                        />
                      }
                      label="모션 줄이기 (접근성)"
                    />
                  </Grid>
                  
                  {formData.enableAnimations && !formData.reduceMotion && (
                    <Grid item xs={12} md={6}>
                      <Box sx={{ width: '100%', mt: 2 }}>
                        <Typography id="animation-speed-slider" gutterBottom>
                          애니메이션 속도: {formData.animationSpeed}ms
                        </Typography>
                        <Slider
                          value={formData.animationSpeed}
                          onChange={handleSliderChange('animationSpeed')}
                          aria-labelledby="animation-speed-slider"
                          valueLabelDisplay="auto"
                          step={50}
                          marks
                          min={100}
                          max={600}
                        />
                      </Box>
                    </Grid>
                  )}
                  
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          name="useAdaptiveLayout"
                          checked={formData.useAdaptiveLayout}
                          onChange={handleChange}
                          color="primary"
                        />
                      }
                      label="반응형 레이아웃 사용"
                    />
                  </Grid>
                  
                  {formData.useAdaptiveLayout && (
                    <>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="모바일 분기점 (px)"
                          name="mobileBreakpoint"
                          type="number"
                          value={formData.mobileBreakpoint}
                          onChange={handleChange}
                          margin="normal"
                          InputProps={{ inputProps: { min: 320, max: 767 } }}
                          helperText="이 너비 이하는 모바일로 취급"
                        />
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label="태블릿 분기점 (px)"
                          name="tabletBreakpoint"
                          type="number"
                          value={formData.tabletBreakpoint}
                          onChange={handleChange}
                          margin="normal"
                          InputProps={{ inputProps: { min: 768, max: 1279 } }}
                          helperText="이 너비 이하는 태블릿으로 취급"
                        />
                      </Grid>
                    </>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

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

export default AppearanceSettings;
