import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardHeader,
  Divider,
  IconButton,
  Button,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  PersonAdd as PersonAddIcon,
  Assignment as AssignmentIcon,
  CardGiftcard as RewardsIcon,
  SupervisedUserCircle as UserIcon
} from '@mui/icons-material';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
import api from '../services/api';

// ChartJS 컴포넌트 등록
ChartJS.register(...registerables);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalUsers: 0,
    activeUsers: 0,
    completedMissions: 0,
    issuedRewards: 0,
    nestTokenCirculation: 0
  });
  const [userStats, setUserStats] = useState({ labels: [], data: [] });
  const [missionStats, setMissionStats] = useState({ labels: [], data: [] });
  const [tokenDistribution, setTokenDistribution] = useState({ labels: [], data: [] });
  const [recentActivities, setRecentActivities] = useState([]);
  
  // 대시보드 데이터 로드
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 실제 API 연결 - 현재는 목업 데이터 사용
      // const response = await api.get('/analytics/dashboard');
      // const data = response.data;
      
      // 목업 데이터
      const mockData = {
        summary: {
          totalUsers: 1203,
          activeUsers: 876,
          completedMissions: 5432,
          issuedRewards: 2150,
          nestTokenCirculation: 3500000
        },
        userStats: {
          labels: ['1월', '2월', '3월', '4월', '5월', '6월', '7월'],
          data: [120, 190, 270, 350, 520, 670, 850]
        },
        missionStats: {
          labels: ['AI 글쓰기', '이미지 생성', '댓글 작성', '출석 체크', '기타'],
          data: [42, 28, 15, 10, 5]
        },
        tokenDistribution: {
          labels: ['활성 유저', '잠금 상태', '보상 풀', '생태계 기금', '개발 기금'],
          data: [35, 20, 15, 20, 10]
        },
        recentActivities: [
          { id: 1, type: 'user', action: '신규 가입', target: '김지훈', time: '10분 전' },
          { id: 2, type: 'mission', action: '미션 완료', target: 'AI 소설 쓰기', time: '25분 전' },
          { id: 3, type: 'reward', action: 'NFT 발급', target: '김민수', time: '40분 전' },
          { id: 4, type: 'token', action: 'NEST 발급', target: '2,000 NEST', time: '1시간 전' },
          { id: 5, type: 'user', action: '소셜 연동', target: '이지영', time: '2시간 전' }
        ]
      };
      
      setSummary(mockData.summary);
      setUserStats(mockData.userStats);
      setMissionStats(mockData.missionStats);
      setTokenDistribution(mockData.tokenDistribution);
      setRecentActivities(mockData.recentActivities);
    } catch (error) {
      console.error('대시보드 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadDashboardData();
  }, []);
  
  // 차트 설정
  const userChartData = {
    labels: userStats.labels,
    datasets: [
      {
        label: '신규 사용자',
        data: userStats.data,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        fill: true
      }
    ]
  };
  
  const missionChartData = {
    labels: missionStats.labels,
    datasets: [
      {
        label: '미션 참여 비율 (%)',
        data: missionStats.data,
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)'
        ],
        borderWidth: 1
      }
    ]
  };
  
  const tokenChartData = {
    labels: tokenDistribution.labels,
    datasets: [
      {
        label: 'NEST 토큰 분배',
        data: tokenDistribution.data,
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 99, 132, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)'
        ],
        borderWidth: 1
      }
    ]
  };
  
  // 활동 타입에 따른 아이콘 반환 함수
  const getActivityIcon = (type) => {
    switch (type) {
      case 'user':
        return <PersonAddIcon />;
      case 'mission':
        return <AssignmentIcon />;
      case 'reward':
        return <RewardsIcon />;
      case 'token':
        return <RewardsIcon />;
      default:
        return <UserIcon />;
    }
  };
  
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '80vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          대시보드
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadDashboardData}
        >
          새로고침
        </Button>
      </Box>
      
      {/* 요약 카드 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(75, 192, 192, 0.1)' }}>
            <Typography variant="subtitle2" color="textSecondary">
              총 사용자
            </Typography>
            <Typography variant="h4" sx={{ mt: 1, mb: 1, fontWeight: 'bold' }}>
              {summary.totalUsers.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              활성 사용자: {summary.activeUsers.toLocaleString()}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(54, 162, 235, 0.1)' }}>
            <Typography variant="subtitle2" color="textSecondary">
              완료된 미션
            </Typography>
            <Typography variant="h4" sx={{ mt: 1, mb: 1, fontWeight: 'bold' }}>
              {summary.completedMissions.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              평균 참여율: 76%
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255, 99, 132, 0.1)' }}>
            <Typography variant="subtitle2" color="textSecondary">
              발급된 보상
            </Typography>
            <Typography variant="h4" sx={{ mt: 1, mb: 1, fontWeight: 'bold' }}>
              {summary.issuedRewards.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              NFT + 토큰 보상
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255, 206, 86, 0.1)' }}>
            <Typography variant="subtitle2" color="textSecondary">
              NEST 토큰 유통량
            </Typography>
            <Typography variant="h4" sx={{ mt: 1, mb: 1, fontWeight: 'bold' }}>
              {summary.nestTokenCirculation.toLocaleString()}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              총 발행량의 35%
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper elevation={0} sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(153, 102, 255, 0.1)' }}>
            <Typography variant="subtitle2" color="textSecondary">
              CTA 교환 비율
            </Typography>
            <Typography variant="h4" sx={{ mt: 1, mb: 1, fontWeight: 'bold' }}>
              1:1,000
            </Typography>
            <Typography variant="body2" color="textSecondary">
              지난주 대비 변동 없음
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* 차트 및 활동 내역 */}
      <Grid container spacing={3}>
        {/* 사용자 성장 차트 */}
        <Grid item xs={12} md={8}>
          <Card elevation={0}>
            <CardHeader
              title="사용자 성장 추이"
              subheader="지난 7개월 간 신규 사용자 등록 추이"
              action={
                <Tooltip title="새로고침">
                  <IconButton onClick={loadDashboardData}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              }
            />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <Line data={userChartData} options={{ maintainAspectRatio: false }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* 최근 활동 */}
        <Grid item xs={12} md={4}>
          <Card elevation={0}>
            <CardHeader
              title="최근 활동"
              subheader="실시간 플랫폼 활동 내역"
            />
            <Divider />
            <CardContent sx={{ maxHeight: 340, overflow: 'auto' }}>
              {recentActivities.map((activity) => (
                <Box key={activity.id} sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <Box
                    sx={{
                      bgcolor: 'primary.light',
                      color: 'white',
                      p: 1,
                      borderRadius: '50%',
                      mr: 2
                    }}
                  >
                    {getActivityIcon(activity.type)}
                  </Box>
                  <Box>
                    <Typography variant="body1">
                      {activity.action}: <strong>{activity.target}</strong>
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {activity.time}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
        
        {/* 미션 참여 분포 */}
        <Grid item xs={12} sm={6}>
          <Card elevation={0}>
            <CardHeader
              title="미션 참여 분포"
              subheader="유형별 미션 참여 비율"
            />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <Bar data={missionChartData} options={{ maintainAspectRatio: false }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* 토큰 분배 현황 */}
        <Grid item xs={12} sm={6}>
          <Card elevation={0}>
            <CardHeader
              title="NEST 토큰 분배 현황"
              subheader="카테고리별 토큰 할당 비율 (%)"
            />
            <Divider />
            <CardContent>
              <Box sx={{ height: 300 }}>
                <Doughnut data={tokenChartData} options={{ maintainAspectRatio: false }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
