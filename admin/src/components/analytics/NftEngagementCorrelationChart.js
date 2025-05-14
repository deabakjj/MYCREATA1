import React, { useState, useEffect } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ZAxis,
  Cell,
  LabelList
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
  MenuItem,
  Grid
} from '@mui/material';
import analyticsService from '../../services/analyticsService';

// Color settings for different user levels
const USER_LEVEL_COLORS = {
  beginner: '#4CAF50',
  intermediate: '#2196F3',
  advanced: '#9C27B0',
  VIP: '#FF5722'
};

const NftEngagementCorrelationChart = ({ timeRange }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [correlationData, setCorrelationData] = useState([]);
  const [xMetric, setXMetric] = useState('nftCount');
  const [yMetric, setYMetric] = useState('engagementScore');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch NFT engagement correlation data from the API
        const response = await analyticsService.getNftEngagementCorrelationData({ timeRange });
        setCorrelationData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching NFT engagement correlation data:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  const handleXMetricChange = (event) => {
    setXMetric(event.target.value);
  };

  const handleYMetricChange = (event) => {
    setYMetric(event.target.value);
  };

  // Custom tooltip for the scatter chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
          <p><strong>{`User ID: ${data.userId}`}</strong></p>
          <p>{`User Level: ${data.userLevel}`}</p>
          <p>{`NFT Count: ${data.nftCount}`}</p>
          <p>{`Engagement Score: ${data.engagementScore}`}</p>
          <p>{`Platform Retention Days: ${data.retentionDays}`}</p>
          <p>{`Weekly Active Minutes: ${data.weeklyActiveMinutes}`}</p>
          <p>{`Mission Completion Rate: ${data.missionCompletionRate}%`}</p>
        </div>
      );
    }
    return null;
  };

  // Get metric label based on the metric key
  const getMetricLabel = (metricKey) => {
    const metricLabels = {
      nftCount: 'NFT 보유 수',
      engagementScore: '참여 점수',
      retentionDays: '유지 일수',
      weeklyActiveMinutes: '주간 활동 시간(분)',
      missionCompletionRate: '미션 완료율(%)'
    };
    return metricLabels[metricKey] || metricKey;
  };

  // Calculate correlation coefficient for the currently displayed metrics
  const calculateCorrelation = () => {
    if (!correlationData || correlationData.length < 2) return 0;

    const n = correlationData.length;
    const xValues = correlationData.map(item => item[xMetric]);
    const yValues = correlationData.map(item => item[yMetric]);

    // Calculate means
    const xMean = xValues.reduce((sum, val) => sum + val, 0) / n;
    const yMean = yValues.reduce((sum, val) => sum + val, 0) / n;

    // Calculate products and squares
    let numerator = 0;
    let xSquaredSum = 0;
    let ySquaredSum = 0;

    for (let i = 0; i < n; i++) {
      const xDiff = xValues[i] - xMean;
      const yDiff = yValues[i] - yMean;
      numerator += xDiff * yDiff;
      xSquaredSum += xDiff * xDiff;
      ySquaredSum += yDiff * yDiff;
    }

    // Calculate correlation coefficient
    const denominator = Math.sqrt(xSquaredSum * ySquaredSum);
    return denominator === 0 ? 0 : parseFloat((numerator / denominator).toFixed(4));
  };

  // Get linear regression details for the trend line
  const getLinearRegression = () => {
    if (!correlationData || correlationData.length < 2) return { slope: 0, intercept: 0 };

    const n = correlationData.length;
    const xValues = correlationData.map(item => item[xMetric]);
    const yValues = correlationData.map(item => item[yMetric]);

    // Calculate means
    const xMean = xValues.reduce((sum, val) => sum + val, 0) / n;
    const yMean = yValues.reduce((sum, val) => sum + val, 0) / n;

    // Calculate slope and intercept
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      const xDiff = xValues[i] - xMean;
      numerator += xDiff * (yValues[i] - yMean);
      denominator += xDiff * xDiff;
    }

    const slope = denominator === 0 ? 0 : numerator / denominator;
    const intercept = yMean - slope * xMean;

    return { slope, intercept };
  };

  // Generate trend line data points
  const getTrendLineData = () => {
    if (!correlationData || correlationData.length < 2) return [];

    const xValues = correlationData.map(item => item[xMetric]);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    
    const { slope, intercept } = getLinearRegression();
    
    return [
      { x: minX, y: slope * minX + intercept },
      { x: maxX, y: slope * maxX + intercept }
    ];
  };

  // Get correlation strength description
  const getCorrelationDescription = (value) => {
    const absValue = Math.abs(value);
    if (absValue >= 0.8) return '매우 강한';
    if (absValue >= 0.6) return '강한';
    if (absValue >= 0.4) return '보통의';
    if (absValue >= 0.2) return '약한';
    return '매우 약한';
  };

  // Get correlation direction
  const getCorrelationDirection = (value) => {
    if (value > 0) return '양의';
    if (value < 0) return '음의';
    return '없는';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title="NFT 참여 상관관계 분석" />
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
        <CardHeader title="NFT 참여 상관관계 분석" />
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  const correlationCoefficient = calculateCorrelation();
  const trendLineData = getTrendLineData();
  
  // Create formatted data for the scatter chart
  const formattedData = correlationData.map(item => ({
    x: item[xMetric],
    y: item[yMetric],
    userId: item.userId,
    userLevel: item.userLevel,
    nftCount: item.nftCount,
    engagementScore: item.engagementScore,
    retentionDays: item.retentionDays,
    weeklyActiveMinutes: item.weeklyActiveMinutes,
    missionCompletionRate: item.missionCompletionRate
  }));

  return (
    <Card>
      <CardHeader title="NFT 참여 상관관계 분석" />
      <CardContent>
        <Box mb={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl variant="outlined" size="small" fullWidth>
                <InputLabel>X축 지표</InputLabel>
                <Select
                  value={xMetric}
                  onChange={handleXMetricChange}
                  label="X축 지표"
                >
                  <MenuItem value="nftCount">NFT 보유 수</MenuItem>
                  <MenuItem value="engagementScore">참여 점수</MenuItem>
                  <MenuItem value="retentionDays">유지 일수</MenuItem>
                  <MenuItem value="weeklyActiveMinutes">주간 활동 시간(분)</MenuItem>
                  <MenuItem value="missionCompletionRate">미션 완료율(%)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl variant="outlined" size="small" fullWidth>
                <InputLabel>Y축 지표</InputLabel>
                <Select
                  value={yMetric}
                  onChange={handleYMetricChange}
                  label="Y축 지표"
                >
                  <MenuItem value="nftCount">NFT 보유 수</MenuItem>
                  <MenuItem value="engagementScore">참여 점수</MenuItem>
                  <MenuItem value="retentionDays">유지 일수</MenuItem>
                  <MenuItem value="weeklyActiveMinutes">주간 활동 시간(분)</MenuItem>
                  <MenuItem value="missionCompletionRate">미션 완료율(%)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>

        <Box height={400}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{
                top: 20,
                right: 20,
                bottom: 20,
                left: 20,
              }}
            >
              <CartesianGrid />
              <XAxis 
                type="number" 
                dataKey="x" 
                name={getMetricLabel(xMetric)} 
                label={{ 
                  value: getMetricLabel(xMetric), 
                  position: 'bottom',
                  style: { textAnchor: 'middle' } 
                }} 
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name={getMetricLabel(yMetric)} 
                label={{ 
                  value: getMetricLabel(yMetric), 
                  angle: -90, 
                  position: 'left',
                  style: { textAnchor: 'middle' } 
                }} 
              />
              <ZAxis type="category" dataKey="userLevel" range={[100, 500]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend payload={[
                { value: '초보자', type: 'circle', color: USER_LEVEL_COLORS.beginner },
                { value: '중급자', type: 'circle', color: USER_LEVEL_COLORS.intermediate },
                { value: '고급자', type: 'circle', color: USER_LEVEL_COLORS.advanced },
                { value: 'VIP', type: 'circle', color: USER_LEVEL_COLORS.VIP },
                { value: '추세선', type: 'line', color: '#FF0000' }
              ]} />
              <Scatter name="Users" data={formattedData} fill="#8884d8">
                {formattedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={USER_LEVEL_COLORS[entry.userLevel] || '#8884d8'} 
                  />
                ))}
              </Scatter>
              <Scatter 
                name="추세선" 
                data={trendLineData} 
                line={{ stroke: '#FF0000', strokeWidth: 2 }} 
                lineType="fitting" 
                shape="none"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </Box>

        <Box mt={2}>
          <Typography variant="subtitle1" gutterBottom>
            상관계수: {correlationCoefficient} 
            ({getCorrelationDescription(correlationCoefficient)} {getCorrelationDirection(correlationCoefficient)} 상관관계)
          </Typography>
          <Typography variant="body2" color="textSecondary">
            * 이 차트는 {getMetricLabel(xMetric)}와(과) {getMetricLabel(yMetric)} 간의 상관관계를 보여줍니다.
            상관계수가 1에 가까울수록 강한 양의 상관관계, -1에 가까울수록 강한 음의 상관관계를 나타냅니다.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default NftEngagementCorrelationChart;
