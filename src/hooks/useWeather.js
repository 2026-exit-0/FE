import { useState, useEffect } from 'react';
import client, { isMock } from '../api/client';

// 서울 기준 기본 위치 좌표
const DEFAULT_LAT = 37.5665;
const DEFAULT_LON = 126.9780;

const useWeather = () => {
  const [weather, setWeather] = useState({
    temp: 22,
    humidity: 50,
    uv: 'moderate',
    dust: 'good',
    region: '서울',
    advice: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWeatherData = async (lat, lon) => {
      try {
        setLoading(true);

        // 1. BE 연동 모드일 때 (GET /weather?lat=...&lon=...)
        if (!isMock) {
          try {
            const params = {};
            if (lat != null && lon != null) {
              params.lat = lat;
              params.lon = lon;
            }
            const res = await client.get('/weather', { params });
            const data = res.data; // WeatherOut: { region, temperature, humidity, uv_index, advice, ... }

            // uv_index 한글 라벨 매핑 ("낮음" -> "low", "보통" -> "moderate", "높음" -> "high", "매우높음" -> "very-high")
            let mappedUv = 'moderate';
            if (data.uv_index === '낮음') mappedUv = 'low';
            else if (data.uv_index === '높음') mappedUv = 'high';
            else if (data.uv_index === '매우높음') mappedUv = 'very-high';

            setWeather({
              temp: Math.round(data.temperature ?? 22),
              humidity: Math.round(data.humidity ?? 50),
              uv: mappedUv,
              dust: 'good',
              region: data.region || '현재 위치',
              advice: data.advice || '',
              raw: data,
            });
            setError(null);
            return;
          } catch (beErr) {
            console.warn('BE weather endpoint failed, fallback to direct Open-Meteo:', beErr);
          }
        }

        // 2. Mock 모드이거나 BE 연동 실패 시 Direct Open-Meteo Fallback
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m&daily=uv_index_max&timezone=Asia%2FSeoul&forecast_days=1`;
        const weatherRes = await fetch(weatherUrl).catch(() => null);

        let currentTemp = 22;
        let currentHumidity = 50;
        let mappedUv = 'moderate';

        if (weatherRes && weatherRes.ok) {
          const data = await weatherRes.json();
          currentTemp = Math.round(data.current?.temperature_2m ?? 22);
          currentHumidity = Math.round(data.current?.relative_humidity_2m ?? 50);
          const uvValue = data.daily?.uv_index_max?.[0] ?? 4;

          if (uvValue < 3) mappedUv = 'low';
          else if (uvValue < 6) mappedUv = 'moderate';
          else if (uvValue < 8) mappedUv = 'high';
          else mappedUv = 'very-high';
        }

        setWeather({
          temp: currentTemp,
          humidity: currentHumidity,
          uv: mappedUv,
          dust: 'good',
          region: '현재 위치',
          advice: '',
        });
        setError(null);
      } catch (err) {
        console.error('Weather fetch error:', err);
        setError('날씨 정보를 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };

    // Geolocation API로 사용자 실제 위치 확인
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeatherData(latitude, longitude);
        },
        () => {
          // 위치 권한 거부/에러 시 기본 좌표로 조회
          fetchWeatherData(DEFAULT_LAT, DEFAULT_LON);
        },
        { timeout: 5000 }
      );
    } else {
      fetchWeatherData(DEFAULT_LAT, DEFAULT_LON);
    }
  }, []);

  return { weather, loading, error };
};

export default useWeather;
