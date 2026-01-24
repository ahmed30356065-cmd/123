import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDownIcon, SearchIcon, CheckCircleIcon } from '../icons';

interface Option {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder = 'Select an option' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(() => options.find(opt => opt.value === value), [options, value]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(opt =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [options, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-right px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
      >
        <span className={selectedOption ? 'text-neutral-100' : 'text-neutral-400'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDownIcon className={`w-5 h-5 text-neutral-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-30 mt-1 w-full bg-gray-800 shadow-lg rounded-md border border-gray-600 max-h-60 flex flex-col">
          <div className="p-2 border-b border-gray-700 relative">
            <SearchIcon className="absolute top-1/2 left-4 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="ابحث..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-900 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 placeholder:text-neutral-500"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full text-right px-4 py-3 text-sm flex justify-between items-center transition-colors ${value === opt.value ? 'bg-red-500/20 text-red-400' : 'text-neutral-200 hover:bg-gray-700'}`}
                >
                  <div>
                    <p className="font-semibold">{opt.label}</p>
                    {opt.sublabel && <p className="text-xs text-neutral-400">{opt.sublabel}</p>}
                  </div>
                  {value === opt.value && <CheckCircleIcon className="w-5 h-5" />}
                </button>
              ))
            ) : (
              <p className="text-center text-neutral-500 py-4">لا توجد نتائج.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;