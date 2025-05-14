/**
 * 지갑 유지율 차트 컴포넌트
 * 보상 지급 이후 지갑 유지율을 시각화합니다.
 */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceLine,
  Label
} from 'recharts';
import { Info, Calendar } from 'react-feather';

// 차트 유형 정의
const CHART_TYPES = {
  LINE: 'line',
  AREA: 'area',
};

// 차트 색상 정의
const COLORS = {
  retentionRate: '#4f46e5', // 인디고 (유지율)
  activeUsers: '#0ea5e9', // 스카이 블루 (활성 사용자)
  inactiveUsers: '#f97316', // 오렌지 (비활성 사용자)
  rewardedUsers: '#10b981', // 에메랄드 (보상받은 사용자)
  walletActivity: '#8b5cf6', // 바이올렛 (지갑 활동)
  target: '#ef4444', // 빨강 (목표)
};

// 커스텀 툴팁 컴포넌트
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-white rounded shadow-md border border-gray-200">
        <div className="flex items-center mb-2">
          <Calendar className="w-4 h-4 mr-1 text-gray-500" />
          <p className="text-sm font-medium text-gray-600">{label}</p>
        </div>
        
        {payload.map((entry, index) => {
          // 값이 퍼센트인지 확인
          const isPercent = entry.name.toLowerCase().includes('율') || 
                          entry.name.toLowerCase().includes('비율') ||
                          entry.dataKey.toLowerCase().includes('rate');
                          
          const formattedValue = formatter 
            ? formatter(entry.name, entry.value)
            : `${entry.value.toLocaleString()}${isPercent ? '%' : ''}`;
          
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

// 메트릭 정보
const METRICS_INFO = {
  retentionRate: {
    label: '지갑 유지율',
    description: '보상 지급 이후 지갑을 계속 사용하는 사용자의 비율',
    isPercentage: true,
  },
  activeUsers: {
    label: '활성 사용자 수',
    description: '지갑을 활발하게 사용하는 사용자 수',
    isPercentage: false,
  },
  inactiveUsers: {
    label: '비활성 사용자 수',
    description: '지갑을 생성했으나 활발하게 사용하지 않는 사용자 수',
    isPercentage: false,
  },
  rewardedUsers: {
    label: '보상받은 사용자 수',
    description: '토큰 또는 NFT 형태의 보상을 받은 사용자 수',
    isPercentage: false,
  },
  walletActivity: {
    label: '지갑 활동 지수',
    description: '사용자당 평균 지갑 활동 횟수 (전송, 교환 등)',
    isPercentage: false,
  },
};

const WalletRetentionChart = ({
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
  metrics,
  dateKey,
  targetValue,
}) => {
  const [selectedMetrics, setSelectedMetrics] = useState([]);

  // 사용할 수 있는 메트릭 초기화
  React.useEffect(() => {
    if (metrics && metrics.length > 0) {
      setSelectedMetrics(metrics);
    } else if (data.length > 0) {
      // date/time 키를 제외한 데이터 키들을 메트릭으로 간주
      const availableMetrics = Object.keys(data[0]).filter(
        (key) => key !== dateKey && !['timestamp', 'period', 'name', 'value'].includes(key)
      );
      setSelectedMetrics(availableMetrics);
    }
  }, [data, metrics, dateKey]);

  // 메트릭 토글 핸들러
  const handleMetricToggle = (dataKey) => {
    setSelectedMetrics((prev) =>
      prev.includes(dataKey)
        ? prev.filter((m) => m !== dataKey)
        : [...prev, dataKey]
    );
  };

  // 차트 유형 변경 핸들러
  const handleChartTypeChange = (type) => {
    if (onChartTypeChange) {
      onChartTypeChange(type);
    }
  };

  // 메트릭 이름을 보기 좋은 레이블로 변환
  const getMetricLabel = (metric) => {
    return METRICS_INFO[metric]?.label || metric;
  };

  // 차트에서 메트릭 포맷 가져오기
  const getMetricFormat = (metric, value) => {
    const isPercent = METRICS_INFO[metric]?.isPercentage;
    return `${value.toLocaleString()}${isPercent ? '%' : ''}`;
  };

  // 선 차트 렌더링
  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey={dateKey} tick={{ fontSize: 12 }} />
        <YAxis 
          yAxisId="left"
          tick={{ fontSize: 12 }}
          domain={[0, targetValue ? Math.max(100, targetValue + 10) : 100]}
          tickFormatter={(value) => `${value}%`}
        />
        <YAxis 
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 12 }}
          domain={['auto', 'auto']}
        />
        <Tooltip content={<CustomTooltip formatter={(name, value) => getMetricFormat(name, value)} />} />
        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: 20 }}
            onClick={(e) => handleMetricToggle(e.dataKey)}
          />
        )}
        
        {selectedMetrics.map((metric) => {
          const isPercent = METRICS_INFO[metric]?.isPercentage;
          return (
            <Line
              key={metric}
              type="monotone"
              dataKey={metric}
              name={getMetricLabel(metric)}
              stroke={COLORS[metric] || '#8884d8'}
              yAxisId={isPercent ? 'left' : 'right'}
              activeDot={{ 
                r: 8, 
                onClick: (e) => onDataPointClick && onDataPointClick(e, metric) 
              }}
              strokeWidth={2}
            />
          );
        })}
        
        {targetValue && (
          <ReferenceLine
            y={targetValue}
            yAxisId="left"
            stroke={COLORS.target}
            strokeDasharray="3 3"
          >
            <Label
              value={`목표: ${targetValue}%`}
              position="insideTopRight"
              fill={COLORS.target}
              fontSize={12}
            />
          </ReferenceLine>
        )}
      </LineChart>
    </ResponsiveContainer>
  );

  // 영역 차트 렌더링
  const renderAreaChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey={dateKey} tick={{ fontSize: 12 }} />
        <YAxis 
          yAxisId="left"
          tick={{ fontSize: 12 }}
          domain={[0, targetValue ? Math.max(100, targetValue + 10) : 100]}
          tickFormatter={(value) => `${value}%`}
        />
        <YAxis 
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 12 }}
          domain={['auto', 'auto']}
        />
        <Tooltip content={<CustomTooltip formatter={(name, value) => getMetricFormat(name, value)} />} />
        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: 20 }}
            onClick={(e) => handleMetricToggle(e.dataKey)}
          />
        )}
        
        {selectedMetrics.map((metric) => {
          const isPercent = METRICS_INFO[metric]?.isPercentage;
          return (
            <Area
              key={metric}
              type="monotone"
              dataKey={metric}
              name={getMetricLabel(metric)}
              stroke={COLORS[metric] || '#8884d8'}
              fill={`${COLORS[metric] || '#8884d8'}33`} // 투명도 20%
              yAxisId={isPercent ? 'left' : 'right'}
              activeDot={{ 
                r: 8, 
                onClick: (e) => onDataPointClick && onDataPointClick(e, metric) 
              }}
            />
          );
        })}
        
        {targetValue && (
          <ReferenceLine
            y={targetValue}
            yAxisId="left"
            stroke={COLORS.target}
            strokeDasharray="3 3"
          >
            <Label
              value={`목표: ${targetValue}%`}
              position="insideTopRight"
              fill={COLORS.target}
              fontSize={12}
            />
          </ReferenceLine>
        )}
      </AreaChart>
    </ResponsiveContainer>
  );

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
                chartType === CHART_TYPES.LINE
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => handleChartTypeChange(CHART_TYPES.LINE)}
            >
              선 그래프
            </button>
            <button
              type="button"
              className={`px-2 py-1 text-xs font-medium rounded ${
                chartType === CHART_TYPES.AREA
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => handleChartTypeChange(CHART_TYPES.AREA)}
            >
              영역 그래프
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        {chartType === CHART_TYPES.LINE && renderLineChart()}
        {chartType === CHART_TYPES.AREA && renderAreaChart()}
      </div>
      
      {/* 메트릭 설명 */}
      <div className="px-4 pb-4">
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {selectedMetrics.map((metric) => (
            <div
              key={`desc-${metric}`}
              className="p-2 border border-gray-200 rounded-md"
            >
              <div className="flex items-center mb-1">
                <span
                  className="inline-block w-3 h-3 mr-2 rounded-full"
                  style={{ backgroundColor: COLORS[metric] || '#8884d8' }}
                />
                <span className="font-medium text-sm">{getMetricLabel(metric)}</span>
              </div>
              <p className="text-xs text-gray-600">{METRICS_INFO[metric]?.description || '설명 없음'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

WalletRetentionChart.propTypes = {
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
  metrics: PropTypes.arrayOf(PropTypes.string),
  dateKey: PropTypes.string,
  targetValue: PropTypes.number,
};

WalletRetentionChart.defaultProps = {
  chartType: CHART_TYPES.LINE,
  title: '지갑 유지율',
  description: '보상 지급 이후 사용자의 지갑 유지율',
  loading: false,
  onChartTypeChange: null,
  showLegend: true,
  height: 400,
  tooltipFormatter: null,
  className: '',
  onDataPointClick: null,
  metrics: ['retentionRate', 'activeUsers'],
  dateKey: 'date',
  targetValue: null,
};

// 차트 유형 및 메트릭 정보 내보내기
WalletRetentionChart.CHART_TYPES = CHART_TYPES;
WalletRetentionChart.METRICS_INFO = METRICS_INFO;

export default WalletRetentionChart;
