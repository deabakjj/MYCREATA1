import React from 'react';
import { Card, Empty, Spin, Select } from 'antd';
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
 * 사용자 유지율 차트 컴포넌트
 * 코호트별 사용자 유지율을 시각화하는 차트
 */
const RetentionChart = ({ data, loading }) => {
  const [cohortType, setCohortType] = React.useState('weekly');

  // 데이터 없을 때 표시할 내용
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

  // 코호트 유형 변경 핸들러
  const handleCohortTypeChange = (value) => {
    setCohortType(value);
  };

  // 현재 코호트 타입에 맞는 데이터 가져오기
  const getCurrentData = () => {
    if (!data) return [];
    return data[cohortType] || [];
  };

  // 차트 데이터 가공 (라인차트용)
  const transformDataForChart = () => {
    const currentData = getCurrentData();
    
    // 그룹별 데이터를 차트 형식으로 변환
    // 예: [{ cohort: '2025-W01', day1: 100, day7: 75, day30: 50 }, ...]
    
    return currentData;
  };

  // 코호트별 색상 매핑
  const getLineColors = () => {
    return [
      '#1890ff', // 첫 번째 코호트
      '#52c41a', // 두 번째 코호트
      '#fa8c16', // 세 번째 코호트
      '#722ed1', // 네 번째 코호트
      '#eb2f96', // 다섯 번째 코호트
      '#f5222d', // 여섯 번째 코호트
      '#13c2c2', // 일곱 번째 코호트
      '#faad14', // 여덟 번째 코호트
    ];
  };

  // 현재 데이터에서 사용 가능한 기간 추출
  const getPeriods = () => {
    const currentData = getCurrentData();
    if (currentData.length === 0) return [];
    
    // 첫 번째 항목의 키 중 'cohort'를 제외한 나머지가 기간
    const firstItem = currentData[0];
    return Object.keys(firstItem).filter(key => key !== 'cohort');
  };

  const chartData = transformDataForChart();
  const periods = getPeriods();
  const lineColors = getLineColors();

  return (
    <Card
      title="사용자 유지율"
      extra={
        <Select
          defaultValue="weekly"
          style={{ width: 120 }}
          onChange={handleCohortTypeChange}
          disabled={loading}
        >
          <Option value="daily">일별</Option>
          <Option value="weekly">주별</Option>
          <Option value="monthly">월별</Option>
        </Select>
      }
    >
      {loading ? (
        renderLoading()
      ) : !data || chartData.length === 0 ? (
        renderEmpty()
      ) : (
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis 
                domain={[0, 100]} 
                label={{ value: '유지율 (%)', angle: -90, position: 'insideLeft' }} 
              />
              <Tooltip formatter={(value) => [`${value}%`, null]} />
              <Legend />
              {chartData.map((entry, index) => (
                <Line
                  key={entry.cohort}
                  type="monotone"
                  dataKey="retentionRate"
                  name={entry.cohort}
                  stroke={lineColors[index % lineColors.length]}
                  dot={{ r: 4 }}
                  activeDot={{ r: 8 }}
                  isAnimationActive={true}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};

export default RetentionChart;
