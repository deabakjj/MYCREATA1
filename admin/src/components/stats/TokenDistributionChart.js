import React from 'react';
import { Card, Empty, Spin } from 'antd';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

/**
 * 토큰 분포 차트 컴포넌트
 * NEST 토큰의 분포 현황을 시각화하는 파이 차트
 */
const TokenDistributionChart = ({ data, loading }) => {
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

  // 차트 색상 설정
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#83a6ed'];

  // 차트 툴팁 커스텀 컴포넌트
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: 'white', padding: '10px', border: '1px solid #ccc' }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{`${payload[0].name}`}</p>
          <p style={{ margin: 0 }}>{`${payload[0].value.toLocaleString()} NEST`}</p>
          <p style={{ margin: 0 }}>{`비율: ${payload[0].payload.percentage}%`}</p>
        </div>
      );
    }
    return null;
  };

  // 레이블 커스텀 렌더러
  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
    name,
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // 비율이 5% 미만인 작은 조각은 레이블 표시하지 않음
    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  return (
    <Card title="NEST 토큰 분포">
      {loading ? (
        renderLoading()
      ) : !data || data.length === 0 ? (
        renderEmpty()
      ) : (
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};

export default TokenDistributionChart;
