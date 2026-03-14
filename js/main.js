import { getSymptomScore, calculateRisk } from "./riskCalc.js";
import { getEnvironmentalData } from "./api.js";

/* ---------------------------
   RISK PAGE BUTTON HANDLER
--------------------------- */

const analyzeBtn = document.getElementById("analyzeBtn");

if (analyzeBtn) {

  analyzeBtn.addEventListener("click", async () => {

    // Get weighted symptom score
    const symptomScore = getSymptomScore();
    localStorage.setItem("symptomScore", symptomScore);

    const city = "Bangalore";

    // Fetch environmental data
    const data = await getEnvironmentalData(city);

    localStorage.setItem("aqi", data.aqi);
    localStorage.setItem("temperature", data.temperature);
    localStorage.setItem("humidity", data.humidity);

    // Calculate final risk
    const risk = calculateRisk(symptomScore, {
      aqi: data.aqi,
      humidity: data.humidity,
      temperature: data.temperature
    });

    localStorage.setItem("riskScore", risk.score);
    localStorage.setItem("riskLevel", risk.level);

    // Go to results page
    window.location.href = "result.html";

  });

}

/* ---------------------------
   RESULT PAGE DISPLAY
--------------------------- */

function loadResultData(){

  const aqi = Number(localStorage.getItem("aqi"));
  const temp = Number(localStorage.getItem("temperature"));
  const humidity = Number(localStorage.getItem("humidity"));
  const symptoms = Number(localStorage.getItem("symptomScore"));

  const riskScore = Number(localStorage.getItem("riskScore"));
  const riskLevel = localStorage.getItem("riskLevel");

  if(document.getElementById("aqi")){
    document.getElementById("aqi").textContent = aqi;
  }

  if(document.getElementById("temp")){
    document.getElementById("temp").textContent = temp + "°C";
  }

  if(document.getElementById("humidity")){
    document.getElementById("humidity").textContent = humidity + "%";
  }

  if(document.getElementById("risk-score")){
    document.getElementById("risk-score").textContent = riskScore;
  }

  if(document.getElementById("risk-label")){
    document.getElementById("risk-label").textContent = riskLevel + " RISK";
  }

  generateSummary(riskScore, aqi, temp, humidity, symptoms);
  setupPDF(riskScore, riskLevel, aqi, temp, humidity, symptoms);
}

/* ---------------------------
   RISK SUMMARY GENERATOR
--------------------------- */

function generateSummary(score, aqi, temp, humidity, symptoms){

  const list = document.getElementById("summary-points");
  if(!list) return;

  list.innerHTML = "";

  let points = [];

  if(score < 30){

    points = [
      "Your asthma risk is currently LOW based on reported symptoms and environmental conditions.",
      "Air Quality Index of " + aqi + " indicates relatively clean air with minimal respiratory irritation.",
      "Temperature of " + temp + "°C is within a comfortable breathing range.",
      "Humidity at " + humidity + "% is unlikely to trigger airway constriction.",
      "Continue routine asthma management and stay aware of symptom changes.",
      "Avoid sudden exposure to dust, smoke, or strong pollutants."
    ];

  }

  else if(score < 60){

    points = [
      "Your asthma risk is MODERATE based on symptom reporting and environmental exposure.",
      "AQI level of " + aqi + " may irritate sensitive airways.",
      "Humidity levels around " + humidity + "% may worsen breathing discomfort for some individuals.",
      "You reported symptoms totaling a score of " + symptoms + ", suggesting airway sensitivity.",
      "Consider reducing outdoor activity if pollution levels increase.",
      "Keep your inhaler or rescue medication accessible.",
      "Monitor symptoms closely throughout the day."
    ];

  }

  else{

    points = [
      "Your asthma risk is HIGH and may indicate a possible asthma exacerbation.",
      "AQI level of " + aqi + " poses significant respiratory stress.",
      "Multiple or severe symptoms suggest possible airway obstruction.",
      "Environmental conditions may intensify breathing difficulty.",
      "Immediate access to prescribed inhalers is strongly recommended.",
      "Avoid strenuous physical activity and outdoor pollution exposure.",
      "Seek medical assistance if breathing becomes difficult or symptoms worsen."
    ];

  }

  points.forEach(point => {

    const li = document.createElement("li");
    li.textContent = point;
    li.style.marginBottom = "8px";

    list.appendChild(li);

  });

}

/* ---------------------------
   PDF REPORT GENERATOR
--------------------------- */

function setupPDF(score, level, aqi, temp, humidity, symptoms){

  const btn = document.getElementById("download-report");
  if(!btn) return;

  btn.addEventListener("click", () => {

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("AirGuard Asthma Risk Assessment Report", 20, 20);

    doc.setFontSize(12);

    doc.text("Risk Score: " + score, 20, 40);
    doc.text("Risk Level: " + level, 20, 50);

    doc.text("Environmental Data", 20, 70);
    doc.text("AQI: " + aqi, 20, 80);
    doc.text("Temperature: " + temp + "°C", 20, 90);
    doc.text("Humidity: " + humidity + "%", 20, 100);

    doc.text("Symptom Score: " + symptoms + " / 60", 20, 120);

    doc.text("Medical Interpretation:", 20, 140);

    doc.text(
      "This report estimates asthma risk using environmental exposure data and symptom severity indicators. " +
      "Higher scores represent an increased likelihood of airway irritation or asthma exacerbation. " +
      "Environmental pollutants such as particulate matter and unfavorable humidity levels can aggravate asthma symptoms. " +
      "Users experiencing persistent breathing difficulty should seek professional medical consultation.",
      20,
      150,
      { maxWidth: 170 }
    );

    doc.save("AirGuard_Asthma_Report.pdf");

  });

}

loadResultData();