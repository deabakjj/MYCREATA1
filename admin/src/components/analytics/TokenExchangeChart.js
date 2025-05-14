/**
 * 토큰 교환율 차트 컴포넌트
 * CTA와 NEST 토큰 간의 교환율 추이를 시각화합니다.
 */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
  ReferenceLine,
  Label,
  Brush,
} from 'recharts';
import { Info, ArrowUpDown } from 'react-feather';

// 차트 유형 정의
const CHART_TYPES = {
  LINE: 'line',
  BAR: 'bar',
  COMPOSED: 'composed',
};

// 교환 방향 정의
const EXCHANGE_DIRECTIONS = {
  CTA_TO_NEST: 'cta_to_nest',
  NEST_TO_CTA: 'nest_to_cta',
  BOTH: 'both',
};

// 차트 색상 정의
const COLORS = {
  exchangeRate: '#4f46e5', // 인디고 (교환율)
  volume: '#0ea5e9', // 스카이 블루 (거래량)
  ctaToNest: '#10b981', // 에메랄드 (CTA→NEST)
  nestToCta: '#f59e0b', // 앰버 (NEST→CTA)
  averageRate: '#8b5cf6', // 바이올렛 (평균 교환율)
  targetRate: '#ef4444', // 빨강 (목표 교환율)
};

