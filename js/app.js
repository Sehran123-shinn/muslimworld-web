const BACKEND_URL = "http://localhost:5000";
const CLIENT_ID = "632574791859-8vf92qtbjp98do5rum8gmkonkk3v6koq.apps.googleusercontent.com";

let currentUser = null;
let currentAudio = new Audio();
let isPlaying = false;

// =========================================================
// 1. GLOBAL HELPERS & DATA
// =========================================================

// Imams of Kaaba Reciter List
const recitersList = [
    { id: "ar.sudais", name: "Abdurrahmaan As-Sudais", type: "Imam of Kaaba" },
    { id: "ar.shuraym", name: "Saud Al-Shuraim", type: "Imam of Kaaba" },
    { id: "ar.mahermuaiqly", name: "Maher Al Muaiqly", type: "Imam of Kaaba" },
    { id: "ar.juhany", name: "Abdullah Al-Juhany", type: "Imam of Kaaba" },
    { id: "ar.yasseraddussary", name: "Yasser Al-Dosari", type: "Imam of Kaaba" }
];

// Exact 30 Parah Names
const juzData = [
    { id: 1, ar: "آلم", en: "Alif Laam meem" }, { id: 2, ar: "سَيَقُولُ", en: "Sayaqool" },
    { id: 3, ar: "تِلْكَ الرُّسُلُ", en: "Tilkar rusul" }, { id: 4, ar: "لَنْ تَنَالُوا", en: "Lann tanaloo" },
    { id: 5, ar: "وَالْمُحْصَنَاتُ", en: "Wal Mohsanat" }, { id: 6, ar: "لَا يُحِبَّ اللَّهُ", en: "La Yuhibbullah" },
    { id: 7, ar: "وَإِذَا سَمِعُوا", en: "Wa Iza Samiu" }, { id: 8, ar: "وَلَوْ أَنَّنَا", en: "Wa Lau Annana" },
    { id: 9, ar: "قَالَ الْمَلَأُ", en: "Qalal Malao" }, { id: 10, ar: "وَاعْلَمُوا", en: "Wa A'lamu" },
    { id: 11, ar: "يَعْتَذِرُونَ", en: "Yatazeroon" }, { id: 12, ar: "وَمَا مِنْ دَابَّةٍ", en: "Wa Mamin Da'abat" },
    { id: 13, ar: "وَمَا أُبَرِّئُ", en: "Wa Ma Ubarri'u" }, { id: 14, ar: "رُبَمَا", en: "Rubama" },
    { id: 15, ar: "سُبْحَانَ الَّذِي", en: "Subhanallazi" }, { id: 16, ar: "قَالَ أَلَمْ", en: "Qal Alam" },
    { id: 17, ar: "اقْتَرَبَ", en: "Iqtaraba" }, { id: 18, ar: "قَدْ أَفْلَحَ", en: "Qadd Aflaha" },
    { id: 19, ar: "وَقَالَ الَّذِينَ", en: "Wa Qalallazina" }, { id: 20, ar: "أَمَّنْ خَلَقَ", en: "A'man Khalaqa" },
    { id: 21, ar: "اتْلُ مَا أُوحِيَ", en: "Utlu Ma Oohi" }, { id: 22, ar: "وَمَنْ يَقْنُتْ", en: "Wa Manyaqnut" },
    { id: 23, ar: "وَمَا لِيَ", en: "Wa Mali" }, { id: 24, ar: "فَمَنْ أَظْلَمُ", en: "Faman Azlam" },
    { id: 25, ar: "إِلَيْهِ يُرَدُّ", en: "Ilaihi Yuraddu" }, { id: 26, ar: "حم", en: "Ha'a Meem" },
    { id: 27, ar: "قَالَ فَمَا خَطْبُكُمْ", en: "Qala Fama Khatbukum" }, { id: 28, ar: "قَدْ سَمِعَ اللَّهُ", en: "Qadd Sami Allah" },
    { id: 29, ar: "تَبَارَكَ الَّذِي", en: "Tabarakallazi" }, { id: 30, ar: "عَمَّ يَتَسَاءَلُونَ", en: "Amma Yatasa'aloon" }
];

window.toArabicNumeral = function(enNum) {
    return ("" + enNum).replace(/[0-9]/g, (t) => "٠١٢٣٤٥٦٧٨٩"[t]);
};

window.safeGetItem = function(key, fallback) {
    try {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : fallback;
    } catch (e) { return fallback; }
};

window.syncToCloud = async function(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
    if (currentUser) {
        try {
            await fetch(`${BACKEND_URL}/api/user/sync`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ googleId: currentUser.googleId, key, data }),
            });
        } catch (err) { console.warn("Sync delayed."); }
    }
};

// =========================================================
// 2. GLOBAL ACTIONS (Reciter, Bookmarks, Settings)
// =========================================================

