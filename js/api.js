// Fetch Weather Data
async function getWeather(city){

 const apiKey = "33f462d170af4975404810328fd703d3";

 const response = await fetch(
  `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
 );

 const data = await response.json();

 return {
  temperature: data.main.temp,
  humidity: data.main.humidity
 };
}


// Fetch AQI Data
async function getAQI(city){

 const token = "132c4ecbee0e4f70d60cacc5f12e5100eb13dc04";

 const response = await fetch(
  `https://api.waqi.info/feed/${city}/?token=${token}`
 );

 const data = await response.json();

 return {
  aqi: data.data.aqi
 };
}


// Combine Environmental Data
export async function getEnvironmentalData(city){

 const weather = await getWeather(city);
 const air = await getAQI(city);

 return {
  temperature: weather.temperature,
  humidity: weather.humidity,
  aqi: air.aqi
 };
}