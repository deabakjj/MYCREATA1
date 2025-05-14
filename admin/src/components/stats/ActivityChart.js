import React, { useState, useEffect } from 'react';
import { Card, Radio, Select, Empty, Spin } from 'antd';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const { Option } = Select;

/**
 * 활동 통계 차트 컴포넌트
 * 사용자 활동, 미션 참여 등의 시계열 데이터를 차트로 시각화
 */
const ActivityChart = ({ data, loading }) => {
  const [chartData, setChartData] = useState([]);
  const [timeRange, setTimeRange] = useState('week');
  const [dataType, setDataType] = useState('users');

  // 시간 범위에 따라 차트 데이터 필터링
  useEffect(() => {
    if (!data) return;

    // 현재 선택된 데이터 유형과 시간 범위에 맞는 데이터 선택
    const currentData = data[dataType] || [];
    
    // 시간 범위에 따라 데이터 필터링
    let filteredData = [];
    const now = new Date();
    
    switch (timeRange) {
      case 'week':
        // 최근 7일 데이터
        filteredData = currentData.slice(-7);
        break;
      case 'month':
        // 최근 30일 데이터
        filteredData = currentData.slice(-30);
        break;
      case 'quarter':
        // 최근 90일 데이터
        filteredData = currentData.slice(-90);
        break;
      case 'year':
        // 최근 365일 데이터
        filteredData = currentData.slice(-365);
        break;
      default:
        filteredData = currentData;
    }
    
    setChartData(filteredData);
  }, [data, timeRange, dataType]);

  // 차트 데이터 없을 때 표시할 내용
  const renderEmpty = () => (
    <div style={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Empty description="데이터가 없습니다" />
    </div>
  );

  // 로딩 중일 때 표시할 내용
  const renderLoading = () => (
    <div style={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Spin size="large" />
    </div>
  );

  // 데이터 유형에 따른 차트 설정
  const getChartConfig = () => {
    switch (dataType) {
      case 'users':
        return {
          lines: [
            { dataKey: 'newUsers', name: '신규 사용자', stroke: '#1890ff' },
            { dataKey: 'activeUsers', name: '활성 사용자', stroke: '#52c41a' },
          ],
          tooltip: '명',
        };
      case 'missions':
        return {
          lines: [
            { dataKey: 'newMissions', name: '신규 미션', stroke: '#722ed1' },
            { dataKey: 'completedMissions', name: '완료된 미션', stroke: '#eb2f96' },
          ],
          tooltip: '개',
        };
      case 'tokens':
        return {
          lines: [
            { dataKey: 'issuedTokens', name: '발행된 토큰', stroke: '#fa8c16' },
            { dataKey: 'transferredTokens', name: '거래된 토큰', stroke: '#fa541c' },
          ],
          tooltip: 'NEST',
        };
      case 'nfts':
        return {
          lines: [
            { dataKey: 'mintedNfts', name: '발행된 NFT', stroke: '#13c2c2' },
            { dataKey: 'transferredNfts', name: '거래된 NFT', stroke: '#096dd9' },
          ],
          tooltip: '개',
        };
      default:
        return {
          lines: [],
          tooltip: '',
        };
    }
  };

  // 데이터 유형 변경 핸들러
  const handleDataTypeChange = (value) => {
    setDataType(value);
  };

  // 시간 범위 변경 핸들러
  const handleTimeRangeChange = (e) => {
    setTimeRange(e.target.value);
  };

  const chartConfig = getChartConfig();

  // 데이터 포맷터
  const formatYAxis = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value;
  };

  return (
    <Card
      title="활동 추이"
      extra={
        <div style={{ display: 'flex', gap: 16 }}>
          <Select
            defaultValue="users"
            style={{ width: 120 }}
            onChange={handleDataTypeChange}
            disabled={loading}
          >
            <Option value="users">사용자</Option>
            <Option value="missions">미션</Option>
            <Option value="tokens">토큰</Option>
            <Option value="nfts">NFT</Option>
          </Select>
          <Radio.Group
            value={timeRange}
            onChange={handleTimeRangeChange}
            disabled={loading}
          >
            <Radio.Button value="week">주간</Radio.Button>
            <Radio.Button value="month">월간</Radio.Button>
            <Radio.Button value="quarter">분기</Radio.Button>
            <Radio.Button value="year">연간</Radio.Button>
          </Radio.Group>
        </div>
      }
    >
      {loading ? (
        renderLoading()
      ) : chartData.length === 0 ? (
        renderEmpty()
      ) : (
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={formatYAxis} />
              <Tooltip
                formatter={(value) => [`${value.toLocaleString()} ${chartConfig.tooltip}`, null]}
              />
              <Legend />
              {chartConfig.lines.map((line) => (
                <Line
                  key={line.dataKey}
                  type="monotone"
                  dataKey={line.dataKey}
                  name={line.name}
                  stroke={line.stroke}
                  activeDot={{ r: 8 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};

export default ActivityChart;
