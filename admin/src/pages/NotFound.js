import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const NotFound = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          py: 5,
          px: 6,
          borderRadius: 2,
          textAlign: 'center',
          maxWidth: 500,
        }}
      >
        <Typography variant="h1" color="primary" sx={{ fontSize: 120, fontWeight: 'bold' }}>
          404
        </Typography>
        <Typography variant="h5" gutterBottom>
          페이지를 찾을 수 없습니다
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          대시보드로 돌아가거나 다른 페이지로 이동해주세요.
        </Typography>
      </Paper>
    </Box>
  );
};

export default NotFound;
