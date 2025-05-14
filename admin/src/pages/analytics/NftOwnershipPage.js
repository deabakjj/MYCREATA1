import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Divider,
  Button
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import dayjs from 'dayjs';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Import custom components
import NftOwnershipChart from '../../components/analytics/NftOwnershipChart';
import NftByUserSegmentChart from '../../components/analytics/NftByUserSegmentChart';
import NftEngagementCorrelationChart from '../../components/analytics/NftEngagementCorrelationChart';
import AnalyticsSummaryCard from '../../components/analytics/AnalyticsSummaryCard';
import AnalyticsFilters from '../../components/analytics/AnalyticsFilters';
import AnalyticsMetricTrend from '../../components/analytics/AnalyticsMetricTrend';
import KpiCard from '../../components/analytics/KpiCard';
import ExportButtons from '../../components/analytics/ExportButtons';

// Import services
import analyticsService from '../../services/analyticsService';

// Theme configuration
const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
  },
  typography: {
    fontFamily: "'Noto Sans KR', 'Roboto', 'Helvetica', 'Arial', sans-serif",
  },
});

const NftOwnershipPage = () => {
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [timeRange, setTimeRange] = useState('last30Days');
  const [userSegment, setUserSegment] = useState('all');
  const [startDate, setStartDate] = useState(dayjs().subtract(30, 'day'));
  const [endDate, setEndDate] = useState(dayjs());
  const [nftType, setNftType] = useState('all');

  // Load summary data on component mount and when filters change
  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        setLoading(true);
        const response = await analyticsService.getNftSummaryData({
          timeRange,
          userSegment,
          startDate: startDate.format('YYYY-MM-DD'),
          endDate: endDate.format('YYYY-MM-DD'),
          nftType
        });
        setSummaryData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching NFT summary data:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    };

    fetchSummaryData();
  }, [timeRange, userSegment, startDate, endDate, nftType]);

  // Handler for time range change
  const handleTimeRangeChange = (event) => {
    const newRange = event.target.value;
    setTimeRange(newRange);
    
    // Automatically adjust date range based on time range selection
    switch (newRange) {
      case 'last7Days':
        setStartDate(dayjs().subtract(7, 'day'));
        setEndDate(dayjs());
        break;
      case 'last30Days':
        setStartDate(dayjs().subtract(30, 'day'));
        setEndDate(dayjs());
        break;
      case 'last90Days':
        setStartDate(dayjs().subtract(90, 'day'));
        setEndDate(dayjs());
        break;
      case 'last12Months':
        setStartDate(dayjs().subtract(12, 'month'));
        setEndDate(dayjs());
        break;
      case 'custom':
        // Don't change dates for custom range
        break;
      default:
        setStartDate(dayjs().subtract(30, 'day'));
        setEndDate(dayjs());
    }
  };

  // Handler for user segment change
  const handleUserSegmentChange = (event) => {
    setUserSegment(event.target.value);
  };

  // Handler for NFT type change
  const handleNftTypeChange = (event) => {
    setNftType(event.target.value);
  };

  // Handler for start date change
  const handleStartDateChange = (date) => {
    setStartDate(date);
    setTimeRange('custom');
  };

  // Handler for end date change
  const handleEndDateChange = (date) => {
    setEndDate(date);
    setTimeRange('custom');
  };

  // Handle export data
  const handleExportData = (format) => {
    analyticsService.exportNftData({
      format,
      timeRange,
      userSegment,
      startDate: startDate.format('YYYY-MM-DD'),
      endDate: endDate.format('YYYY-MM-DD'),
      nftType
    });
  };

  // Handler for data refresh
  const handleRefreshData = () => {
    // Re-fetch data with current filters
    const fetchSummaryData = async () => {
      try {
        setLoading(true);
        const response = await analyticsService.getNftSummaryData({
          timeRange,
          userSegment,
          startDate: startDate.format('YYYY-MM-DD'),
          endDate: endDate.format('YYYY-MM-DD'),
          nftType
        });
        setSummaryData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error refreshing NFT summary data:', err);
        setError('데이터를 새로고침하는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    };

    fetchSummaryData();
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="xl">
        {/* Page Header */}
        <Box my={4}>
          <Typography variant="h4" component="h1" gutterBottom>
            NFT 보유 분석 대시보드
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            사용자 NFT 보유량, 세그먼트별 분포, 참여 상관관계 등을 분석합니다.
          </Typography>
        </Box>

        {/* Filters */}
        <Paper elevation={2} style={{ padding: '16px', marginBottom: '24px' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={10}>
              <AnalyticsFilters
                timeRange={timeRange}
                userSegment={userSegment}
                startDate={startDate}
                endDate={endDate}
                nftType={nftType}
                onTimeRangeChange={handleTimeRangeChange}
                onUserSegmentChange={handleUserSegmentChange}
                onStartDateChange={handleStartDateChange}
                onEndDateChange={handleEndDateChange}
                onNftTypeChange={handleNftTypeChange}
              />
            </Grid>
            <Grid item xs={12} md={2} style={{ textAlign: 'right' }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={handleRefreshData}
              >
                새로고침
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Paper elevation={2} style={{ padding: '24px', textAlign: 'center' }}>
            <Typography color="error">{error}</Typography>
          </Paper>
        ) : (
          <>
            {/* KPI Cards */}
            <Grid container spacing={3} style={{ marginBottom: '24px' }}>
              <Grid item xs={12} sm={6} md={3}>
                <KpiCard
                  title="총 NFT 발행량"
                  value={summaryData?.totalNfts || 0}
                  change={summaryData?.totalNftsChange || 0}
                  icon="dashboard"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <KpiCard
                  title="평균 NFT 보유량"
                  value={summaryData?.averageNftsPerUser || 0}
                  change={summaryData?.averageNftsChange || 0}
                  icon="trending_up"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <KpiCard
                  title="최대 보유자"
                  value={summaryData?.topNftHolder || 'N/A'}
                  subvalue={`${summaryData?.topNftCount || 0} NFTs`}
                  icon="emoji_events"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <KpiCard
                  title="NFT 보유 사용자"
                  value={summaryData?.nftHolders || 0}
                  change={summaryData?.nftHoldersChange || 0}
                  icon="person"
                />
              </Grid>
            </Grid>

            {/* Charts - Row 1 */}
            <Grid container spacing={3} style={{ marginBottom: '24px' }}>
              <Grid item xs={12} md={7}>
                <NftOwnershipChart
                  timeRange={timeRange}
                  userSegment={userSegment}
                />
              </Grid>
              <Grid item xs={12} md={5}>
                <NftByUserSegmentChart
                  timeRange={timeRange}
                />
              </Grid>
            </Grid>

            {/* Charts - Row 2 */}
            <Grid container spacing={3} style={{ marginBottom: '24px' }}>
              <Grid item xs={12}>
                <NftEngagementCorrelationChart
                  timeRange={timeRange}
                />
              </Grid>
            </Grid>

            {/* Metrics Trends */}
            <Paper elevation={2} style={{ padding: '24px', marginBottom: '24px' }}>
              <Typography variant="h6" gutterBottom>
                NFT 핵심 지표 추세
              </Typography>
              <Divider style={{ marginBottom: '16px' }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <AnalyticsMetricTrend
                    title="일일 NFT 발행량"
                    data={summaryData?.dailyMintTrend || []}
                    dataKey="mintCount"
                    color="#8884d8"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <AnalyticsMetricTrend
                    title="NFT 소유자 비율"
                    data={summaryData?.nftOwnershipRateTrend || []}
                    dataKey="ownershipRate"
                    color="#82ca9d"
                    valueFormatter={(value) => `${value}%`}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Summary Section */}
            <Paper elevation={2} style={{ padding: '24px', marginBottom: '24px' }}>
              <Typography variant="h6" gutterBottom>
                분석 요약
              </Typography>
              <Divider style={{ marginBottom: '16px' }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <AnalyticsSummaryCard
                    title="NFT 보유 패턴"
                    content={summaryData?.nftOwnershipPattern || '데이터가 충분하지 않습니다.'}
                    insights={summaryData?.insights?.ownershipPattern || []}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <AnalyticsSummaryCard
                    title="NFT 참여 상관관계"
                    content={summaryData?.nftEngagementCorrelation || '데이터가 충분하지 않습니다.'}
                    insights={summaryData?.insights?.engagementCorrelation || []}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <AnalyticsSummaryCard
                    title="세그먼트별 NFT 분포"
                    content={summaryData?.segmentDistribution || '데이터가 충분하지 않습니다.'}
                    insights={summaryData?.insights?.segmentDistribution || []}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Export Buttons */}
            <Box display="flex" justifyContent="flex-end" mb={4}>
              <ExportButtons onExport={handleExportData} />
            </Box>
          </>
        )}
      </Container>
    </ThemeProvider>
  );
};

export default NftOwnershipPage;
