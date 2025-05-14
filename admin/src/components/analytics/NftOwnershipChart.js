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
  PieChart,
  Pie,
  Cell
} from 'recharts';
import analyticsService from '../../services/analyticsService';
import { Card, CardHeader, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import { ToggleButtonGroup, ToggleButton } from '@mui/material';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#4CAF50', '#FF5722', '#9C27B0'];

const NftOwnershipChart = ({ timeRange, userSegment }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nftData, setNftData] = useState([]);
  const [chartType, setChartType] = useState('bar');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch NFT ownership data from the API
        const response = await analyticsService.getNftOwnershipData({
          timeRange,
          userSegment
        });
        setNftData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching NFT ownership data:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange, userSegment]);

  const handleChartTypeChange = (event, newChartType) => {
    if (newChartType !== null) {
      setChartType(newChartType);
    }
  };

  // Process data for distribution by quantity
  const getDistributionData = () => {
    // Convert raw data to distribution format
    const distributionData = [
      { name: '0 NFTs', value: 0 },
      { name: '1 NFT', value: 0 },
      { name: '2-5 NFTs', value: 0 },
      { name: '6-10 NFTs', value: 0 },
      { name: '11-20 NFTs', value: 0 },
      { name: '21+ NFTs', value: 0 }
    ];

    // Process the data to fill in the distribution
    nftData.forEach(user => {
      const count = user.nftCount;
      if (count === 0) distributionData[0].value++;
      else if (count === 1) distributionData[1].value++;
      else if (count >= 2 && count <= 5) distributionData[2].value++;
      else if (count >= 6 && count <= 10) distributionData[3].value++;
      else if (count >= 11 && count <= 20) distributionData[4].value++;
      else distributionData[5].value++;
    });

    return distributionData;
  };

  // Custom tooltip for the charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div 
          style={{ 
            backgroundColor: '#fff', 
            padding: '10px', 
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        >
          <p>{`${label}: ${payload[0].value}`}</p>
          {chartType === 'bar' && <p>{`사용자 수: ${payload[0].payload.userCount || 0}`}</p>}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader title="NFT 보유 분석" />
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
        <CardHeader title="NFT 보유 분석" />
        <CardContent>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  const distributionData = getDistributionData();

  return (
    <Card>
      <CardHeader 
        title="NFT 보유 분석" 
        action={
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={handleChartTypeChange}
            aria-label="chart type"
            size="small"
          >
            <ToggleButton value="bar" aria-label="bar chart">
              Bar
            </ToggleButton>
            <ToggleButton value="pie" aria-label="pie chart">
              Pie
            </ToggleButton>
          </ToggleButtonGroup>
        }
      />
      <CardContent>
        <Box height={400}>
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart
                data={distributionData}
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
                <Bar dataKey="value" name="사용자 수" fill="#8884d8" />
              </BarChart>
            ) : (
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            )}
          </ResponsiveContainer>
        </Box>
        <Box mt={2}>
          <Typography variant="body2" color="textSecondary">
            * 이 차트는 사용자별 NFT 보유량 분포를 보여줍니다.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default NftOwnershipChart;
