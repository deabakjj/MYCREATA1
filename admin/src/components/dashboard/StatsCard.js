import React from 'react';
import PropTypes from 'prop-types';

/**
 * 통계 카드 컴포넌트
 * @param {Object} props - 속성
 * @param {string} props.title - 카드 제목
 * @param {string} props.value - 주요 값
 * @param {string} props.subtitle - 부제목
 * @param {React.ReactNode} props.icon - 아이콘
 * @param {string} props.color - 색상 (blue, green, purple, orange)
 */
const StatsCard = ({ title, value, subtitle, icon, color = 'blue' }) => {
  // 색상 클래스 매핑
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-500 border-blue-100',
    green: 'bg-green-50 text-green-500 border-green-100',
    purple: 'bg-purple-50 text-purple-500 border-purple-100',
    orange: 'bg-orange-50 text-orange-500 border-orange-100',
    red: 'bg-red-50 text-red-500 border-red-100'
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-600 font-medium text-sm">{title}</h3>
        <div className={`p-2 rounded-md ${colorClasses[color] || colorClasses.blue}`}>
          {icon}
        </div>
      </div>
      
      <div className="flex flex-col space-y-2">
        <p className="text-3xl font-bold text-gray-800">{value}</p>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
};

StatsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.node,
  color: PropTypes.oneOf(['blue', 'green', 'purple', 'orange', 'red'])
};

export default StatsCard;
