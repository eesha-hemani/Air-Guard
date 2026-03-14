// ------------------------------
// Symptom Weights (Max ~60)
// ------------------------------
const symptomWeights = {
  cough_night: 8,
  cough_exercise: 7,
  chest_tightness: 12,
  shortness_breath: 18,
  trouble_talking: 7,
  panic_anxiety: 2,
  fatigue: 2,
  chest_pain: 4
};

// ------------------------------
// Calculate Symptom Score
// ------------------------------
export function getSymptomScore(){

  const symptoms = document.querySelectorAll("input[name='symptom']:checked");

  let score = 0;

  symptoms.forEach(symptom => {
    const weight = symptomWeights[symptom.value];

    if(weight){
      score += weight;
    }
  });

  return score;
}


// ------------------------------
// Final Risk Calculation
// ------------------------------
export function calculateRisk(symptomScore, envData){

  let score = 0;

  // ------------------------------
  // Symptom contribution (max ~60)
  // ------------------------------
  score += symptomScore;


  // ------------------------------
  // Environmental factors (max ~40)
  // ------------------------------

  // AQI
  if(envData.aqi > 150){
    score += 25;
  }
  else if(envData.aqi > 100){
    score += 15;
  }
  else if(envData.aqi > 50){
    score += 8;
  }

  // Humidity
  if(envData.humidity > 70 || envData.humidity < 30){
    score += 10;
  }
  else if(envData.humidity > 60 || envData.humidity < 40){
    score += 5;
  }

  // Temperature extremes
  if(envData.temperature > 35 || envData.temperature < 10){
    score += 5;
  }


  // ------------------------------
  // Risk Level Classification
  // ------------------------------

  let level = "Low";

  if(score > 60){
    level = "High";
  }
  else if(score > 30){
    level = "Moderate";
  }

  return {
    score: score,
    level: level
  };
}