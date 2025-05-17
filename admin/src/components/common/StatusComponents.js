import React from 'react';
import { 
  CircularProgress, 
  Alert, 
  AlertTitle, 
  Box, 
  Typography,
  Button
} from '@mui/material';

/**
 * 로딩 상태를 표시하는 컴포넌트
 * @param {Object} props - 컴포넌트 속성
 * @param {string} [props.message='로딩 중입니다...'] - 로딩 메시지
 * @param {string} [props.size='medium'] - 로딩 인디케이터 크기 ('small', 'medium', 'large')
 * @returns {JSX.Element} 로딩 컴포넌트
 */
export const Loading = ({ 
  message = '로딩 중입니다...', 
  size = 'medium',
  fullPage = false,
  minHeight = '200px'
}) => {
  const containerStyle = fullPage ? {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '80vh',
    width: '100%'
  } : {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight,
    width: '100%'
  };
  
  const getSize = () => {
    switch (size) {
      case 'small': return 24;
      case 'large': return 60;
      case 'medium':
      default: return 40;
    }
  };

  return (
    <Box sx={containerStyle}>
      <CircularProgress size={getSize()} />
      <Typography 
        variant="body1" 
        color="text.secondary" 
        sx={{ mt: 2 }}
      >
        {message}
      </Typography>
    </Box>
  );
};

/**
 * 에러 상태를 표시하는 컴포넌트
 * @param {Object} props - 컴포넌트 속성
 * @param {string} props.error - 에러 메시지
 * @param {Function} [props.onRetry] - 재시도 버튼 클릭 시 호출할 함수
 * @param {string} [props.severity='error'] - 알림 심각도 ('error', 'warning', 'info', 'success')
 * @returns {JSX.Element} 에러 컴포넌트
 */
export const ErrorMessage = ({ 
  error, 
  onRetry, 
  severity = 'error',
  title = '오류가 발생했습니다'
}) => {
  if (!error) return null;

  return (
    <Alert 
      severity={severity}
      action={onRetry ? (
        <Button color="inherit" size="small" onClick={onRetry}>
          재시도
        </Button>
      ) : undefined}
      sx={{ mb: 2, width: '100%' }}
    >
      <AlertTitle>{title}</AlertTitle>
      {error}
    </Alert>
  );
};

/**
 * 빈 데이터 상태를 표시하는 컴포넌트
 * @param {Object} props - 컴포넌트 속성
 * @param {string} [props.message='데이터가 없습니다'] - 표시할 메시지
 * @param {React.ReactNode} [props.icon] - 표시할 아이콘
 * @param {React.ReactNode} [props.action] - 표시할 액션 버튼
 * @returns {JSX.Element} 빈 데이터 컴포넌트
 */
export const EmptyState = ({ 
  message = '데이터가 없습니다', 
  icon,
  action,
  minHeight = '200px'
}) => {
  return (
    <Box 
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight,
        width: '100%',
        p: 3
      }}
    >
      {icon && (
        <Box sx={{ mb: 2, color: 'text.secondary' }}>
          {icon}
        </Box>
      )}
      <Typography 
        variant="body1" 
        color="text.secondary"
        sx={{ mb: action ? 2 : 0 }}
      >
        {message}
      </Typography>
      {action}
    </Box>
  );
};
