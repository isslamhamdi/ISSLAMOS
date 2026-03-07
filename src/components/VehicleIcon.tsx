import React from 'react';
import { motion } from 'motion/react';
import { Bus, Container, Truck } from 'lucide-react';
import { Movement } from '../types';

export const VehicleIcon = ({ type }: { type: Movement['type'] }) => {
  const Icon = () => {
    switch (type) {
      case 'bus': return <Bus className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
      case 'trailer': return <Container className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
      default: return <Truck className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
    }
  };

  return (
    <motion.div whileHover={{ scale: 1.2, rotate: 5 }}>
      <Icon />
    </motion.div>
  );
};
