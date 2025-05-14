/**
 * XP 누적량 차트 컴포넌트
 * 커뮤니티 활동 기반 XP 누적량을 시각화합니다.
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
  AreaChart,
  Area,
  ComposedChart,
  Scatter,
  ReferenceLine,
  Label
} from 'recharts';
import { Info, Award } from 'react-feather';

// 차트 유형 정의
const CHART_TYPES = {
  LINE: 'line',
  AREA: 'area',
  BAR: 'bar',
  COMPOSED: 'composed',
};

// 데이터 그룹화 방식
const GROUP_BY = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  ACTIVITY: 'activity',
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
  'total': '#6b7280', // 회색 (총합)
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
  'total': '총합',
};

// 커스텀 툴팁 컴포넌트
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-white rounded shadow-md border border-gray-200">
        <p className="mb-1 text-sm font-medium text-gray-600">{label}</p>
        {payload.map((entry, index) => {
          // 활동 이름 변환
          const name = ACTIVITY_LABELS[entry.dataKey] || entry.name;
          
          // 값 포맷팅
          const formattedValue = formatter 
            ? formatter(name, entry.value, entry.payload) 
            : `${entry.value.toLocaleString()} XP`;
          
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

const XpAccumulationChart = ({
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
  groupBy,
  onGroupByChange,
  dateKey,
  xpKey,
  activityKey,
  // 레벨 경계 표시 (선택적)
  levelThresholds,
}) => {
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [hoveredActivity, setHoveredActivity] = useState(null);
  
  // 컴포넌트 마운트 시 활동 선택 초기화
  React.useEffect(() => {
    if (data.length > 0) {
      const availableActivities = determineAvailableActivities();
      
      // 기본적으로 'total' 활동과 가장 높은 XP 기여도를 가진 활동 2개를 선택
      let initialSelected = ['total'];
      
      if (groupBy === GROUP_BY.ACTIVITY) {
        // 활동별 그룹화에서는 모든 활동을 선택
        initialSelected = availableActivities;
      } else {
        // 다른 그룹화에서는 XP 기여도 높은 활동 선택
        const activitySums = {};
        
        // 각 활동별 XP 합계 계산
        availableActivities.forEach(activity => {
          if (activity !== 'total') {
            activitySums[activity] = data.reduce((sum, item) => {
              return sum + (item[activity] || 0);
            }, 0);
          }
        });
        
        // XP 합계 기준으로 정렬하고 상위 2개 선택
        const topActivities = Object.entries(activitySums)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
          .map(([activity]) => activity);
        
        initialSelected = [...initialSelected, ...topActivities];
      }
      
      setSelectedActivities(initialSelected);
    }
  }, [data, groupBy]);

  // 사용 가능한 활동 유형 감지
  const determineAvailableActivities = () => {
    if (!data || data.length === 0) return [];
    
    const sample = data[0];
    return Object.keys(sample).filter(key => {
      // date, activity 키는 제외
      if (key === dateKey || key === activityKey) return false;
      
      // 숫자 값을 가진 키만 포함 (활동 데이터로 간주)
      return typeof sample[key] === 'number';
    });
  };

  // 활동 토글 핸들러
  const handleActivityToggle = (activity) => {
    setSelectedActivities(prev => {
      if (prev.includes(activity)) {
        return prev.filter(a => a !== activity);
      } else {
        return [...prev, activity];
      }
    });
  };

  // 차트 유형 변경 핸들러
  const handleChartTypeChange = (type) => {
    if (onChartTypeChange) {
      onChartTypeChange(type);
    }
  };

  // 그룹화 방식 변경 핸들러
  const handleGroupByChange = (mode) => {
    if (onGroupByChange) {
      onGroupByChange(mode);
    }
  };

  // 선 차트 렌더링
  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey={dateKey} 
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          domain={['auto', 'auto']}
          label={{ 
            value: 'XP', 
            angle: -90, 
            position: 'insideLeft',
            fontSize: 12 
          }}
        />
        <Tooltip content={<CustomTooltip formatter={tooltipFormatter} />} />
        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: 20 }}
            onClick={(e) => {
              // Legend 클릭 시 해당 활동 토글
              if (e && e.dataKey) {
                handleActivityToggle(e.dataKey);
              }
            }}
            onMouseEnter={(e) => {
              if (e && e.dataKey) {
                setHoveredActivity(e.dataKey);
              }
            }}
            onMouseLeave={() => {
              setHoveredActivity(null);
            }}
          />
        )}
        
        {selectedActivities.map(activity => (
          <Line
            key={activity}
            type="monotone"
            dataKey={activity}
            name={ACTIVITY_LABELS[activity] || activity}
            stroke={ACTIVITY_COLORS[activity] || '#8884d8'}
            activeDot={{ 
              r: 8, 
              onClick: (e) => onDataPointClick && onDataPointClick(e, activity) 
            }}
            strokeWidth={hoveredActivity === activity ? 3 : 2}
            dot={false}
          />
        ))}
        
        {/* 레벨 경계 표시 */}
        {levelThresholds && levelThresholds.map((threshold, index) => (
          <ReferenceLine
            key={`level-${index}`}
            y={threshold.xp}
            stroke="#ef4444"
            strokeDasharray="3 3"
          >
            <Label
              value={`Level ${threshold.level}`}
              position="insideBottomRight"
              fill="#ef4444"
              fontSize={10}
            />
          </ReferenceLine>
        ))}
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
        <XAxis 
          dataKey={dateKey} 
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          domain={['auto', 'auto']}
          label={{ 
            value: 'XP', 
            angle: -90, 
            position: 'insideLeft',
            fontSize: 12 
          }}
        />
        <Tooltip content={<CustomTooltip formatter={tooltipFormatter} />} />
        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: 20 }}
            onClick={(e) => {
              // Legend 클릭 시 해당 활동 토글
              if (e && e.dataKey) {
                handleActivityToggle(e.dataKey);
              }
            }}
            onMouseEnter={(e) => {
              if (e && e.dataKey) {
                setHoveredActivity(e.dataKey);
              }
            }}
            onMouseLeave={() => {
              setHoveredActivity(null);
            }}
          />
        )}
        
        {selectedActivities.map(activity => (
          <Area
            key={activity}
            type="monotone"
            dataKey={activity}
            name={ACTIVITY_LABELS[activity] || activity}
            stroke={ACTIVITY_COLORS[activity] || '#8884d8'}
            fill={ACTIVITY_COLORS[activity] || '#8884d8'}
            fillOpacity={0.3}
            activeDot={{ 
              r: 8, 
              onClick: (e) => onDataPointClick && onDataPointClick(e, activity) 
            }}
            strokeWidth={hoveredActivity === activity ? 3 : 2}
          />
        ))}
        
        {/* 레벨 경계 표시 */}
        {levelThresholds && levelThresholds.map((threshold, index) => (
          <ReferenceLine
            key={`level-${index}`}
            y={threshold.xp}
            stroke="#ef4444"
            strokeDasharray="3 3"
          >
            <Label
              value={`Level ${threshold.level}`}
              position="insideBottomRight"
              fill="#ef4444"
              fontSize={10}
            />
          </ReferenceLine>
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
  
  // 막대 차트 렌더링
  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey={dateKey} 
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          domain={['auto', 'auto']}
          label={{ 
            value: 'XP', 
            angle: -90, 
            position: 'insideLeft',
            fontSize: 12 
          }}
        />
        <Tooltip content={<CustomTooltip formatter={tooltipFormatter} />} />
        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: 20 }}
            onClick={(e) => {
              // Legend 클릭 시 해당 활동 토글
              if (e && e.dataKey) {
                handleActivityToggle(e.dataKey);
              }
            }}
            onMouseEnter={(e) => {
              if (e && e.dataKey) {
                setHoveredActivity(e.dataKey);
              }
            }}
            onMouseLeave={() => {
              setHoveredActivity(null);
            }}
          />
        )}
        
        {selectedActivities.map(activity => (
          <Bar
            key={activity}
            dataKey={activity}
            name={ACTIVITY_LABELS[activity] || activity}
            fill={ACTIVITY_COLORS[activity] || '#8884d8'}
            onClick={(e) => onDataPointClick && onDataPointClick(e, activity)}
            stackId={activity === 'total' ? undefined : 'a'}  // total은 스택에서 제외
            opacity={hoveredActivity && hoveredActivity !== activity ? 0.5 : 1}
          />
        ))}
        
        {/* 레벨 경계 표시 */}
        {levelThresholds && levelThresholds.map((threshold, index) => (
          <ReferenceLine
            key={`level-${index}`}
            y={threshold.xp}
            stroke="#ef4444"
            strokeDasharray="3 3"
          >
            <Label
              value={`Level ${threshold.level}`}
              position="insideBottomRight"
              fill="#ef4444"
              fontSize={10}
            />
          </ReferenceLine>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );

  // 복합 차트 렌더링 (막대 + 선)
  const renderComposedChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey={dateKey} 
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          domain={['auto', 'auto']}
          label={{ 
            value: 'XP', 
            angle: -90, 
            position: 'insideLeft',
            fontSize: 12 
          }}
        />
        <Tooltip content={<CustomTooltip formatter={tooltipFormatter} />} />
        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: 20 }}
            onClick={(e) => {
              // Legend 클릭 시 해당 활동 토글
              if (e && e.dataKey) {
                handleActivityToggle(e.dataKey);
              }
            }}
            onMouseEnter={(e) => {
              if (e && e.dataKey) {
                setHoveredActivity(e.dataKey);
              }
            }}
            onMouseLeave={() => {
              setHoveredActivity(null);
            }}
          />
        )}
        
        {/* 개별 활동은 막대 그래프로 표시 */}
        {selectedActivities
          .filter(activity => activity !== 'total')
          .map(activity => (
            <Bar
              key={activity}
              dataKey={activity}
              name={ACTIVITY_LABELS[activity] || activity}
              fill={ACTIVITY_COLORS[activity] || '#8884d8'}
              onClick={(e) => onDataPointClick && onDataPointClick(e, activity)}
              stackId="a"
              opacity={hoveredActivity && hoveredActivity !== activity && hoveredActivity !== 'total' ? 0.5 : 1}
            />
          ))}
        
        {/* 총합은 선 그래프로 표시 */}
        {selectedActivities.includes('total') && (
          <Line
            type="monotone"
            dataKey="total"
            name="총 XP"
            stroke={ACTIVITY_COLORS.total}
            strokeWidth={hoveredActivity === 'total' ? 3 : 2}
            dot={false}
            activeDot={{ 
              r: 8, 
              onClick: (e) => onDataPointClick && onDataPointClick(e, 'total') 
            }}
          />
        )}
        
        {/* 레벨 경계 표시 */}
        {levelThresholds && levelThresholds.map((threshold, index) => (
          <ReferenceLine
            key={`level-${index}`}
            y={threshold.xp}
            stroke="#ef4444"
            strokeDasharray="3 3"
          >
            <Label
              value={`Level ${threshold.level}`}
              position="insideBottomRight"
              fill="#ef4444"
              fontSize={10}
            />
          </ReferenceLine>
        ))}
      </ComposedChart>
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

  // 활동별 XP 기여도 계산
  const calculateActivityContribution = () => {
    const availableActivities = determineAvailableActivities();
    const result = {};
    
    availableActivities.forEach(activity => {
      if (activity !== 'total') {
        const sum = data.reduce((acc, item) => acc + (item[activity] || 0), 0);
        result[activity] = sum;
      }
    });
    
    const totalXP = Object.values(result).reduce((acc, val) => acc + val, 0);
    
    return {
      contributions: result,
      totalXP,
    };
  };

  const { contributions, totalXP } = calculateActivityContribution();

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-800">{title}</h3>
            {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
          </div>
          
          <div className="flex items-center space-x-4">
            {/* 그룹화 방식 선택 */}
            <div className="flex items-center">
              <label className="text-xs text-gray-600 mr-2">그룹화:</label>
              <select
                className="py-1 px-2 text-xs border border-gray-300 rounded"
                value={groupBy}
                onChange={(e) => handleGroupByChange(e.target.value)}
              >
                <option value={GROUP_BY.DAY}>일별</option>
                <option value={GROUP_BY.WEEK}>주별</option>
                <option value={GROUP_BY.MONTH}>월별</option>
                <option value={GROUP_BY.ACTIVITY}>활동별</option>
              </select>
            </div>
            
            {/* 차트 유형 선택 */}
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
        {chartType === CHART_TYPES.AREA && renderAreaChart()}
        {chartType === CHART_TYPES.BAR && renderBarChart()}
        {chartType === CHART_TYPES.COMPOSED && renderComposedChart()}
      </div>
      
      {/* 활동별 XP 기여도 */}
      <div className="px-4 pb-4">
        <div className="border-t pt-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            <Award className="inline w-4 h-4 mr-1 text-indigo-600" />
            활동별 XP 기여도
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
            {Object.entries(contributions).map(([activity, xp]) => {
              const percentage = totalXP > 0 ? (xp / totalXP * 100).toFixed(1) : 0;
              
              return (
                <div
                  key={activity}
                  className={`flex items-center justify-between p-2 border rounded-md ${
                    selectedActivities.includes(activity) ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200'
                  }`}
                  onClick={() => handleActivityToggle(activity)}
                >
                  <div className="flex items-center">
                    <span
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: ACTIVITY_COLORS[activity] }}
                    ></span>
                    <span>{ACTIVITY_LABELS[activity] || activity}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{xp.toLocaleString()} XP</span>
                    <span className="ml-1 text-gray-500">({percentage}%)</span>
                  </div>
                </div>
              );
            })}
            
            {/* 총합 */}
            <div className="flex items-center justify-between p-2 border border-gray-300 rounded-md bg-gray-50">
              <div className="flex items-center font-medium">
                <span
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: ACTIVITY_COLORS.total }}
                ></span>
                <span>총 XP</span>
              </div>
              <div className="text-right font-medium">
                {totalXP.toLocaleString()} XP
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

