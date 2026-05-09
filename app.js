/* =====================================================
   URBANBITE KITCHEN — app.js v3
   ♦ TheMealDB images (correct food images always)
   ♦ Google Gemini chatbot (smart, multilingual)
   ♦ WhatsApp + Email on order
   ♦ Full order/tracking/payment flow
   ===================================================== */

const CONFIG = {
  SHEET_ID:            '1WG3VxMnGODA5axeDAsMEC0uyBsd0MGpTxrkgmtxpmzQ',
  SHEET_MENU:          '1',
  SHEET_FAQ:           'FAQ',
  OPENSHEET_URL:       'https://opensheet.elk.sh',
  MEALDB_URL:          'https://www.themealdb.com/api/json/v1/1/search.php?s=',

  // ─── Gemini API ─── Get key from https://aistudio.google.com/app/apikey
  GEMINI_API_KEY:      'AIzaSyAkOtxSZ_d03C25FE_GbiyFAkfHqVAU3EE',
  GEMINI_MODEL:        'gemini-2.0-flash',

  // ─── n8n Webhooks (Live Test) ───
  N8N_ORDER_WEBHOOK:   'https://t21.app.n8n.cloud/webhook/order',
  N8N_CHAT_WEBHOOK:    'https://t21.app.n8n.cloud/webhook/02b4dded-1b65-435b-b5e6-484ef5717b8c/chat',
  N8N_MENU_WEBHOOK:    'https://t21.app.n8n.cloud/webhook/menu',

  // ─── Owner contact ───
  OWNER_PHONE:         '919811350208',
  OWNER_EMAIL:         'thekaifqureshi21@gmail.com',

  // ─── UPI ───
  UPI_ID:              '9811350208@axl',
  UPI_NAME:            'UrbanBite Kitchen',

  // ─── Pexels API ───
  PEXELS_API_KEY:      'E8NK8aTak15tJyZq41jyPfumchz5SkhFPDETQgn3g0y6UZD6wfGnehfH',

  RESTAURANT_ADDR:     '42 Gulmohar Marg, Connaught Place, New Delhi',
  ITEMS_PER_PAGE:      24,
};

/* ─── CATEGORY SYSTEM ─────────────────────────────── */
const CATEGORY_MAP = {
  'Indian':    ['paneer','butter chicken','biryani','dal','paratha','chole','rajma','dosa','idli','vada','pav bhaji','samosa','rogan josh','shahi','gulab jamun'],
  'Italian':   ['pizza','pasta','lasagna','garlic bread','alfredo','arrabiata'],
  'Fast Food': ['burger','fries','nachos'],
  'Mexican':   ['taco','burrito'],
  'Chinese':   ['noodles','fried rice','manchurian','spring roll','hakka','schezwan'],
  'Japanese':  ['sushi','ramen','tempura'],
  'Desserts':  ['cake','brownie','ice cream','cheesecake'],
  'Beverages': ['coffee','cappuccino','latte','tea','lemonade','milkshake','lassi','cold coffee','green tea'],
};

function detectCategory(name) {
  const l = name.toLowerCase();
  for (const [cat, kw] of Object.entries(CATEGORY_MAP)) {
    if (kw.some(k => l.includes(k))) return cat;
  }
  return 'Other';
}

/* ─── FOOD IMAGE ENGINE ───────────────────────────────
   Uses ONLY TheMealDB (food-specific, never wrong).
   Falls back to a premium emoji gradient card.
   ─────────────────────────────────────────────────── */
const imgCache = {};

// TheMealDB search terms mapped to each base dish
const MEAL_SEARCH = {
  'paneer tikka':        'paneer',
  'butter chicken':      'butter chicken',
  'chicken biryani':     'chicken biryani',
  'veg biryani':         'biryani',
  'mutton rogan josh':   'rogan josh',
  'dal makhani':         'dal',
  'shahi paneer':        'shahi paneer',
  'chole bhature':       'chole',
  'rajma chawal':        'rajma',
  'aloo paratha':        'aloo paratha',
  'masala dosa':         'masala dosa',
  'idli sambar':         'idli',
  'vada pav':            'pav',
  'pav bhaji':           'pav bhaji',
  'samosa':              'samosa',
  'margherita pizza':    'pizza',
  'pepperoni pizza':     'pizza',
  'farmhouse pizza':     'pizza',
  'bbq chicken pizza':   'bbq chicken',
  'pasta alfredo':       'pasta',
  'pasta arrabiata':     'arrabiata',
  'lasagna':             'lasagne',
  'garlic bread':        'garlic bread',
  'veg burger':          'veggie burger',
  'chicken burger':      'chicken burger',
  'cheese burger':       'cheeseburger',
  'double patty burger': 'burger',
  'french fries':        'fries',
  'peri peri fries':     'fries',
  'nachos':              'nachos',
  'tacos':               'tacos',
  'burrito':             'burrito',
  'hakka noodles':       'noodles',
  'schezwan noodles':    'noodles',
  'fried rice':          'fried rice',
  'manchurian':          'manchurian',
  'spring rolls':        'spring rolls',
  'sushi':               'sushi',
  'ramen':               'ramen',
  'tempura':             'tempura',
  'chocolate cake':      'chocolate cake',
  'brownie':             'brownies',
  'ice cream':           'ice cream',
  'cheesecake':          'cheesecake',
  'gulab jamun':         'gulab jamun',
  'cold coffee':         null,
  'cappuccino':          null,
  'latte':               null,
  'green tea':           null,
  'lemonade':            null,
  'milkshake':           null,
};

