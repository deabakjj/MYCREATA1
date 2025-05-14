/**
 * 사용자 전환률 차트 컴포넌트
 * Web2 사용자에서 Web3 사용자로의 전환률을 시각화합니다.
 */
import React, { useState, useEffect } from 'react';
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
} from 'recharts';
import { Info } from 'react-feather';

// 차트 유형 정의
const CHART_TYPES = {
  LINE: 'line',
  BAR: 'bar',
  PIE: 'pie',
};

// 차트 색상 정의
const COLORS = {
  signups: '#4f46e5', // 인디고
  wallets: '#0ea5e9', // 스카이 블루
  transactions: '#10b981', // 에메랄드
  retention: '#f59e0b', // 앰버
  active: '#06b6d4', // 시안
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
            : `${entry.value}${entry.name.includes('비율') ? '%' : ''}`;
          
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
        {value}
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

const UserConversionChart = ({
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
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedMetrics, setSelectedMetrics] = useState([]);

  // 데이터의 메트릭 이름 추출
  useEffect(() => {
    if (data.length > 0) {
      // date/time 키를 제외한 데이터 키들을 메트릭으로 간주
      const metrics = Object.keys(data[0]).filter(
        (key) => !['date', 'time', 'timestamp', 'period', 'name', 'value'].includes(key)
      );
      setSelectedMetrics(metrics);
    }
  }, [data]);

  // 메트릭 토글 핸들러
  const handleMetricToggle = (metric) => {
    setSelectedMetrics((prev) =>
      prev.includes(metric)
        ? prev.filter((m) => m !== metric)
        : [...prev, metric]
    );
  };

  // 파이 차트 섹터 클릭 핸들러
  const handlePieEnter = (_, index) => {
    setActiveIndex(index);
  };

  // 선 차트 렌더링
  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip content={<CustomTooltip formatter={tooltipFormatter} />} />
        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: 20 }}
            onClick={(e) => handleMetricToggle(e.dataKey)}
          />
        )}
        {selectedMetrics.map((metric) => (
          <Line
            key={metric}
            type="monotone"
            dataKey={metric}
            name={getMetricLabel(metric)}
            stroke={COLORS[metric] || '#8884d8'}
            activeDot={{ r: 8, onClick: (e) => onDataPointClick && onDataPointClick(e, metric) }}
            strokeWidth={2}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );

  // 바 차트 렌더링
  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip content={<CustomTooltip formatter={tooltipFormatter} />} />
        {showLegend && (
          <Legend
            wrapperStyle={{ paddingTop: 20 }}
            onClick={(e) => handleMetricToggle(e.dataKey)}
          />
        )}
        {selectedMetrics.map((metric, index) => (
          <Bar
            key={metric}
            dataKey={metric}
            name={getMetricLabel(metric)}
            fill={COLORS[metric] || `#${Math.floor(Math.random() * 16777215).toString(16)}`}
            onClick={(e) => onDataPointClick && onDataPointClick(e, metric)}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );

  // 파이 차트 렌더링
  const renderPieChart = () => {
    // 선택된 메트릭이 없으면 첫 번째 메트릭 선택
    if (selectedMetrics.length === 0 && data.length > 0) {
      const firstMetric = Object.keys(data[0]).find(
        (key) => !['date', 'time', 'timestamp', 'period', 'name'].includes(key)
      );
      
      if (firstMetric) {
        setSelectedMetrics([firstMetric]);
      }
    }

    // 파이 차트용 데이터 준비
    const pieData = [];
    if (data.length > 0 && selectedMetrics.length > 0) {
      // 가장 최근 데이터 포인트 사용
      const latestData = data[data.length - 1];
      
      Object.keys(latestData).forEach((key) => {
        if (selectedMetrics.includes(key)) {
          pieData.push({
            name: getMetricLabel(key),
            value: latestData[key],
            metric: key,
          });
        }
      });
    }

    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            data={pieData}
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            onMouseEnter={handlePieEnter}
            onClick={(e) => onDataPointClick && onDataPointClick(e, e.metric)}
          >
            {pieData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[entry.metric] || `#${Math.floor(Math.random() * 16777215).toString(16)}`}
              />
            ))}
          </Pie>
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: 20 }}
              onClick={(e) => handleMetricToggle(e.dataKey)}
            />
          )}
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // 메트릭 이름을 보기 좋은 레이블로 변환
  const getMetricLabel = (metric) => {
    const metricLabels = {
      signups: '회원가입',
      wallets: '지갑 생성',
      transactions: '트랜잭션',
      retention: '유지율',
      active: '활성 사용자',
      conversionRate: '전환율',
      webSignups: 'Web2 가입',
      web3Signups: 'Web3 가입',
      walletCreationRate: '지갑 생성률',
      averageDwellTime: '평균 체류 시간',
    };

    return metricLabels[metric] || metric;
  };

  // 차트 유형 변경 핸들러
  const handleChartTypeChange = (type) => {
    if (onChartTypeChange) {
      onChartTypeChange(type);
    }
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
          </div>
        </div>
      </div>
      
      <div className="p-4">
        {chartType === CHART_TYPES.LINE && renderLineChart()}
        {chartType === CHART_TYPES.BAR && renderBarChart()}
        {chartType === CHART_TYPES.PIE && renderPieChart()}
      </div>
    </div>
  );
};

UserConversionChart.propTypes = {
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
};

UserConversionChart.defaultProps = {
  chartType: CHART_TYPES.LINE,
  title: '사용자 전환률',
  description: '',
  loading: false,
  onChartTypeChange: null,
  showLegend: true,
  height: 400,
  tooltipFormatter: null,
  className: '',
  onDataPointClick: null,
};

// 차트 유형 상수 내보내기
UserConversionChart.CHART_TYPES = CHART_TYPES;

export default UserConversionChart;
