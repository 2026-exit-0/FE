import { useState, useEffect } from 'react';
import client from '../api/client';

// 기본 좌표 (서울)
const DEFAULT_LAT = 37.5665;
const DEFAULT_LON = 126.9780;

const useWeather = () => {
  const [weather, setWeather] = useState({
    temp: 22,
    humidity: 50,
    uv: 'moderate',
    region: '서울',
    advice: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBEWeather = async (lat, lon) => {
      try {
        setLoading(true);
        const params = {};
        if (lat != null && lon != null) {
          params.lat = lat;
          params.lon = lon;
        }

        // BE 정식 날씨 API 호출: GET /weather
        const res = await client.get('/weather', { params });
        const data = res.data; // WeatherOut: { region, temperature, humidity, uv_index, advice }

        let mappedUv = 'moderate';
        if (data.uv_index === '낮음') mappedUv = 'low';
        else if (data.uv_index === '높음') mappedUv = 'high';
        else if (data.uv_index === '매우높음') mappedUv = 'very-high';

        setWeather({
          temp: Math.round(data.temperature ?? 22),
          humidity: Math.round(data.humidity ?? 50),
          uv: mappedUv,
          region: data.region || '서울',
          advice: data.advice || '',
          raw: data,
        });
        setError(null);
      } catch (err) {
        console.error('BE Weather API fetch error:', err);
        setError('날씨 정보를 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchBEWeather(latitude, longitude);
        },
        () => {
          fetchBEWeather(DEFAULT_LAT, DEFAULT_LON);
        },
        { timeout: 5000 }
      );
    } else {
      fetchBEWeather(DEFAULT_LAT, DEFAULT_LON);
    }
  }, []);

  return { weather, loading, error };
};

export default useWeather;