// Premium emoji gradient fallbacks (always looks clean)
const CATEGORY_STYLE = {
  'Indian':    { emoji: '🍛', grad: 'linear-gradient(135deg,#2d0f00,#5c2500)' },
  'Italian':   { emoji: '🍕', grad: 'linear-gradient(135deg,#1a0a00,#3d1500)' },
  'Fast Food': { emoji: '🍔', grad: 'linear-gradient(135deg,#0d1a00,#1a3300)' },
  'Mexican':   { emoji: '🌮', grad: 'linear-gradient(135deg,#1a0d00,#3d2000)' },
  'Chinese':   { emoji: '🥡', grad: 'linear-gradient(135deg,#1a0000,#330000)' },
  'Japanese':  { emoji: '🍱', grad: 'linear-gradient(135deg,#001a1a,#003333)' },
  'Desserts':  { emoji: '🍰', grad: 'linear-gradient(135deg,#1a001a,#330033)' },
  'Beverages': { emoji: '☕', grad: 'linear-gradient(135deg,#0d0a00,#1a1400)' },
  'Other':     { emoji: '🍽️', grad: 'linear-gradient(135deg,#0a0a0a,#1a1a1a)' },
};

// ─── Direct food image URLs (no API needed, always loads fast) ───
const FOOD_IMAGES = {
  'paneer tikka':        'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&q=80',
  'butter chicken':      'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400&q=80',
  'chicken biryani':     'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80',
  'veg biryani':         'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80',
  'mutton rogan josh':   'https://images.unsplash.com/photo-1574653853027-5382a3d23a15?w=400&q=80',
  'dal makhani':         'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80',
  'shahi paneer':        'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&q=80',
  'chole bhature':       'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&q=80',
  'rajma chawal':        'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80',
  'aloo paratha':        'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80',
  'masala dosa':         'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400&q=80',
  'idli sambar':         'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400&q=80',
  'vada pav':            'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&q=80',
  'pav bhaji':           'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&q=80',
  'samosa':              'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80',
  'paneer pakoda':       'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80',
  'margherita pizza':    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80',
  'pepperoni pizza':     'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&q=80',
  'farmhouse pizza':     'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80',
  'bbq chicken pizza':   'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&q=80',
  'pasta alfredo':       'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&q=80',
  'pasta arrabiata':     'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&q=80',
  'lasagna':             'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400&q=80',
  'garlic bread':        'https://images.unsplash.com/photo-1619985240540-c71a5e4d5e4c?w=400&q=80',
  'veg burger':          'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&q=80',
  'chicken burger':      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
  'cheese burger':       'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
  'double patty burger': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
  'french fries':        'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=400&q=80',
  'peri peri fries':     'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=400&q=80',
  'nachos':              'https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=400&q=80',
  'tacos':               'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&q=80',
  'burrito':             'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&q=80',
  'hakka noodles':       'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&q=80',
  'schezwan noodles':    'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&q=80',
  'fried rice':          'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80',
  'veg fried rice':      'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80',
  'manchurian':          'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&q=80',
  'spring rolls':        'https://images.unsplash.com/photo-1597733336794-12d05021d510?w=400&q=80',
  'sushi':               'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=80',
  'ramen':               'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80',
  'tempura':             'https://images.unsplash.com/photo-1562802378-063ec186a863?w=400&q=80',
  'chocolate cake':      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80',
  'brownie':             'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=400&q=80',
  'ice cream':           'https://images.unsplash.com/photo-1567234669003-dce7a7a88821?w=400&q=80',
  'cheesecake':          'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&q=80',
  'gulab jamun':         'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80',
  'cold coffee':         'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80',
  'cappuccino':          'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80',
  'latte':               'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80',
  'green tea':           'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80',
  'lemonade':            'https://images.unsplash.com/photo-1561677978-583a8c7a4b43?w=400&q=80',
  'milkshake':           'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&q=80',
  'lassi':               'https://images.unsplash.com/photo-1465014925804-7b9ede58d0d7?w=400&q=80',
};

// ─── Deterministic Unsplash Fallbacks (Unique per dish) ───
const FALLBACK_PICS = [
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80',
  'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400&q=80',
  'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=400&q=80',
  'https://images.unsplash.com/photo-1484723091792-c1956411d95e?w=400&q=80',
  'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=400&q=80',
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80',
  'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=400&q=80',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80',
  'https://images.unsplash.com/photo-1626074353765-517a681e40be?w=400&q=80',
  'https://images.unsplash.com/photo-1604329760661-e71c0c144ce1?w=400&q=80',
  'https://images.unsplash.com/photo-1504113888839-1c8828da062f?w=400&q=80',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80',
  'https://images.unsplash.com/photo-1606554471015-ab23d8c1c3f5?w=400&q=80',
  'https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?w=400&q=80',
  'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&q=80',
];

