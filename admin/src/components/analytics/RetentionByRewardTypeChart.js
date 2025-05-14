/**
 * 보상 유형별 유지율 차트 컴포넌트
 * 보상 유형에 따른 사용자 지갑 유지율을 비교합니다.
 */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LabelList,
  ComposedChart,
  Line,
} from 'recharts';
import { Info, Award } from 'react-feather';

// 차트 유형 정의
const CHART_TYPES = {
  BAR: 'bar',
  GROUPED_BAR: 'grouped_bar',
  COMPOSED: 'composed',
};

// 시간 기간 정의
const TIME_PERIODS = {
  DAY_7: '7d',
  DAY_30: '30d',
  DAY_90: '90d',
};

// 모든 시간 기간에 대한 레이블
const TIME_PERIOD_LABELS = {
  [TIME_PERIODS.DAY_7]: '7일',
  [TIME_PERIODS.DAY_30]: '30일',
  [TIME_PERIODS.DAY_90]: '90일',
};

// 보상 유형에 대한 색상
const REWARD_COLORS = {
  'nest_token': '#4f46e5', // 인디고 (NEST 토큰)
  'cta_token': '#0ea5e9', // 스카이 블루 (CTA 토큰)
  'badge_nft': '#10b981', // 에메랄드 (배지 NFT)
  'special_nft': '#f59e0b', // 앰버 (특별 NFT)
  'xp': '#8b5cf6', // 바이올렛 (경험치)
  'mixed': '#f97316', // 오렌지 (복합 보상)
};

// 보상 타입 레이블
const REWARD_TYPE_LABELS = {
  'nest_token': 'NEST 토큰',
  'cta_token': 'CTA 토큰',
  'badge_nft': '뱃지 NFT',
  'special_nft': '특별 NFT',
  'xp': '경험치',
  'mixed': '복합 보상',
};

