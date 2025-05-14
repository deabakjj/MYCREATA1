/**
 * 활동 효율성 차트 컴포넌트
 * 각 활동 유형별 XP 획득 효율성을 시각화합니다.
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
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
  ReferenceLine,
  Label,
  LabelList,
  PieChart,
  Pie,
  Sector,
} from 'recharts';
import { Info, Activity } from 'react-feather';

// 차트 유형 정의
const CHART_TYPES = {
  BAR: 'bar',
  SCATTER: 'scatter',
  PIE: 'pie',
};

// 효율성 측정 기준 정의
const EFFICIENCY_METRICS = {
  XP_PER_ACTION: 'xpPerAction',
  XP_PER_MINUTE: 'xpPerMinute',
  TOTAL_XP: 'totalXp',
};

// 활동 유형별 색상
const ACTIVITY_COLORS = {
  'login': '#4f46e5', // 인디고 (로그인)
  'mission_complete': '#0ea5e9', // 스카이 블루 (미션 완료)
  'content_creation': '#10b981', // 에메랄드 (콘텐츠 생성)
  'comment': '#f59e0b', // 앰버 (댓글)
  'social_interaction': '#8b5cf6', // 바이올렛 (소셜 상호작용)
  'token_exchange': '#f97316', // 오렌지 (토큰 교환)
  'nft_mint': '#06b6d4', // 시안 (NFT 발행)
  'profile_update': '#a3e635', // 라임 (프로필 업데이트)
  'invitation': '#ec4899', // 핑크 (초대)
};

// 활동 유형 레이블
const ACTIVITY_LABELS = {
  'login': '로그인',
  'mission_complete': '미션 완료',
  'content_creation': '콘텐츠 생성',
  'comment': '댓글',
  'social_interaction': '소셜 상호작용',
  'token_exchange': '토큰 교환',
  'nft_mint': 'NFT 발행',
  'profile_update': '프로필 업데이트',
  'invitation': '초대',
};

// 효율성 측정 기준 레이블
const EFFICIENCY_LABELS = {
  [EFFICIENCY_METRICS.XP_PER_ACTION]: '활동당 XP',
  [EFFICIENCY_METRICS.XP_PER_MINUTE]: '분당 XP',
  [EFFICIENCY_METRICS.TOTAL_XP]: '총 XP',
};

// 커스텀 툴팁 컴포넌트
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    const activity = payload[0]?.payload?.activity;
    const activityLabel = ACTIVITY_LABELS[activity] || activity;
    
    return (
      <div className="p-3 bg-white rounded shadow-md border border-gray-200">
        <p className="mb-1 text-sm font-medium text-gray-600">{activityLabel}</p>
        {payload.map((entry, index) => {
          // 효율성 측정값 포맷팅
          const name = entry.name === '활동당 XP' || entry.name === '분당 XP' || entry.name === '총 XP'
            ? entry.name
            : entry.name === '활동 횟수'
              ? entry.name
              : entry.name === '소요 시간'
                ? entry.name
                : entry.name;
                
          const formattedValue = formatter 
            ? formatter(name, entry.value, entry.payload) 
            : name === '활동당 XP' || name === '분당 XP' || name === '총 XP'
              ? `${entry.value.toLocaleString()} XP`
              : name === '활동 횟수'
                ? `${entry.value.toLocaleString()}회`
                : name === '소요 시간'
                  ? `${entry.value.toLocaleString()}분`
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
  
  const activityLabel = ACTIVITY_LABELS[payload.activity] || payload.activity;
  
  return (
    <g>
      <text x={cx} y={cy} dy={-20} textAnchor="middle" fill="#333" className="text-sm">
        {activityLabel}
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

const ActivityEfficiencyChart = ({
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
  onActivityClick,
  efficiencyMetric,
  onEfficiencyMetricChange,
  activityKey,
  xpPerActionKey,
  xpPerMinuteKey,
  totalXpKey,
  actionCountKey,
  timeSpentKey,
  // 효율성 기준선 (선택적)
  thresholds,
}) => {
  const [activeActivity, setActiveActivity] = useState(null);
  
  // 활동 클릭 핸들러
  const handleActivityClick = (entry) => {
    const activity = entry[activityKey];
    const newActiveActivity = activeActivity === activity ? null : activity;
    setActiveActivity(newActiveActivity);
    
    if (onActivityClick) {
      onActivityClick(entry, newActiveActivity);
    }
  };

  // 차트 유형 변경 핸들러
  const handleChartTypeChange = (type) => {
    if (onChartTypeChange) {
      onChartTypeChange(type);
    }
  };

  // 효율성 측정 기준 변경 핸들러
  const handleEfficiencyMetricChange = (metric) => {
    if (onEfficiencyMetricChange) {
      onEfficiencyMetricChange(metric);
    }
  };

  // 효율성 측정 기준에 따른 데이터 키와 레이블 가져오기
  const getEfficiencyInfo = () => {
    switch (efficiencyMetric) {
      case EFFICIENCY_METRICS.XP_PER_ACTION:
        return { key: xpPerActionKey, label: '활동당 XP', unit: 'XP' };
      case EFFICIENCY_METRICS.XP_PER_MINUTE:
        return { key: xpPerMinuteKey, label: '분당 XP', unit: 'XP' };
      case EFFICIENCY_METRICS.TOTAL_XP:
        return { key: totalXpKey, label: '총 XP', unit: 'XP' };
      default:
        return { key: xpPerActionKey, label: '활동당 XP', unit: 'XP' };
    }
  };

  // 데이터 정렬
  const sortData = () => {
    const { key } = getEfficiencyInfo();
    return [...data].sort((a, b) => b[key] - a[key]);
  };

  const sortedData = sortData();

  // 막대 차트 렌더링
  const renderBarChart = () => {
    const { key, label, unit } = getEfficiencyInfo();
    
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
            dataKey={activityKey} 
            type="category" 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => ACTIVITY_LABELS[value] || value}
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
            onClick={handleActivityClick}
          >
            <LabelList 
              dataKey={key} 
              position="right" 
              formatter={(value) => `${value.toLocaleString()} ${unit}`}
              style={{ fontSize: 11 }}
            />
            {sortedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={ACTIVITY_COLORS[entry[activityKey]] || '#8884d8'}
                opacity={activeActivity === null || activeActivity === entry[activityKey] ? 1 : 0.5}
              />
            ))}
          </Bar>
          
          {/* 효율성 기준선 표시 */}
          {thresholds && efficiencyMetric !== EFFICIENCY_METRICS.TOTAL_XP && thresholds.map((threshold, index) => (
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

  // 산점도 차트 렌더링 (활동 횟수 vs XP 효율)
  const renderScatterChart = () => {
    const { key, label } = getEfficiencyInfo();
    
    return (
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart
          margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            type="number" 
            dataKey={actionCountKey} 
            name="활동 횟수" 
            tick={{ fontSize: 12 }}
            label={{ 
              value: '활동 횟수', 
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
            dataKey={timeSpentKey} 
            range={[50, 500]} 
            name="소요 시간"
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
            name="활동 효율" 
            data={sortedData} 
            onClick={handleActivityClick}
            fillOpacity={0.7}
          >
            {sortedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={ACTIVITY_COLORS[entry[activityKey]] || '#8884d8'}
                opacity={activeActivity === null || activeActivity === entry[activityKey] ? 1 : 0.5}
              />
            ))}
          </Scatter>
          
          {/* 효율성 기준선 표시 */}
          {thresholds && efficiencyMetric !== EFFICIENCY_METRICS.TOTAL_XP && thresholds.map((threshold, index) => (
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

  // 파이 차트 렌더링
  const renderPieChart = () => {
    const { key, label } = getEfficiencyInfo();
    
    // 파이 차트를 위한 데이터 가공 (비율 계산)
    const sum = sortedData.reduce((acc, curr) => acc + curr[key], 0);
    const pieData = sortedData.map(item => ({
      ...item,
      percentage: (item[key] / sum) * 100,
    }));
    
    // 활성 활동 인덱스 찾기
    const activeIndex = pieData.findIndex(item => item[activityKey] === activeActivity);
    
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            activeIndex={activeIndex !== -1 ? activeIndex : undefined}
            activeShape={renderActiveShape}
            data={pieData}
            dataKey={key}
            nameKey={activityKey}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={120}
            fill="#8884d8"
            onClick={handleActivityClick}
            // 파이 차트 라벨 커스터마이징
            label={({ activity, percentage }) => {
              const activityName = ACTIVITY_LABELS[activity] || activity;
              return `${activityName} (${percentage.toFixed(1)}%)`;
            }}
            labelLine={false}
          >
            {pieData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={ACTIVITY_COLORS[entry[activityKey]] || '#8884d8'}
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

  // 선택된 활동에 대한 상세 정보
  const selectedActivity = sortedData.find(item => item[activityKey] === activeActivity);

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-800">{title}</h3>
            {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
          </div>
          
          <div className="flex items-center">
            {/* 효율성 측정 기준 선택 */}
            <div className="mr-4 flex items-center">
              <label className="text-xs text-gray-600 mr-2">효율성 기준:</label>
              <select
                className="py-1 px-2 text-xs border border-gray-300 rounded"
                value={efficiencyMetric}
                onChange={(e) => handleEfficiencyMetricChange(e.target.value)}
              >
                <option value={EFFICIENCY_METRICS.XP_PER_ACTION}>활동당 XP</option>
                <option value={EFFICIENCY_METRICS.XP_PER_MINUTE}>분당 XP</option>
                <option value={EFFICIENCY_METRICS.TOTAL_XP}>총 XP</option>
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
                  chartType === CHART_TYPES.PIE
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => handleChartTypeChange(CHART_TYPES.PIE)}
              >
                파이 차트
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        {chartType === CHART_TYPES.BAR && renderBarChart()}
        {chartType === CHART_TYPES.SCATTER && renderScatterChart()}
        {chartType === CHART_TYPES.PIE && renderPieChart()}
      </div>
      
      {/* 선택된 활동 상세 정보 */}
      {selectedActivity && (
        <div className="px-4 pb-4">
          <div className="p-3 border border-indigo-100 rounded-md bg-indigo-50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-indigo-800">
                <Activity className="inline w-4 h-4 mr-1" />
                {ACTIVITY_LABELS[selectedActivity[activityKey]] || selectedActivity[activityKey]} 활동 상세
              </h4>
              <button
                type="button"
                className="text-xs text-indigo-600 hover:text-indigo-800"
                onClick={() => setActiveActivity(null)}
              >
                닫기
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <div className="flex justify-between p-1">
                <span className="text-gray-600">활동당 XP:</span>
                <span className="font-medium">{selectedActivity[xpPerActionKey].toLocaleString()} XP</span>
              </div>
              
              <div className="flex justify-between p-1">
                <span className="text-gray-600">분당 XP:</span>
                <span className="font-medium">{selectedActivity[xpPerMinuteKey].toLocaleString()} XP</span>
              </div>
              
              <div className="flex justify-between p-1">
                <span className="text-gray-600">총 XP:</span>
                <span className="font-medium">{selectedActivity[totalXpKey].toLocaleString()} XP</span>
              </div>
              
              <div className="flex justify-between p-1">
                <span className="text-gray-600">활동 횟수:</span>
                <span className="font-medium">{selectedActivity[actionCountKey].toLocaleString()}회</span>
              </div>
              
              <div className="flex justify-between p-1">
                <span className="text-gray-600">소요 시간:</span>
                <span className="font-medium">{selectedActivity[timeSpentKey].toLocaleString()}분</span>
              </div>
              
              {/* 추가 정보가 있는 경우 표시 */}
              {Object.entries(selectedActivity).map(([key, value]) => {
                if (![activityKey, xpPerActionKey, xpPerMinuteKey, totalXpKey, actionCountKey, timeSpentKey].includes(key)) {
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
      
      {/* 활동 유형 설명 */}
      <div className="px-4 pb-4">
        <div className="border-t pt-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">활동 유형별 효율성</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
            {sortedData.map((item) => {
              const { key } = getEfficiencyInfo();
              
              return (
                <div
                  key={`efficiency-${item[activityKey]}`}
                  className={`flex items-center justify-between p-2 border rounded-md ${
                    activeActivity === item[activityKey] ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200'
                  }`}
                  onClick={() => handleActivityClick(item)}
                >
                  <div className="flex items-center">
                    <span
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: ACTIVITY_COLORS[item[activityKey]] }}
                    ></span>
                    <span>{ACTIVITY_LABELS[item[activityKey]] || item[activityKey]}</span>
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

ActivityEfficiencyChart.propTypes = {
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
  onActivityClick: PropTypes.func,
  efficiencyMetric: PropTypes.oneOf(Object.values(EFFICIENCY_METRICS)),
  onEfficiencyMetricChange: PropTypes.func,
  activityKey: PropTypes.string,
  xpPerActionKey: PropTypes.string,
  xpPerMinuteKey: PropTypes.string,
  totalXpKey: PropTypes.string,
  actionCountKey: PropTypes.string,
  timeSpentKey: PropTypes.string,
  thresholds: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.number.isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
};

ActivityEfficiencyChart.defaultProps = {
  chartType: CHART_TYPES.BAR,
  title: '활동 효율성',
  description: '활동 유형별 XP 획득 효율성 분석',
  loading: false,
  onChartTypeChange: null,
  showLegend: true,
  height: 400,
  tooltipFormatter: null,
  className: '',
  onActivityClick: null,
  efficiencyMetric: EFFICIENCY_METRICS.XP_PER_ACTION,
  onEfficiencyMetricChange: null,
  activityKey: 'activity',
  xpPerActionKey: 'xpPerAction',
  xpPerMinuteKey: 'xpPerMinute',
  totalXpKey: 'totalXp',
  actionCountKey: 'actionCount',
  timeSpentKey: 'timeSpent',
  thresholds: null,
};

// 차트 유형, 효율성 측정 기준, 활동 레이블 상수 내보내기
ActivityEfficiencyChart.CHART_TYPES = CHART_TYPES;
ActivityEfficiencyChart.EFFICIENCY_METRICS = EFFICIENCY_METRICS;
ActivityEfficiencyChart.ACTIVITY_LABELS = ACTIVITY_LABELS;

export default ActivityEfficiencyChart;