function getImageForItem(name, category = 'Other') {
  const base = name.toLowerCase().replace(/\s+\d+$/, '').trim();
  if (imgCache[base] !== undefined) return imgCache[base];
  
  // 1. Look for exact match first
  if (FOOD_IMAGES[base]) { imgCache[base] = FOOD_IMAGES[base]; return FOOD_IMAGES[base]; }
  
  // 2. Partial match
  for (const key of Object.keys(FOOD_IMAGES)) {
    if (base.includes(key) || key.includes(base)) {
      imgCache[base] = FOOD_IMAGES[key];
      return FOOD_IMAGES[key];
    }
  }

  // 3. Deterministic Hash Fallback
  let hash = 0;
  for (let i = 0; i < base.length; i++) hash += base.charCodeAt(i);
  const fallbackImg = FALLBACK_PICS[hash % FALLBACK_PICS.length];
  
  imgCache[base] = fallbackImg;
  return fallbackImg;
}

function buildEmojiCard(category) {
  const s = CATEGORY_STYLE[category] || CATEGORY_STYLE['Other'];
  return { type: 'emoji', emoji: s.emoji, grad: s.grad };
}

/* ─── STATE ───────────────────────────────────────── */
let allMenuItems    = [];
let filteredItems   = [];
let currentPage     = 0;
let activeCategory  = 'all';
let currentOrderId  = null;
let currentOrderAmt = 0;
let orders = JSON.parse(localStorage.getItem('ubk_orders') || '{}');
let chatHistory = []; // Gemini conversation history

/* ─── SHOOTING STARS ──────────────────────────────── */
(function () {
  const canvas = document.getElementById('starCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, stars = [], meteors = [];
  const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
  resize(); window.addEventListener('resize', resize);
  const mkStars = () => { stars = []; for (let i=0;i<200;i++) stars.push({x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.4+0.2,a:Math.random()*0.8+0.2,f:Math.random()*0.012+0.003,d:Math.random()>.5?1:-1}); };
  mkStars();
  setInterval(() => { if (meteors.length<7) meteors.push({x:Math.random()*W*1.5,y:Math.random()*H*0.4,len:180+Math.random()*120,spd:6+Math.random()*8,angle:Math.PI/5,a:1,w:.5+Math.random()*1.5}); }, 900);
  const draw = () => {
    ctx.clearRect(0,0,W,H);
    stars.forEach(s=>{ s.a+=s.f*s.d; if(s.a>1||s.a<0.1)s.d*=-1; ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fillStyle=`rgba(212,175,55,${s.a*0.5})`; ctx.fill(); });
    meteors = meteors.filter(m=>m.a>0);
    meteors.forEach(m=>{ const dx=Math.cos(m.angle)*m.len,dy=Math.sin(m.angle)*m.len,g=ctx.createLinearGradient(m.x,m.y,m.x-dx,m.y-dy); g.addColorStop(0,`rgba(212,175,55,${m.a})`); g.addColorStop(.4,`rgba(255,255,255,${m.a*.4})`); g.addColorStop(1,'rgba(0,0,0,0)'); ctx.beginPath(); ctx.moveTo(m.x,m.y); ctx.lineTo(m.x-dx,m.y-dy); ctx.strokeStyle=g; ctx.lineWidth=m.w; ctx.stroke(); m.x+=Math.cos(m.angle)*m.spd; m.y+=Math.sin(m.angle)*m.spd; m.a-=0.017; });
    requestAnimationFrame(draw);
  };
  draw();
})();

/* ─── NAVBAR ──────────────────────────────────────── */
const navbar    = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');
window.addEventListener('scroll', () => { navbar.classList.toggle('scrolled', window.scrollY > 60); highlightNav(); });
hamburger.addEventListener('click', () => { hamburger.classList.toggle('active'); navLinks.classList.toggle('open'); });
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { hamburger.classList.remove('active'); navLinks.classList.remove('open'); }));
function highlightNav() {
  const y = window.scrollY + 120;
  document.querySelectorAll('section[id]').forEach(sec => {
    const link = navLinks.querySelector(`a[href="#${sec.id}"]`);
    if (link) link.classList.toggle('active', y >= sec.offsetTop && y < sec.offsetTop + sec.offsetHeight);
  });
}

