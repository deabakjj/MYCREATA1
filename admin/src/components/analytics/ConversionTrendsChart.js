/**
 * 전환 추세 차트 컴포넌트
 * 시간에 따른 사용자 전환 추세를 시각화합니다.
 */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
} from 'recharts';
import { Info, Calendar } from 'react-feather';

// 차트 유형 정의
const CHART_TYPES = {
  LINE: 'line',
  AREA: 'area',
  COMPOSED: 'composed',
};

// 차트 색상 정의
const COLORS = {
  signupToWallet: '#4f46e5', // 인디고 (회원가입 -> 지갑 생성)
  walletToTransaction: '#0ea5e9', // 스카이 블루 (지갑 생성 -> 트랜잭션)
  transactionToRetention: '#10b981', // 에메랄드 (트랜잭션 -> 유지)
  overallConversion: '#f59e0b', // 앰버 (전체 전환율)
  webSignups: '#94a3b8', // 슬레이트 (웹 가입)
  web3Adoption: '#8b5cf6', // 바이올렛 (웹3 채택)
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
  signupToWallet: {
    label: '가입 → 지갑 전환율',
    description: '회원가입 후 지갑을 생성한 사용자 비율',
    isPercentage: true,
  },
  walletToTransaction: {
    label: '지갑 → 트랜잭션 전환율',
    description: '지갑 생성 후 트랜잭션을 발생시킨 사용자 비율',
    isPercentage: true,
  },
  transactionToRetention: {
    label: '트랜잭션 → 유지율',
    description: '트랜잭션 발생 후 서비스를 계속 사용하는 사용자 비율',
    isPercentage: true,
  },
  overallConversion: {
    label: '전체 전환율',
    description: '전체 가입자 중 Web3 활동으로 전환된 사용자 비율',
    isPercentage: true,
  },
  webSignups: {
    label: '웹 가입자 수',
    description: '기간별 전체 가입자 수',
    isPercentage: false,
  },
  web3Adoption: {
    label: 'Web3 채택률',
    description: '전체 활성 사용자 중 Web3 기능을 사용하는 비율',
    isPercentage: true,
  },
};

const ConversionTrendsChart = ({
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
}) => {
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [activeTooltipIndex, setActiveTooltipIndex] = useState(null);

  // 사용할 수 있는 메트릭 선택 초기화
  useEffect(() => {
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
        onMouseMove={(e) => e && e.activeTooltipIndex !== undefined && setActiveTooltipIndex(e.activeTooltipIndex)}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey={dateKey} tick={{ fontSize: 12 }} />
        <YAxis 
          yAxisId="left"
          tick={{ fontSize: 12 }}
          domain={[0, 100]}
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
                onClick: (e) => onDataPointClick && onDataPointClick(e, metric, data[activeTooltipIndex]) 
              }}
              strokeWidth={2}
            />
          );
        })}
      </LineChart>
    </ResponsiveContainer>
  );

  // 영역 차트 렌더링
  const renderAreaChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
        onMouseMove={(e) => e && e.activeTooltipIndex !== undefined && setActiveTooltipIndex(e.activeTooltipIndex)}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey={dateKey} tick={{ fontSize: 12 }} />
        <YAxis 
          yAxisId="left"
          tick={{ fontSize: 12 }}
          domain={[0, 100]}
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
                onClick: (e) => onDataPointClick && onDataPointClick(e, metric, data[activeTooltipIndex]) 
              }}
            />
          );
        })}
      </AreaChart>
    </ResponsiveContainer>
  );

  // 복합 차트 렌더링 (막대 + 선)
  const renderComposedChart = () => {
    // 퍼센트 메트릭과 숫자 메트릭 분리
    const percentMetrics = selectedMetrics.filter(
      (metric) => METRICS_INFO[metric]?.isPercentage
    );
    
    const countMetrics = selectedMetrics.filter(
      (metric) => !METRICS_INFO[metric]?.isPercentage
    );

    return (
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
          onMouseMove={(e) => e && e.activeTooltipIndex !== undefined && setActiveTooltipIndex(e.activeTooltipIndex)}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey={dateKey} tick={{ fontSize: 12 }} />
          <YAxis 
            yAxisId="left"
            tick={{ fontSize: 12 }}
            domain={[0, 100]}
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
          
          {percentMetrics.map((metric) => (
            <Line
              key={metric}
              type="monotone"
              dataKey={metric}
              name={getMetricLabel(metric)}
              stroke={COLORS[metric] || '#8884d8'}
              yAxisId="left"
              activeDot={{ 
                r: 8, 
                onClick: (e) => onDataPointClick && onDataPointClick(e, metric, data[activeTooltipIndex]) 
              }}
              strokeWidth={2}
            />
          ))}
          
          {countMetrics.map((metric) => (
            <Bar
              key={metric}
              dataKey={metric}
              name={getMetricLabel(metric)}
              fill={COLORS[metric] || '#8884d8'}
              yAxisId="right"
              onClick={(e) => onDataPointClick && onDataPointClick(e, metric, data[activeTooltipIndex])}
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
            <button
              type="button"
              className={`px-2 py-1 text-xs font-medium rounded ${
                chartType === CHART_TYPES.COMPOSED
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => handleChartTypeChange(CHART_TYPES.COMPOSED)}
            >
              복합 그래프
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        {chartType === CHART_TYPES.LINE && renderLineChart()}
        {chartType === CHART_TYPES.AREA && renderAreaChart()}
        {chartType === CHART_TYPES.COMPOSED && renderComposedChart()}
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

ConversionTrendsChart.propTypes = {
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
};

ConversionTrendsChart.defaultProps = {
  chartType: CHART_TYPES.LINE,
  title: '전환 추세',
  description: '시간에 따른 사용자 전환율 변화',
  loading: false,
  onChartTypeChange: null,
  showLegend: true,
  height: 400,
  tooltipFormatter: null,
  className: '',
  onDataPointClick: null,
  metrics: null,
  dateKey: 'date',
};

// 차트 유형 및 메트릭 정보 내보내기
ConversionTrendsChart.CHART_TYPES = CHART_TYPES;
ConversionTrendsChart.METRICS_INFO = METRICS_INFO;

export default ConversionTrendsChart;
