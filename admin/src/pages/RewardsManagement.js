import React from 'react';
import { Box, Typography, Paper, Grid, Button } from '@mui/material';
import { CardGiftcard as RewardsIcon } from '@mui/icons-material';

const RewardsManagement = () => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          보상 관리
        </Typography>
        <Button
          variant="contained"
          startIcon={<RewardsIcon />}
        >
          새 보상 생성
        </Button>
      </Box>
      
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          페이지 준비 중
        </Typography>
        <Typography>
          이 페이지는 현재 개발 중입니다. 보상 관리 기능은 곧 추가될 예정입니다.
        </Typography>
      </Paper>
    </Box>
  );
};

export default RewardsManagement;