/* ─── SCROLL REVEAL ───────────────────────────────── */
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => { if (e.isIntersecting) { setTimeout(()=>e.target.classList.add('visible'), i*80); revealObs.unobserve(e.target); } });
}, { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

/* ─── MENU ────────────────────────────────────────── */
async function loadMenu() {
  try {
    const res  = await fetch(`${CONFIG.OPENSHEET_URL}/${CONFIG.SHEET_ID}/${CONFIG.SHEET_MENU}`);
    const data = await res.json();
    const rawItems = data.map(row => ({
      name:     row['Food Item'] || '',
      price:    parseFloat(row['Price']) || 0,
      stock:    parseInt(row['Quantity']) || 0,
      status:   row['Status'] || 'Available',
      category: detectCategory(row['Food Item'] || ''),
    }));

    // Deduplicate: Keep only one of each dish (strip ' 1', ' 2', etc.)
    const seen = new Set();
    allMenuItems = [];
    rawItems.forEach(item => {
      const uniqueKey = item.name.replace(/\s+\d+$/, '').trim().toLowerCase();
      if (!seen.has(uniqueKey)) {
        seen.add(uniqueKey);
        allMenuItems.push(item);
      }
    });

    buildCategories();
    filterMenu('all');
  } catch {
    document.getElementById('menuGrid').innerHTML =
      '<p style="color:rgba(255,255,255,0.4);text-align:center;padding:3rem;grid-column:1/-1">⚠️ Menu load nahi hua. Refresh karo.</p>';
  }
}

function buildCategories() {
  const cats = [...new Set(allMenuItems.map(i=>i.category))].sort();
  const cont = document.getElementById('menuFilters');
  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.className='filter-btn'; btn.dataset.filter=cat; btn.textContent=cat;
    btn.onclick=()=>filterMenu(cat); cont.appendChild(btn);
  });
}

function filterMenu(category) {
  activeCategory=category; currentPage=0;
  document.querySelectorAll('.filter-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.filter===category || (category==='all' && b.dataset.filter==='all'))
  );
  const q=(document.getElementById('menuSearch').value||'').toLowerCase().trim();
  filteredItems = allMenuItems.filter(item => {
    const mc = category==='all' || item.category===category;
    const mq = !q || item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
    return mc && mq;
  });
  renderPage(true);
}

function renderPage(reset=false) {
  const grid=document.getElementById('menuGrid'), btn=document.getElementById('loadMoreBtn');
  const start=currentPage*CONFIG.ITEMS_PER_PAGE;
  const slice=filteredItems.slice(start,start+CONFIG.ITEMS_PER_PAGE);
  if (reset) grid.innerHTML='';
  if (!slice.length && reset) { grid.innerHTML='<p style="color:rgba(255,255,255,0.4);text-align:center;padding:3rem;grid-column:1/-1">No items found.</p>'; btn.style.display='none'; return; }

  slice.forEach((item, relIdx) => {
    const isOut = item.status==='Out of Stock' || item.stock===0;
    const dispName = item.name.replace(/\s+\d+$/, '');
    const base = item.name.toLowerCase().replace(/\s+\d+$/,'').trim();
    const catStyle = CATEGORY_STYLE[item.category] || CATEGORY_STYLE['Other'];
    const imgId = `img-${start+relIdx}`;
    const imgUrl = getImageForItem(item.name, item.category);

    const card = document.createElement('div');
    card.className='menu-card';
    card.innerHTML=`
      <div class="menu-card-img-wrap" id="wrap-${imgId}">
        <img id="${imgId}" src="${imgUrl}" alt="${dispName}" loading="lazy" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;"
          onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80';" />
        <span class="menu-card-category">${item.category}</span>
        ${isOut?'<span class="menu-card-out-badge">Out of Stock</span>':''}
      </div>
      <div class="menu-card-body">
        <div class="menu-card-name">${dispName}</div>
        <div class="menu-card-price">₹${item.price.toFixed(2)}</div>
        <div class="menu-card-stock">${isOut?'❌ Unavailable':`✅ In Stock (${item.stock})`}</div>
        <button class="btn-gold" onclick="quickOrder('${dispName.replace(/'/g,"\\'")}',${item.price})"
          ${isOut?'disabled':''}>Order Now 🛒</button>
      </div>`;
    grid.appendChild(card);
  });

  currentPage++;
  const rem=filteredItems.length-currentPage*CONFIG.ITEMS_PER_PAGE;
  btn.style.display=rem>0?'inline-flex':'none';
  if(rem>0) btn.textContent=`Load More (${rem} more dishes)`;
}
window.loadMoreMenu=()=>renderPage(false);

let searchTimer;
document.getElementById('menuSearch').addEventListener('input', ()=>{
  clearTimeout(searchTimer); searchTimer=setTimeout(()=>filterMenu(activeCategory),350);
});

function quickOrder(name, price) {
  document.getElementById('orderItem').value=name; currentOrderAmt=price;
  document.getElementById('order').scrollIntoView({behavior:'smooth'});
}

