/**
 * 교환 금액 분포 차트 컴포넌트
 * 토큰 교환 금액의 분포를 시각화합니다.
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
  AreaChart,
  Area,
} from 'recharts';
import { Info, DollarSign } from 'react-feather';

// 차트 유형 정의
const CHART_TYPES = {
  BAR: 'bar',
  PIE: 'pie',
  AREA: 'area',
};

// 교환 유형 정의
const EXCHANGE_TYPES = {
  CTA_TO_NEST: 'cta_to_nest',
  NEST_TO_CTA: 'nest_to_cta',
  BOTH: 'both',
};

// 색상 팔레트
const COLORS = [
  '#4f46e5', // 인디고
  '#0ea5e9', // 스카이 블루
  '#10b981', // 에메랄드
  '#f59e0b', // 앰버
  '#8b5cf6', // 바이올렛
  '#ef4444', // 빨강
  '#f97316', // 오렌지
  '#a3e635', // 라임
];

// 커스텀 툴팁 컴포넌트
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-white rounded shadow-md border border-gray-200">
        <p className="mb-1 text-sm font-medium text-gray-600">
          {payload[0]?.payload?.name || label}
        </p>
        {payload.map((entry, index) => {
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
        {payload.name}
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

const ExchangeAmountDistributionChart = ({
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
  onRangeClick,
  exchangeType,
  onExchangeTypeChange,
  amountRangeKey,
  countKey,
  volumeKey,
  percentageKey,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  // 분포 범위 클릭 핸들러
  const handleRangeClick = (entry, index) => {
    setActiveIndex(index);
    
    if (onRangeClick) {
      onRangeClick(entry, index);
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

  // 바 차트 렌더링
  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey={amountRangeKey} 
          tick={{ fontSize: 12 }}
          label={{ 
            value: '교환 금액 범위', 
            position: 'insideBottom', 
            offset: -10,
            fontSize: 12 
          }}
        />
        <YAxis 
          yAxisId="count"
          tick={{ fontSize: 12 }}
          label={{ 
            value: '거래 건수', 
            angle: -90, 
            position: 'insideLeft',
            fontSize: 12,
            dx: -15
          }}
        />
        <YAxis 
          yAxisId="volume"
          orientation="right"
          tick={{ fontSize: 12 }}
          label={{ 
            value: '거래량', 
            angle: 90, 
            position: 'insideRight',
            fontSize: 12,
            dx: 15
          }}
        />
        <Tooltip content={<CustomTooltip formatter={tooltipFormatter} />} />
        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: 10 }}
          />
        )}
        
        <Bar
          dataKey={countKey}
          name="거래 건수"
          yAxisId="count"
          fill="#4f46e5"
          onClick={(e, index) => handleRangeClick(e, index)}
          activeBar={{ fill: '#312e81', stroke: '#4f46e5', strokeWidth: 2 }}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={index === activeIndex ? '#312e81' : '#4f46e5'}
            />
          ))}
        </Bar>
        
        <Bar
          dataKey={volumeKey}
          name="거래량"
          yAxisId="volume"
          fill="#0ea5e9"
          onClick={(e, index) => handleRangeClick(e, index)}
          activeBar={{ fill: '#075985', stroke: '#0ea5e9', strokeWidth: 2 }}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={index === activeIndex ? '#075985' : '#0ea5e9'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  // 파이 차트 렌더링
  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          activeIndex={activeIndex}
          activeShape={renderActiveShape}
          data={data}
          dataKey={volumeKey}
          nameKey={amountRangeKey}
          cx="50%"
          cy="50%"
          innerRadius={80}
          outerRadius={120}
          fill="#8884d8"
          onClick={(e, index) => handleRangeClick(e, index)}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip formatter={tooltipFormatter} />} />
        {showLegend && (
          <Legend
            formatter={(value, entry, index) => {
              const { payload } = entry;
              return `${value} (${payload.percentage.toFixed(1)}%)`;
            }}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );

  // 영역 차트 렌더링 (누적 분포)
  const renderAreaChart = () => {
    // 누적 분포를 계산
    let cumulativeData = [];
    let cumulativeCount = 0;
    let cumulativeVolume = 0;
    let totalCount = data.reduce((sum, item) => sum + item[countKey], 0);
    let totalVolume = data.reduce((sum, item) => sum + item[volumeKey], 0);
    
    data.forEach((item, index) => {
      cumulativeCount += item[countKey];
      cumulativeVolume += item[volumeKey];
      
      cumulativeData.push({
        ...item,
        cumulativeCount,
        cumulativeVolume,
        countPercentage: (cumulativeCount / totalCount) * 100,
        volumePercentage: (cumulativeVolume / totalVolume) * 100,
      });
    });

    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={cumulativeData}
          margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey={amountRangeKey} 
            tick={{ fontSize: 12 }}
            label={{ 
              value: '교환 금액 범위', 
              position: 'insideBottom', 
              offset: -10,
              fontSize: 12 
            }}
          />
          <YAxis 
            yAxisId="percentage"
            tick={{ fontSize: 12 }}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            label={{ 
              value: '누적 비율 (%)', 
              angle: -90, 
              position: 'insideLeft',
              fontSize: 12,
              dx: -15
            }}
          />
          <Tooltip 
            content={<CustomTooltip 
              formatter={(name, value, payload) => {
                if (name === '누적 거래 건수 비율' || name === '누적 거래량 비율') {
                  return `${value.toFixed(1)}%`;
                }
                return `${value.toLocaleString()}`;
              }} 
            />}
          />
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: 10 }}
            />
          )}
          
          <Area
            type="monotone"
            dataKey="countPercentage"
            name="누적 거래 건수 비율"
            stroke="#4f46e5"
            fill="#4f46e5"
            fillOpacity={0.4}
            yAxisId="percentage"
            activeDot={{ 
              r: 6, 
              onClick: (e, index) => handleRangeClick(cumulativeData[index], index) 
            }}
          />
          
          <Area
            type="monotone"
            dataKey="volumePercentage"
            name="누적 거래량 비율"
            stroke="#0ea5e9"
            fill="#0ea5e9"
            fillOpacity={0.4}
            yAxisId="percentage"
            activeDot={{ 
              r: 6, 
              onClick: (e, index) => handleRangeClick(cumulativeData[index], index) 
            }}
          />
        </AreaChart>
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

  // 선택된 범위에 대한 상세 정보
  const selectedRange = data[activeIndex];

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
              <label className="text-xs text-gray-600 mr-2">교환 유형:</label>
              <select
                className="py-1 px-2 text-xs border border-gray-300 rounded"
                value={exchangeType}
                onChange={(e) => handleExchangeTypeChange(e.target.value)}
              >
                <option value={EXCHANGE_TYPES.BOTH}>모든 교환</option>
                <option value={EXCHANGE_TYPES.CTA_TO_NEST}>CTA→NEST</option>
                <option value={EXCHANGE_TYPES.NEST_TO_CTA}>NEST→CTA</option>
              </select>
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
                  chartType === CHART_TYPES.AREA
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => handleChartTypeChange(CHART_TYPES.AREA)}
              >
                누적 분포
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        {chartType === CHART_TYPES.BAR && renderBarChart()}
        {chartType === CHART_TYPES.PIE && renderPieChart()}
        {chartType === CHART_TYPES.AREA && renderAreaChart()}
      </div>
      
      {/* 선택된 범위 상세 정보 */}
      {selectedRange && (
        <div className="px-4 pb-4">
          <div className="p-3 border border-indigo-100 rounded-md bg-indigo-50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-indigo-800">
                <DollarSign className="inline w-4 h-4 mr-1" />
                {selectedRange[amountRangeKey]} 범위 상세
              </h4>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div className="flex justify-between p-1">
                <span className="text-gray-600">거래 건수:</span>
                <span className="font-medium">{selectedRange[countKey].toLocaleString()}건</span>
              </div>
              <div className="flex justify-between p-1">
                <span className="text-gray-600">비율:</span>
                <span className="font-medium">{selectedRange[percentageKey].toFixed(1)}%</span>
              </div>
              <div className="flex justify-between p-1">
                <span className="text-gray-600">거래량:</span>
                <span className="font-medium">{selectedRange[volumeKey].toLocaleString()} 토큰</span>
              </div>
              
              {/* 추가 정보가 있는 경우 표시 */}
              {Object.entries(selectedRange).map(([key, value]) => {
                if (![amountRangeKey, countKey, volumeKey, percentageKey].includes(key)) {
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
      
      {/* 통계 요약 */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
            <h5 className="text-xs text-gray-500 mb-1">총 거래 건수</h5>
            <p className="text-lg font-semibold">
              {data.reduce((sum, item) => sum + item[countKey], 0).toLocaleString()}건
            </p>
          </div>
          <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
            <h5 className="text-xs text-gray-500 mb-1">총 거래량</h5>
            <p className="text-lg font-semibold">
              {data.reduce((sum, item) => sum + item[volumeKey], 0).toLocaleString()} 토큰
            </p>
          </div>
          <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
            <h5 className="text-xs text-gray-500 mb-1">평균 거래 금액</h5>
            <p className="text-lg font-semibold">
              {(data.reduce((sum, item) => sum + item[volumeKey], 0) / 
                data.reduce((sum, item) => sum + item[countKey], 0)).toFixed(2)} 토큰
            </p>
          </div>
          <div className="p-3 border border-gray-200 rounded-md bg-gray-50">
            <h5 className="text-xs text-gray-500 mb-1">최다 거래 범위</h5>
            <p className="text-lg font-semibold">
              {data.reduce((max, item) => item[countKey] > max.count ? { range: item[amountRangeKey], count: item[countKey] } : max, { range: '', count: 0 }).range}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

ExchangeAmountDistributionChart.propTypes = {
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
  onRangeClick: PropTypes.func,
  exchangeType: PropTypes.oneOf(Object.values(EXCHANGE_TYPES)),
  onExchangeTypeChange: PropTypes.func,
  amountRangeKey: PropTypes.string,
  countKey: PropTypes.string,
  volumeKey: PropTypes.string,
  percentageKey: PropTypes.string,
};

ExchangeAmountDistributionChart.defaultProps = {
  chartType: CHART_TYPES.BAR,
  title: '교환 금액 분포',
  description: '토큰 교환 금액의 분포 및 빈도',
  loading: false,
  onChartTypeChange: null,
  showLegend: true,
  height: 400,
  tooltipFormatter: null,
  className: '',
  onRangeClick: null,
  exchangeType: EXCHANGE_TYPES.BOTH,
  onExchangeTypeChange: null,
  amountRangeKey: 'range',
  countKey: 'count',
  volumeKey: 'volume',
  percentageKey: 'percentage',
};

// 차트 유형 및 교환 유형 상수 내보내기
ExchangeAmountDistributionChart.CHART_TYPES = CHART_TYPES;
ExchangeAmountDistributionChart.EXCHANGE_TYPES = EXCHANGE_TYPES;

export default ExchangeAmountDistributionChart;