window.playAyahAudio = function(globalAyahNumber, boxId) {
    const qari = safeGetItem('quranSettings', {}).qari || 'ar.yasseraddussary';
    const icon = event.currentTarget;
    
    if (isPlaying && currentAudio.src.includes(globalAyahNumber)) {
        currentAudio.pause();
        isPlaying = false;
        icon.className = 'fa-solid fa-play';
        document.getElementById(boxId).classList.remove('playing-now');
        return;
    }

    currentAudio.src = `https://cdn.islamic.network/quran/audio/128/${qari}/${globalAyahNumber}.mp3`;
    currentAudio.play();
    isPlaying = true;
    
    document.querySelectorAll('.fa-pause').forEach(el => el.className = 'fa-solid fa-play');
    document.querySelectorAll('.ayah-box').forEach(el => el.classList.remove('playing-now'));
    
    icon.className = 'fa-solid fa-pause';
    document.getElementById(boxId).classList.add('playing-now');

    currentAudio.onended = () => {
        icon.className = 'fa-solid fa-play';
        document.getElementById(boxId).classList.remove('playing-now');
        isPlaying = false;
    };
};

window.toggleBookmark = function(type, id, ayahNum, text) {
    let bmarks = safeGetItem('quranBookmarks', []);
    const index = bmarks.findIndex(b => b.type == type && b.id == id && b.ayah == ayahNum);
    const icon = event.currentTarget;

    if (index > -1) {
        bmarks.splice(index, 1);
        icon.className = 'fa-regular fa-bookmark';
        icon.style.color = '';
    } else {
        bmarks.push({ type, id, ayah: ayahNum, arabic: text });
        icon.className = 'fa-solid fa-bookmark';
        icon.style.color = '#5ab276'; 
    }
    syncToCloud('quranBookmarks', bmarks);
};

window.applySettings = function() {
    const settings = safeGetItem('quranSettings', { arabicSize: '2.8', transSize: '1.4', showTrans: true, showArabic: true, qari: 'ar.yasseraddussary' });
    document.documentElement.style.setProperty('--arabic-font-size', settings.arabicSize + 'rem');
    document.documentElement.style.setProperty('--translation-font-size', settings.transSize + 'rem');
    
    if (!settings.showArabic) document.body.classList.add('hide-arabic');
    else document.body.classList.remove('hide-arabic');

    if (!settings.showTrans) document.body.classList.add('hide-translation');
    else document.body.classList.remove('hide-translation');
};

// =========================================================
// 3. INITIALIZATION & ROUTING
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
    if (window.google) {
        google.accounts.id.initialize({ client_id: CLIENT_ID, callback: handleCredentialResponse, ux_mode: 'popup' });
        const loginBtn = document.getElementById('google-login-btn');
        if (loginBtn) loginBtn.onclick = () => google.accounts.id.prompt();
    }

    const savedUser = safeGetItem('muslimUser', null);
    if (savedUser) { currentUser = savedUser; updateAuthUI(savedUser); }

    // Apply Settings
    applySettings();
    setupSettingsModal();

    // Router
    if (document.querySelector(".hero")) initDashboard();
    else if (document.getElementById("surah-list-container")) initSurahList();
    else if (document.getElementById("ayahs-container")) initQuranReader();
    
    // Sidebar
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    document.getElementById('open-sidebar-btn')?.addEventListener('click', () => { sidebar.classList.add('active'); overlay.classList.add('active'); });
    document.getElementById('close-sidebar')?.addEventListener('click', () => { sidebar.classList.remove('active'); overlay.classList.remove('active'); });
    overlay?.addEventListener('click', () => { sidebar.classList.remove('active'); overlay.classList.remove('active'); });
    document.getElementById('logout-btn')?.addEventListener('click', () => { localStorage.clear(); location.reload(); });
});

async function handleCredentialResponse(response) {
    try {
        const res = await fetch(`${BACKEND_URL}/api/auth/google`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: response.credential }),
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('muslimUser', JSON.stringify(data.user));
            location.reload(); 
        }
    } catch(e) { console.log(e); }
}

function updateAuthUI(user) {
    document.getElementById('google-login-btn').style.display = 'none';
    document.getElementById('user-profile').style.display = 'flex';
    document.getElementById('user-avatar').src = user.picture;
    document.getElementById('user-name').innerText = user.name;
}

// =========================================================
// 4. QURAN READER (Dal-Jazm Fix & exact End Symbol)
// =========================================================

