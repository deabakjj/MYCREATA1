import React from 'react';
import { Box, Typography, Paper, Grid, Button } from '@mui/material';
import { BarChart as ChartIcon } from '@mui/icons-material';

const Analytics = () => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          분석
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ChartIcon />}
        >
          보고서 내보내기
        </Button>
      </Box>
      
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          페이지 준비 중
        </Typography>
        <Typography>
          이 페이지는 현재 개발 중입니다. 심층 분석 및 통계 기능은 곧 추가될 예정입니다.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Analytics;
