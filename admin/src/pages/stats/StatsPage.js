import React, { useState, useEffect } from 'react';
import { PageHeader, Card, Row, Col, Tabs, DatePicker, Button, Select, Space, Spin } from 'antd';
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import moment from 'moment';
import {
  DashboardStats,
  ActivityChart,
  XpDistributionChart,
  RetentionChart,
  TokenDistributionChart,
} from '../../components/stats';
import { statsService } from '../../services';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;

/**
 * 통계 페이지
 * 플랫폼 통계 데이터를 조회하고 시각화하는 페이지
 */
const StatsPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dateRange, setDateRange] = useState([moment().subtract(30, 'days'), moment()]);
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [stats, setStats] = useState({
    dashboard: null,
    activity: null,
    retention: null,
    xpDistribution: null,
    tokenDistribution: null,
  });

  // 통계 데이터 로드 함수
  const loadStats = async () => {
    setLoading(true);
    try {
      // 실제 API 호출 코드 (현재는 더미 데이터 사용)
      // const dashboardData = await statsService.getDashboardStats();
      // const activityData = await statsService.getUserActivityStats({ 
      //   startDate: dateRange[0].format('YYYY-MM-DD'), 
      //   endDate: dateRange[1].format('YYYY-MM-DD') 
      // });
      // const retentionData = await statsService.getUserRetentionStats();
      // const xpDistData = await statsService.getXpDistributionStats();
      // const tokenDistData = await statsService.getTokenEconomyStats();
      
      // 임시 더미 데이터
      setTimeout(() => {
        // 대시보드 통계 더미 데이터
        const dashboardData = {
          usersTotal: 15642,
          usersActive: 8721,
          usersGrowth: 12.5,
          missionsTotal: 356,
          missionsActive: 142,
          missionsCompleted: 214,
          tokensTotal: 10000000000,
          tokensCirculating: 3456789012,
          xpTotal: 29876543,
          nftsTotal: 45678,
          retentionRate: 67,
          conversionRate: 43,
        };
        
        // 활동 추이 더미 데이터
        const activityData = {
          users: Array(30).fill().map((_, i) => ({
            date: moment().subtract(30 - i, 'days').format('YYYY-MM-DD'),
            newUsers: Math.floor(Math.random() * 500) + 100,
            activeUsers: Math.floor(Math.random() * 2000) + 5000,
          })),
          missions: Array(30).fill().map((_, i) => ({
            date: moment().subtract(30 - i, 'days').format('YYYY-MM-DD'),
            newMissions: Math.floor(Math.random() * 10) + 1,
            completedMissions: Math.floor(Math.random() * 50) + 20,
          })),
          tokens: Array(30).fill().map((_, i) => ({
            date: moment().subtract(30 - i, 'days').format('YYYY-MM-DD'),
            issuedTokens: Math.floor(Math.random() * 50000) + 10000,
            transferredTokens: Math.floor(Math.random() * 100000) + 50000,
          })),
          nfts: Array(30).fill().map((_, i) => ({
            date: moment().subtract(30 - i, 'days').format('YYYY-MM-DD'),
            mintedNfts: Math.floor(Math.random() * 100) + 20,
            transferredNfts: Math.floor(Math.random() * 50) + 10,
          })),
        };
        
        // 유지율 더미 데이터
        const retentionData = {
          weekly: [
            { cohort: '2025-W01', period: 'Week 1', retentionRate: 100 },
            { cohort: '2025-W01', period: 'Week 2', retentionRate: 75 },
            { cohort: '2025-W01', period: 'Week 3', retentionRate: 63 },
            { cohort: '2025-W01', period: 'Week 4', retentionRate: 58 },
            { cohort: '2025-W02', period: 'Week 1', retentionRate: 100 },
            { cohort: '2025-W02', period: 'Week 2', retentionRate: 78 },
            { cohort: '2025-W02', period: 'Week 3', retentionRate: 66 },
            { cohort: '2025-W03', period: 'Week 1', retentionRate: 100 },
            { cohort: '2025-W03', period: 'Week 2', retentionRate: 80 },
            { cohort: '2025-W04', period: 'Week 1', retentionRate: 100 },
          ],
          monthly: [
            { cohort: '2025-01', period: 'Month 1', retentionRate: 100 },
            { cohort: '2025-01', period: 'Month 2', retentionRate: 68 },
            { cohort: '2025-01', period: 'Month 3', retentionRate: 54 },
            { cohort: '2025-02', period: 'Month 1', retentionRate: 100 },
            { cohort: '2025-02', period: 'Month 2', retentionRate: 71 },
            { cohort: '2025-03', period: 'Month 1', retentionRate: 100 },
          ],
        };
        
        // XP 분포 더미 데이터
        const xpDistData = [
          { range: '0-100', count: 3245, percentage: 20.7 },
          { range: '101-500', count: 5621, percentage: 35.9 },
          { range: '501-1000', count: 2874, percentage: 18.4 },
          { range: '1001-2000', count: 1968, percentage: 12.6 },
          { range: '2001-5000', count: 1254, percentage: 8.0 },
          { range: '5001+', count: 680, percentage: 4.4 },
        ];
        
        // 토큰 분포 더미 데이터
        const tokenDistData = [
          { name: '유통량', value: 3456789012, percentage: 34.6 },
          { name: '회사 보유', value: 4000000000, percentage: 40.0 },
          { name: '개발 펀드', value: 1000000000, percentage: 10.0 },
          { name: '마케팅', value: 800000000, percentage: 8.0 },
          { name: '팀/어드바이저', value: 500000000, percentage: 5.0 },
          { name: '생태계 보상', value: 243210988, percentage: 2.4 },
        ];
        
        setStats({
          dashboard: dashboardData,
          activity: activityData,
          retention: retentionData,
          xpDistribution: xpDistData,
          tokenDistribution: tokenDistData,
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('통계 데이터 로드 실패:', error);
      setLoading(false);
    }
  };

  // 페이지 로드 시 데이터 로드
  useEffect(() => {
    loadStats();
  }, []);

  // 탭 변경 핸들러
  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  // 날짜 범위 변경 핸들러
  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  // 통계 내보내기 핸들러
  const handleExportStats = async (reportType) => {
    setExportLoading(true);
    try {
      // 실제 API 호출 코드
      // const blob = await statsService.exportStats(reportType, {
      //   startDate: dateRange[0].format('YYYY-MM-DD'),
      //   endDate: dateRange[1].format('YYYY-MM-DD'),
      // });
      
      // // 파일 다운로드
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = `nest_stats_${reportType}_${moment().format('YYYY-MM-DD')}.xlsx`;
      // document.body.appendChild(a);
      // a.click();
      // window.URL.revokeObjectURL(url);
      // document.body.removeChild(a);
      
      // 임시 처리
      setTimeout(() => {
        console.log(`통계 내보내기: ${reportType}`);
        setExportLoading(false);
      }, 1000);
    } catch (error) {
      console.error('통계 내보내기 실패:', error);
      setExportLoading(false);
    }
  };

  // 대시보드 탭 렌더링
  const renderDashboardTab = () => (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <DashboardStats data={stats.dashboard} loading={loading} />
      </Col>
      <Col span={24}>
        <ActivityChart data={stats.activity} loading={loading} />
      </Col>
      <Col xs={24} md={12}>
        <XpDistributionChart data={stats.xpDistribution} loading={loading} />
      </Col>
      <Col xs={24} md={12}>
        <TokenDistributionChart data={stats.tokenDistribution} loading={loading} />
      </Col>
    </Row>
  );

  // 사용자 분석 탭 렌더링
  const renderUserAnalysisTab = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24}>
        <ActivityChart data={stats.activity} loading={loading} />
      </Col>
      <Col xs={24}>
        <RetentionChart data={stats.retention} loading={loading} />
      </Col>
      <Col xs={24} md={12}>
        <XpDistributionChart data={stats.xpDistribution} loading={loading} />
      </Col>
    </Row>
  );

  // 토큰 경제 탭 렌더링
  const renderTokenEconomyTab = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24} md={12}>
        <TokenDistributionChart data={stats.tokenDistribution} loading={loading} />
      </Col>
      <Col xs={24}>
        <ActivityChart data={stats.activity} loading={loading} />
      </Col>
    </Row>
  );

  return (
    <div className="stats-page">
      <PageHeader
        title="통계 대시보드"
        subTitle="플랫폼 전체 통계 데이터를 확인하고 분석합니다"
        extra={[
          <RangePicker
            key="datePicker"
            value={dateRange}
            onChange={handleDateRangeChange}
            allowClear={false}
            disabled={loading}
          />,
          <Select
            key="exportSelect"
            placeholder="내보내기"
            style={{ width: 120 }}
            onSelect={handleExportStats}
            disabled={exportLoading}
          >
            <Option value="excel">Excel 내보내기</Option>
            <Option value="csv">CSV 내보내기</Option>
            <Option value="pdf">PDF 내보내기</Option>
          </Select>,
          <Button
            key="refresh"
            icon={<ReloadOutlined />}
            onClick={loadStats}
            loading={loading}
          >
            새로고침
          </Button>,
        ]}
      />

      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        <TabPane tab="대시보드" key="dashboard">
          {renderDashboardTab()}
        </TabPane>
        <TabPane tab="사용자 분석" key="userAnalysis">
          {renderUserAnalysisTab()}
        </TabPane>
        <TabPane tab="토큰 경제" key="tokenEconomy">
          {renderTokenEconomyTab()}
        </TabPane>
      </Tabs>
    </div>
  );
};

export default StatsPage;
