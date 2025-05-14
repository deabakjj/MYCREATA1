import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  Typography, 
  Box, 
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import analyticsService from '../../services/analyticsService';

// Color palette for different categories
const COLORS = {
  attendance: '#8884d8',
  comment: '#82ca9d',
  ranking: '#ffc658',
  ai: '#ff8042',
  group: '#1976d2',
  beginner: '#388e3c',
  intermediate: '#f57c00',
  advanced: '#d32f2f',
  VIP: '#7b1fa2'
};

const NftByUserSegmentChart = ({ timeRange }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [segmentData, setSegmentData] = useState([]);
  const [viewMode, setViewMode] = useState('level'); // 'level' or 'activityType'
  const [chartType, setChartType] = useState('bar');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch NFT segment data from the API
        const response = await analyticsService.getNftByUserSegmentData({ timeRange });
        setSegmentData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching NFT segment data:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  const handleViewModeChange = (event) => {
    setViewMode(event.target.value);
  };

  const handleChartTypeChange = (event) => {
    setChartType(event.target.value);
  };

  // Transform data based on the selected view mode
  const getTransformedData = () => {
    if (!segmentData || !segmentData.length) return [];

    if (viewMode === 'level') {
      // Group by user level
      return [
        { name: '초보자', nftCount: getAverageNftByLevel('beginner'), userCount: getUserCountByLevel('beginner') },
        { name: '중급자', nftCount: getAverageNftByLevel('intermediate'), userCount: getUserCountByLevel('intermediate') },
        { name: '고급자', nftCount: getAverageNftByLevel('advanced'), userCount: getUserCountByLevel('advanced') },
        { name: 'VIP', nftCount: getAverageNftByLevel('VIP'), userCount: getUserCountByLevel('VIP') }
      ];
    } else {
      // Group by activity type
      return [
        { name: '출석', nftCount: getAverageNftByActivity('attendance'), userCount: getUserCountByActivity('attendance') },
        { name: '댓글', nftCount: getAverageNftByActivity('comment'), userCount: getUserCountByActivity('comment') },
        { name: '랭킹', nftCount: getAverageNftByActivity('ranking'), userCount: getUserCountByActivity('ranking') },
        { name: 'AI 활용', nftCount: getAverageNftByActivity('ai'), userCount: getUserCountByActivity('ai') },
        { name: '그룹 미션', nftCount: getAverageNftByActivity('group'), userCount: getUserCountByActivity('group') }
      ];
    }
  };

  // Calculate average NFT count by level
  const getAverageNftByLevel = (level) => {
    const filtered = segmentData.filter(item => item.userLevel === level);
    if (!filtered.length) return 0;
    const sum = filtered.reduce((acc, curr) => acc + curr.nftCount, 0);
    return parseFloat((sum / filtered.length).toFixed(2));
  };

  // Calculate average NFT count by activity type
  const getAverageNftByActivity = (activityType) => {
    const filtered = segmentData.filter(item => item.primaryActivityType === activityType);
    if (!filtered.length) return 0;
    const sum = filtered.reduce((acc, curr) => acc + curr.nftCount, 0);
    return parseFloat((sum / filtered.length).toFixed(2));
  };

  // Get user count by level
  const getUserCountByLevel = (level) => {
    return segmentData.filter(item => item.userLevel === level).length;
  };

  // Get user count by activity type
  const getUserCountByActivity = (activityType) => {
    return segmentData.filter(item => item.primaryActivityType === activityType).length;
  };

  // Custom tooltip for chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
          <p><strong>{`${label}`}</strong></p>
          <p>{`평균 NFT 보유량: ${payload[0].value}`}</p>
          <p>{`사용자 수: ${payload[0].payload.userCount}`}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title="세그먼트별 NFT 분석" />
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" height="300px">
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader title="세그먼트별 NFT 분석" />
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  const data = getTransformedData();

  return (
    <Card>
      <CardHeader title="세그먼트별 NFT 분석" />
      <CardContent>
        <Box mb={2} display="flex" justifyContent="space-between">
          <FormControl variant="outlined" size="small" style={{ minWidth: 150 }}>
            <InputLabel>세그먼트 유형</InputLabel>
            <Select
              value={viewMode}
              onChange={handleViewModeChange}
              label="세그먼트 유형"
            >
              <MenuItem value="level">사용자 레벨</MenuItem>
              <MenuItem value="activityType">활동 유형</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl variant="outlined" size="small" style={{ minWidth: 150 }}>
            <InputLabel>차트 유형</InputLabel>
            <Select
              value={chartType}
              onChange={handleChartTypeChange}
              label="차트 유형"
            >
              <MenuItem value="bar">막대 차트</MenuItem>
              <MenuItem value="line">선 차트</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box height={400}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart
                data={data}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="nftCount" 
                  name="평균 NFT 보유량" 
                  fill={viewMode === 'level' ? '#8884d8' : '#82ca9d'} 
                />
              </BarChart>
            ) : (
              <LineChart
                data={data}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="nftCount"
                  name="평균 NFT 보유량"
                  stroke={viewMode === 'level' ? '#8884d8' : '#82ca9d'}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </Box>

        <Box mt={2}>
          <Typography variant="body2" color="textSecondary">
            * 이 차트는 사용자 세그먼트별 평균 NFT 보유량을 보여줍니다.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default NftByUserSegmentChart;
