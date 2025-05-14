/**
 * 전환 퍼널 차트 컴포넌트
 * 사용자 전환 퍼널을 시각화하는 컴포넌트입니다.
 */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
  Tooltip,
  Cell,
} from 'recharts';
import { Info } from 'react-feather';

// 퍼널 단계별 색상
const FUNNEL_COLORS = [
  '#4f46e5', // 인디고 (최상위)
  '#6366f1',
  '#818cf8',
  '#a5b4fc',
  '#c7d2fe',
  '#e0e7ff', // 라이트 인디고 (최하위)
];

// 사용자 정의 툴팁
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { name, value, dropRate, conversionRate, fill } = payload[0].payload;
    
    return (
      <div className="p-3 bg-white rounded shadow-md border border-gray-200">
        <div className="flex items-center mb-2">
          <span
            className="inline-block w-3 h-3 mr-2 rounded-full"
            style={{ backgroundColor: fill }}
          />
          <span className="font-medium">{name}</span>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">사용자 수:</span>
            <span className="font-medium">{value.toLocaleString()}</span>
          </div>
          {dropRate !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">이탈률:</span>
              <span className="font-medium">{dropRate}%</span>
            </div>
          )}
          {conversionRate !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">전환율:</span>
              <span className="font-medium">{conversionRate}%</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return null;
};

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
};

const ConversionFunnelChart = ({
  data,
  title,
  description,
  loading,
  height,
  showLabels,
  className,
  onFunnelClick,
}) => {
  const [activeIndex, setActiveIndex] = useState(null);

  // 활성화된 퍼널 단계 클릭 핸들러
  const handleFunnelClick = (data, index) => {
    setActiveIndex(index === activeIndex ? null : index);
    if (onFunnelClick) {
      onFunnelClick(data, index);
    }
  };

  // 퍼널 데이터 준비
  const processedData = data.map((item, index) => {
    const nextValue = data[index + 1]?.value || 0;
    const dropRate = item.value > 0 ? ((item.value - nextValue) / item.value * 100).toFixed(1) : 0;
    const prevValue = data[index - 1]?.value || item.value;
    const conversionRate = prevValue > 0 ? ((item.value / prevValue) * 100).toFixed(1) : 100;
    
    return {
      ...item,
      fill: FUNNEL_COLORS[index % FUNNEL_COLORS.length],
      dropRate: index < data.length - 1 ? dropRate : undefined,
      conversionRate: index > 0 ? conversionRate : 100,
    };
  });

  // 로딩 상태 렌더링
  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-white rounded-lg shadow ${className}`} style={{ height }}>
        <div className="text-center">
          <div className="w-8 h-8 mx-auto border-4 border-t-indigo-500 border-gray-200 rounded-full animate-spin"></div>
          <p className="mt-2 text-sm text-gray-600">데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  // 데이터가 없는 경우 렌더링
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-white rounded-lg shadow ${className}`} style={{ height }}>
        <div className="text-center">
          <Info className="w-8 h-8 mx-auto text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">표시할 데이터가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-4 border-b">
        <h3 className="text-lg font-medium text-gray-800">{title}</h3>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      
      <div className="p-4">
        <ResponsiveContainer width="100%" height={height}>
          <FunnelChart>
            <Tooltip content={<CustomTooltip />} />
            <Funnel
              data={processedData}
              dataKey="value"
              nameKey="name"
              onClick={handleFunnelClick}
            >
              <LabelList
                position="right"
                fill="#555"
                stroke="none"
                dataKey="name"
                style={{ fontSize: 12 }}
              />
              {processedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill}
                  stroke="#fff"
                  strokeWidth={2}
                  opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
                />
              ))}
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>

        {/* 퍼널 단계별 통계 */}
        <div className="mt-4 space-y-2">
          {processedData.map((item, index) => (
            <div 
              key={`stat-${index}`}
              className={`p-2 rounded-md flex justify-between items-center transition-colors ${
                activeIndex === index ? 'bg-indigo-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => handleFunnelClick(item, index)}
            >
              <div className="flex items-center">
                <span
                  className="inline-block w-3 h-3 mr-2 rounded-full"
                  style={{ backgroundColor: item.fill }}
                />
                <span className="font-medium">{item.name}</span>
              </div>
              <div className="flex space-x-4">
                <div className="text-right">
                  <span className="block text-sm text-gray-500">사용자 수</span>
                  <span className="font-medium">{item.value.toLocaleString()}</span>
                </div>
                {index > 0 && (
                  <div className="text-right">
                    <span className="block text-sm text-gray-500">전환율</span>
                    <span className="font-medium">{item.conversionRate}%</span>
                  </div>
                )}
                {index < processedData.length - 1 && (
                  <div className="text-right">
                    <span className="block text-sm text-gray-500">이탈률</span>
                    <span className="font-medium">{item.dropRate}%</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

ConversionFunnelChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
    })
  ).isRequired,
  title: PropTypes.string,
  description: PropTypes.string,
  loading: PropTypes.bool,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  showLabels: PropTypes.bool,
  className: PropTypes.string,
  onFunnelClick: PropTypes.func,
};

ConversionFunnelChart.defaultProps = {
  title: '전환 퍼널',
  description: '',
  loading: false,
  height: 400,
  showLabels: true,
  className: '',
  onFunnelClick: null,
};

export default ConversionFunnelChart;