XpAccumulationChart.propTypes = {
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
  groupBy: PropTypes.oneOf(Object.values(GROUP_BY)),
  onGroupByChange: PropTypes.func,
  dateKey: PropTypes.string,
  xpKey: PropTypes.string,
  activityKey: PropTypes.string,
  levelThresholds: PropTypes.arrayOf(
    PropTypes.shape({
      level: PropTypes.number.isRequired,
      xp: PropTypes.number.isRequired,
    })
  ),
};

XpAccumulationChart.defaultProps = {
  chartType: CHART_TYPES.AREA,
  title: 'XP 누적량',
  description: '커뮤니티 활동 기반 XP 누적량 추이',
  loading: false,
  onChartTypeChange: null,
  showLegend: true,
  height: 400,
  tooltipFormatter: null,
  className: '',
  onDataPointClick: null,
  groupBy: GROUP_BY.DAY,
  onGroupByChange: null,
  dateKey: 'date',
  xpKey: 'total',
  activityKey: 'activity',
  levelThresholds: null,
};

// 차트 유형, 그룹화 방식, 활동 레이블 상수 내보내기
XpAccumulationChart.CHART_TYPES = CHART_TYPES;
XpAccumulationChart.GROUP_BY = GROUP_BY;
XpAccumulationChart.ACTIVITY_LABELS = ACTIVITY_LABELS;

export default XpAccumulationChart;
