import React from 'react';
import { Sun, Cloud, Droplets, Wind, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ALGERIAN_CITIES = [
  { name: "Alger", lat: 36.7538, lon: 3.0588 },
  { name: "Oran", lat: 35.6977, lon: -0.6337 },
  { name: "Constantine", lat: 36.3650, lon: 6.6147 },
  { name: "Annaba", lat: 36.9000, lon: 7.7667 },
  { name: "Biskra", lat: 34.8505, lon: 5.7280 },
  { name: "Sétif", lat: 36.1901, lon: 5.4107 },
  { name: "Ouargla", lat: 31.9500, lon: 5.3167 },
  { name: "Tamanrasset", lat: 22.7850, lon: 5.5228 },
  { name: "Bejaia", lat: 36.7500, lon: 5.0667 },
  { name: "Ghardaia", lat: 32.4833, lon: 3.6667 },
];

export const WeatherWidget = () => {
  const [weather1, setWeather1] = React.useState<{name: string, temp: number, code: number} | null>(null);
  const [weather2, setWeather2] = React.useState<{name: string, temp: number, code: number} | null>(null);

  const fetchWeatherForCity = async (city: typeof ALGERIAN_CITIES[0]) => {
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,weather_code&timezone=auto`);
      const data = await res.json();
      return { name: city.name, temp: data.current.temperature_2m, code: data.current.weather_code };
    } catch (error) {
      console.error("Erreur météo:", error);
      return null;
    }
  };

  React.useEffect(() => {
    const updateWeather = async () => {
      const shuffled = [...ALGERIAN_CITIES].sort(() => 0.5 - Math.random());
      const city1 = shuffled[0];
      const city2 = shuffled[1];

      const [w1, w2] = await Promise.all([
        fetchWeatherForCity(city1),
        fetchWeatherForCity(city2)
      ]);

      if (w1) setWeather1(w1);
      if (w2) setWeather2(w2);
    };

    updateWeather();
    const interval = setInterval(updateWeather, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const getWeatherIcon = (code: number) => {
    if (code <= 1) return <Sun className="w-5 h-5 text-accent" />;
    if (code <= 3) return <Cloud className="w-5 h-5 text-slate-400" />;
    if (code <= 67) return <Droplets className="w-5 h-5 text-blue-400" />;
    return <Wind className="w-5 h-5 text-slate-500" />;
  };

  return (
    <div className="flex items-center gap-6 px-4 py-2 bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={weather1?.name || 'loading1'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2"
        >
          {weather1 ? getWeatherIcon(weather1.code) : <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">{weather1?.name || '...'}</p>
            <p className="text-sm font-mono font-bold">{weather1 ? `${weather1.temp}°C` : '--'}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="w-px h-8 bg-slate-200" />

      <AnimatePresence mode="wait">
        <motion.div
          key={weather2?.name || 'loading2'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2"
        >
          {weather2 ? getWeatherIcon(weather2.code) : <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">{weather2?.name || '...'}</p>
            <p className="text-sm font-mono font-bold">{weather2 ? `${weather2.temp}°C` : '--'}</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
