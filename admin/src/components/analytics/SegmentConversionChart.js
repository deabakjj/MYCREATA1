/**
 * 세그먼트별 전환률 차트 컴포넌트
 * 서로 다른 사용자 세그먼트 간의 전환률을 비교합니다.
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { Info, Filter } from 'react-feather';

// 차트 유형 정의
const CHART_TYPES = {
  BAR: 'bar',
  HORIZONTAL_BAR: 'horizontal_bar',
  RADAR: 'radar',
};

// 커스텀 툴팁 컴포넌트
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-white rounded shadow-md border border-gray-200">
        <p className="mb-1 text-sm font-medium text-gray-600">{label}</p>
        {payload.map((entry, index) => {
          const formattedValue = formatter 
            ? formatter(entry.name, entry.value)
            : `${entry.value}${entry.name.includes('율') ? '%' : ''}`;
          
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

// 색상 스케일 생성 함수
const generateColorScale = (count) => {
  const baseColors = [
    '#4f46e5', // 인디고
    '#0ea5e9', // 스카이 블루
    '#10b981', // 에메랄드
    '#f59e0b', // 앰버
    '#6366f1', // 인디고 라이트
    '#06b6d4', // 시안
  ];
  
  // 필요한 만큼 색상 반복
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }
  
  return colors;
};

const SegmentConversionChart = ({
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
  onSegmentClick,
  segmentKey,
  conversionKey,
}) => {
  const [activeSegment, setActiveSegment] = useState(null);
  const [selectedMetrics, setSelectedMetrics] = useState([conversionKey]);
  
  // 세그먼트 클릭 핸들러
  const handleSegmentClick = (entry) => {
    const segmentValue = entry[segmentKey];
    const newActiveSegment = activeSegment === segmentValue ? null : segmentValue;
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

  // 메트릭 토글 핸들러
  const handleMetricToggle = (dataKey) => {
    setSelectedMetrics((prev) =>
      prev.includes(dataKey)
        ? prev.filter((m) => m !== dataKey)
        : [...prev, dataKey]
    );
  };

  // 색상 스케일 생성
  const colorScale = generateColorScale(data.length);

  // 바 차트 렌더링
  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
        layout="vertical"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
        <YAxis 
          dataKey={segmentKey} 
          type="category" 
          tick={{ fontSize: 12 }}
          width={150}
        />
        <Tooltip content={<CustomTooltip formatter={tooltipFormatter} />} />
        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: 20 }}
            onClick={(e) => handleMetricToggle(e.dataKey)}
          />
        )}
        
        <Bar 
          dataKey={conversionKey} 
          name="전환율"
          onClick={handleSegmentClick}
        >
          <LabelList 
            dataKey={conversionKey} 
            position="right" 
            formatter={(value) => `${value}%`}
            style={{ fontSize: 11 }}
          />
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={colorScale[index]}
              opacity={activeSegment === null || activeSegment === entry[segmentKey] ? 1 : 0.5}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  // 수평 바 차트 렌더링
  const renderHorizontalBarChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey={segmentKey} 
          tick={{ fontSize: 12, angle: -45, textAnchor: 'end' }}
          height={80}
        />
        <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
        <Tooltip content={<CustomTooltip formatter={tooltipFormatter} />} />
        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: 20 }}
            onClick={(e) => handleMetricToggle(e.dataKey)}
          />
        )}
        
        <Bar 
          dataKey={conversionKey} 
          name="전환율"
          onClick={handleSegmentClick}
        >
          <LabelList 
            dataKey={conversionKey} 
            position="top" 
            formatter={(value) => `${value}%`}
            style={{ fontSize: 11 }}
          />
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={colorScale[index]}
              opacity={activeSegment === null || activeSegment === entry[segmentKey] ? 1 : 0.5}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  // 레이더 차트 렌더링
  const renderRadarChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey={segmentKey} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
        <Radar
          name="전환율"
          dataKey={conversionKey}
          stroke="#4f46e5"
          fill="#4f46e5"
          fillOpacity={0.6}
          activeDot={{ r: 8, onClick: handleSegmentClick }}
        />
        <Tooltip content={<CustomTooltip formatter={tooltipFormatter} />} />
        {showLegend && <Legend />}
      </RadarChart>
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
                chartType === CHART_TYPES.HORIZONTAL_BAR
                  ? 'bg-indigo-100 text-indigo-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              onClick={() => handleChartTypeChange(CHART_TYPES.HORIZONTAL_BAR)}
            >
              가로 바
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
              레이더
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        {chartType === CHART_TYPES.BAR && renderBarChart()}
        {chartType === CHART_TYPES.HORIZONTAL_BAR && renderHorizontalBarChart()}
        {chartType === CHART_TYPES.RADAR && renderRadarChart()}
      </div>

      {/* 세그먼트 상세 정보 */}
      {activeSegment && (
        <div className="px-4 pb-4 mt-2">
          <div className="p-3 border border-indigo-100 rounded-md bg-indigo-50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-indigo-800">
                <Filter className="inline w-4 h-4 mr-1" />
                {activeSegment} 세그먼트 상세
              </h4>
              <button
                type="button"
                className="text-xs text-indigo-600 hover:text-indigo-800"
                onClick={() => setActiveSegment(null)}
              >
                닫기
              </button>
            </div>
            
            <div>
              {data.find(d => d[segmentKey] === activeSegment) && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between p-1">
                    <span className="text-gray-600">전환율:</span>
                    <span className="font-medium">
                      {data.find(d => d[segmentKey] === activeSegment)[conversionKey]}%
                    </span>
                  </div>
                  
                  {Object.entries(data.find(d => d[segmentKey] === activeSegment)).map(([key, value]) => {
                    // segmentKey와 conversionKey를 제외한 추가 속성 표시
                    if (key !== segmentKey && key !== conversionKey) {
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
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

SegmentConversionChart.propTypes = {
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
  onSegmentClick: PropTypes.func,
  segmentKey: PropTypes.string,
  conversionKey: PropTypes.string,
};

SegmentConversionChart.defaultProps = {
  chartType: CHART_TYPES.BAR,
  title: '세그먼트별 전환률',
  description: '사용자 세그먼트별 전환률 비교',
  loading: false,
  onChartTypeChange: null,
  showLegend: true,
  height: 400,
  tooltipFormatter: null,
  className: '',
  onDataPointClick: null,
  onSegmentClick: null,
  segmentKey: 'segment',
  conversionKey: 'conversionRate',
};

// 차트 유형 상수 내보내기
SegmentConversionChart.CHART_TYPES = CHART_TYPES;

export default SegmentConversionChart;