// 커스텀 툴팁 컴포넌트
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-white rounded shadow-md border border-gray-200">
        <p className="mb-1 text-sm font-medium text-gray-600">{label}</p>
        {payload.map((entry, index) => {
          // 특정 필드에 대한 단위 결정
          let unit = '';
          if (entry.dataKey === 'exchangeRate' || entry.name === '교환율') {
            unit = ' CTA';
          } else if (entry.dataKey.includes('volume') || entry.name.includes('거래량')) {
            unit = ' 토큰';
          }
          
          const formattedValue = formatter 
            ? formatter(entry.name, entry.value)
            : `${entry.value.toLocaleString()}${unit}`;
          
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
  exchangeRate: {
    label: '교환율 (1 NEST = ? CTA)',
    description: 'NEST 토큰 1개당 CTA 토큰 교환 비율',
  },
  ctaToNestVolume: {
    label: 'CTA→NEST 거래량',
    description: 'CTA에서 NEST로 교환된 토큰 수량',
  },
  nestToCtaVolume: {
    label: 'NEST→CTA 거래량',
    description: 'NEST에서 CTA로 교환된 토큰 수량',
  },
  totalExchangeVolume: {
    label: '총 거래량',
    description: '모든 방향의 총 토큰 교환 수량',
  },
};

const TokenExchangeChart = ({
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
  exchangeDirection,
  onExchangeDirectionChange,
  dateKey,
  targetExchangeRate,
}) => {
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [activePeriod, setActivePeriod] = useState(null);

  // 사용할 수 있는 메트릭 초기화
  React.useEffect(() => {
    if (data.length > 0) {
      const defaultMetrics = ['exchangeRate', 'totalExchangeVolume'];
      
      // 교환 방향에 따라 메트릭 선택
      if (exchangeDirection === EXCHANGE_DIRECTIONS.CTA_TO_NEST) {
        defaultMetrics.push('ctaToNestVolume');
      } else if (exchangeDirection === EXCHANGE_DIRECTIONS.NEST_TO_CTA) {
        defaultMetrics.push('nestToCtaVolume');
      } else if (exchangeDirection === EXCHANGE_DIRECTIONS.BOTH) {
        defaultMetrics.push('ctaToNestVolume', 'nestToCtaVolume');
      }
      
      setSelectedMetrics(defaultMetrics);
    }
  }, [data, exchangeDirection]);

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

  // 교환 방향 변경 핸들러
  const handleExchangeDirectionChange = (direction) => {
    if (onExchangeDirectionChange) {
      onExchangeDirectionChange(direction);
    }
  };

  // 기간 선택 핸들러 (브러시 이벤트)
  const handleBrushChange = (e) => {
    if (e.startIndex === e.endIndex) {
      setActivePeriod(null);
    } else {
      setActivePeriod({
        startIndex: e.startIndex,
        endIndex: e.endIndex,
      });
    }
  };

  // 메트릭 이름을 보기 좋은 레이블로 변환
  const getMetricLabel = (metric) => {
    return METRICS_INFO[metric]?.label || metric;
  };

  // 선 차트 렌더링
  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey={dateKey} tick={{ fontSize: 12 }} />
        <YAxis 
          yAxisId="rate"
          tick={{ fontSize: 12 }}
          domain={['auto', 'auto']}
          label={{ 
            value: '교환율 (CTA)', 
            angle: -90, 
            position: 'insideLeft',
            fontSize: 12,
            dy: 50
          }}
        />
        <YAxis 
          yAxisId="volume"
          orientation="right"
          tick={{ fontSize: 12 }}
          domain={[0, 'auto']}
          label={{ 
            value: '거래량', 
            angle: 90, 
            position: 'insideRight',
            fontSize: 12,
            dy: -50
          }}
        />
        <Tooltip content={<CustomTooltip formatter={tooltipFormatter} />} />
        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: 20 }}
            onClick={(e) => handleMetricToggle(e.dataKey)}
          />
        )}
        
        {selectedMetrics.includes('exchangeRate') && (
          <Line
            type="monotone"
            dataKey="exchangeRate"
            name="교환율 (1 NEST = ? CTA)"
            stroke={COLORS.exchangeRate}
            yAxisId="rate"
            dot={false}
            activeDot={{ 
              r: 6, 
              onClick: (e) => onDataPointClick && onDataPointClick(e, 'exchangeRate') 
            }}
            strokeWidth={2}
          />
        )}
        
        {selectedMetrics.includes('ctaToNestVolume') && (
          <Line
            type="monotone"
            dataKey="ctaToNestVolume"
            name="CTA→NEST 거래량"
            stroke={COLORS.ctaToNest}
            yAxisId="volume"
            dot={false}
            activeDot={{ 
              r: 6, 
              onClick: (e) => onDataPointClick && onDataPointClick(e, 'ctaToNestVolume') 
            }}
          />
        )}
        
        {selectedMetrics.includes('nestToCtaVolume') && (
          <Line
            type="monotone"
            dataKey="nestToCtaVolume"
            name="NEST→CTA 거래량"
            stroke={COLORS.nestToCta}
            yAxisId="volume"
            dot={false}
            activeDot={{ 
              r: 6, 
              onClick: (e) => onDataPointClick && onDataPointClick(e, 'nestToCtaVolume') 
            }}
          />
        )}
        
        {selectedMetrics.includes('totalExchangeVolume') && (
          <Line
            type="monotone"
            dataKey="totalExchangeVolume"
            name="총 거래량"
            stroke={COLORS.volume}
            yAxisId="volume"
            dot={false}
            activeDot={{ 
              r: 6, 
              onClick: (e) => onDataPointClick && onDataPointClick(e, 'totalExchangeVolume') 
            }}
            strokeWidth={2}
          />
        )}
        
        {targetExchangeRate && (
          <ReferenceLine
            y={targetExchangeRate}
            yAxisId="rate"
            stroke={COLORS.targetRate}
            strokeDasharray="3 3"
          >
            <Label
              value={`목표: ${targetExchangeRate} CTA`}
              position="insideBottomRight"
              fill={COLORS.targetRate}
              fontSize={12}
            />
          </ReferenceLine>
        )}
        
        <Brush 
          dataKey={dateKey} 
          height={30} 
          stroke="#4f46e5"
          onChange={handleBrushChange}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  // 바 차트 렌더링
  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey={dateKey} tick={{ fontSize: 12 }} />
        <YAxis 
          yAxisId="volume"
          tick={{ fontSize: 12 }}
          domain={[0, 'auto']}
          label={{ 
            value: '거래량', 
            angle: -90, 
            position: 'insideLeft',
            fontSize: 12,
            dy: 50
          }}
        />
        <Tooltip content={<CustomTooltip formatter={tooltipFormatter} />} />
        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: 20 }}
            onClick={(e) => handleMetricToggle(e.dataKey)}
          />
        )}
        
        {(selectedMetrics.includes('ctaToNestVolume') || 
          selectedMetrics.includes('totalExchangeVolume')) && (
          <Bar
            dataKey="ctaToNestVolume"
            name="CTA→NEST 거래량"
            fill={COLORS.ctaToNest}
            yAxisId="volume"
            onClick={(e) => onDataPointClick && onDataPointClick(e, 'ctaToNestVolume')}
            stackId={selectedMetrics.includes('totalExchangeVolume') ? "a" : undefined}
          />
        )}
        
        {(selectedMetrics.includes('nestToCtaVolume') || 
          selectedMetrics.includes('totalExchangeVolume')) && (
          <Bar
            dataKey="nestToCtaVolume"
            name="NEST→CTA 거래량"
            fill={COLORS.nestToCta}
            yAxisId="volume"
            onClick={(e) => onDataPointClick && onDataPointClick(e, 'nestToCtaVolume')}
            stackId={selectedMetrics.includes('totalExchangeVolume') ? "a" : undefined}
          />
        )}
        
        <Brush 
          dataKey={dateKey} 
          height={30} 
          stroke="#4f46e5"
          onChange={handleBrushChange}
        />
      </BarChart>
    </ResponsiveContainer>
  );

  // 복합 차트 렌더링
  const renderComposedChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey={dateKey} tick={{ fontSize: 12 }} />
        <YAxis 
          yAxisId="rate"
          tick={{ fontSize: 12 }}
          domain={['auto', 'auto']}
          label={{ 
            value: '교환율 (CTA)', 
            angle: -90, 
            position: 'insideLeft',
            fontSize: 12,
            dy: 50
          }}
        />
        <YAxis 
          yAxisId="volume"
          orientation="right"
          tick={{ fontSize: 12 }}
          domain={[0, 'auto']}
          label={{ 
            value: '거래량', 
            angle: 90, 
            position: 'insideRight',
            fontSize: 12,
            dy: -50
          }}
        />
        <Tooltip content={<CustomTooltip formatter={tooltipFormatter} />} />
        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: 20 }}
            onClick={(e) => handleMetricToggle(e.dataKey)}
          />
        )}
        
        {selectedMetrics.includes('exchangeRate') && (
          <Line
            type="monotone"
            dataKey="exchangeRate"
            name="교환율 (1 NEST = ? CTA)"
            stroke={COLORS.exchangeRate}
            yAxisId="rate"
            dot={false}
            activeDot={{ 
              r: 6, 
              onClick: (e) => onDataPointClick && onDataPointClick(e, 'exchangeRate') 
            }}
            strokeWidth={2}
          />
        )}
        
        {targetExchangeRate && (
          <ReferenceLine
            y={targetExchangeRate}
            yAxisId="rate"
            stroke={COLORS.targetRate}
            strokeDasharray="3 3"
          >
            <Label
              value={`목표: ${targetExchangeRate} CTA`}
              position="insideBottomRight"
              fill={COLORS.targetRate}
              fontSize={12}
            />
          </ReferenceLine>
        )}
        
        {selectedMetrics.includes('ctaToNestVolume') && (
          <Area
            type="monotone"
            dataKey="ctaToNestVolume"
            name="CTA→NEST 거래량"
            fill={COLORS.ctaToNest}
            stroke={COLORS.ctaToNest}
            fillOpacity={0.4}
            yAxisId="volume"
            onClick={(e) => onDataPointClick && onDataPointClick(e, 'ctaToNestVolume')}
            stackId={selectedMetrics.includes('totalExchangeVolume') ? "a" : undefined}
          />
        )}
        
        {selectedMetrics.includes('nestToCtaVolume') && (
          <Area
            type="monotone"
            dataKey="nestToCtaVolume"
            name="NEST→CTA 거래량"
            fill={COLORS.nestToCta}
            stroke={COLORS.nestToCta}
            fillOpacity={0.4}
            yAxisId="volume"
            onClick={(e) => onDataPointClick && onDataPointClick(e, 'nestToCtaVolume')}
            stackId={selectedMetrics.includes('totalExchangeVolume') ? "a" : undefined}
          />
        )}
        
        <Brush 
          dataKey={dateKey} 
          height={30} 
          stroke="#4f46e5"
          onChange={handleBrushChange}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );

  // 선택된 기간에 대한 통계 계산
  const calculateStats = () => {
    if (!activePeriod) return null;
    
    const { startIndex, endIndex } = activePeriod;
    const selectedData = data.slice(startIndex, endIndex + 1);
    
    if (selectedData.length === 0) return null;
    
    const avgExchangeRate = selectedData.reduce((sum, item) => sum + item.exchangeRate, 0) / selectedData.length;
    const totalCtaToNest = selectedData.reduce((sum, item) => sum + (item.ctaToNestVolume || 0), 0);
    const totalNestToCta = selectedData.reduce((sum, item) => sum + (item.nestToCtaVolume || 0), 0);
    const totalVolume = selectedData.reduce((sum, item) => sum + (item.totalExchangeVolume || 0), 0);
    
    const startDate = selectedData[0][dateKey];
    const endDate = selectedData[selectedData.length - 1][dateKey];
    
    return {
      avgExchangeRate,
      totalCtaToNest,
      totalNestToCta,
      totalVolume,
      startDate,
      endDate,
    };
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

  const stats = calculateStats();

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-800">{title}</h3>
            {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
          </div>
          
          <div className="flex items-center">
            <div className="mr-4">
              <label className="text-xs text-gray-600 mr-2">교환 방향:</label>
              <select
                className="py-1 px-2 text-xs border border-gray-300 rounded"
                value={exchangeDirection}
                onChange={(e) => handleExchangeDirectionChange(e.target.value)}
              >
                <option value={EXCHANGE_DIRECTIONS.BOTH}>양방향</option>
                <option value={EXCHANGE_DIRECTIONS.CTA_TO_NEST}>CTA→NEST</option>
                <option value={EXCHANGE_DIRECTIONS.NEST_TO_CTA}>NEST→CTA</option>
              </select>
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
                  chartType === CHART_TYPES.BAR
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => handleChartTypeChange(CHART_TYPES.BAR)}
              >
                막대 그래프
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
      </div>
      
      <div className="p-4">
        {chartType === CHART_TYPES.LINE && renderLineChart()}
        {chartType === CHART_TYPES.BAR && renderBarChart()}
        {chartType === CHART_TYPES.COMPOSED && renderComposedChart()}
      </div>
      
      {/* 선택된 기간 통계 */}
      {stats && (
        <div className="px-4 pb-4">
          <div className="p-3 border border-indigo-100 rounded-md bg-indigo-50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-indigo-800">
                <ArrowUpDown className="inline w-4 h-4 mr-1" />
                {stats.startDate} ~ {stats.endDate} 기간 통계
              </h4>
              <button
                type="button"
                className="text-xs text-indigo-600 hover:text-indigo-800"
                onClick={() => setActivePeriod(null)}
              >
                닫기
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div className="flex justify-between p-1">
                <span className="text-gray-600">평균 교환율:</span>
                <span className="font-medium">{stats.avgExchangeRate.toFixed(2)} CTA</span>
              </div>
              <div className="flex justify-between p-1">
                <span className="text-gray-600">CTA→NEST 거래량:</span>
                <span className="font-medium">{stats.totalCtaToNest.toLocaleString()} 토큰</span>
              </div>
              <div className="flex justify-between p-1">
                <span className="text-gray-600">NEST→CTA 거래량:</span>
                <span className="font-medium">{stats.totalNestToCta.toLocaleString()} 토큰</span>
              </div>
              <div className="flex justify-between p-1">
                <span className="text-gray-600">총 거래량:</span>
                <span className="font-medium">{stats.totalVolume.toLocaleString()} 토큰</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 메트릭 설명 */}
      <div className="px-4 pb-4">
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
          {Object.entries(METRICS_INFO).map(([metric, info]) => (
            <div
              key={`desc-${metric}`}
              className={`p-2 border rounded-md cursor-pointer ${
                selectedMetrics.includes(metric) ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200'
              }`}
              onClick={() => handleMetricToggle(metric)}
            >
              <div className="flex items-center mb-1">
                <span
                  className="inline-block w-3 h-3 mr-2 rounded-full"
                  style={{ backgroundColor: COLORS[metric] || '#8884d8' }}
                />
                <span className="font-medium text-sm">{info.label}</span>
              </div>
              <p className="text-xs text-gray-600">{info.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

TokenExchangeChart.propTypes = {
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
  exchangeDirection: PropTypes.oneOf(Object.values(EXCHANGE_DIRECTIONS)),
  onExchangeDirectionChange: PropTypes.func,
  dateKey: PropTypes.string,
  targetExchangeRate: PropTypes.number,
};

TokenExchangeChart.defaultProps = {
  chartType: CHART_TYPES.LINE,
  title: '토큰 교환율',
  description: 'CTA와 NEST 토큰 간의 교환율 추이',
  loading: false,
  onChartTypeChange: null,
  showLegend: true,
  height: 400,
  tooltipFormatter: null,
  className: '',
  onDataPointClick: null,
  exchangeDirection: EXCHANGE_DIRECTIONS.BOTH,
  onExchangeDirectionChange: null,
  dateKey: 'date',
  targetExchangeRate: null,
};

// 차트 유형 및 교환 방향 상수 내보내기
TokenExchangeChart.CHART_TYPES = CHART_TYPES;
TokenExchangeChart.EXCHANGE_DIRECTIONS = EXCHANGE_DIRECTIONS;

export default TokenExchangeChart;
