/**
 * 활동 패턴별 유지율 차트 컴포넌트
 * 사용자의 활동 패턴에 따른 지갑 유지율을 시각화합니다.
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
  ScatterChart,
  Scatter,
  ZAxis,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { Info, Activity } from 'react-feather';

// 차트 유형 정의
const CHART_TYPES = {
  BAR: 'bar',
  SCATTER: 'scatter',
  RADAR: 'radar',
};

// 활동 패턴 색상
const PATTERN_COLORS = {
  'daily_login': '#4f46e5', // 인디고 (일일 로그인)
  'mission_completion': '#0ea5e9', // 스카이 블루 (미션 완료)
  'content_creation': '#10b981', // 에메랄드 (콘텐츠 생성)
  'social_interaction': '#f59e0b', // 앰버 (소셜 상호작용)
  'token_exchange': '#8b5cf6', // 바이올렛 (토큰 교환)
  'nft_collection': '#f97316', // 오렌지 (NFT 수집)
  'no_activity': '#94a3b8', // 슬레이트 (활동 없음)
};

// 활동 패턴 레이블
const PATTERN_LABELS = {
  'daily_login': '일일 로그인',
  'mission_completion': '미션 완료',
  'content_creation': '콘텐츠 생성',
  'social_interaction': '소셜 상호작용',
  'token_exchange': '토큰 교환',
  'nft_collection': 'NFT 수집',
  'no_activity': '활동 없음',
};

// 커스텀 툴팁 컴포넌트
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    // 바 차트인 경우
    if (payload[0].payload.activityPattern !== undefined) {
      return (
        <div className="p-3 bg-white rounded shadow-md border border-gray-200">
          <div className="flex items-center mb-2">
            <Activity className="w-4 h-4 mr-1 text-gray-500" />
            <p className="text-sm font-medium text-gray-600">
              {PATTERN_LABELS[payload[0].payload.activityPattern] || payload[0].payload.activityPattern}
            </p>
          </div>
          
          {payload.map((entry, index) => {
            // retentionRate는 퍼센트로 표시
            const isPercent = entry.dataKey === 'retentionRate';
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
    
    // 스캐터 차트나 레이더 차트인 경우
    return (
      <div className="p-3 bg-white rounded shadow-md border border-gray-200">
        <div className="flex items-center mb-2">
          <p className="text-sm font-medium text-gray-600">{label}</p>
        </div>
        
        {payload.map((entry, index) => {
          const formattedValue = formatter 
            ? formatter(entry.name, entry.value)
            : `${entry.value.toLocaleString()}${entry.name.includes('율') ? '%' : ''}`;
          
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

const RetentionByActivityPatternChart = ({
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
  activityPatternKey,
  retentionRateKey,
  userCountKey,
  activityCountKey,
}) => {
  const [activePattern, setActivePattern] = useState(null);
  
  // 활동 패턴 클릭 핸들러
  const handlePatternClick = (entry) => {
    const pattern = entry[activityPatternKey];
    const newActivePattern = activePattern === pattern ? null : pattern;
    setActivePattern(newActivePattern);
    
    if (onDataPointClick) {
      onDataPointClick(entry, newActivePattern);
    }
  };

  // 차트 유형 변경 핸들러
  const handleChartTypeChange = (type) => {
    if (onChartTypeChange) {
      onChartTypeChange(type);
    }
  };

  // 바 차트 렌더링
  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
        layout="vertical"
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
        <YAxis 
          dataKey={activityPatternKey} 
          type="category" 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => PATTERN_LABELS[value] || value}
          width={150}
        />
        <Tooltip content={<CustomTooltip formatter={tooltipFormatter} />} />
        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: 20 }}
          />
        )}
        
        <Bar 
          dataKey={retentionRateKey} 
          name="유지율"
          onClick={handlePatternClick}
        >
          <LabelList 
            dataKey={retentionRateKey} 
            position="right" 
            formatter={(value) => `${value}%`}
            style={{ fontSize: 11 }}
          />
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={PATTERN_COLORS[entry[activityPatternKey]] || '#8884d8'}
              opacity={activePattern === null || activePattern === entry[activityPatternKey] ? 1 : 0.5}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  // 스캐터 차트 렌더링 (사용자 수와 활동 횟수 대비 유지율)
  const renderScatterChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart
        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          type="number" 
          dataKey={activityCountKey} 
          name="활동 횟수" 
          tick={{ fontSize: 12 }}
          label={{ 
            value: '활동 횟수', 
            position: 'insideBottom', 
            offset: -5,
            fontSize: 12 
          }}
        />
        <YAxis 
          type="number" 
          dataKey={retentionRateKey} 
          name="유지율" 
          tick={{ fontSize: 12 }}
          domain={[0, 100]}
          tickFormatter={(value) => `${value}%`}
          label={{ 
            value: '유지율 (%)', 
            angle: -90, 
            position: 'insideLeft',
            fontSize: 12 
          }}
        />
        <ZAxis 
          type="number" 
          dataKey={userCountKey} 
          range={[100, 1000]} 
          name="사용자 수" 
        />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip formatter={tooltipFormatter} />} />
        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: 20 }}
          />
        )}
        
        <Scatter 
          name="활동 패턴별 유지율" 
          data={data} 
          onClick={handlePatternClick}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={PATTERN_COLORS[entry[activityPatternKey]] || '#8884d8'}
              opacity={activePattern === null || activePattern === entry[activityPatternKey] ? 1 : 0.5}
            />
          ))}
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer>
  );

  // 레이더 차트 렌더링
  const renderRadarChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid />
        <PolarAngleAxis 
          dataKey={activityPatternKey} 
          tickFormatter={(value) => PATTERN_LABELS[value] || value}
          tick={{ fontSize: 11 }}
        />
        <PolarRadiusAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
        <Radar
          name="유지율"
          dataKey={retentionRateKey}
          stroke="#4f46e5"
          fill="#4f46e5"
          fillOpacity={0.6}
          activeDot={{ r: 8, onClick: handlePatternClick }}
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
              바 차트
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
      
      <div className="p-4">
        {chartType === CHART_TYPES.BAR && renderBarChart()}
        {chartType === CHART_TYPES.SCATTER && renderScatterChart()}
        {chartType === CHART_TYPES.RADAR && renderRadarChart()}
      </div>

      {/* 선택된 활동 패턴 상세 정보 */}
      {activePattern && (
        <div className="px-4 pb-4">
          <div className="p-3 border border-indigo-100 rounded-md bg-indigo-50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-indigo-800">
                <Activity className="inline w-4 h-4 mr-1" />
                {PATTERN_LABELS[activePattern] || activePattern} 활동 상세
              </h4>
              <button
                type="button"
                className="text-xs text-indigo-600 hover:text-indigo-800"
                onClick={() => setActivePattern(null)}
              >
                닫기
              </button>
            </div>
            
            <div>
              {data.find(item => item[activityPatternKey] === activePattern) && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between p-1">
                    <span className="text-gray-600">유지율:</span>
                    <span className="font-medium">
                      {data.find(item => item[activityPatternKey] === activePattern)[retentionRateKey]}%
                    </span>
                  </div>
                  <div className="flex justify-between p-1">
                    <span className="text-gray-600">사용자 수:</span>
                    <span className="font-medium">
                      {data.find(item => item[activityPatternKey] === activePattern)[userCountKey].toLocaleString()}명
                    </span>
                  </div>
                  <div className="flex justify-between p-1">
                    <span className="text-gray-600">평균 활동 횟수:</span>
                    <span className="font-medium">
                      {data.find(item => item[activityPatternKey] === activePattern)[activityCountKey].toLocaleString()}회
                    </span>
                  </div>
                  
                  {Object.entries(data.find(item => item[activityPatternKey] === activePattern)).map(([key, value]) => {
                    // 이미 표시된 필드 제외
                    if (![activityPatternKey, retentionRateKey, userCountKey, activityCountKey].includes(key)) {
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

RetentionByActivityPatternChart.propTypes = {
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
  activityPatternKey: PropTypes.string,
  retentionRateKey: PropTypes.string,
  userCountKey: PropTypes.string,
  activityCountKey: PropTypes.string,
};

RetentionByActivityPatternChart.defaultProps = {
  chartType: CHART_TYPES.BAR,
  title: '활동 패턴별 유지율',
  description: '사용자 활동 패턴에 따른 지갑 유지율 비교',
  loading: false,
  onChartTypeChange: null,
  showLegend: true,
  height: 400,
  tooltipFormatter: null,
  className: '',
  onDataPointClick: null,
  activityPatternKey: 'activityPattern',
  retentionRateKey: 'retentionRate',
  userCountKey: 'userCount',
  activityCountKey: 'activityCount',
};

// 차트 유형 및 패턴 레이블 상수 내보내기
RetentionByActivityPatternChart.CHART_TYPES = CHART_TYPES;
RetentionByActivityPatternChart.PATTERN_LABELS = PATTERN_LABELS;

export default RetentionByActivityPatternChart;
