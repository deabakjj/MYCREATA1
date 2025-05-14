/**
 * 분석 지표 추세 컴포넌트
 * 시간에 따른 지표의 추세를 시각화하는 작은 차트 컴포넌트입니다.
 */
import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { TrendingUp, TrendingDown } from 'react-feather';
import { Line, LineChart, ResponsiveContainer, Tooltip } from 'recharts';

const CustomTooltip = ({ active, payload, label, formatter, labelFormatter }) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const formattedValue = formatter ? formatter(value) : value;
    const formattedLabel = labelFormatter ? labelFormatter(label) : label;

    return (
      <div className="p-2 text-xs bg-white border rounded shadow">
        <p className="mb-1 font-medium">{formattedLabel}</p>
        <p className="font-medium text-indigo-600">{formattedValue}</p>
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
  labelFormatter: PropTypes.func,
};

const AnalyticsMetricTrend = ({
  title,
  currentValue,
  previousValue,
  data,
  dataKey,
  increaseIsGood,
  valueFormatter,
  dateFormat,
  className,
  height,
  onClick,
}) => {
  // 추세 계산 (증가 또는 감소)
  const trend = useMemo(() => {
    if (currentValue === previousValue) return { type: 'neutral', percentage: 0 };
    
    const isIncreasing = currentValue > previousValue;
    const percentage = previousValue !== 0
      ? Math.abs(((currentValue - previousValue) / previousValue) * 100).toFixed(1)
      : 0;
    
    return {
      type: isIncreasing ? 'increase' : 'decrease',
      percentage,
    };
  }, [currentValue, previousValue]);

  // 추세에 따른 스타일
  const getTrendStyles = () => {
    if (trend.type === 'neutral') {
      return {
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        icon: null,
      };
    }

    const isPositive = 
      (trend.type === 'increase' && increaseIsGood) || 
      (trend.type === 'decrease' && !increaseIsGood);

    if (isPositive) {
      return {
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: <TrendingUp className="w-3 h-3" />,
      };
    }

    return {
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      icon: <TrendingDown className="w-3 h-3" />,
    };
  };

  const trendStyles = getTrendStyles();
  const formattedValue = valueFormatter ? valueFormatter(currentValue) : currentValue;
  const lineColor = trendStyles.color.replace('text-', 'stroke-').replace('-600', '-500');
  
  // Tooltip 날짜 포맷터
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    if (dateFormat === 'month') {
      return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short' });
    }
    if (dateFormat === 'day') {
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString('ko-KR');
  };

  return (
    <div 
      className={`p-3 bg-white rounded-lg shadow ${className} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-xs font-medium text-gray-500">{title}</h3>
        {trend.type !== 'neutral' && (
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${trendStyles.color} ${trendStyles.bgColor}`}>
            {trendStyles.icon}
            <span className="ml-1">{trend.percentage}%</span>
          </span>
        )}
      </div>
      
      <div className="mb-3">
        <div className="text-xl font-semibold">{formattedValue}</div>
      </div>
      
      <div style={{ height: height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={`var(--${lineColor})`}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, className: trendStyles.color.replace('text', 'fill') }}
            />
            <Tooltip
              content={
                <CustomTooltip
                  formatter={valueFormatter}
                  labelFormatter={formatDate}
                />
              }
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

AnalyticsMetricTrend.propTypes = {
  title: PropTypes.string.isRequired,
  currentValue: PropTypes.number.isRequired,
  previousValue: PropTypes.number.isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  dataKey: PropTypes.string.isRequired,
  increaseIsGood: PropTypes.bool,
  valueFormatter: PropTypes.func,
  dateFormat: PropTypes.oneOf(['day', 'month', 'default']),
  className: PropTypes.string,
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onClick: PropTypes.func,
};

AnalyticsMetricTrend.defaultProps = {
  increaseIsGood: true,
  valueFormatter: null,
  dateFormat: 'default',
  className: '',
  height: 50,
  onClick: null,
};

export default AnalyticsMetricTrend;
