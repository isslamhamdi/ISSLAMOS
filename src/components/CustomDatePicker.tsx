import React from 'react';
import { motion } from 'motion/react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { fr } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { Clock } from 'lucide-react';

// Register French locale
registerLocale('fr', fr);

interface CustomDatePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  placeholderText?: string;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ selected, onChange, placeholderText }) => {
  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      className="relative w-full"
    >
      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-green z-10" />
      <DatePicker
        selected={selected}
        onChange={onChange}
        placeholderText={placeholderText}
        locale="fr"
        dateFormat="dd/MM/yyyy"
        className="w-full pl-11 pr-4 py-3 bg-white/95 backdrop-blur-sm border border-white/20 rounded-2xl text-xs shadow-md focus:outline-none focus:ring-2 focus:ring-brand-green/50 text-slate-800"
        calendarClassName="!bg-white !rounded-2xl !shadow-2xl !border !border-slate-100 !p-2"
        dayClassName={(date) => 
          "!text-slate-700 hover:!bg-brand-green/10 hover:!rounded-full !transition-colors"
        }
        popperClassName="!z-[100]"
      />
    </motion.div>
  );
};
