import React from 'react';
import { Card, Empty, Spin } from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

/**
 * XP 분포 차트 컴포넌트
 * 사용자들의 XP 분포를 구간별로 시각화하는 차트
 */
const XpDistributionChart = ({ data, loading }) => {
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

  // 차트 툴팁 커스텀 컴포넌트
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc' }}>
          <p style={{ margin: 0 }}>{`${label} XP: ${payload[0].value}명`}</p>
          <p style={{ margin: 0 }}>{`전체 대비: ${payload[0].payload.percentage}%`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card title="XP 분포">
      {loading ? (
        renderLoading()
      ) : !data || data.length === 0 ? (
        renderEmpty()
      ) : (
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="count"
                name="사용자 수"
                fill="#8884d8"
                background={{ fill: '#eee' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};

export default XpDistributionChart;
