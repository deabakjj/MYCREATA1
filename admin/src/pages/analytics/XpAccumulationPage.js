import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Import custom components
import XpAccumulationChart from '../../components/analytics/XpAccumulationChart';
import LevelProgressionChart from '../../components/analytics/LevelProgressionChart';
import ActivityEfficiencyChart from '../../components/analytics/ActivityEfficiencyChart';
import XpByUserSegmentChart from '../../components/analytics/XpByUserSegmentChart';
import AnalyticsSummaryCard from '../../components/analytics/AnalyticsSummaryCard';
import AnalyticsFilters from '../../components/analytics/AnalyticsFilters';
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

const XpAccumulationPage = () => {
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [timeRange, setTimeRange] = useState('last30Days');
  const [userSegment, setUserSegment] = useState('all');
  const [startDate, setStartDate] = useState(dayjs().subtract(30, 'day'));
  const [endDate, setEndDate] = useState(dayjs());
  const [activityType, setActivityType] = useState('all');

  // Load summary data on component mount and when filters change
  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        setLoading(true);
        const response = await analyticsService.getXpSummaryData({
          timeRange,
          userSegment,
          startDate: startDate.format('YYYY-MM-DD'),
          endDate: endDate.format('YYYY-MM-DD'),
          activityType
        });
        setSummaryData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching XP summary data:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    };

    fetchSummaryData();
  }, [timeRange, userSegment, startDate, endDate, activityType]);

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

  // Handler for activity type change
  const handleActivityTypeChange = (event) => {
    setActivityType(event.target.value);
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
    analyticsService.exportXpData({
      format,
      timeRange,
      userSegment,
      startDate: startDate.format('YYYY-MM-DD'),
      endDate: endDate.format('YYYY-MM-DD'),
      activityType
    });
  };

  // Handler for data refresh
  const handleRefreshData = () => {
    // Re-fetch data with current filters
    const fetchSummaryData = async () => {
      try {
        setLoading(true);
        const response = await analyticsService.getXpSummaryData({
          timeRange,
          userSegment,
          startDate: startDate.format('YYYY-MM-DD'),
          endDate: endDate.format('YYYY-MM-DD'),
          activityType
        });
        setSummaryData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error refreshing XP summary data:', err);
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
            XP 누적량 분석 대시보드
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            사용자 XP 누적량, 레벨 진행도, 활동 효율성 등을 분석합니다.
          </Typography>
        </Box>

        {/* Filters */}
        <Paper elevation={2} style={{ padding: '16px', marginBottom: '24px' }}>
          <AnalyticsFilters
            timeRange={timeRange}
            userSegment={userSegment}
            startDate={startDate}
            endDate={endDate}
            activityType={activityType}
            onTimeRangeChange={handleTimeRangeChange}
            onUserSegmentChange={handleUserSegmentChange}
            onStartDateChange={handleStartDateChange}
            onEndDateChange={handleEndDateChange}
            onActivityTypeChange={handleActivityTypeChange}
            onRefreshData={handleRefreshData}
          />
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
                  title="평균 XP 누적량"
                  value={summaryData?.averageXp || 0}
                  change={summaryData?.averageXpChange || 0}
                  icon="trending_up"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <KpiCard
                  title="최대 XP 획득자"
                  value={summaryData?.maxXpUser || 'N/A'}
                  subvalue={`${summaryData?.maxXp || 0} XP`}
                  icon="emoji_events"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <KpiCard
                  title="평균 레벨"
                  value={summaryData?.averageLevel || 0}
                  change={summaryData?.averageLevelChange || 0}
                  icon="grade"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <KpiCard
                  title="활성 사용자"
                  value={summaryData?.activeUsers || 0}
                  change={summaryData?.activeUsersChange || 0}
                  icon="person"
                />
              </Grid>
            </Grid>

            {/* Charts - Row 1 */}
            <Grid container spacing={3} style={{ marginBottom: '24px' }}>
              <Grid item xs={12} md={8}>
                <XpAccumulationChart
                  timeRange={timeRange}
                  userSegment={userSegment}
                  startDate={startDate.format('YYYY-MM-DD')}
                  endDate={endDate.format('YYYY-MM-DD')}
                  activityType={activityType}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <LevelProgressionChart
                  timeRange={timeRange}
                  userSegment={userSegment}
                />
              </Grid>
            </Grid>

            {/* Charts - Row 2 */}
            <Grid container spacing={3} style={{ marginBottom: '24px' }}>
              <Grid item xs={12} md={6}>
                <ActivityEfficiencyChart
                  timeRange={timeRange}
                  userSegment={userSegment}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <XpByUserSegmentChart
                  timeRange={timeRange}
                />
              </Grid>
            </Grid>

            {/* Summary Section */}
            <Paper elevation={2} style={{ padding: '24px', marginBottom: '24px' }}>
              <Typography variant="h6" gutterBottom>
                분석 요약
              </Typography>
              <Divider style={{ marginBottom: '16px' }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <AnalyticsSummaryCard
                    title="XP 누적 패턴"
                    content={summaryData?.xpAccumulationPattern || '데이터가 충분하지 않습니다.'}
                    insights={summaryData?.insights?.xpPattern || []}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <AnalyticsSummaryCard
                    title="사용자 참여도"
                    content={summaryData?.userEngagementSummary || '데이터가 충분하지 않습니다.'}
                    insights={summaryData?.insights?.engagement || []}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <AnalyticsSummaryCard
                    title="레벨 진행"
                    content={summaryData?.levelProgressionSummary || '데이터가 충분하지 않습니다.'}
                    insights={summaryData?.insights?.levelProgression || []}
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

export default XpAccumulationPage;
