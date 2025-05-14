/**
 * 세그먼트별 XP 차트 컴포넌트
 * 사용자 세그먼트별 XP 현황을 시각화합니다.
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
  PieChart,
  Pie,
  Cell,
  Sector,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine,
  Label,
  LabelList,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { Info, Users } from 'react-feather';

// 차트 유형 정의
const CHART_TYPES = {
  BAR: 'bar',
  PIE: 'pie',
  SCATTER: 'scatter',
  RADAR: 'radar',
};

// XP 측정 방식 정의
const XP_METRICS = {
  AVERAGE_XP: 'averageXp',
  TOTAL_XP: 'totalXp',
  MEDIAN_XP: 'medianXp',
  MAX_XP: 'maxXp',
};

// 세그먼트 색상
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

// XP 측정 방식 레이블
const XP_METRIC_LABELS = {
  [XP_METRICS.AVERAGE_XP]: '평균 XP',
  [XP_METRICS.TOTAL_XP]: '총 XP',
  [XP_METRICS.MEDIAN_XP]: '중앙값 XP',
  [XP_METRICS.MAX_XP]: '최대 XP',
};

// 커스텀 툴팁 컴포넌트
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    const segment = payload[0]?.payload?.segment;
    const segmentLabel = SEGMENT_LABELS[segment] || segment;
    
    return (
      <div className="p-3 bg-white rounded shadow-md border border-gray-200">
        <p className="mb-1 text-sm font-medium text-gray-600">{segmentLabel}</p>
        {payload.map((entry, index) => {
          // XP 값 포맷팅
          const name = entry.name === '평균 XP' || entry.name === '총 XP' || entry.name === '중앙값 XP' || entry.name === '최대 XP'
            ? entry.name
            : entry.name === '사용자 수'
              ? entry.name
              : entry.name === '최소 XP'
                ? entry.name
                : entry.name;
                
          const formattedValue = formatter 
            ? formatter(name, entry.value, entry.payload) 
            : name.includes('XP')
              ? `${entry.value.toLocaleString()} XP`
              : name === '사용자 수'
                ? `${entry.value.toLocaleString()}명`
                : `${entry.value.toLocaleString()}`;
          
          return (
            <div
              key={`item-${index}`}
              className="flex items-center mb-1 last:mb-0"
            >
              <span
                className="inline-block w-3 h-3 mr-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="mr-2 text-xs text-gray-600">{name}:</span>
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

// 커스텀 파이 차트 활성 형태
const renderActiveShape = (props) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    value,
    percent,
  } = props;
  
  const segmentLabel = SEGMENT_LABELS[payload.segment] || payload.segment;
  
  return (
    <g>
      <text x={cx} y={cy} dy={-20} textAnchor="middle" fill="#333" className="text-sm">
        {segmentLabel}
      </text>
      <text x={cx} y={cy} textAnchor="middle" fill="#333" className="text-xl font-semibold">
        {value.toLocaleString()} XP
      </text>
      <text x={cx} y={cy} dy={20} textAnchor="middle" fill="#666" className="text-sm">
        ({(percent * 100).toFixed(1)}%)
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={innerRadius - 8}
        outerRadius={innerRadius - 4}
        fill={fill}
      />
    </g>
  );
};

const XpByUserSegmentChart = ({
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
  xpMetric,
  onXpMetricChange,
  segmentKey,
  averageXpKey,
  totalXpKey,
  medianXpKey,
  maxXpKey,
  userCountKey,
  minXpKey,
  // XP 기준선 (선택적)
  thresholds,
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

  // XP 측정 방식 변경 핸들러
  const handleXpMetricChange = (metric) => {
    if (onXpMetricChange) {
      onXpMetricChange(metric);
    }
  };

  // XP 측정 방식에 따른 데이터 키와 레이블 가져오기
  const getXpMetricInfo = () => {
    switch (xpMetric) {
      case XP_METRICS.AVERAGE_XP:
        return { key: averageXpKey, label: '평균 XP' };
      case XP_METRICS.TOTAL_XP:
        return { key: totalXpKey, label: '총 XP' };
      case XP_METRICS.MEDIAN_XP:
        return { key: medianXpKey, label: '중앙값 XP' };
      case XP_METRICS.MAX_XP:
        return { key: maxXpKey, label: '최대 XP' };
      default:
        return { key: averageXpKey, label: '평균 XP' };
    }
  };

  // 데이터 정렬
  const sortData = () => {
    const { key } = getXpMetricInfo();
    return [...data].sort((a, b) => b[key] - a[key]);
  };

  const sortedData = sortData();

  // 막대 차트 렌더링
  const renderBarChart = () => {
    const { key, label } = getXpMetricInfo();
    
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={sortedData}
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
            content={<CustomTooltip formatter={tooltipFormatter} />}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: 20 }}
            />
          )}
          
          <Bar 
            dataKey={key} 
            name={label}
            fill="#4f46e5"
            onClick={handleSegmentClick}
          >
            <LabelList 
              dataKey={key} 
              position="right" 
              formatter={(value) => `${value.toLocaleString()} XP`}
              style={{ fontSize: 11 }}
            />
            {sortedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={SEGMENT_COLORS[entry[segmentKey]] || '#8884d8'}
                opacity={activeSegment === null || activeSegment === entry[segmentKey] ? 1 : 0.5}
              />
            ))}
          </Bar>
          
          {/* XP 기준선 표시 */}
          {thresholds && thresholds.map((threshold, index) => (
            <ReferenceLine
              key={`threshold-${index}`}
              x={threshold.value}
              stroke="#ef4444"
              strokeDasharray="3 3"
            >
              <Label
                value={threshold.label}
                position="top"
                fill="#ef4444"
                fontSize={10}
              />
            </ReferenceLine>
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // 파이 차트 렌더링
  const renderPieChart = () => {
    const { key, label } = getXpMetricInfo();
    
    // 파이 차트를 위한 데이터 가공 (비율 계산)
    const sum = sortedData.reduce((acc, curr) => acc + curr[key], 0);
    const pieData = sortedData.map(item => ({
      ...item,
      percentage: (item[key] / sum) * 100,
    }));
    
    // 활성 세그먼트 인덱스 찾기
    const activeIndex = pieData.findIndex(item => item[segmentKey] === activeSegment);
    
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            activeIndex={activeIndex !== -1 ? activeIndex : undefined}
            activeShape={renderActiveShape}
            data={pieData}
            dataKey={key}
            nameKey={segmentKey}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={120}
            fill="#8884d8"
            onClick={handleSegmentClick}
            // 파이 차트 라벨 커스터마이징
            label={({ segment, percentage }) => {
              const segmentName = SEGMENT_LABELS[segment] || segment;
              return `${segmentName} (${percentage.toFixed(1)}%)`;
            }}
            labelLine={false}
          >
            {pieData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={SEGMENT_COLORS[entry[segmentKey]] || '#8884d8'}
              />
            ))}
          </Pie>
          <Tooltip 
            content={<CustomTooltip formatter={tooltipFormatter} />}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // 산점도 차트 렌더링 (사용자 수 vs XP)
  const renderScatterChart = () => {
    const { key, label } = getXpMetricInfo();
    
    return (
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart
          margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            type="number" 
            dataKey={userCountKey} 
            name="사용자 수" 
            tick={{ fontSize: 12 }}
            label={{ 
              value: '사용자 수', 
              position: 'insideBottomRight', 
              offset: -5,
              fontSize: 12 
            }}
          />
          <YAxis 
            type="number" 
            dataKey={key} 
            name={label} 
            tick={{ fontSize: 12 }}
            label={{ 
              value: label, 
              angle: -90, 
              position: 'insideLeft',
              fontSize: 12,
              dx: -5
            }}
          />
          <ZAxis 
            type="number" 
            range={[100, 1000]} 
            name="거품 크기"
            dataKey={(data) => data[maxXpKey] - (data[minXpKey] || 0)}
          />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }} 
            content={<CustomTooltip formatter={tooltipFormatter} />}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: 20 }}
            />
          )}
          
          <Scatter 
            name={label} 
            data={sortedData} 
            onClick={handleSegmentClick}
            fillOpacity={0.7}
          >
            {sortedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={SEGMENT_COLORS[entry[segmentKey]] || '#8884d8'}
                opacity={activeSegment === null || activeSegment === entry[segmentKey] ? 1 : 0.5}
              />
            ))}
          </Scatter>
          
          {/* XP 기준선 표시 */}
          {thresholds && thresholds.map((threshold, index) => (
            <ReferenceLine
              key={`threshold-${index}`}
              y={threshold.value}
              stroke="#ef4444"
              strokeDasharray="3 3"
            >
              <Label
                value={threshold.label}
                position="insideTopLeft"
                fill="#ef4444"
                fontSize={10}
              />
            </ReferenceLine>
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    );
  };

  // 레이더 차트 렌더링
  const renderRadarChart = () => {
    const { key, label } = getXpMetricInfo();
    
    return (
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={sortedData}>
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
            content={<CustomTooltip formatter={tooltipFormatter} />}
          />
          {showLegend && <Legend />}
        </RadarChart>
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
  const selectedSegment = sortedData.find(item => item[segmentKey] === activeSegment);

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-800">{title}</h3>
            {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
          </div>
          
          <div className="flex items-center">
            {/* XP 측정 방식 선택 */}
            <div className="mr-4 flex items-center">
              <label className="text-xs text-gray-600 mr-2">XP 측정:</label>
              <select
                className="py-1 px-2 text-xs border border-gray-300 rounded"
                value={xpMetric}
                onChange={(e) => handleXpMetricChange(e.target.value)}
              >
                <option value={XP_METRICS.AVERAGE_XP}>평균 XP</option>
                <option value={XP_METRICS.TOTAL_XP}>총 XP</option>
                <option value={XP_METRICS.MEDIAN_XP}>중앙값 XP</option>
                <option value={XP_METRICS.MAX_XP}>최대 XP</option>
              </select>
            </div>
            
            {/* 차트 유형 선택 */}
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
                  chartType === CHART_TYPES.PIE
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => handleChartTypeChange(CHART_TYPES.PIE)}
              >
                파이 차트
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
      </div>
      
      <div className="p-4">
        {chartType === CHART_TYPES.BAR && renderBarChart()}
        {chartType === CHART_TYPES.PIE && renderPieChart()}
        {chartType === CHART_TYPES.SCATTER && renderScatterChart()}
        {chartType === CHART_TYPES.RADAR && renderRadarChart()}
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
                <span className="text-gray-600">평균 XP:</span>
                <span className="font-medium">{selectedSegment[averageXpKey]?.toLocaleString() || '데이터 없음'} XP</span>
              </div>
              
              <div className="flex justify-between p-1">
                <span className="text-gray-600">총 XP:</span>
                <span className="font-medium">{selectedSegment[totalXpKey]?.toLocaleString() || '데이터 없음'} XP</span>
              </div>
              
              <div className="flex justify-between p-1">
                <span className="text-gray-600">중앙값 XP:</span>
                <span className="font-medium">{selectedSegment[medianXpKey]?.toLocaleString() || '데이터 없음'} XP</span>
              </div>
              
              <div className="flex justify-between p-1">
                <span className="text-gray-600">최대 XP:</span>
                <span className="font-medium">{selectedSegment[maxXpKey]?.toLocaleString() || '데이터 없음'} XP</span>
              </div>
              
              <div className="flex justify-between p-1">
                <span className="text-gray-600">사용자 수:</span>
                <span className="font-medium">{selectedSegment[userCountKey]?.toLocaleString() || '데이터 없음'}명</span>
              </div>
              
              {minXpKey && selectedSegment[minXpKey] !== undefined && (
                <div className="flex justify-between p-1">
                  <span className="text-gray-600">최소 XP:</span>
                  <span className="font-medium">{selectedSegment[minXpKey].toLocaleString()} XP</span>
                </div>
              )}
              
              {/* 추가 정보가 있는 경우 표시 */}
              {Object.entries(selectedSegment).map(([key, value]) => {
                if (![segmentKey, averageXpKey, totalXpKey, medianXpKey, maxXpKey, userCountKey, minXpKey].includes(key)) {
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
      
      {/* 세그먼트 설명 */}
      <div className="px-4 pb-4">
        <div className="border-t pt-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">사용자 세그먼트별 XP</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
            {sortedData.map((item) => {
              const { key } = getXpMetricInfo();
              
              return (
                <div
                  key={`segment-${item[segmentKey]}`}
                  className={`flex items-center justify-between p-2 border rounded-md ${
                    activeSegment === item[segmentKey] ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200'
                  }`}
                  onClick={() => handleSegmentClick(item)}
                >
                  <div className="flex items-center">
                    <span
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: SEGMENT_COLORS[item[segmentKey]] }}
                    ></span>
                    <span>{SEGMENT_LABELS[item[segmentKey]] || item[segmentKey]}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{item[key].toLocaleString()} XP</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

XpByUserSegmentChart.propTypes = {
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
  xpMetric: PropTypes.oneOf(Object.values(XP_METRICS)),
  onXpMetricChange: PropTypes.func,
  segmentKey: PropTypes.string,
  averageXpKey: PropTypes.string,
  totalXpKey: PropTypes.string,
  medianXpKey: PropTypes.string,
  maxXpKey: PropTypes.string,
  userCountKey: PropTypes.string,
  minXpKey: PropTypes.string,
  thresholds: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.number.isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
};

XpByUserSegmentChart.defaultProps = {
  chartType: CHART_TYPES.BAR,
  title: '세그먼트별 XP',
  description: '사용자 세그먼트별 XP 현황 분석',
  loading: false,
  onChartTypeChange: null,
  showLegend: true,
  height: 400,
  tooltipFormatter: null,
  className: '',
  onSegmentClick: null,
  xpMetric: XP_METRICS.AVERAGE_XP,
  onXpMetricChange: null,
  segmentKey: 'segment',
  averageXpKey: 'averageXp',
  totalXpKey: 'totalXp',
  medianXpKey: 'medianXp',
  maxXpKey: 'maxXp',
  userCountKey: 'userCount',
  minXpKey: 'minXp',
  thresholds: null,
};

// 차트 유형, XP 측정 방식, 세그먼트 레이블 상수 내보내기
XpByUserSegmentChart.CHART_TYPES = CHART_TYPES;
XpByUserSegmentChart.XP_METRICS = XP_METRICS;
XpByUserSegmentChart.SEGMENT_LABELS = SEGMENT_LABELS;

export default XpByUserSegmentChart;