async function initQuranReader() {
    const container = document.getElementById("ayahs-container");
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type') || 'surah';
    const id = params.get('id') || 1;
    const transLang = 'ur.junagarhi';

    try {
        const [arRes, trRes] = await Promise.all([
            fetch(`https://api.alquran.cloud/v1/${type}/${id}/quran-indopak`),
            fetch(`https://api.alquran.cloud/v1/${type}/${id}/${transLang}`)
        ]);

        const arData = await arRes.json();
        const trData = await trRes.json();
        const bookmarks = safeGetItem('quranBookmarks', []);
        container.innerHTML = '';

        arData.data.ayahs.forEach((ayah, i) => {
            const boxId = `ayah-box-${i}`;
            const isBookmarked = bookmarks.some(b => b.type == type && b.id == id && b.ayah == ayah.numberInSurah);
            const bmClass = isBookmarked ? 'fa-solid fa-bookmark' : 'fa-regular fa-bookmark';
            const bmColor = isBookmarked ? 'color: #5ab276;' : '';

            // THE FIX: Replace standard circular sukun (\u0652) with Dal-shaped Indo-Pak Small High Kha (\u06E1)
            let arabicText = ayah.text.replace(/\u0652/g, '\u06E1');
            
            // THE FIX: Exact Ornate Badge using \u06DD (End of Ayah Symbol)
            const ornateEnd = `<span class="ayah-end">\u06DD${toArabicNumeral(ayah.numberInSurah)}</span>`;

            const box = document.createElement('div');
            box.className = 'ayah-box';
            box.id = boxId;
            box.innerHTML = `
                <div class="ayah-card-header">
                    <div class="ayah-actions-left" style="display:flex; gap:15px; align-items:center;">
                        <i class="fa-solid fa-play" style="cursor:pointer;" onclick="playAyahAudio(${ayah.number}, '${boxId}')"></i>
                        <i class="${bmClass}" style="cursor:pointer; ${bmColor}" onclick="toggleBookmark('${type}', ${id}, ${ayah.numberInSurah}, \`${arabicText}\`)"></i>
                    </div>
                    <div class="ayah-number-badge">${ayah.surah ? ayah.surah.number : id}:${ayah.numberInSurah}</div>
                </div>
                <div class="ayah-arabic">${arabicText}${ornateEnd}</div>
                <div class="ayah-translation urdu-text" dir="rtl">${trData.data.ayahs[i].text}</div>
            `;
            container.appendChild(box);
        });
        
        syncToCloud('quranLastSeen', { type, id, title: arData.data.englishName || `Juz ${id}`, surahNum: id, ayah: 1 });

    } catch (err) { console.error("Reader Error", err); }
}

// =========================================================
// 5. DASHBOARD & LISTS
// =========================================================

function initDashboard() {
    const lastSeen = safeGetItem('quranLastSeen', null);
    if(lastSeen) {
        document.getElementById('last-seen-surah').innerText = lastSeen.title;
        document.getElementById('last-seen-ayah').innerText = `${lastSeen.surahNum} : ${lastSeen.ayah}`;
        document.getElementById('last-seen-btn').onclick = () => window.location.href = `quran.html?type=${lastSeen.type}&id=${lastSeen.id}`;
    }
}

function initSurahList() {
    const listContainer = document.getElementById("surah-list-container");
    const tabs = document.querySelectorAll('.list-tab');

    const renderSurahs = (surahs) => {
        listContainer.innerHTML = surahs.map(s => `
            <a href="quran.html?type=surah&id=${s.number}" class="surah-item">
                <div class="surah-number">${s.number}</div>
                <div class="surah-english-details"><strong>${s.englishName}</strong><br><span>Verses ${s.numberOfAyahs}</span></div>
                <div class="surah-arabic-name">${s.name}</div>
            </a>`).join('');
    };

    // THE FIX: Exact Parah Names
    const renderJuzs = () => {
        listContainer.innerHTML = juzData.map(j => `
            <a href="quran.html?type=juz&id=${j.id}" class="parah-item">
                <div class="parah-number">${j.id}</div>
                <div class="parah-details"><strong>${j.en}</strong><br><span>Juz ${j.id}</span></div>
                <div class="parah-arabic">${j.ar}</div>
            </a>`).join('');
    };

    fetch('https://api.alquran.cloud/v1/surah').then(res => res.json()).then(data => {
        renderSurahs(data.data);
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                if (tab.getAttribute('data-target') === 'surah') renderSurahs(data.data);
                else renderJuzs();
            });
        });
    });
}

// =========================================================
// 6. SETTINGS MODAL
// =========================================================

function setupSettingsModal() {
    const settings = safeGetItem('quranSettings', { arabicSize: '2.8', transSize: '1.4', showTrans: true, showArabic: true, qari: 'ar.yasseraddussary' });
    
    // Connect Sliders
    const arSlider = document.getElementById('arabic-font-slider');
    const trSlider = document.getElementById('translation-font-slider');
    if(arSlider) arSlider.value = settings.arabicSize;
    if(trSlider) trSlider.value = settings.transSize;

    // Save Button
    const saveBtn = document.querySelector('.save-settings-btn') || document.getElementById('set-default-btn');
    if (saveBtn) {
        saveBtn.onclick = () => {
            const newSettings = {
                arabicSize: arSlider ? arSlider.value : '2.8',
                transSize: trSlider ? trSlider.value : '1.4',
                showArabic: true,
                showTrans: true,
                qari: settings.qari // kept existing qari
            };
            syncToCloud('quranSettings', newSettings);
            applySettings();
            document.getElementById('settings-modal').style.display = 'none';
        };
    }
}
