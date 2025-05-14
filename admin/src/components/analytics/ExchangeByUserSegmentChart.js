/**
 * 사용자 세그먼트별 교환 차트 컴포넌트
 * 사용자 세그먼트별 토큰 교환 행동을 시각화합니다.
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Scatter,
  ScatterChart,
  ZAxis,
  Cell,
} from 'recharts';
import { Info, Users } from 'react-feather';

// 차트 유형 정의
const CHART_TYPES = {
  BAR: 'bar',
  RADAR: 'radar',
  SCATTER: 'scatter',
};

// 데이터 표시 방식
const DATA_DISPLAY = {
  COUNT: 'count',
  VOLUME: 'volume',
  AVERAGE: 'average',
};

// 색상 팔레트
const SEGMENT_COLORS = {
  'new_users': '#4f46e5', // 인디고 (신규 사용자)
  'active_users': '#0ea5e9', // 스카이 블루 (활성 사용자)
  'inactive_users': '#94a3b8', // 슬레이트 (비활성 사용자)
  'power_users': '#10b981', // 에메랄드 (파워 사용자)
  'casual_users': '#f59e0b', // 앰버 (일반 사용자)
  'whales': '#8b5cf6', // 바이올렛 (대형 투자자)
  'dolphins': '#06b6d4', // 시안 (중형 투자자)
  'early_adopters': '#f97316', // 오렌지 (얼리어답터)
  'late_adopters': '#64748b', // 회색 (레이트 어답터)
};

// 세그먼트 레이블
const SEGMENT_LABELS = {
  'new_users': '신규 사용자',
  'active_users': '활성 사용자',
  'inactive_users': '비활성 사용자',
  'power_users': '파워 사용자',
  'casual_users': '일반 사용자',
  'whales': '대형 투자자',
  'dolphins': '중형 투자자',
  'early_adopters': '얼리어답터',
  'late_adopters': '레이트 어답터',
};

// 커스텀 툴팁 컴포넌트
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-white rounded shadow-md border border-gray-200">
        <p className="mb-1 text-sm font-medium text-gray-600">
          {payload[0]?.payload?.segmentName || SEGMENT_LABELS[label] || label}
        </p>
        {payload.map((entry, index) => {
          const formattedValue = formatter 
            ? formatter(entry.name, entry.value, entry.payload) 
            : `${entry.value.toLocaleString()} ${entry.unit || ''}`;
          
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
              <span className="text-xs font-semibold">
                {formattedValue}
              </span>
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

const ExchangeByUserSegmentChart = ({
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
  onSegmentClick,
  segmentKey,
  countKey,
  volumeKey,
  averageKey,
  displayMode,
  onDisplayModeChange,
}) => {
  const [activeSegment, setActiveSegment] = useState(null);
  
  // 세그먼트 클릭 핸들러
  const handleSegmentClick = (entry) => {
    const segment = entry[segmentKey];
    const newActiveSegment = activeSegment === segment ? null : segment;
    setActiveSegment(newActiveSegment);
    
    if (onSegmentClick) {
      onSegmentClick(entry, newActiveSegment);
    }
  };

  // 차트 유형 변경 핸들러
  const handleChartTypeChange = (type) => {
    if (onChartTypeChange) {
      onChartTypeChange(type);
    }
  };

  // 데이터 표시 방식 변경 핸들러
  const handleDisplayModeChange = (mode) => {
    if (onDisplayModeChange) {
      onDisplayModeChange(mode);
    }
  };

  // 현재 표시 방식에 따른 데이터 키와 레이블 가져오기
  const getDisplayInfo = () => {
    switch (displayMode) {
      case DATA_DISPLAY.COUNT:
        return { key: countKey, label: '거래 건수', unit: '건' };
      case DATA_DISPLAY.VOLUME:
        return { key: volumeKey, label: '거래량', unit: '토큰' };
      case DATA_DISPLAY.AVERAGE:
        return { key: averageKey, label: '평균 거래액', unit: '토큰' };
      default:
        return { key: countKey, label: '거래 건수', unit: '건' };
    }
  };

  // 바 차트 렌더링
  const renderBarChart = () => {
    const { key, label, unit } = getDisplayInfo();
    
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
          layout="vertical"
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis type="number" />
          <YAxis 
            dataKey={segmentKey} 
            type="category" 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => SEGMENT_LABELS[value] || value}
            width={120}
          />
          <Tooltip 
            content={
              <CustomTooltip 
                formatter={(name, value) => `${value.toLocaleString()} ${unit}`} 
              />
            } 
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: 20 }}
            />
          )}
          
          <Bar 
            dataKey={key} 
            name={label}
            onClick={handleSegmentClick}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={SEGMENT_COLORS[entry[segmentKey]] || `#${Math.floor(Math.random() * 16777215).toString(16)}`}
                opacity={activeSegment === null || activeSegment === entry[segmentKey] ? 1 : 0.5}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // 레이더 차트 렌더링
  const renderRadarChart = () => {
    const { key, label } = getDisplayInfo();

    return (
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid />
          <PolarAngleAxis 
            dataKey={segmentKey} 
            tickFormatter={(value) => SEGMENT_LABELS[value] || value}
            tick={{ fontSize: 11 }}
          />
          <PolarRadiusAxis />
          <Radar
            name={label}
            dataKey={key}
            stroke="#4f46e5"
            fill="#4f46e5"
            fillOpacity={0.6}
            activeDot={{ r: 8, onClick: handleSegmentClick }}
          />
          <Tooltip 
            content={
              <CustomTooltip 
                formatter={(name, value) => `${value.toLocaleString()} ${getDisplayInfo().unit}`} 
              />
            } 
          />
          {showLegend && <Legend />}
        </RadarChart>
      </ResponsiveContainer>
    );
  };

  // 스캐터 차트 렌더링 (거래량 vs 거래 건수)
  const renderScatterChart = () => {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart
          margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            type="number" 
            dataKey={countKey} 
            name="거래 건수" 
            tick={{ fontSize: 12 }}
            label={{ 
              value: '거래 건수', 
              position: 'insideBottom', 
              offset: -5,
              fontSize: 12 
            }}
          />
          <YAxis 
            type="number" 
            dataKey={volumeKey} 
            name="거래량" 
            tick={{ fontSize: 12 }}
            label={{ 
              value: '거래량', 
              angle: -90, 
              position: 'insideLeft',
              fontSize: 12 
            }}
          />
          <ZAxis 
            type="number" 
            dataKey={averageKey} 
            range={[100, 1000]} 
            name="평균 거래액" 
          />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }} 
            content={
              <CustomTooltip 
                formatter={(name, value, payload) => {
                  if (name === '평균 거래액') {
                    return `${value.toLocaleString()} 토큰`;
                  }
                  if (name === '거래 건수') {
                    return `${value.toLocaleString()} 건`;
                  }
                  if (name === '거래량') {
                    return `${value.toLocaleString()} 토큰`;
                  }
                  return `${value.toLocaleString()}`;
                }} 
              />
            }
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: 20 }}
            />
          )}
          
          <Scatter 
            name="사용자 세그먼트" 
            data={data} 
            onClick={handleSegmentClick}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={SEGMENT_COLORS[entry[segmentKey]] || `#${Math.floor(Math.random() * 16777215).toString(16)}`}
                opacity={activeSegment === null || activeSegment === entry[segmentKey] ? 1 : 0.5}
              />
            ))}
          </Scatter>
        </ScatterChart>
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

  // 선택된 세그먼트에 대한 상세 정보
  const selectedSegment = data.find(item => item[segmentKey] === activeSegment);

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-800">{title}</h3>
            {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
          </div>
          
          <div className="flex items-center">
            {/* 데이터 표시 방식 선택 (스캐터 차트에서는 비활성화) */}
            {chartType !== CHART_TYPES.SCATTER && (
              <div className="mr-4">
                <label className="text-xs text-gray-600 mr-2">표시 데이터:</label>
                <select
                  className="py-1 px-2 text-xs border border-gray-300 rounded"
                  value={displayMode}
                  onChange={(e) => handleDisplayModeChange(e.target.value)}
                >
                  <option value={DATA_DISPLAY.COUNT}>거래 건수</option>
                  <option value={DATA_DISPLAY.VOLUME}>거래량</option>
                  <option value={DATA_DISPLAY.AVERAGE}>평균 거래액</option>
                </select>
              </div>
            )}
            
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
                막대 차트
              </button>
              <button
                type="button"
                className={`px-2 py-1 text-xs font-medium rounded ${
                  chartType === CHART_TYPES.RADAR
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => handleChartTypeChange(CHART_TYPES.RADAR)}
              >
                레이더 차트
              </button>
              <button
                type="button"
                className={`px-2 py-1 text-xs font-medium rounded ${
                  chartType === CHART_TYPES.SCATTER
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => handleChartTypeChange(CHART_TYPES.SCATTER)}
              >
                산점도
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        {chartType === CHART_TYPES.BAR && renderBarChart()}
        {chartType === CHART_TYPES.RADAR && renderRadarChart()}
        {chartType === CHART_TYPES.SCATTER && renderScatterChart()}
      </div>
      
      {/* 선택된 세그먼트 상세 정보 */}
      {selectedSegment && (
        <div className="px-4 pb-4">
          <div className="p-3 border border-indigo-100 rounded-md bg-indigo-50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-indigo-800">
                <Users className="inline w-4 h-4 mr-1" />
                {SEGMENT_LABELS[selectedSegment[segmentKey]] || selectedSegment[segmentKey]} 세그먼트 상세
              </h4>
              <button
                type="button"
                className="text-xs text-indigo-600 hover:text-indigo-800"
                onClick={() => setActiveSegment(null)}
              >
                닫기
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <div className="flex justify-between p-1">
                <span className="text-gray-600">거래 건수:</span>
                <span className="font-medium">{selectedSegment[countKey].toLocaleString()}건</span>
              </div>
              <div className="flex justify-between p-1">
                <span className="text-gray-600">거래량:</span>
                <span className="font-medium">{selectedSegment[volumeKey].toLocaleString()} 토큰</span>
              </div>
              <div className="flex justify-between p-1">
                <span className="text-gray-600">평균 거래액:</span>
                <span className="font-medium">{selectedSegment[averageKey].toLocaleString()} 토큰</span>
              </div>
              
              {/* 추가 정보가 있는 경우 표시 */}
              {Object.entries(selectedSegment).map(([key, value]) => {
                if (![segmentKey, countKey, volumeKey, averageKey].includes(key)) {
                  return (
                    <div key={key} className="flex justify-between p-1">
                      <span className="text-gray-600">{key}:</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        </div>
      )}
      
      {/* 세그먼트 범례 */}
      <div className="px-4 pb-4">
        <div className="border-t pt-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">세그먼트 설명</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
            {Object.entries(SEGMENT_LABELS).map(([key, label]) => (
              <div
                key={`legend-${key}`}
                className={`flex items-center p-2 border rounded-md ${
                  activeSegment === key ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200'
                }`}
                onClick={() => {
                  const segment = data.find(item => item[segmentKey] === key);
                  if (segment) handleSegmentClick(segment);
                }}
              >
                <span
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: SEGMENT_COLORS[key] }}
                ></span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

ExchangeByUserSegmentChart.propTypes = {
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
  onSegmentClick: PropTypes.func,
  segmentKey: PropTypes.string,
  countKey: PropTypes.string,
  volumeKey: PropTypes.string,
  averageKey: PropTypes.string,
  displayMode: PropTypes.oneOf(Object.values(DATA_DISPLAY)),
  onDisplayModeChange: PropTypes.func,
};

ExchangeByUserSegmentChart.defaultProps = {
  chartType: CHART_TYPES.BAR,
  title: '세그먼트별 토큰 교환',
  description: '사용자 세그먼트별 토큰 교환 행동 분석',
  loading: false,
  onChartTypeChange: null,
  showLegend: true,
  height: 400,
  tooltipFormatter: null,
  className: '',
  onSegmentClick: null,
  segmentKey: 'segment',
  countKey: 'count',
  volumeKey: 'volume',
  averageKey: 'average',
  displayMode: DATA_DISPLAY.COUNT,
  onDisplayModeChange: null,
};

// 차트 유형, 데이터 표시 방식, 세그먼트 레이블 상수 내보내기
ExchangeByUserSegmentChart.CHART_TYPES = CHART_TYPES;
ExchangeByUserSegmentChart.DATA_DISPLAY = DATA_DISPLAY;
ExchangeByUserSegmentChart.SEGMENT_LABELS = SEGMENT_LABELS;

export default ExchangeByUserSegmentChart;
