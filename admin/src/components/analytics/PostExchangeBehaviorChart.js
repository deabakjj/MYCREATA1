/**
 * 교환 후 행동 패턴 차트 컴포넌트
 * 토큰 교환 이후 사용자 행동 패턴을 시각화합니다.
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
  PieChart,
  Pie,
  Cell,
  Sector,
  ComposedChart,
  Area,
  Sankey,
  Scatter,
  ScatterChart,
  ZAxis,
} from 'recharts';
import { Info, Activity } from 'react-feather';

// 차트 유형 정의
const CHART_TYPES = {
  LINE: 'line',
  BAR: 'bar',
  PIE: 'pie',
  SCATTER: 'scatter',
};

// 교환 유형 정의
const EXCHANGE_TYPES = {
  CTA_TO_NEST: 'cta_to_nest',
  NEST_TO_CTA: 'nest_to_cta',
  BOTH: 'both',
};

// 행동 유형별 색상
const BEHAVIOR_COLORS = {
  'nft_purchase': '#4f46e5', // 인디고 (NFT 구매)
  'social_interaction': '#0ea5e9', // 스카이 블루 (소셜 상호작용)
  'mission_completion': '#10b981', // 에메랄드 (미션 완료)
  'content_creation': '#f59e0b', // 앰버 (콘텐츠 생성)
  'additional_exchange': '#8b5cf6', // 바이올렛 (추가 교환)
  'dao_participation': '#f97316', // 오렌지 (DAO 참여)
  'profile_update': '#06b6d4', // 시안 (프로필 업데이트)
  'no_activity': '#94a3b8', // 슬레이트 (활동 없음)
  'platform_exit': '#ef4444', // 빨강 (플랫폼 이탈)
};

// 행동 유형 레이블
const BEHAVIOR_LABELS = {
  'nft_purchase': 'NFT 구매',
  'social_interaction': '소셜 상호작용',
  'mission_completion': '미션 완료',
  'content_creation': '콘텐츠 생성',
  'additional_exchange': '추가 교환',
  'dao_participation': 'DAO 참여',
  'profile_update': '프로필 업데이트',
  'no_activity': '활동 없음',
  'platform_exit': '플랫폼 이탈',
};

// 시간 단위 정의
const TIME_UNITS = {
  HOUR: 'hour',
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
};

// 커스텀 툴팁 컴포넌트
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-white rounded shadow-md border border-gray-200">
        <p className="mb-1 text-sm font-medium text-gray-600">
          {typeof label === 'string' && BEHAVIOR_LABELS[label] 
            ? BEHAVIOR_LABELS[label] 
            : label}
        </p>
        {payload.map((entry, index) => {
          // 적절한 단위와 함께 값 포맷팅
          const formattedValue = formatter 
            ? formatter(entry.name, entry.value, entry.payload) 
            : `${entry.value.toLocaleString()} ${entry.unit || ''}`;
          
          const percentage = entry.payload?.percentage 
            ? ` (${entry.payload.percentage.toFixed(1)}%)` 
            : '';
          
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
                {formattedValue}{percentage}
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

  return (
    <g>
      <text x={cx} y={cy} dy={-20} textAnchor="middle" fill="#333" className="text-sm">
        {BEHAVIOR_LABELS[payload.behaviorType] || payload.behaviorType}
      </text>
      <text x={cx} y={cy} textAnchor="middle" fill="#333" className="text-xl font-semibold">
        {value.toLocaleString()}
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

const PostExchangeBehaviorChart = ({
  data,
  timeData,
  chartType,
  title,
  description,
  loading,
  onChartTypeChange,
  showLegend,
  height,
  tooltipFormatter,
  className,
  onBehaviorClick,
  exchangeType,
  onExchangeTypeChange,
  timeUnit,
  onTimeUnitChange,
  behaviorTypeKey,
  userCountKey,
  percentageKey,
  timeKey,
}) => {
  const [activeBehavior, setActiveBehavior] = useState(null);
  
  // 행동 유형 클릭 핸들러
  const handleBehaviorClick = (entry) => {
    const behavior = entry[behaviorTypeKey];
    const newActiveBehavior = activeBehavior === behavior ? null : behavior;
    setActiveBehavior(newActiveBehavior);
    
    if (onBehaviorClick) {
      onBehaviorClick(entry, newActiveBehavior);
    }
  };

  // 차트 유형 변경 핸들러
  const handleChartTypeChange = (type) => {
    if (onChartTypeChange) {
      onChartTypeChange(type);
    }
  };

  // 교환 유형 변경 핸들러
  const handleExchangeTypeChange = (type) => {
    if (onExchangeTypeChange) {
      onExchangeTypeChange(type);
    }
  };

  // 시간 단위 변경 핸들러
  const handleTimeUnitChange = (unit) => {
    if (onTimeUnitChange) {
      onTimeUnitChange(unit);
    }
  };

  // 시간 단위에 따른 레이블 포맷
  const formatTimeLabel = (label) => {
    switch (timeUnit) {
      case TIME_UNITS.HOUR:
        return `${label}시간 후`;
      case TIME_UNITS.DAY:
        return `${label}일 후`;
      case TIME_UNITS.WEEK:
        return `${label}주 후`;
      case TIME_UNITS.MONTH:
        return `${label}개월 후`;
      default:
        return label;
    }
  };

  // 선 차트 렌더링 (시간에 따른 행동 패턴)
  const renderLineChart = () => {
    if (!timeData || timeData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <Info className="w-8 h-8 text-gray-400 mr-2" />
          <p className="text-gray-600">시간 기반 데이터가 없습니다.</p>
        </div>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={timeData}
          margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey={timeKey} 
            tick={{ fontSize: 12 }}
            tickFormatter={formatTimeLabel}
            label={{ 
              value: '교환 후 경과 시간', 
              position: 'insideBottom', 
              offset: -10,
              fontSize: 12 
            }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            domain={[0, 'auto']}
            label={{ 
              value: '사용자 수', 
              angle: -90, 
              position: 'insideLeft',
              fontSize: 12,
              dx: -15
            }}
          />
          <Tooltip 
            content={
              <CustomTooltip 
                formatter={(name, value) => `${value.toLocaleString()} 명`} 
              />
            } 
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: 10 }}
              onClick={(e) => {
                const behavior = Object.keys(BEHAVIOR_LABELS).find(
                  key => BEHAVIOR_LABELS[key] === e.value
                );
                if (behavior) {
                  const newActiveBehavior = activeBehavior === behavior ? null : behavior;
                  setActiveBehavior(newActiveBehavior);
                }
              }}
            />
          )}
          
          {Object.keys(BEHAVIOR_LABELS).map((behavior) => (
            <Line
              key={behavior}
              type="monotone"
              dataKey={behavior}
              name={BEHAVIOR_LABELS[behavior]}
              stroke={BEHAVIOR_COLORS[behavior] || '#8884d8'}
              activeDot={{ 
                r: 8, 
                onClick: (e) => {
                  const newActiveBehavior = activeBehavior === behavior ? null : behavior;
                  setActiveBehavior(newActiveBehavior);
                  if (onBehaviorClick) {
                    onBehaviorClick({ behaviorType: behavior }, newActiveBehavior);
                  }
                } 
              }}
              strokeWidth={activeBehavior === behavior ? 3 : 1}
              opacity={activeBehavior === null || activeBehavior === behavior ? 1 : 0.3}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  // 바 차트 렌더링
  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey={behaviorTypeKey} 
          tick={{ fontSize: 12, angle: -45, textAnchor: 'end' }}
          height={80}
          tickFormatter={(value) => BEHAVIOR_LABELS[value] || value}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          label={{ 
            value: '사용자 수', 
            angle: -90, 
            position: 'insideLeft',
            fontSize: 12,
            dx: -15
          }}
        />
        <Tooltip 
          content={
            <CustomTooltip 
              formatter={(name, value) => `${value.toLocaleString()} 명`} 
            />
          } 
        />
        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: 10 }}
          />
        )}
        
        <Bar 
          dataKey={userCountKey} 
          name="사용자 수"
          onClick={handleBehaviorClick}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={BEHAVIOR_COLORS[entry[behaviorTypeKey]] || '#8884d8'}
              opacity={activeBehavior === null || activeBehavior === entry[behaviorTypeKey] ? 1 : 0.5}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  // 파이 차트 렌더링
  const renderPieChart = () => {
    // 활성 행동 인덱스 찾기
    const activeIndex = data.findIndex(item => item[behaviorTypeKey] === activeBehavior);
    
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            activeIndex={activeIndex !== -1 ? activeIndex : undefined}
            activeShape={renderActiveShape}
            data={data}
            dataKey={userCountKey}
            nameKey={behaviorTypeKey}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={120}
            fill="#8884d8"
            onClick={handleBehaviorClick}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={BEHAVIOR_COLORS[entry[behaviorTypeKey]] || '#8884d8'}
              />
            ))}
          </Pie>
          <Tooltip 
            content={
              <CustomTooltip 
                formatter={(name, value) => `${value.toLocaleString()} 명`} 
              />
            } 
          />
          {showLegend && (
            <Legend 
              formatter={(value) => BEHAVIOR_LABELS[value] || value}
              onClick={(e) => {
                const item = data.find(d => d[behaviorTypeKey] === e.value);
                if (item) {
                  handleBehaviorClick(item);
                }
              }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // 산점도 차트 렌더링 (교환 이후 경과 시간과 행동 발생 비율)
  const renderScatterChart = () => {
    if (!timeData || timeData.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <Info className="w-8 h-8 text-gray-400 mr-2" />
          <p className="text-gray-600">시간 기반 데이터가 없습니다.</p>
        </div>
      );
    }

    // 데이터 변환 (산점도 형식으로)
    const scatterData = [];
    timeData.forEach(timePoint => {
      Object.keys(BEHAVIOR_LABELS).forEach(behavior => {
        if (timePoint[behavior] !== undefined) {
          scatterData.push({
            time: timePoint[timeKey],
            count: timePoint[behavior],
            behaviorType: behavior,
          });
        }
      });
    });

    return (
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart
          margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            type="number" 
            dataKey="time" 
            name="경과 시간" 
            tick={{ fontSize: 12 }}
            tickFormatter={formatTimeLabel}
            label={{ 
              value: '교환 후 경과 시간', 
              position: 'insideBottom', 
              offset: -5,
              fontSize: 12 
            }}
          />
          <YAxis 
            type="number" 
            dataKey="count" 
            name="사용자 수" 
            tick={{ fontSize: 12 }}
            label={{ 
              value: '사용자 수', 
              angle: -90, 
              position: 'insideLeft',
              fontSize: 12,
              dx: -15 
            }}
          />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }} 
            content={
              <CustomTooltip 
                formatter={(name, value, payload) => {
                  if (name === '경과 시간') {
                    return formatTimeLabel(value);
                  }
                  if (name === '사용자 수') {
                    return `${value.toLocaleString()} 명`;
                  }
                  if (name === '행동 유형') {
                    return BEHAVIOR_LABELS[value] || value;
                  }
                  return `${value.toLocaleString()}`;
                }} 
              />
            }
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: 10 }}
              payload={Object.entries(BEHAVIOR_LABELS).map(([key, value]) => ({
                value,
                type: 'square',
                id: key,
                color: BEHAVIOR_COLORS[key] || '#8884d8',
              }))}
              onClick={(e) => {
                const behavior = Object.keys(BEHAVIOR_LABELS).find(
                  key => BEHAVIOR_LABELS[key] === e.value
                );
                if (behavior) {
                  const newActiveBehavior = activeBehavior === behavior ? null : behavior;
                  setActiveBehavior(newActiveBehavior);
                  if (onBehaviorClick) {
                    onBehaviorClick({ behaviorType: behavior }, newActiveBehavior);
                  }
                }
              }}
            />
          )}
          
          <Scatter 
            name="행동 패턴" 
            data={scatterData} 
            fill="#8884d8"
          >
            {scatterData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={BEHAVIOR_COLORS[entry.behaviorType] || '#8884d8'}
                opacity={activeBehavior === null || activeBehavior === entry.behaviorType ? 1 : 0.3}
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
  if ((!data || data.length === 0) && (!timeData || timeData.length === 0)) {
    return (
      <div className={`flex items-center justify-center bg-white rounded-lg shadow ${className}`} style={{ height }}>
        <div className="text-center">
          <Info className="w-8 h-8 mx-auto text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">표시할 데이터가 없습니다.</p>
        </div>
      </div>
    );
  }

  // 선택된 행동 유형에 대한 상세 정보
  const selectedBehavior = data && data.find(item => item[behaviorTypeKey] === activeBehavior);

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-800">{title}</h3>
            {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
          </div>
          
          <div className="flex items-center">
            <div className="mr-4 flex items-center">
              <label className="text-xs text-gray-600 mr-2">교환 유형:</label>
              <select
                className="py-1 px-2 text-xs border border-gray-300 rounded"
                value={exchangeType}
                onChange={(e) => handleExchangeTypeChange(e.target.value)}
              >
                <option value={EXCHANGE_TYPES.BOTH}>양방향</option>
                <option value={EXCHANGE_TYPES.CTA_TO_NEST}>CTA→NEST</option>
                <option value={EXCHANGE_TYPES.NEST_TO_CTA}>NEST→CTA</option>
              </select>
            </div>
            
            {(chartType === CHART_TYPES.LINE || chartType === CHART_TYPES.SCATTER) && (
              <div className="mr-4 flex items-center">
                <label className="text-xs text-gray-600 mr-2">시간 단위:</label>
                <select
                  className="py-1 px-2 text-xs border border-gray-300 rounded"
                  value={timeUnit}
                  onChange={(e) => handleTimeUnitChange(e.target.value)}
                >
                  <option value={TIME_UNITS.HOUR}>시간</option>
                  <option value={TIME_UNITS.DAY}>일</option>
                  <option value={TIME_UNITS.WEEK}>주</option>
                  <option value={TIME_UNITS.MONTH}>월</option>
                </select>
              </div>
            )}
            
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
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        {chartType === CHART_TYPES.LINE && renderLineChart()}
        {chartType === CHART_TYPES.BAR && renderBarChart()}
        {chartType === CHART_TYPES.PIE && renderPieChart()}
        {chartType === CHART_TYPES.SCATTER && renderScatterChart()}
      </div>
      
      {/* 선택된 행동 유형 상세 정보 */}
      {selectedBehavior && (
        <div className="px-4 pb-4">
          <div className="p-3 border border-indigo-100 rounded-md bg-indigo-50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-indigo-800">
                <Activity className="inline w-4 h-4 mr-1" />
                {BEHAVIOR_LABELS[selectedBehavior[behaviorTypeKey]] || selectedBehavior[behaviorTypeKey]} 행동 상세
              </h4>
              <button
                type="button"
                className="text-xs text-indigo-600 hover:text-indigo-800"
                onClick={() => setActiveBehavior(null)}
              >
                닫기
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <div className="flex justify-between p-1">
                <span className="text-gray-600">사용자 수:</span>
                <span className="font-medium">{selectedBehavior[userCountKey].toLocaleString()}명</span>
              </div>
              <div className="flex justify-between p-1">
                <span className="text-gray-600">비율:</span>
                <span className="font-medium">{selectedBehavior[percentageKey].toFixed(1)}%</span>
              </div>
              
              {/* 추가 정보가 있는 경우 표시 */}
              {Object.entries(selectedBehavior).map(([key, value]) => {
                if (![behaviorTypeKey, userCountKey, percentageKey].includes(key)) {
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
      
      {/* 행동 유형 설명 */}
      <div className="px-4 pb-4">
        <div className="border-t pt-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">행동 유형 설명</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
            {Object.entries(BEHAVIOR_LABELS).map(([key, label]) => (
              <div
                key={`legend-${key}`}
                className={`flex items-center p-2 border rounded-md cursor-pointer ${
                  activeBehavior === key ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200'
                }`}
                onClick={() => {
                  const behavior = data && data.find(item => item[behaviorTypeKey] === key);
                  if (behavior) handleBehaviorClick(behavior);
                }}
              >
                <span
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: BEHAVIOR_COLORS[key] }}
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

PostExchangeBehaviorChart.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
  timeData: PropTypes.arrayOf(PropTypes.object),
  chartType: PropTypes.oneOf(Object.values(CHART_TYPES)),
  title: PropTypes.string,
  description: PropTypes.string,
  loading: PropTypes.bool,
  onChartTypeChange: PropTypes.func,
  showLegend: PropTypes.bool,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  tooltipFormatter: PropTypes.func,
  className: PropTypes.string,
  onBehaviorClick: PropTypes.func,
  exchangeType: PropTypes.oneOf(Object.values(EXCHANGE_TYPES)),
  onExchangeTypeChange: PropTypes.func,
  timeUnit: PropTypes.oneOf(Object.values(TIME_UNITS)),
  onTimeUnitChange: PropTypes.func,
  behaviorTypeKey: PropTypes.string,
  userCountKey: PropTypes.string,
  percentageKey: PropTypes.string,
  timeKey: PropTypes.string,
};

PostExchangeBehaviorChart.defaultProps = {
  data: [],
  timeData: [],
  chartType: CHART_TYPES.BAR,
  title: '교환 후 행동 패턴',
  description: '토큰 교환 이후 사용자 행동 패턴 분석',
  loading: false,
  onChartTypeChange: null,
  showLegend: true,
  height: 400,
  tooltipFormatter: null,
  className: '',
  onBehaviorClick: null,
  exchangeType: EXCHANGE_TYPES.BOTH,
  onExchangeTypeChange: null,
  timeUnit: TIME_UNITS.DAY,
  onTimeUnitChange: null,
  behaviorTypeKey: 'behaviorType',
  userCountKey: 'userCount',
  percentageKey: 'percentage',
  timeKey: 'time',
};

// 차트 유형, 교환 유형, 시간 단위, 행동 레이블 상수 내보내기
PostExchangeBehaviorChart.CHART_TYPES = CHART_TYPES;
PostExchangeBehaviorChart.EXCHANGE_TYPES = EXCHANGE_TYPES;
PostExchangeBehaviorChart.TIME_UNITS = TIME_UNITS;
PostExchangeBehaviorChart.BEHAVIOR_LABELS = BEHAVIOR_LABELS;

export default PostExchangeBehaviorChart;
