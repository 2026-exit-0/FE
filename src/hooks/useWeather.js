import { useState, useEffect } from 'react';

// 서울 기준 기본 위치 좌표
const DEFAULT_LAT = 37.5665;
const DEFAULT_LON = 126.9780;

const useWeather = () => {
  const [weather, setWeather] = useState({
    temp: 22,
    humidity: 50,
    uv: 'moderate',
    dust: 'moderate',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWeatherData = async (lat, lon) => {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m&daily=uv_index_max&timezone=Asia%2FSeoul&forecast_days=1`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Weather API request failed');
        const data = await res.json();

        const currentTemp = Math.round(data.current?.temperature_2m ?? 22);
        const currentHumidity = Math.round(data.current?.relative_humidity_2m ?? 50);
        const uvValue = data.daily?.uv_index_max?.[0] ?? 4;

        // UV Index 지수 매핑
        let mappedUv = 'moderate';
        if (uvValue < 3) mappedUv = 'low';
        else if (uvValue < 6) mappedUv = 'moderate';
        else if (uvValue < 8) mappedUv = 'high';
        else mappedUv = 'very-high';

        setWeather({
          temp: currentTemp,
          humidity: currentHumidity,
          uv: mappedUv,
          dust: 'moderate', // 오픈 API에서 실시간 미세먼지는 지원하지 않으므로 기본값 유지
        });
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
          // 위치 권한 거부 시 서울 기준 날씨 조회
          fetchWeatherData(DEFAULT_LAT, DEFAULT_LON);
        },
        { timeout: 5000 }
      );
    } else {
      // Geolocation 미지원 시 서울 기준 날씨 조회
      fetchWeatherData(DEFAULT_LAT, DEFAULT_LON);
    }
  }, []);

  return { weather, loading, error };
};

export default useWeather;