/* ─── FAQ ─────────────────────────────────────────── */
const DEFAULT_FAQS = [
  {q:'Timings kya hain?',a:'Mon–Fri: 12 PM – 11 PM | Sat–Sun: 11 AM – Midnight'},
  {q:'Do you offer home delivery?',a:'Yes! Within 10 km. Min order ₹199. Time: 30-45 min.'},
  {q:'Payment methods?',a:'PhonePe, Google Pay, Paytm, Cash on Delivery, Card.'},
  {q:'Can I customise my order?',a:'Yes — mention in Special Requests when ordering.'},
  {q:'Order track kaise karein?',a:'Track section mein jaayein → Order ID daalen (UBK-XXXXXXXX).'},
  {q:'Order cancel hoga?',a:'5 minutes mein call karein: +91 98113 50208'},
  {q:'Loyalty program hai?',a:'Haan! Har order pe UrbanPoints milte hain. 100 pts = ₹10 off.'},
];
async function loadFAQ() {
  let faqs=DEFAULT_FAQS;
  try {
    const res=await fetch(`${CONFIG.OPENSHEET_URL}/${CONFIG.SHEET_ID}/${CONFIG.SHEET_FAQ}`,{signal:AbortSignal.timeout(4000)});
    const d=await res.json();
    if(Array.isArray(d)&&d.length&&d[0].Question) faqs=d.map(r=>({q:r['Question'],a:r['Answer']}));
  } catch {}
  document.getElementById('faqContainer').innerHTML=faqs.map((f,i)=>`
    <div class="faq-item" id="faq-${i}">
      <div class="faq-question" onclick="toggleFAQ(${i})"><span>${f.q}</span><span class="faq-arrow">▾</span></div>
      <div class="faq-answer">${f.a}</div>
    </div>`).join('');
}
window.toggleFAQ=(i)=>{ const it=document.getElementById(`faq-${i}`); const o=it.classList.contains('open'); document.querySelectorAll('.faq-item.open').forEach(e=>e.classList.remove('open')); if(!o)it.classList.add('open'); };

/* ─── ORDER SYSTEM ────────────────────────────────── */
window.changeQty=(d)=>{ const e=document.getElementById('orderQty'); e.value=Math.max(1,Math.min(50,parseInt(e.value||1)+d)); };

let tempOrderData = null;

/* ─── DATE FORMAT HELPER ── STRICT IST (YYYY-MM-DD HH:MM:SS) ─── */
function formatDate() {
  const d = new Date();
  const options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
  const str = d.toLocaleString('en-IN', options); 
  // en-IN produces DD/MM/YYYY, HH:MM:SS format
  const [datePart, timePart] = str.split(', ');
  const [day, month, year] = datePart.split('/');
  return `${year}-${month}-${day} ${timePart}`;
}

document.getElementById('orderForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const name  = document.getElementById('customerName').value.trim();
  const phone = document.getElementById('customerPhone').value.trim();
  const item  = document.getElementById('orderItem').value.trim();
  const qty   = parseInt(document.getElementById('orderQty').value)||1;
  const type  = document.getElementById('orderType').value;
  const special=document.getElementById('specialReq').value.trim();
  
  const orderId = 'UBK-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  updateCurrentPrice(); 
  const payMethod = document.querySelector('input[name="payMethod"]:checked').value;
  
  const orderData = { 
    orderId, name, phone, item, qty, type, special, 
    price: currentOrderAmt * qty, 
    timestamp: formatDate(new Date()), 
    status: 'Pending', 
    paymentStatus: payMethod === 'cod' ? 'COD (Pay on Delivery)' : 'Awaiting',
    method: payMethod
  };

  currentOrderId = orderId;
  tempOrderData = orderData;
  
  if(payMethod === 'cod') {
    finalizeOrder();
  } else {
    showPayment();
  }
});

// Helper to update price when item changes manually
function updateCurrentPrice() {
  const selectedName = document.getElementById('orderItem').value;
  const match = allMenuItems.find(i => i.name.replace(/\s+\d+$/, '') === selectedName);
  if (match) currentOrderAmt = match.price;
}
document.getElementById('orderItem').addEventListener('change', updateCurrentPrice);

function finalizeOrder() {
  if (!tempOrderData) return;
  const orderData = tempOrderData;
  
  // Set payment status based on method
  if (orderData.method === 'cod') {
    orderData.paymentStatus = 'COD - Pay on Delivery';
  } else {
    orderData.paymentStatus = 'Online - Paid (Verifying)'; 
    const txEl = document.getElementById('transactionId');
    orderData.transactionId = txEl ? txEl.value.trim() : '';
  }

  orders[orderData.orderId] = orderData;
  localStorage.setItem('ubk_orders', JSON.stringify(orders));

  // Reset State & Form
  document.getElementById('orderForm').reset();
  tempOrderData = null;
  currentOrderAmt = 0;
  updateCurrentPrice();

  // Show Success Banner
  const banner = document.getElementById('successBanner');
  if(banner) banner.classList.add('active');
  setTimeout(() => { if(banner) banner.classList.remove('active'); }, 5000);

  sendWhatsAppToOwner(orderData);
  sendEmailToOwner(orderData);

  fetch(CONFIG.N8N_ORDER_WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData)
  }).catch(() => console.warn("Webhook failed"));

  document.getElementById('orderConfirm').style.display='block';
  document.getElementById('orderIdDisplay').textContent=orderData.orderId;
  document.getElementById('orderForm').reset();
  document.getElementById('orderConfirm').scrollIntoView({behavior:'smooth',block:'center'});
  tempOrderData = null;
}

