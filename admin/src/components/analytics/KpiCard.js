/**
 * KPI 카드 컴포넌트
 * 주요 성과 지표(KPI)를 표시하는 카드 컴포넌트입니다.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { ArrowUpRight, ArrowDownRight } from 'react-feather';

const KpiCard = ({
  title,
  value,
  previousValue,
  unit,
  icon: Icon,
  change,
  changeType,
  changeLabel,
  tooltip,
  className,
  onClick,
}) => {
  // 변화율 계산 (백분율)
  const calculateChange = () => {
    if (previousValue === 0 || value === 0 || !previousValue) return null;

    const percentChange = ((value - previousValue) / previousValue) * 100;
    return {
      value: percentChange.toFixed(1),
      isPositive: percentChange > 0,
      isNegative: percentChange < 0,
    };
  };

  // 변화율이 직접 제공되지 않은 경우 계산
  const changeInfo = change !== undefined ? change : calculateChange();

  // 변화율 색상 및 아이콘 결정
  const getChangeStyles = () => {
    if (!changeInfo) return {};

    const changeValue = typeof changeInfo === 'object' ? changeInfo.value : changeInfo;
    const isPositive = 
      typeof changeInfo === 'object' 
        ? changeInfo.isPositive 
        : (changeType === 'positive' ? true : changeType === 'negative' ? false : parseFloat(changeValue) > 0);
    
    // 긍정적인 변화에 대한 색상(녹색)
    if (isPositive) {
      return {
        textColor: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: <ArrowUpRight className="w-3 h-3" />,
      };
    }
    
    // 부정적인 변화에 대한 색상(빨간색)
    if (typeof changeInfo === 'object' ? changeInfo.isNegative : parseFloat(changeValue) < 0) {
      return {
        textColor: 'text-red-600',
        bgColor: 'bg-red-100',
        icon: <ArrowDownRight className="w-3 h-3" />,
      };
    }
    
    // 변화 없음
    return {
      textColor: 'text-gray-600',
      bgColor: 'bg-gray-100',
      icon: null,
    };
  };

  // 값 포맷팅 (단위 추가)
  const formattedValue = `${value}${unit || ''}`;
  const changeStyles = getChangeStyles();

  return (
    <div 
      className={`p-4 bg-white rounded-lg shadow ${className} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
      title={tooltip}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {Icon && <Icon className="w-5 h-5 text-gray-400" />}
      </div>
      
      <div className="mb-1">
        <div className="text-2xl font-semibold">{formattedValue}</div>
      </div>
      
      {changeInfo && (
        <div className="flex items-center">
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${changeStyles.textColor} ${changeStyles.bgColor}`}>
            {changeStyles.icon}
            <span className="ml-1">
              {typeof changeInfo === 'object' ? changeInfo.value : Math.abs(parseFloat(changeInfo)).toFixed(1)}%
            </span>
          </span>
          <span className="ml-2 text-xs text-gray-500">
            {changeLabel || '지난 기간 대비'}
          </span>
        </div>
      )}
    </div>
  );
};

KpiCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  previousValue: PropTypes.number,
  unit: PropTypes.string,
  icon: PropTypes.elementType,
  change: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.string,
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
      isPositive: PropTypes.bool,
      isNegative: PropTypes.bool,
    }),
  ]),
  changeType: PropTypes.oneOf(['positive', 'negative', 'neutral']),
  changeLabel: PropTypes.string,
  tooltip: PropTypes.string,
  className: PropTypes.string,
  onClick: PropTypes.func,
};

KpiCard.defaultProps = {
  previousValue: null,
  unit: '',
  icon: null,
  change: null,
  changeType: null,
  changeLabel: '',
  tooltip: '',
  className: '',
  onClick: null,
};

export default KpiCard;
