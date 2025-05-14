/**
 * 레벨 진행도 차트 컴포넌트
 * 사용자 레벨 진행 상황을 시각화합니다.
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
  LabelList,
  ComposedChart,
  Area,
} from 'recharts';
import { Info, Award } from 'react-feather';

// 차트 유형 정의
const CHART_TYPES = {
  BAR: 'bar',
  PIE: 'pie',
  LINE: 'line',
  COMPOSED: 'composed',
};

// 분포 유형 정의
const DISTRIBUTION_TYPES = {
  LEVEL: 'level',
  XP: 'xp',
  PROGRESS: 'progress',
};

// 레벨 색상 생성
const generateLevelColors = (levelCount) => {
  // 색상 그라디언트 생성 (레벨이 높아질수록 진해지는 색상)
  const colors = [];
  
  for (let i = 0; i < levelCount; i++) {
    // 인디고 색상 - 밝은 색에서 진한 색으로
    const lightness = Math.max(40, 80 - (i * 4)); // 80%에서 시작해서 점점 어두워짐 (최소 40%)
    colors.push(`hsl(238, 80%, ${lightness}%)`);
  }
  
  return colors;
};

// 커스텀 툴팁 컴포넌트
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-white rounded shadow-md border border-gray-200">
        <p className="mb-1 text-sm font-medium text-gray-600">
          {label ? `레벨 ${label}` : payload[0]?.payload?.level ? `레벨 ${payload[0].payload.level}` : ''}
        </p>
        {payload.map((entry, index) => {
          // 값 포맷팅
          const formattedValue = formatter 
            ? formatter(entry.name, entry.value, entry.payload) 
            : `${entry.value.toLocaleString()}${entry.name.includes('비율') ? '%' : entry.name.includes('XP') ? ' XP' : '명'}`;
          
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
        
        {/* 추가 정보 표시 (레벨 범위, 요구 XP 등) */}
        {payload[0]?.payload?.requiredXp && (
          <div className="mt-1 pt-1 border-t border-gray-200">
            <div className="flex items-center mb-1">
              <span className="mr-2 text-xs text-gray-600">필요 XP:</span>
              <span className="text-xs font-semibold">{payload[0].payload.requiredXp.toLocaleString()} XP</span>
            </div>
            {payload[0]?.payload?.nextLevelXp && (
              <div className="flex items-center">
                <span className="mr-2 text-xs text-gray-600">다음 레벨까지:</span>
                <span className="text-xs font-semibold">{payload[0].payload.nextLevelXp.toLocaleString()} XP</span>
              </div>
            )}
          </div>
        )}
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
        레벨 {payload.level}
      </text>
      <text x={cx} y={cy} textAnchor="middle" fill="#333" className="text-xl font-semibold">
        {value.toLocaleString()}명
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

