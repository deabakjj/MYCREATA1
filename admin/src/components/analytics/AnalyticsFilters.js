/**
 * 분석 필터 컴포넌트
 * 분석 데이터에 대한 다양한 필터링 옵션을 제공합니다.
 */
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Filter, ChevronDown, ChevronUp, Check } from 'react-feather';

// 필터 옵션 유형
const FILTER_TYPES = {
  USER_SEGMENT: 'userSegment',
  ACTIVITY_TYPE: 'activityType',
  MISSION_TYPE: 'missionType',
  REWARD_TYPE: 'rewardType',
  LEVEL_RANGE: 'levelRange',
  REGISTRATION_DATE: 'registrationDate',
  WALLET_TYPE: 'walletType',
  NFT_OWNED: 'nftOwned',
};

// 사전 정의된 필터 옵션
const PREDEFINED_FILTERS = {
  [FILTER_TYPES.USER_SEGMENT]: [
    { id: 'new', label: '신규 사용자' },
    { id: 'active', label: '활성 사용자' },
    { id: 'inactive', label: '비활성 사용자' },
    { id: 'converted', label: '전환 사용자' },
    { id: 'high_value', label: '고가치 사용자' },
  ],
  [FILTER_TYPES.ACTIVITY_TYPE]: [
    { id: 'login', label: '로그인' },
    { id: 'mission_complete', label: '미션 완료' },
    { id: 'comment', label: '댓글 작성' },
    { id: 'token_exchange', label: '토큰 교환' },
    { id: 'nft_mint', label: 'NFT 발행' },
  ],
  [FILTER_TYPES.MISSION_TYPE]: [
    { id: 'daily', label: '일일 미션' },
    { id: 'weekly', label: '주간 미션' },
    { id: 'special', label: '특별 미션' },
    { id: 'group', label: '그룹 미션' },
    { id: 'user_created', label: '사용자 생성 미션' },
  ],
  [FILTER_TYPES.REWARD_TYPE]: [
    { id: 'nest_token', label: 'NEST 토큰' },
    { id: 'cta_token', label: 'CTA 토큰' },
    { id: 'badge_nft', label: '뱃지 NFT' },
    { id: 'special_nft', label: '특별 NFT' },
    { id: 'xp', label: '경험치' },
  ],
  [FILTER_TYPES.WALLET_TYPE]: [
    { id: 'eoa', label: 'EOA 지갑' },
    { id: 'aa', label: 'AA 지갑' },
  ],
};

