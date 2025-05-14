/**
 * 날짜 범위 선택 컴포넌트
 * 분석 페이지에서 데이터의 날짜 범위를 필터링하는 데 사용됩니다.
 */
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, ChevronDown } from 'react-feather';

// 미리 정의된 날짜 범위 옵션
const PRESET_RANGES = [
  { label: '오늘', getValue: () => [new Date(), new Date()] },
  { label: '어제', getValue: () => [subDays(new Date(), 1), subDays(new Date(), 1)] },
  { label: '지난 7일', getValue: () => [subDays(new Date(), 6), new Date()] },
  { label: '지난 30일', getValue: () => [subDays(new Date(), 29), new Date()] },
  { label: '이번 주', getValue: () => [startOfWeek(new Date(), { weekStartsOn: 1 }), endOfWeek(new Date(), { weekStartsOn: 1 })] },
  { label: '이번 달', getValue: () => [startOfMonth(new Date()), endOfMonth(new Date())] },
  { label: '이번 분기', getValue: () => {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3);
    const startMonth = quarter * 3;
    return [
      new Date(now.getFullYear(), startMonth, 1),
      new Date(now.getFullYear(), startMonth + 3, 0)
    ];
  }},
  { label: '올해', getValue: () => [startOfYear(new Date()), endOfYear(new Date())] },
];

const DateRangePicker = ({ onChange, initialDateRange, className }) => {
  const [startDate, setStartDate] = useState(initialDateRange?.[0] || subDays(new Date(), 29));
  const [endDate, setEndDate] = useState(initialDateRange?.[1] || new Date());
  const [isOpen, setIsOpen] = useState(false);
  const [displayLabel, setDisplayLabel] = useState('날짜 범위 선택');
  const dropdownRef = useRef(null);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 날짜 범위가 변경될 때마다 표시 레이블 업데이트
  useEffect(() => {
    updateDisplayLabel();
    
    if (onChange) {
      onChange([startDate, endDate]);
    }
  }, [startDate, endDate]);

  // 초기 날짜 범위가 변경될 때 상태 업데이트
  useEffect(() => {
    if (initialDateRange?.length === 2) {
      setStartDate(initialDateRange[0]);
      setEndDate(initialDateRange[1]);
    }
  }, [initialDateRange]);

  // 표시 레이블 업데이트 함수
  const updateDisplayLabel = () => {
    const formatDate = (date) => format(date, 'yyyy.MM.dd', { locale: ko });
    const startFormatted = formatDate(startDate);
    const endFormatted = formatDate(endDate);

    // 미리 정의된 범위와 일치하는지 확인
    for (const range of PRESET_RANGES) {
      const [presetStart, presetEnd] = range.getValue();
      if (
        format(startDate, 'yyyy-MM-dd') === format(presetStart, 'yyyy-MM-dd') &&
        format(endDate, 'yyyy-MM-dd') === format(presetEnd, 'yyyy-MM-dd')
      ) {
        setDisplayLabel(range.label);
        return;
      }
    }

    // 일치하는 미리 정의 범위가 없으면 날짜 범위를 표시
    setDisplayLabel(`${startFormatted} ~ ${endFormatted}`);
  };

  // 미리 정의된 범위 선택 핸들러
  const handleSelectPreset = (preset) => {
    const [newStart, newEnd] = preset.getValue();
    setStartDate(newStart);
    setEndDate(newEnd);
    setIsOpen(false);
  };

  // 커스텀 날짜 선택 핸들러
  const handleDateChange = (e, isStart) => {
    const date = new Date(e.target.value);
    if (isStart) {
      setStartDate(date);
      // 시작일이 종료일보다 나중인 경우 종료일 조정
      if (date > endDate) {
        setEndDate(date);
      }
    } else {
      setEndDate(date);
      // 종료일이 시작일보다 이전인 경우 시작일 조정
      if (date < startDate) {
        setStartDate(date);
      }
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* 선택기 버튼 */}
      <button
        type="button"
        className="flex items-center px-4 py-2 text-sm border rounded-md border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Calendar className="w-4 h-4 mr-2 text-gray-500" />
        <span className="mr-2">{displayLabel}</span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute z-10 w-72 mt-1 bg-white rounded-md shadow-lg">
          <div className="p-4">
            {/* 미리 정의된 범위 */}
            <div className="mb-4">
              <h4 className="mb-2 text-xs font-medium text-gray-500">빠른 선택</h4>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_RANGES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="px-3 py-1 text-sm text-left text-gray-700 rounded hover:bg-gray-100 focus:outline-none"
                    onClick={() => handleSelectPreset(preset)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 커스텀 날짜 선택 */}
            <div>
              <h4 className="mb-2 text-xs font-medium text-gray-500">직접 선택</h4>
              <div className="space-y-2">
                <div>
                  <label htmlFor="start-date" className="block text-xs text-gray-500">
                    시작일
                  </label>
                  <input
                    id="start-date"
                    type="date"
                    className="block w-full px-3 py-2 mt-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={format(startDate, 'yyyy-MM-dd')}
                    onChange={(e) => handleDateChange(e, true)}
                    max={format(endDate, 'yyyy-MM-dd')}
                  />
                </div>
                <div>
                  <label htmlFor="end-date" className="block text-xs text-gray-500">
                    종료일
                  </label>
                  <input
                    id="end-date"
                    type="date"
                    className="block w-full px-3 py-2 mt-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={format(endDate, 'yyyy-MM-dd')}
                    onChange={(e) => handleDateChange(e, false)}
                    min={format(startDate, 'yyyy-MM-dd')}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* 적용 및 취소 버튼 */}
          <div className="flex px-4 py-2 bg-gray-50 rounded-b-md">
            <button
              type="button"
              className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={() => setIsOpen(false)}
            >
              적용
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

DateRangePicker.propTypes = {
  onChange: PropTypes.func,
  initialDateRange: PropTypes.arrayOf(PropTypes.instanceOf(Date)),
  className: PropTypes.string,
};

DateRangePicker.defaultProps = {
  onChange: () => {},
  initialDateRange: [subDays(new Date(), 29), new Date()],
  className: '',
};

export default DateRangePicker;