const LevelProgressionChart = ({
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
  onLevelClick,
  distributionType,
  onDistributionTypeChange,
  levelKey,
  userCountKey,
  xpKey,
  progressKey,
  // 레벨 요구사항 정보 (선택적)
  levelRequirements,
}) => {
  const [activeLevel, setActiveLevel] = useState(null);
  
  // 레벨 클릭 핸들러
  const handleLevelClick = (entry) => {
    const level = entry[levelKey];
    const newActiveLevel = activeLevel === level ? null : level;
    setActiveLevel(newActiveLevel);
    
    if (onLevelClick) {
      onLevelClick(entry, newActiveLevel);
    }
  };

  // 차트 유형 변경 핸들러
  const handleChartTypeChange = (type) => {
    if (onChartTypeChange) {
      onChartTypeChange(type);
    }
  };

  // 분포 유형 변경 핸들러
  const handleDistributionTypeChange = (type) => {
    if (onDistributionTypeChange) {
      onDistributionTypeChange(type);
    }
  };

  // 분포 유형에 따른 데이터 키와 레이블 가져오기
  const getDistributionInfo = () => {
    switch (distributionType) {
      case DISTRIBUTION_TYPES.LEVEL:
        return { key: userCountKey, label: '사용자 수', unit: '명' };
      case DISTRIBUTION_TYPES.XP:
        return { key: xpKey, label: '평균 XP', unit: 'XP' };
      case DISTRIBUTION_TYPES.PROGRESS:
        return { key: progressKey, label: '진행률', unit: '%' };
      default:
        return { key: userCountKey, label: '사용자 수', unit: '명' };
    }
  };

  // 레벨 요구사항 정보가 있는 경우 데이터에 추가
  const enrichDataWithRequirements = () => {
    if (!levelRequirements || !Array.isArray(levelRequirements)) {
      return data;
    }
    
    return data.map(item => {
      const level = item[levelKey];
      const requirement = levelRequirements.find(req => req.level === level);
      const nextRequirement = levelRequirements.find(req => req.level === level + 1);
      
      if (requirement) {
        return {
          ...item,
          requiredXp: requirement.requiredXp,
          nextLevelXp: nextRequirement ? nextRequirement.requiredXp - requirement.requiredXp : null,
        };
      }
      
      return item;
    });
  };

  const enrichedData = enrichDataWithRequirements();
  const levelColors = generateLevelColors(data.length);

  // 막대 차트 렌더링
  const renderBarChart = () => {
    const { key, label, unit } = getDistributionInfo();
    
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={enrichedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey={levelKey} 
            tick={{ fontSize: 12 }}
            label={{ 
              value: '레벨', 
              position: 'insideBottom', 
              offset: -10,
              fontSize: 12 
            }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            label={{ 
              value: label, 
              angle: -90, 
              position: 'insideLeft',
              fontSize: 12 
            }}
          />
          <Tooltip content={<CustomTooltip formatter={tooltipFormatter} />} />
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: 20 }}
            />
          )}
          
          <Bar 
            dataKey={key} 
            name={label}
            onClick={handleLevelClick}
          >
            <LabelList 
              dataKey={key} 
              position="top" 
              formatter={(value) => `${value}${unit}`}
              style={{ fontSize: 11 }}
            />
            {enrichedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={levelColors[index]}
                opacity={activeLevel === null || activeLevel === entry[levelKey] ? 1 : 0.5}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // 파이 차트 렌더링
  const renderPieChart = () => {
    const { key, label } = getDistributionInfo();
    const activeIndex = enrichedData.findIndex(item => item[levelKey] === activeLevel);
    
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            activeIndex={activeIndex !== -1 ? activeIndex : undefined}
            activeShape={renderActiveShape}
            data={enrichedData}
            dataKey={key}
            nameKey={levelKey}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={120}
            fill="#8884d8"
            onClick={handleLevelClick}
            // 파이 차트 라벨 커스터마이징
            label={({ level, percent }) => `${level}lvl (${(percent * 100).toFixed(0)}%)`}
            labelLine={false}
          >
            {enrichedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={levelColors[index]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip formatter={tooltipFormatter} />} />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // 선 차트 렌더링
  const renderLineChart = () => {
    const { key, label, unit } = getDistributionInfo();
    
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={enrichedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey={levelKey} 
            tick={{ fontSize: 12 }}
            label={{ 
              value: '레벨', 
              position: 'insideBottom', 
              offset: -10,
              fontSize: 12 
            }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            label={{ 
              value: label, 
              angle: -90, 
              position: 'insideLeft',
              fontSize: 12 
            }}
          />
          <Tooltip content={<CustomTooltip formatter={tooltipFormatter} />} />
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: 20 }}
            />
          )}
          
          <Line
            type="monotone"
            dataKey={key}
            name={label}
            stroke="#4f46e5"
            strokeWidth={2}
            activeDot={{ 
              r: 8, 
              onClick: (e) => onLevelClick && onLevelClick(e, key) 
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  // 복합 차트 렌더링 (사용자 수 막대 + 평균 XP 선)
  const renderComposedChart = () => {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={enrichedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey={levelKey} 
            tick={{ fontSize: 12 }}
            label={{ 
              value: '레벨', 
              position: 'insideBottom', 
              offset: -10,
              fontSize: 12 
            }}
          />
          <YAxis 
            yAxisId="count"
            tick={{ fontSize: 12 }}
            label={{ 
              value: '사용자 수', 
              angle: -90, 
              position: 'insideLeft',
              fontSize: 12 
            }}
          />
          <YAxis 
            yAxisId="xp"
            orientation="right"
            tick={{ fontSize: 12 }}
            label={{ 
              value: '평균 XP', 
              angle: 90, 
              position: 'insideRight',
              fontSize: 12 
            }}
          />
          <Tooltip content={<CustomTooltip formatter={tooltipFormatter} />} />
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: 20 }}
            />
          )}
          
          <Bar 
            dataKey={userCountKey} 
            name="사용자 수"
            yAxisId="count"
            onClick={handleLevelClick}
          >
            {enrichedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={levelColors[index]}
                opacity={activeLevel === null || activeLevel === entry[levelKey] ? 1 : 0.5}
              />
            ))}
          </Bar>
          
          <Line
            type="monotone"
            dataKey={xpKey}
            name="평균 XP"
            stroke="#f59e0b"
            strokeWidth={2}
            yAxisId="xp"
            activeDot={{ 
              r: 8, 
              onClick: (e) => onLevelClick && onLevelClick(e, xpKey) 
            }}
          />
          
          {progressKey && (
            <Area
              type="monotone"
              dataKey={progressKey}
              name="진행률"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.2}
              yAxisId="count"
              hide={true} // 기본으로는 숨김 (분포 유형이 PROGRESS일 때만 표시)
            />
          )}
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

  // 선택된 레벨에 대한 상세 정보
  const selectedLevel = enrichedData.find(item => item[levelKey] === activeLevel);

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-800">{title}</h3>
            {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
          </div>
          
          <div className="flex items-center">
            {/* 분포 유형 선택 */}
            <div className="mr-4 flex items-center">
              <label className="text-xs text-gray-600 mr-2">분포 기준:</label>
              <select
                className="py-1 px-2 text-xs border border-gray-300 rounded"
                value={distributionType}
                onChange={(e) => handleDistributionTypeChange(e.target.value)}
              >
                <option value={DISTRIBUTION_TYPES.LEVEL}>사용자 수</option>
                <option value={DISTRIBUTION_TYPES.XP}>평균 XP</option>
                <option value={DISTRIBUTION_TYPES.PROGRESS}>진행률</option>
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
        </div>
      </div>
      
      <div className="p-4">
        {chartType === CHART_TYPES.BAR && renderBarChart()}
        {chartType === CHART_TYPES.PIE && renderPieChart()}
        {chartType === CHART_TYPES.LINE && renderLineChart()}
        {chartType === CHART_TYPES.COMPOSED && renderComposedChart()}
      </div>
      
      {/* 선택된 레벨 상세 정보 */}
      {selectedLevel && (
        <div className="px-4 pb-4">
          <div className="p-3 border border-indigo-100 rounded-md bg-indigo-50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-indigo-800">
                <Award className="inline w-4 h-4 mr-1" />
                레벨 {selectedLevel[levelKey]} 상세 정보
              </h4>
              <button
                type="button"
                className="text-xs text-indigo-600 hover:text-indigo-800"
                onClick={() => setActiveLevel(null)}
              >
                닫기
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div className="flex justify-between p-1">
                <span className="text-gray-600">사용자 수:</span>
                <span className="font-medium">{selectedLevel[userCountKey].toLocaleString()}명</span>
              </div>
              
              <div className="flex justify-between p-1">
                <span className="text-gray-600">평균 XP:</span>
                <span className="font-medium">{selectedLevel[xpKey].toLocaleString()} XP</span>
              </div>
              
              {progressKey && (
                <div className="flex justify-between p-1">
                  <span className="text-gray-600">평균 진행률:</span>
                  <span className="font-medium">{selectedLevel[progressKey].toFixed(1)}%</span>
                </div>
              )}
              
              {selectedLevel.requiredXp && (
                <div className="flex justify-between p-1">
                  <span className="text-gray-600">필요 XP:</span>
                  <span className="font-medium">{selectedLevel.requiredXp.toLocaleString()} XP</span>
                </div>
              )}
              
              {selectedLevel.nextLevelXp && (
                <div className="flex justify-between p-1">
                  <span className="text-gray-600">다음 레벨까지:</span>
                  <span className="font-medium">{selectedLevel.nextLevelXp.toLocaleString()} XP</span>
                </div>
              )}
              
              {/* 추가 정보가 있는 경우 표시 */}
              {Object.entries(selectedLevel).map(([key, value]) => {
                if (![levelKey, userCountKey, xpKey, progressKey, 'requiredXp', 'nextLevelXp'].includes(key)) {
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
      
      {/* 레벨 요구사항 테이블 */}
      {levelRequirements && (
        <div className="px-4 pb-4">
          <div className="border-t pt-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">레벨별 필요 XP</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      레벨
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      필요 XP
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      증가치
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {levelRequirements.map((level, index) => {
                    const prevLevel = index > 0 ? levelRequirements[index - 1] : null;
                    const xpDiff = prevLevel ? level.requiredXp - prevLevel.requiredXp : level.requiredXp;
                    
                    return (
                      <tr 
                        key={level.level}
                        className={activeLevel === level.level ? 'bg-indigo-50' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                        onClick={() => {
                          const found = data.find(item => item[levelKey] === level.level);
                          if (found) handleLevelClick(found);
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {level.level}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {level.requiredXp.toLocaleString()} XP
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          +{xpDiff.toLocaleString()} XP
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

LevelProgressionChart.propTypes = {
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
  onLevelClick: PropTypes.func,
  distributionType: PropTypes.oneOf(Object.values(DISTRIBUTION_TYPES)),
  onDistributionTypeChange: PropTypes.func,
  levelKey: PropTypes.string,
  userCountKey: PropTypes.string,
  xpKey: PropTypes.string,
  progressKey: PropTypes.string,
  levelRequirements: PropTypes.arrayOf(
    PropTypes.shape({
      level: PropTypes.number.isRequired,
      requiredXp: PropTypes.number.isRequired,
    })
  ),
};

LevelProgressionChart.defaultProps = {
  chartType: CHART_TYPES.BAR,
  title: '레벨 진행도',
  description: '사용자 레벨 분포 및 진행 상황',
  loading: false,
  onChartTypeChange: null,
  showLegend: true,
  height: 400,
  tooltipFormatter: null,
  className: '',
  onLevelClick: null,
  distributionType: DISTRIBUTION_TYPES.LEVEL,
  onDistributionTypeChange: null,
  levelKey: 'level',
  userCountKey: 'userCount',
  xpKey: 'averageXp',
  progressKey: 'progress',
  levelRequirements: null,
};

// 차트 유형, 분포 유형 상수 내보내기
LevelProgressionChart.CHART_TYPES = CHART_TYPES;
LevelProgressionChart.DISTRIBUTION_TYPES = DISTRIBUTION_TYPES;

export default LevelProgressionChart;