// 커스텀 툴팁 컴포넌트
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-white rounded shadow-md border border-gray-200">
        <div className="flex items-center mb-2">
          <Award className="w-4 h-4 mr-1 text-gray-500" />
          <p className="text-sm font-medium text-gray-600">
            {REWARD_TYPE_LABELS[label] || label}
          </p>
        </div>
        
        {payload.map((entry, index) => {
          const formattedValue = formatter 
            ? formatter(entry.name, entry.value)
            : `${entry.value}%`;
          
          return (
            <div
              key={`item-${index}`}
              className="flex items-center mb-1 last:mb-0"
            >
              <span
                className="inline-block w-3 h-3 mr-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="mr-2 text-xs text-gray-600">{entry.name}:</span>
              <span className="text-xs font-semibold">{formattedValue}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.any,
  formatter: PropTypes.func,
};

// 기본 데이터 구조 변환 함수
const transformDataForChart = (data, selectedPeriod) => {
  // 기본 바 차트용 데이터 변환
  if (!Array.isArray(data)) return [];
  
  return data.map(item => ({
    ...item,
    retentionRate: item[selectedPeriod] || 0,
  }));
};

// 그룹 바 차트용 데이터 변환 함수
const transformDataForGroupedChart = (data) => {
  if (!Array.isArray(data)) return [];
  
  return data.map(item => ({
    ...item,
    '7d': item['7d'] || 0,
    '30d': item['30d'] || 0,
    '90d': item['90d'] || 0,
  }));
};

const RetentionByRewardTypeChart = ({
  data,
  chartType,
  title,
  description,
  loading,
  onChartTypeChange,
  showLegend,
  height,
  tooltipFormatter,
  className,
  onDataPointClick,
  onRewardTypeClick,
  timePeriod,
  onTimePeriodChange,
  rewardTypeKey,
}) => {
  const [activeRewardType, setActiveRewardType] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(timePeriod || TIME_PERIODS.DAY_30);
  
  // 보상 유형 클릭 핸들러
  const handleRewardTypeClick = (entry) => {
    const rewardType = entry[rewardTypeKey];
    const newActiveRewardType = activeRewardType === rewardType ? null : rewardType;
    setActiveRewardType(newActiveRewardType);
    
    if (onRewardTypeClick) {
      onRewardTypeClick(entry, newActiveRewardType);
    }
  };

  // 차트 유형 변경 핸들러
  const handleChartTypeChange = (type) => {
    if (onChartTypeChange) {
      onChartTypeChange(type);
    }
  };

  // 시간 기간 변경 핸들러
  const handleTimePeriodChange = (period) => {
    setSelectedPeriod(period);
    
    if (onTimePeriodChange) {
      onTimePeriodChange(period);
    }
  };

  // 데이터 변환
  const chartData = chartType === CHART_TYPES.GROUPED_BAR 
    ? transformDataForGroupedChart(data)
    : transformDataForChart(data, selectedPeriod);

  // 기본 바 차트 렌더링
  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
        layout="vertical"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
        <YAxis 
          dataKey={rewardTypeKey} 
          type="category" 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => REWARD_TYPE_LABELS[value] || value}
          width={120}
        />
        <Tooltip content={<CustomTooltip formatter={tooltipFormatter} />} />
        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: 20 }}
          />
        )}
        
        <Bar 
          dataKey="retentionRate" 
          name={`${TIME_PERIOD_LABELS[selectedPeriod]} 유지율`}
          onClick={handleRewardTypeClick}
        >
          <LabelList 
            dataKey="retentionRate" 
            position="right" 
            formatter={(value) => `${value}%`}
            style={{ fontSize: 11 }}
          />
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={REWARD_COLORS[entry[rewardTypeKey]] || '#8884d8'}
              opacity={activeRewardType === null || activeRewardType === entry[rewardTypeKey] ? 1 : 0.5}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  // 그룹 바 차트 렌더링
  const renderGroupedBarChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey={rewardTypeKey} 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => REWARD_TYPE_LABELS[value] || value}
        />
        <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
        <Tooltip content={<CustomTooltip formatter={tooltipFormatter} />} />
        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: 20 }}
          />
        )}
        
        <Bar 
          dataKey={TIME_PERIODS.DAY_7} 
          name={`${TIME_PERIOD_LABELS[TIME_PERIODS.DAY_7]} 유지율`}
          fill="#4f46e5"
          onClick={handleRewardTypeClick}
        />
        <Bar 
          dataKey={TIME_PERIODS.DAY_30} 
          name={`${TIME_PERIOD_LABELS[TIME_PERIODS.DAY_30]} 유지율`}
          fill="#0ea5e9"
          onClick={handleRewardTypeClick}
        />
        <Bar 
          dataKey={TIME_PERIODS.DAY_90} 
          name={`${TIME_PERIOD_LABELS[TIME_PERIODS.DAY_90]} 유지율`}
          fill="#10b981"
          onClick={handleRewardTypeClick}
        />
      </BarChart>
    </ResponsiveContainer>
  );

  // 복합 차트 렌더링
  const renderComposedChart = () => {
    // 평균 계산
    const calculateAverage = (period) => {
      if (!data || data.length === 0) return 0;
      
      const sum = data.reduce((acc, item) => acc + (item[period] || 0), 0);
      return Math.round(sum / data.length);
    };
    
    const averages = {
      [TIME_PERIODS.DAY_7]: calculateAverage(TIME_PERIODS.DAY_7),
      [TIME_PERIODS.DAY_30]: calculateAverage(TIME_PERIODS.DAY_30),
      [TIME_PERIODS.DAY_90]: calculateAverage(TIME_PERIODS.DAY_90),
    };
    
    // 여러 시간 기간에 걸친 각 보상 유형의 유지율을 보여주는 데이터
    const composedData = Object.values(TIME_PERIODS).map(period => {
      const result = { period: TIME_PERIOD_LABELS[period], average: averages[period] };
      
      data.forEach(item => {
        result[item[rewardTypeKey]] = item[period] || 0;
      });
      
      return result;
    });

    return (
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={composedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="period" 
            tick={{ fontSize: 12 }}
          />
          <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
          <Tooltip content={<CustomTooltip formatter={tooltipFormatter} />} />
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: 20 }}
            />
          )}
          
          <Line
            type="monotone"
            dataKey="average"
            name="평균 유지율"
            stroke="#f43f5e"
            strokeWidth={2}
            dot={{ r: 5 }}
          />
          
          {data.map((item) => (
            <Bar
              key={item[rewardTypeKey]}
              dataKey={item[rewardTypeKey]}
              name={`${REWARD_TYPE_LABELS[item[rewardTypeKey]] || item[rewardTypeKey]} 유지율`}
              fill={REWARD_COLORS[item[rewardTypeKey]] || '#8884d8'}
              onClick={() => handleRewardTypeClick(item)}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    );
  };

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
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-800">{title}</h3>
            {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
          </div>
          
          <div className="flex space-x-2">
            <button
              type="button"
              className={`px-2 py-1 text-xs font-medium rounded ${
                chartType === CHART_TYPES.BAR
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => handleChartTypeChange(CHART_TYPES.BAR)}
            >
              세로 바
            </button>
            <button
              type="button"
              className={`px-2 py-1 text-xs font-medium rounded ${
                chartType === CHART_TYPES.GROUPED_BAR
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => handleChartTypeChange(CHART_TYPES.GROUPED_BAR)}
            >
              그룹 바
            </button>
            <button
              type="button"
              className={`px-2 py-1 text-xs font-medium rounded ${
                chartType === CHART_TYPES.COMPOSED
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => handleChartTypeChange(CHART_TYPES.COMPOSED)}
            >
              복합 차트
            </button>
          </div>
        </div>
        
        {/* 시간 기간 필터 (기본 바 차트에만 표시) */}
        {chartType === CHART_TYPES.BAR && (
          <div className="flex mt-3 space-x-2">
            {Object.values(TIME_PERIODS).map((period) => (
              <button
                key={period}
                type="button"
                className={`px-2 py-1 text-xs font-medium rounded ${
                  selectedPeriod === period
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => handleTimePeriodChange(period)}
              >
                {TIME_PERIOD_LABELS[period]}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <div className="p-4">
        {chartType === CHART_TYPES.BAR && renderBarChart()}
        {chartType === CHART_TYPES.GROUPED_BAR && renderGroupedBarChart()}
        {chartType === CHART_TYPES.COMPOSED && renderComposedChart()}
      </div>

      {/* 보상 유형 설명 */}
      <div className="px-4 pb-4">
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {Object.entries(REWARD_TYPE_LABELS).map(([type, label]) => (
            <div
              key={`desc-${type}`}
              className={`p-2 border rounded-md ${
                activeRewardType === type ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200'
              }`}
              onClick={() => {
                const entry = data.find(item => item[rewardTypeKey] === type);
                if (entry) handleRewardTypeClick(entry);
              }}
            >
              <div className="flex items-center mb-1">
                <span
                  className="inline-block w-3 h-3 mr-2 rounded-full"
                  style={{ backgroundColor: REWARD_COLORS[type] || '#8884d8' }}
                />
                <span className="font-medium text-sm">{label}</span>
              </div>
              {chartType === CHART_TYPES.BAR && (
                <p className="text-xs text-gray-600">
                  {TIME_PERIOD_LABELS[selectedPeriod]} 유지율: 
                  <span className="font-medium ml-1">
                    {data.find(item => item[rewardTypeKey] === type)?.[selectedPeriod] || 0}%
                  </span>
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

RetentionByRewardTypeChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  chartType: PropTypes.oneOf(Object.values(CHART_TYPES)),
  title: PropTypes.string,
  description: PropTypes.string,
  loading: PropTypes.bool,
  onChartTypeChange: PropTypes.func,
  showLegend: PropTypes.bool,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  tooltipFormatter: PropTypes.func,
  className: PropTypes.string,
  onDataPointClick: PropTypes.func,
  onRewardTypeClick: PropTypes.func,
  timePeriod: PropTypes.oneOf(Object.values(TIME_PERIODS)),
  onTimePeriodChange: PropTypes.func,
  rewardTypeKey: PropTypes.string,
};

RetentionByRewardTypeChart.defaultProps = {
  chartType: CHART_TYPES.BAR,
  title: '보상 유형별 유지율',
  description: '보상 유형에 따른 지갑 유지율 비교',
  loading: false,
  onChartTypeChange: null,
  showLegend: true,
  height: 400,
  tooltipFormatter: null,
  className: '',
  onDataPointClick: null,
  onRewardTypeClick: null,
  timePeriod: TIME_PERIODS.DAY_30,
  onTimePeriodChange: null,
  rewardTypeKey: 'rewardType',
};

// 차트 유형, 시간 기간, 보상 유형 레이블 상수 내보내기
RetentionByRewardTypeChart.CHART_TYPES = CHART_TYPES;
RetentionByRewardTypeChart.TIME_PERIODS = TIME_PERIODS;
RetentionByRewardTypeChart.TIME_PERIOD_LABELS = TIME_PERIOD_LABELS;
RetentionByRewardTypeChart.REWARD_TYPE_LABELS = REWARD_TYPE_LABELS;

export default RetentionByRewardTypeChart;
