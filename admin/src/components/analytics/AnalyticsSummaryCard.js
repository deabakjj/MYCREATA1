/**
 * 분석 요약 카드 컴포넌트
 * 분석 결과의 주요 인사이트를 요약해서 보여주는 카드 컴포넌트입니다.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Info, AlertTriangle, Check, TrendingUp, TrendingDown, HelpCircle } from 'react-feather';

// 인사이트 타입 정의
const INSIGHT_TYPES = {
  INFO: 'info',
  WARNING: 'warning',
  SUCCESS: 'success',
  TREND_UP: 'trend_up',
  TREND_DOWN: 'trend_down',
  TIP: 'tip',
};

// 인사이트 타입에 따른 아이콘 및 스타일 매핑
const insightStyles = {
  [INSIGHT_TYPES.INFO]: {
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  [INSIGHT_TYPES.WARNING]: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  [INSIGHT_TYPES.SUCCESS]: {
    icon: Check,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  [INSIGHT_TYPES.TREND_UP]: {
    icon: TrendingUp,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
  },
  [INSIGHT_TYPES.TREND_DOWN]: {
    icon: TrendingDown,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  [INSIGHT_TYPES.TIP]: {
    icon: HelpCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
};

const AnalyticsSummaryCard = ({
  title,
  insights,
  expandable,
  onViewDetails,
  className,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  // 인사이트 렌더링
  const renderInsights = () => {
    const displayInsights = isExpanded ? insights : insights.slice(0, 3);

    return displayInsights.map((insight, index) => {
      const { icon: Icon, color, bgColor } = insightStyles[insight.type || INSIGHT_TYPES.INFO];

      return (
        <div
          key={index}
          className={`flex p-3 mb-2 rounded-md ${bgColor} last:mb-0`}
        >
          <div className="mr-3">
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <div className="flex-1">
            <p className={`text-sm font-medium ${color}`}>{insight.title}</p>
            <p className="text-sm text-gray-600">{insight.description}</p>
            {insight.data && (
              <div className="flex items-center mt-1 space-x-4">
                {Object.entries(insight.data).map(([key, value], idx) => (
                  <div key={idx} className="flex items-center space-x-1">
                    <span className="text-xs text-gray-500">{key}:</span>
                    <span className="text-xs font-medium">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  // 더 보기 버튼 렌더링
  const renderMoreButton = () => {
    if (!expandable || insights.length <= 3) return null;

    return (
      <button
        type="button"
        className="mt-3 text-sm text-indigo-600 hover:text-indigo-800 focus:outline-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? '접기' : `${insights.length - 3}개 더 보기`}
      </button>
    );
  };

  // 상세 보기 버튼 렌더링
  const renderViewDetailsButton = () => {
    if (!onViewDetails) return null;

    return (
      <button
        type="button"
        className="mt-3 ml-auto text-sm text-indigo-600 hover:text-indigo-800 focus:outline-none"
        onClick={onViewDetails}
      >
        상세 보기
      </button>
    );
  };

  return (
    <div className={`p-4 bg-white rounded-lg shadow ${className}`}>
      <h3 className="mb-3 text-base font-medium text-gray-800">{title}</h3>
      <div className="space-y-3">
        {renderInsights()}
        <div className="flex items-center justify-between">
          {renderMoreButton()}
          {renderViewDetailsButton()}
        </div>
      </div>
    </div>
  );
};

AnalyticsSummaryCard.propTypes = {
  title: PropTypes.string.isRequired,
  insights: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.oneOf(Object.values(INSIGHT_TYPES)),
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      data: PropTypes.object,
    })
  ).isRequired,
  expandable: PropTypes.bool,
  onViewDetails: PropTypes.func,
  className: PropTypes.string,
};

AnalyticsSummaryCard.defaultProps = {
  expandable: true,
  onViewDetails: null,
  className: '',
};

// 인사이트 타입들을 내보내기
AnalyticsSummaryCard.INSIGHT_TYPES = INSIGHT_TYPES;

export default AnalyticsSummaryCard;