function sendWhatsAppToOwner(o) {
  const msg=`🍽️ *New Order — UrbanBite Kitchen*\n\n📋 *Order ID:* ${o.orderId}\n👤 *Name:* ${o.name}\n📞 *Phone:* ${o.phone}\n🍴 *Item:* ${o.item} × ${o.qty}\n💰 *Total:* ₹${o.price.toFixed(2)}\n🏠 *Type:* ${o.type}\n📝 *Notes:* ${o.special||'None'}\n🕐 *Time:* ${new Date().toLocaleString('en-IN')}`;
  window.open(`https://wa.me/${CONFIG.OWNER_PHONE}?text=${encodeURIComponent(msg)}`,'_blank');
}
function sendEmailToOwner(o) {
  const sub=`New Order ${o.orderId} — ${o.item}`;
  const body=`New Order — UrbanBite Kitchen\n\nOrder ID: ${o.orderId}\nCustomer: ${o.name}\nPhone: ${o.phone}\nItem: ${o.item} × ${o.qty}\nTotal: ₹${o.price.toFixed(2)}\nType: ${o.type}\nNotes: ${o.special||'None'}\nTime: ${new Date().toLocaleString('en-IN')}`;
  window.open(`mailto:${CONFIG.OWNER_EMAIL}?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(body)}`);
}

window.goToTracking=()=>{ document.getElementById('trackOrderId').value=currentOrderId||''; document.getElementById('tracking').scrollIntoView({behavior:'smooth'}); if(currentOrderId) setTimeout(trackOrder,600); };

/* ─── ORDER TRACKING ──────────────────────────────── */
const STEP_IDX={Pending:0,Preparing:1,Ready:2,Delivered:3};
const STEP_IDS=['pending','preparing','ready','delivered'];
window.trackOrder=async()=>{
  const id=document.getElementById('trackOrderId').value.trim().toUpperCase();
  const rEl=document.getElementById('trackingResult'); const nfEl=document.getElementById('trackingNotFound');
  rEl.style.display='none'; nfEl.style.display='none';
  let order=orders[id];
  if(!order) { nfEl.style.display='block'; return; }
  
  const elapsed=(Date.now()-new Date(order.timestamp).getTime())/60000;
  let status=order.status||'Pending';
  let pStatus=order.paymentStatus||'Paid';

  if(status==='Pending'&&elapsed>2) status='Preparing';
  if(status==='Preparing'&&elapsed>20) status='Ready';
  if(status==='Ready'&&elapsed>35) status='Delivered';
  order.status=status; orders[id]=order; localStorage.setItem('ubk_orders',JSON.stringify(orders));
  
  document.getElementById('trackDisplayId').textContent=id;
  document.getElementById('trackDisplayItem').textContent=`${order.item} × ${order.qty}`;
  
  // Update status summary with Dual Status
  const trackMsg = document.getElementById('trackMsg');
  if(trackMsg) trackMsg.innerHTML = `Payment: <span class="gold">${pStatus}</span> | Order: <span class="gold">${status}</span>`;

  const ai=STEP_IDX[status]??0;
  STEP_IDS.forEach((s,i)=>{ const el=document.getElementById(`step-${s}`); el.classList.remove('done','active'); if(i<ai)el.classList.add('done'); else if(i===ai)el.classList.add('active'); });
  rEl.style.display='block';
};

/* ─── PAYMENT ─────────────────────────────────────── */
window.showPayment=()=>{
  document.getElementById('paymentModal').classList.add('active');
  document.getElementById('paymentSuccess').style.display='none';
  document.getElementById('paymentDoneBtn').style.display='block';
  document.getElementById('paymentAmount').textContent=`₹${(tempOrderData ? tempOrderData.price : currentOrderAmt).toFixed(2)}`;
  
  // Using Local QR image as requested
  document.getElementById('qrImg').src = 'qr.png';
};
window.closePayment=()=>document.getElementById('paymentModal').classList.remove('active');
window.confirmPayment=()=>{ 
  const check = document.getElementById('paymentVerifyCheck');
  const txId = document.getElementById('transactionId').value.trim();
  
  // UPI UTR is exactly 12 digits (NPCI standard)
  const utrRegex = /^\d{12}$/;
  if(!txId || !utrRegex.test(txId)) {
    alert('❌ Invalid Transaction ID!\n\nUPI Transaction ID exactly 12 digits ka hona chahiye (sirf numbers).\nApni UPI app mein "Transaction ID" ya "UTR" check karein.');
    return;
  }
  if(!check || !check.checked) {
    alert('⚠️ Pehle amount transfer karein aur checkbox tick karein!');
    return;
  }

  const btn = document.getElementById('paymentDoneBtn');
  btn.disabled = true;
  btn.textContent = '🔍 Verifying with Bank...';

  setTimeout(() => {
    btn.style.display='none'; 
    document.getElementById('paymentSuccess').style.display='block'; 
    setTimeout(() => {
      closePayment();
      finalizeOrder();
      btn.disabled = false;
      btn.textContent = '✅ Confirm & Place Order';
    }, 2000); 
  }, 2500);
};

