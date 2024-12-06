import React, { useState } from "react";

interface DateSelectionModalProps {
  onClose: () => void;
  onConfirm: (selectedDates: string[]) => void;
}

const DateSelectionModal: React.FC<DateSelectionModalProps> = ({ onClose, onConfirm }) => {
  const [dates, setDates] = useState<string[]>([]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (e.target.checked) {
      setDates((prevDates) => [...prevDates, value]);
    } else {
      setDates((prevDates) => prevDates.filter((date) => date !== value));
    }
  };

  const handleConfirm = () => {
    onConfirm(dates); // Passa as datas selecionadas de volta ao modal pai
  };

  return (
    <div className="date-selection-modal">
      <h3>Select Dates</h3>
      <div>
        <label>
          <input
            type="checkbox"
            value="2024-12-01"
            onChange={handleDateChange}
          />
          1st December 2024
        </label>
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            value="2024-12-02"
            onChange={handleDateChange}
          />
          2nd December 2024
        </label>
      </div>
      {/* Adicione mais opções de datas conforme necessário */}
      <div>
        <button onClick={handleConfirm}>Confirm Dates</button>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default DateSelectionModal;
