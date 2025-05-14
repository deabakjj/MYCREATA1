/**
 * 내보내기 버튼 컴포넌트
 * 분석 데이터를 다양한 형식(CSV, Excel, PDF)으로 내보내는 기능을 제공합니다.
 */
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Download, FileText, File, ChevronDown } from 'react-feather';

const ExportButtons = ({ onExport, exportableFormats, className, label }) => {
  const [isOpen, setIsOpen] = useState(false);

  // 내보내기 형식에 따른 아이콘 매핑
  const formatIcons = {
    csv: <FileText className="w-4 h-4 mr-2" />,
    excel: <File className="w-4 h-4 mr-2" />,
    pdf: <File className="w-4 h-4 mr-2" />,
    image: <File className="w-4 h-4 mr-2" />,
  };

  // 내보내기 형식 레이블 매핑
  const formatLabels = {
    csv: 'CSV 파일',
    excel: 'Excel 파일',
    pdf: 'PDF 문서',
    image: '이미지 파일',
  };

  // 내보내기 핸들러
  const handleExport = (format) => {
    if (onExport) {
      onExport(format);
    }
    setIsOpen(false);
  };

  // 지원하는 내보내기 형식 필터링
  const availableFormats = Object.keys(formatLabels).filter(
    (format) => exportableFormats.includes(format)
  );

  // 드롭다운 버튼이 있는 경우
  if (availableFormats.length > 1) {
    return (
      <div className={`relative ${className}`}>
        <button
          type="button"
          className="flex items-center px-3 py-2 text-sm text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Download className="w-4 h-4 mr-2" />
          <span className="mr-1">{label}</span>
          <ChevronDown className="w-4 h-4" />
        </button>

        {isOpen && (
          <div className="absolute right-0 z-10 w-40 mt-1 bg-white rounded-md shadow-lg">
            <div className="py-1">
              {availableFormats.map((format) => (
                <button
                  key={format}
                  type="button"
                  className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 focus:outline-none"
                  onClick={() => handleExport(format)}
                >
                  {formatIcons[format]}
                  {formatLabels[format]}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 단일 버튼인 경우 (형식이 하나만 지원되는 경우)
  if (availableFormats.length === 1) {
    const format = availableFormats[0];
    return (
      <button
        type="button"
        className={`flex items-center px-3 py-2 text-sm text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${className}`}
        onClick={() => handleExport(format)}
      >
        <Download className="w-4 h-4 mr-2" />
        <span>{label}</span>
      </button>
    );
  }

  // 지원되는 형식이 없는 경우
  return null;
};

ExportButtons.propTypes = {
  onExport: PropTypes.func.isRequired,
  exportableFormats: PropTypes.arrayOf(
    PropTypes.oneOf(['csv', 'excel', 'pdf', 'image'])
  ),
  className: PropTypes.string,
  label: PropTypes.string,
};

ExportButtons.defaultProps = {
  exportableFormats: ['csv', 'excel', 'pdf'],
  className: '',
  label: '내보내기',
};

export default ExportButtons;
