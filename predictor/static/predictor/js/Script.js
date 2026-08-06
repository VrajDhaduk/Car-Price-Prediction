/* =========================================================
   Car Price Predictor — page scripts
   Load via: {% static 'predictor/js/script.js' %}
   Every block below is guarded with an element-existence check
   because each "page" is now its own template — a given page
   only has some of these elements on it.
   ========================================================= */

// ---------- Hero gauge animation (fills to R²=0.94) — home page only ----------
function setGauge(fillId, needleId, fraction){
  const circumference = 377; // approx arc length of the path
  const fill = document.getElementById(fillId);
  const needle = document.getElementById(needleId);
  if(!fill || !needle) return;
  const offset = circumference - (circumference * fraction);
  fill.style.strokeDashoffset = offset;
  const angle = -90 + (fraction * 180); // -90deg = start, +90deg = end
  needle.setAttribute('transform', `rotate(${angle} 150 160)`);
}
if(document.getElementById('hero-gauge-fill')){
  window.addEventListener('load', ()=>{
    setTimeout(()=> setGauge('hero-gauge-fill','hero-needle', 0.94), 300);
  });
}

// ---------- Demo: brand → model cascading dropdown, year list — demo page only ----------
// Every list below matches the exact class labels the trained encoders expect
// (Brand_encoder.pkl / Model_encoder.pkl classes_), so what gets POSTed to
// /predict/ transforms cleanly server-side.
const BRAND_MODEL_MAP = {
  "Maruti Suzuki": ["Alto", "Baleno", "Dzire", "Ertiga", "Swift", "WagonR", "Vitara Brezza"],
  "Hyundai": ["Creta", "Santro", "Venue", "Verna", "i10", "i20"],
  "Tata": ["Altroz", "Harrier", "Nexon", "Punch", "Tiago"],
  "Mahindra": ["Bolero", "Scorpio", "XUV300", "XUV500"],
  "Toyota": ["Fortuner", "Glanza", "Innova", "Yaris"],
  "Honda": ["Amaze", "City", "Jazz", "WR-V"],
  "Ford": ["EcoSport", "Endeavour", "Figo"],
  "Kia": ["Seltos", "Sonet"],
  "Volkswagen": ["Polo", "Taigun", "Vento"],
  "Renault": ["Duster", "Kwid", "Triber"],
};

const brandSelect = document.getElementById('brand');
const modelSelect = document.getElementById('model');
const yearSelect = document.getElementById('year');

if(brandSelect && modelSelect){
  Object.keys(BRAND_MODEL_MAP).forEach(brand=>{
    const opt = document.createElement('option');
    opt.value = brand;
    opt.textContent = brand;
    brandSelect.appendChild(opt);
  });

  function populateModels(){
    modelSelect.innerHTML = '';
    BRAND_MODEL_MAP[brandSelect.value].forEach(m=>{
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      modelSelect.appendChild(opt);
    });
  }
  brandSelect.addEventListener('change', populateModels);
  populateModels();
}

if(yearSelect){
  const currentYear = new Date().getFullYear();
  for(let y = currentYear; y >= currentYear - 20; y--){
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    if(y === currentYear - 4) opt.selected = true; // sensible default: ~4-year-old car
    yearSelect.appendChild(opt);
  }
}

// ---------- Demo: real prediction call to the Django backend — demo page only ----------
function formatINR(n){
  return '₹' + Math.round(n).toLocaleString('en-IN');
}
function getCookie(name){
  const match = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
  return match ? match.pop() : '';
}
async function runPrediction(){
  const errBox = document.getElementById('predict-error');
  const btn = document.querySelector('.predict-btn');
  errBox.style.display = 'none';
  btn.disabled = true;
  btn.textContent = 'Predicting…';

  const payload = {
    brand: document.getElementById('brand').value,
    model: document.getElementById('model').value,
    year: parseInt(document.getElementById('year').value),
    km_driven: parseInt(document.getElementById('mileage').value) || 0,
    fuel_type: document.getElementById('fuel').value,
    transmission: document.getElementById('trans').value,
    owner: document.getElementById('owner').value,
    city: document.getElementById('city').value,
  };

  try{
    const res = await fetch('/predict/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken'),
      },
      body: JSON.stringify(payload),
    });
    const result = await res.json();

    if(!res.ok || result.error){
      throw new Error(result.error || 'Prediction failed');
    }

    document.getElementById('demo-price').textContent = formatINR(result.price);
    document.getElementById('band-low').textContent = 'low: ' + formatINR(result.low);
    document.getElementById('band-high').textContent = 'high: ' + formatINR(result.high);

    const frac = Math.min(1, Math.max(0, (result.price - 50000) / (3000000 - 50000)));
    setGauge('demo-gauge-fill','demo-needle', frac);
  }catch(err){
    errBox.textContent = 'Could not get a prediction: ' + err.message;
    errBox.style.display = 'block';
  }finally{
    btn.disabled = false;
    btn.textContent = 'Predict price';
  }
}