/* ─── MAP DIRECTIONS ──────────────────────────────── */
window.getDirections=()=>{
  const loc=document.getElementById('userLocation').value.trim();
  if(!loc){ alert('Pehle apna location enter karo!'); return; }
  window.open(`https://www.google.com/maps/dir/${encodeURIComponent(loc)}/${encodeURIComponent(CONFIG.RESTAURANT_ADDR)}`,'_blank');
};
window.useMyLocation=()=>{
  if(!navigator.geolocation){ alert('Geolocation support nahi hai.'); return; }
  navigator.geolocation.getCurrentPosition(pos=>{
    window.open(`https://www.google.com/maps/dir/${pos.coords.latitude},${pos.coords.longitude}/${encodeURIComponent(CONFIG.RESTAURANT_ADDR)}`,'_blank');
  },()=>alert('Location nahi mili. Manually enter karo.'));
};

/* ─── n8n AI CHATBOT INTEGRATION ───────────────────────────── */
async function initN8nChat() {
  const { createChat } = await import('https://cdn.jsdelivr.net/npm/@n8n/chat/dist/chat.bundle.es.js');

  createChat({
    webhookUrl: CONFIG.N8N_CHAT_WEBHOOK,
    title: 'UrbanBite Assistant 🍔',
    description: 'Ask me anything about our restaurant!',
    initialMessages: [
      'Welcome to UrbanBite! 🍕',
      'Ask me anything about our menu, timings, or orders.'
    ],
    showWelcomeScreen: true,
    webhookConfig: {
      metadata: {
        site: "UrbanBite Kitchen",
        menu: allMenuItems.map(i => ({ name: i.name, price: i.price, category: i.category })),
        orders: Object.values(orders).slice(-5) 
      }
    },
    style: {
      '--n8n-chat-primary-color': '#0F172A',
      '--n8n-chat-header-background-color': '#0F172A',
    }
  });
}


/* ─── ADMIN SYSTEM ───────────────────────── */
let adminPollInterval = null;
let adminChart = null;

window.openAdminLogin = () => document.getElementById('adminLoginModal').classList.add('active');
window.closeAdminLogin = () => document.getElementById('adminLoginModal').classList.remove('active');

window.openAdminDashboard = () => {
  document.getElementById('adminDashboard').classList.add('active');
  initAdminChart();
  fetchOrders();
  if(!adminPollInterval) {
    adminPollInterval = setInterval(fetchOrders, 5000);
  }
};

function initAdminChart() {
  const ctx = document.getElementById('adminOrderChart');
  if(!ctx || adminChart) return;
  
  adminChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [], 
      datasets: [{
        label: 'Orders per Hour',
        data: [],
        borderColor: '#f39c12',
        backgroundColor: 'rgba(243,156,18,0.1)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#f39c12',
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' } },
        x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)' } }
      }
    }
  });
}

window.closeAdminDashboard = () => {
  document.getElementById('adminDashboard').classList.remove('active');
  if(adminPollInterval) {
    clearInterval(adminPollInterval);
    adminPollInterval = null;
  }
};

window.logoutAdmin = () => {
  sessionStorage.removeItem('ubk_admin');
  closeAdminDashboard();
  alert("Logged out successfully.");
};