const FilterDropdown = ({ type, options, selectedValues, onChange, title }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(selectedValues || []);

  useEffect(() => {
    setSelected(selectedValues || []);
  }, [selectedValues]);

  const handleToggle = (id) => {
    const newSelected = selected.includes(id)
      ? selected.filter(item => item !== id)
      : [...selected, id];
    
    setSelected(newSelected);
    onChange(type, newSelected);
  };

  const getSelectedCount = () => {
    return selected.length > 0 ? `(${selected.length})` : '';
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="flex items-center px-3 py-2 text-sm border rounded-md border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="mr-2">{title} {getSelectedCount()}</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {isOpen && (
        <div className="absolute z-10 w-56 mt-1 bg-white rounded-md shadow-lg">
          <div className="py-1 max-h-60 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 focus:outline-none"
                onClick={() => handleToggle(option.id)}
              >
                <span className="mr-2 w-5">
                  {selected.includes(option.id) && (
                    <Check className="w-4 h-4 text-indigo-600" />
                  )}
                </span>
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

FilterDropdown.propTypes = {
  type: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  selectedValues: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
};

const LevelRangeFilter = ({ onChange, selectedRange }) => {
  const [range, setRange] = useState(selectedRange || [0, 100]);

  const handleChange = (index, value) => {
    const newRange = [...range];
    newRange[index] = parseInt(value, 10);
    
    // 최소값과 최대값 조정
    if (index === 0 && newRange[0] > newRange[1]) {
      newRange[1] = newRange[0];
    } else if (index === 1 && newRange[1] < newRange[0]) {
      newRange[0] = newRange[1];
    }
    
    setRange(newRange);
    onChange(FILTER_TYPES.LEVEL_RANGE, newRange);
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="flex items-center px-3 py-2 text-sm border rounded-md border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        onClick={() => onChange(FILTER_TYPES.LEVEL_RANGE, range)}
      >
        <span className="mr-2">레벨 범위: {range[0]}-{range[1]}</span>
      </button>
    </div>
  );
};

LevelRangeFilter.propTypes = {
  onChange: PropTypes.func.isRequired,
  selectedRange: PropTypes.arrayOf(PropTypes.number),
};

const NFTOwnedFilter = ({ onChange, selectedValue }) => {
  const [hasNFT, setHasNFT] = useState(selectedValue);

  const handleChange = (value) => {
    setHasNFT(value);
    onChange(FILTER_TYPES.NFT_OWNED, value);
  };

  return (
    <div className="relative">
      <button
        type="button"
        className="flex items-center px-3 py-2 text-sm border rounded-md border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        onClick={() => handleChange(!hasNFT)}
      >
        <span className="mr-2">
          {hasNFT === null ? 'NFT 보유 여부' : hasNFT ? 'NFT 보유' : 'NFT 미보유'}
        </span>
      </button>
    </div>
  );
};

NFTOwnedFilter.propTypes = {
  onChange: PropTypes.func.isRequired,
  selectedValue: PropTypes.bool,
};

const AnalyticsFilters = ({ onChange, filters, availableFilters }) => {
  const [activeFilters, setActiveFilters] = useState(filters || {});

  useEffect(() => {
    setActiveFilters(filters || {});
  }, [filters]);

  const handleFilterChange = (type, value) => {
    const newFilters = {
      ...activeFilters,
      [type]: value,
    };
    
    setActiveFilters(newFilters);
    onChange(newFilters);
  };

  const renderFilters = () => {
    return (
      <div className="flex flex-wrap gap-2">
        {availableFilters.includes(FILTER_TYPES.USER_SEGMENT) && (
          <FilterDropdown
            type={FILTER_TYPES.USER_SEGMENT}
            options={PREDEFINED_FILTERS[FILTER_TYPES.USER_SEGMENT]}
            selectedValues={activeFilters[FILTER_TYPES.USER_SEGMENT]}
            onChange={handleFilterChange}
            title="사용자 세그먼트"
          />
        )}
        
        {availableFilters.includes(FILTER_TYPES.ACTIVITY_TYPE) && (
          <FilterDropdown
            type={FILTER_TYPES.ACTIVITY_TYPE}
            options={PREDEFINED_FILTERS[FILTER_TYPES.ACTIVITY_TYPE]}
            selectedValues={activeFilters[FILTER_TYPES.ACTIVITY_TYPE]}
            onChange={handleFilterChange}
            title="활동 유형"
          />
        )}
        
        {availableFilters.includes(FILTER_TYPES.MISSION_TYPE) && (
          <FilterDropdown
            type={FILTER_TYPES.MISSION_TYPE}
            options={PREDEFINED_FILTERS[FILTER_TYPES.MISSION_TYPE]}
            selectedValues={activeFilters[FILTER_TYPES.MISSION_TYPE]}
            onChange={handleFilterChange}
            title="미션 유형"
          />
        )}
        
        {availableFilters.includes(FILTER_TYPES.REWARD_TYPE) && (
          <FilterDropdown
            type={FILTER_TYPES.REWARD_TYPE}
            options={PREDEFINED_FILTERS[FILTER_TYPES.REWARD_TYPE]}
            selectedValues={activeFilters[FILTER_TYPES.REWARD_TYPE]}
            onChange={handleFilterChange}
            title="보상 유형"
          />
        )}
        
        {availableFilters.includes(FILTER_TYPES.WALLET_TYPE) && (
          <FilterDropdown
            type={FILTER_TYPES.WALLET_TYPE}
            options={PREDEFINED_FILTERS[FILTER_TYPES.WALLET_TYPE]}
            selectedValues={activeFilters[FILTER_TYPES.WALLET_TYPE]}
            onChange={handleFilterChange}
            title="지갑 유형"
          />
        )}
        
        {availableFilters.includes(FILTER_TYPES.LEVEL_RANGE) && (
          <LevelRangeFilter
            onChange={handleFilterChange}
            selectedRange={activeFilters[FILTER_TYPES.LEVEL_RANGE]}
          />
        )}
        
        {availableFilters.includes(FILTER_TYPES.NFT_OWNED) && (
          <NFTOwnedFilter
            onChange={handleFilterChange}
            selectedValue={activeFilters[FILTER_TYPES.NFT_OWNED]}
          />
        )}
      </div>
    );
  };

  return (
    <div className="mb-4">
      <div className="flex items-center mb-2">
        <Filter className="w-4 h-4 mr-2 text-gray-500" />
        <h3 className="text-sm font-medium text-gray-700">필터</h3>
      </div>
      {renderFilters()}
    </div>
  );
};

AnalyticsFilters.propTypes = {
  onChange: PropTypes.func.isRequired,
  filters: PropTypes.object,
  availableFilters: PropTypes.arrayOf(PropTypes.string),
};

AnalyticsFilters.defaultProps = {
  filters: {},
  availableFilters: Object.values(FILTER_TYPES),
};

// 필터 유형들을 내보내기
AnalyticsFilters.FILTER_TYPES = FILTER_TYPES;

export default AnalyticsFilters;