// ---------- Insights: feature importance bars — insights page only ----------
const features = [
  {name:'Car age', val:0.29},
  {name:'Mileage', val:0.24},
  {name:'Brand', val:0.18},
  {name:'Engine size', val:0.12},
  {name:'Fuel type', val:0.09},
  {name:'Transmission', val:0.05},
  {name:'Owner count', val:0.03},
];
const barsEl = document.getElementById('bars');
if(barsEl){
  features.forEach(f=>{
    const row = document.createElement('div');
    row.className = 'bar-row';
    row.innerHTML = `<div class="bar-label">${f.name}</div><div class="bar-track"><div class="bar-fill" data-w="${f.val*100}"></div></div><div class="bar-val">${f.val.toFixed(2)}</div>`;
    barsEl.appendChild(row);
  });
}

// ---------- Insights: scatter plot (predicted vs actual) — insights page only ----------
function buildScatter(){
  const svg = document.getElementById('scatter-svg');
  if(!svg) return;
  const w=700,h=320,pad=46;
  const maxV = 32000;
  let points = '';
  // seeded pseudo-random for consistent demo look
  let seed = 42;
  function rnd(){ seed = (seed*9301+49297)%233280; return seed/233280; }
  for(let i=0;i<55;i++){
    const actual = 1500 + rnd()*maxV;
    const noise = (rnd()-0.5) * actual * 0.18;
    const predicted = Math.max(500, actual + noise);
    const x = pad + (actual/maxV) * (w - pad*2);
    const y = h - pad - (predicted/maxV) * (h - pad*2);
    points += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="#2F9C8A" opacity="0.65"/>`;
  }
  const diagX1 = pad, diagY1 = h-pad, diagX2 = w-pad, diagY2 = pad;
  svg.innerHTML = `
    <line x1="${pad}" y1="${h-pad}" x2="${w-pad}" y2="${h-pad}" stroke="#432A1F" stroke-width="1"/>
    <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${h-pad}" stroke="#432A1F" stroke-width="1"/>
    <line x1="${diagX1}" y1="${diagY1}" x2="${diagX2}" y2="${diagY2}" stroke="#E8A33D" stroke-width="1.5" stroke-dasharray="5,5" opacity="0.8"/>
    ${points}
    <text x="${w/2}" y="${h-8}" fill="#BFA089" font-size="12" text-anchor="middle" font-family="Inter">Actual price →</text>
    <text x="16" y="${h/2}" fill="#BFA089" font-size="12" text-anchor="middle" font-family="Inter" transform="rotate(-90 16 ${h/2})">Predicted price →</text>
  `;
}
buildScatter();

// Animate bars on scroll into view (insights page only)
if(document.getElementById('page-insights')){
  const insightsObserver = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        document.querySelectorAll('.bar-fill').forEach(b=>{
          b.style.width = b.dataset.w + '%';
        });
      }
    });
  }, {threshold:0.2});
  insightsObserver.observe(document.getElementById('page-insights'));
  // Bars are already in the DOM on page load (no JS tab-switch anymore),
  // so also fill them shortly after load in case the section is already in view.
  setTimeout(()=>{
    document.querySelectorAll('.bar-fill').forEach(b=>{ b.style.width = b.dataset.w + '%'; });
  }, 200);
}

// ---------- Contact form (demo only, no backend wired) — about page only ----------
function sendMessage(){
  const status = document.getElementById('contact-status');
  const name = document.getElementById('c-name').value.trim();
  if(!name){
    status.textContent = 'Add your name so I know who to reply to.';
    status.style.color = 'var(--amber)';
    return;
  }
  status.textContent = 'Message captured locally — wire this button to an email/API endpoint to make it live.';
  status.style.color = 'var(--good)';
}     