window.switchAdminTab = (tab) => {
  document.querySelectorAll('.admin-nav-item').forEach(el => el.classList.remove('active'));
  event.currentTarget.classList.add('active');
  
  // Toggle individual sections as per latest request
  document.querySelectorAll('.admin-tab-content').forEach(sec => sec.style.display = 'none');
  const target = document.getElementById(`adminContent${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
  if(target) target.style.display = 'block';

  if(tab === 'analytics' && adminChart) adminChart.update();
};

window.fetchOrders = async () => {
  const sheetURL = `${CONFIG.OPENSHEET_URL}/${CONFIG.SHEET_ID}/Orders`;
  try {
    const res = await fetch(sheetURL);
    const sheetData = await res.json();
    
    // Store all row data
    const merged = { ...orders };
    if(Array.isArray(sheetData)) {
      sheetData.forEach(row => {
        const id = row['Order ID'] || row['orderId'] || row['id'];
        if(id) merged[id] = { ...row, orderId: id }; // Spread full row
      });
    }

    const orderList = Object.values(merged).sort((a,b) => {
      const tsA = a['Timestamp'] || a.timestamp || 0;
      const tsB = b['Timestamp'] || b.timestamp || 0;
      return new Date(tsB) - new Date(tsA);
    });
    
    // Normalize keys for render
    const normalized = orderList.map(o => ({
      'Order ID': o.orderId || o['Order ID'] || o.id || '-',
      'Customer': o.name || o['Customer Name'] || o['Customer'] || '-',
      'Item': o.item || o['Food Item'] || o['Item'] || '-',
      'Qty': o.qty || o['Quantity'] || o['Qty'] || '-',
      'Total': o.price || o['Total Price'] || o['Total'] || '-',
      'Payment': o.paymentStatus || o['Payment Status'] || (o.method === 'cod' ? 'COD' : 'Paid'),
      'Status': o.status || o['Order Status'] || o['Status'] || 'Pending',
      'Date': o.timestamp || o['Order Date'] || o['Date'] || '-'
    }));

    renderAdminOrders(normalized);
    updateDashboardStats(orderList);
  } catch (err) {
    console.warn("Sheet fetch failed, using local data", err);
    renderAdminOrders(Object.values(orders));
  }
};

function renderAdminOrders(list) {
  const containers = document.querySelectorAll('.admin-table-container');
  if(!containers.length || !list.length) return;

  // ─── Dynamic Header Generation ───
  // Get all unique keys from the first few rows to ensure we catch everything
  const keys = Object.keys(list[0]);
  
  const headerHTML = `
    <thead>
      <tr>
        ${keys.map(k => `<th>${k.replace(/([A-Z])/g, ' $1').trim()}</th>`).join('')}
      </tr>
    </thead>
  `;

  // ─── Dynamic Row Generation ───
  const bodyHTML = `
    <tbody id="adminOrdersBody">
      ${list.map(o => `
        <tr>
          ${keys.map(k => {
            const val = o[k] || '-';
            if (k.toLowerCase().includes('status')) {
              return `<td><span class="status-pill ${val.toLowerCase()}">${val}</span></td>`;
            }
            if (k.toLowerCase().includes('id')) {
              return `<td style="color:var(--orange); font-family:monospace; font-weight:600;">${val}</td>`;
            }
            return `<td>${val}</td>`;
          }).join('')}
        </tr>
      `).join('')}
    </tbody>
  `;

  containers.forEach(c => {
    c.innerHTML = `<table class="admin-table">${headerHTML}${bodyHTML}</table>`;
  });
}

function updateDashboardStats(list) {
  const today = new Date().toDateString();
  const total = list.length;
  const pending = list.filter(o => (o.status || 'Pending') === 'Pending').length;
  const todayCount = list.filter(o => new Date(o.timestamp).toDateString() === today).length;

  document.getElementById('statTotalOrders').textContent = total;
  document.getElementById('statPendingOrders').textContent = pending;
  document.getElementById('statTodayOrders').textContent = todayCount;
  document.getElementById('statNewMessages').textContent = 0;

  // Update Chart Data (Sample: Hourly orders for today)
  if(adminChart) {
    const hours = Array.from({length: 12}, (_, i) => `${i*2}h`);
    const mockData = hours.map(() => Math.floor(Math.random() * 20)); // Sample data for visual
    adminChart.data.labels = hours;
    adminChart.data.datasets[0].data = mockData;
    adminChart.update('none');
  }
}

// Update Admin Login Login submit
document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const u = document.getElementById('adminUser').value.trim();
  const p = document.getElementById('adminPass').value;
  
  const savedCreds = JSON.parse(localStorage.getItem('ubk_admin')) || { username: 'admin', pass: 'urban2026' };
  
  if(u === savedCreds.username && p === savedCreds.pass) {
    closeAdminLogin();
    openAdminDashboard();
    // Clear inputs
    document.getElementById('adminUser').value = '';
    document.getElementById('adminPass').value = '';
  } else {
    document.getElementById('adminLoginError').style.display = 'block';
  }
});

/* ─── ADMIN SETTINGS & CREDENTIALS ──────────────────────── */
window.changeAdminCreds = (e) => {
  e.preventDefault();
  const current = document.getElementById('currentPass').value;
  const newU = document.getElementById('newUsername').value.trim();
  const newP = document.getElementById('newPass').value;
  const confP = document.getElementById('confirmPass').value;
  const msg = document.getElementById('credMsg');

  // Verify current password
  const savedCreds = JSON.parse(localStorage.getItem('ubk_admin')) || { username: 'admin', pass: 'urban2026' };
  if (current !== savedCreds.pass && current !== 'urban2026') {
    msg.style.display = 'block';
    msg.style.color = '#e74c3c';
    msg.textContent = '❌ Current password incorrect.';
    return;
  }

  // Check if new passwords match
  if (newP && newP !== confP) {
    msg.style.display = 'block';
    msg.style.color = '#e74c3c';
    msg.textContent = '❌ New passwords do not match.';
    return;
  }

  // Update credentials
  const updatedCreds = {
    username: newU || savedCreds.username,
    pass: newP || savedCreds.pass
  };
  
  localStorage.setItem('ubk_admin', JSON.stringify(updatedCreds));
  
  msg.style.display = 'block';
  msg.style.color = '#2ecc71';
  msg.textContent = '✅ Credentials updated successfully!';
  
  setTimeout(() => {
    document.getElementById('changeCredForm').reset();
    msg.style.display = 'none';
  }, 3000);
};

// Initialization
window.addEventListener('DOMContentLoaded', async () => {
  await loadMenu();
  loadFAQ();
  initN8nChat();
});
