// ============================================
// WC26 ALBUM - MAIN APPLICATION
// ============================================

const TEAM_FLAG_MAP = {
    'czechia': 'CZE', 'korea-republic': 'KOR', 'mexico': 'MEX', 'south-africa': 'RSA',
    'bosnia-herzegovina': 'BIH', 'canada': 'CAN', 'qatar': 'QAT', 'switzerland': 'SUI',
    'brazil': 'BRA', 'haiti': 'HAI', 'morocco': 'MAR', 'scotland': 'SCO',
    'australia': 'AUS', 'paraguay': 'PAR', 'turkiye': 'TUR', 'usa': 'USA',
    'cote-d-ivoire': 'CIV', 'curacao': 'CUW', 'ecuador': 'ECU', 'germany': 'GER',
    'japan': 'JPN', 'netherlands': 'NED', 'sweden': 'SWE', 'tunisia': 'TUN',
    'belgium': 'BEL', 'egypt': 'EGY', 'ir-iran': 'IRN', 'new-zealand': 'NZL',
    'cabo-verde': 'CPV', 'saudi-arabia': 'KSA', 'spain': 'ESP', 'uruguay': 'URU',
    'france': 'FRA', 'iraq': 'IRQ', 'norway': 'NOR', 'senegal': 'SEN',
    'algeria': 'ALG', 'argentina': 'ARG', 'austria': 'AUT', 'jordan': 'JOR',
    'colombia': 'COL', 'congo-dr': 'COD', 'portugal': 'POR', 'uzbekistan': 'UZB',
    'croatia': 'CRO', 'england': 'ENG', 'ghana': 'GHA', 'panama': 'PAN'
};

// State
let state = {
    teams: [],
    players: [],
    collection: {}, // { playerName: count }
    currentView: 'home',
    selectedTeam: null,
    currentPackCards: []
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    loadCollection();
    setupEventListeners();
    loadData();
});

async function loadData() {
    try {
        const [teamsRes, playersRes] = await Promise.all([
            fetch('data/teams.json'),
            fetch('data/players.json')
        ]);
        
        state.teams = await teamsRes.json();
        state.players = await playersRes.json();
        
        // Normalize team names (remove trailing spaces)
        state.teams = state.teams.map(t => ({
            ...t,
            name: t.name.trim(),
            group: t.group.trim().toUpperCase()
        }));
        
        state.players = state.players.filter(p => p && p.name);
        
        updateStats();
        console.log(`✅ Loaded ${state.teams.length} teams and ${state.players.length} players`);
    } catch (err) {
        console.error('❌ Failed to load data:', err);
    }
}

// ============================================
// LOCAL STORAGE
// ============================================

function loadCollection() {
    const saved = localStorage.getItem('wc26_collection');
    if (saved) {
        state.collection = JSON.parse(saved);
    }
}

function saveCollection() {
    localStorage.setItem('wc26_collection', JSON.stringify(state.collection));
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Splash screen
    document.getElementById('enter-btn').addEventListener('click', () => {
        document.getElementById('splash-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
    });

    // Navigation
    document.querySelectorAll('[data-view]').forEach(btn => {
        btn.addEventListener('click', () => {
            switchView(btn.dataset.view);
        });
    });

    // Home navigation cards
    document.querySelectorAll('[data-navigate]').forEach(el => {
        el.addEventListener('click', () => {
            switchView(el.dataset.navigate);
        });
    });

    // Pack opening
    document.getElementById('pack-card').addEventListener('click', openPack);
    document.getElementById('collect-all-btn').addEventListener('click', collectAllCards);
    document.getElementById('new-pack-btn').addEventListener('click', resetPack);

    // Modal
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    document.getElementById('player-modal').addEventListener('click', (e) => {
        if (e.target.id === 'player-modal') closeModal();
    });
}

function switchView(viewName) {
    state.currentView = viewName;
    
    // Update nav
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    // Update views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(`${viewName}-view`).classList.add('active');

    // Render view content
    if (viewName === 'album') renderAlbum();
    if (viewName === 'teams') renderTeams();
    if (viewName === 'pack') resetPack();
}

// ============================================
// PACK OPENING
// ============================================

function openPack() {
    const packCard = document.getElementById('pack-card');
    packCard.classList.add('opening');

    setTimeout(() => {
        // Generate 10 random cards
        state.currentPackCards = getRandomPlayers(10);
        
        // Hide pack, show cards
        document.getElementById('pack-wrapper').classList.add('hidden');
        const openedCards = document.getElementById('opened-cards');
        openedCards.classList.remove('hidden');
        openedCards.innerHTML = '';
        
        state.currentPackCards.forEach(player => {
            const card = createPlayerCard(player, false);
            openedCards.appendChild(card);
        });

        document.getElementById('collect-all-btn').classList.remove('hidden');
    }, 600);
}

function getRandomPlayers(count) {
    const shuffled = [...state.players].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function collectAllCards() {
    let newCards = 0;
    let duplicates = 0;

    state.currentPackCards.forEach(player => {
        const name = player.name;
        if (state.collection[name]) {
            state.collection[name]++;
            duplicates++;
        } else {
            state.collection[name] = 1;
            newCards++;
        }
    });

    saveCollection();
    updateStats();

    // Show success message
    alert(`🎉 Pack opened!\n\n✨ New cards: ${newCards}\n🔄 Duplicates: ${duplicates}`);

    document.getElementById('collect-all-btn').classList.add('hidden');
    document.getElementById('new-pack-btn').classList.remove('hidden');
}

function resetPack() {
    document.getElementById('pack-wrapper').classList.remove('hidden');
    document.getElementById('opened-cards').classList.add('hidden');
    document.getElementById('opened-cards').innerHTML = '';
    document.getElementById('collect-all-btn').classList.add('hidden');
    document.getElementById('new-pack-btn').classList.add('hidden');
    
    const packCard = document.getElementById('pack-card');
    packCard.classList.remove('opening');
    
    state.currentPackCards = [];
}

// ============================================
// PLAYER CARD CREATION
// ============================================

function createPlayerCard(player, isLocked = false) {
    const div = document.createElement('div');
    div.className = 'player-card' + (isLocked ? ' locked' : '');
    
    const teamKey = (player.team || '').toLowerCase().trim();
    const flagCode = TEAM_FLAG_MAP[teamKey] || '';
    const flagPath = flagCode ? `../../assets/flags/${flagCode}.png` : '../../assets/flags/default.png';
    const photoUrl = player.photourl || `../../assets/player_photos/${player.name.toLowerCase().replace(/\s+/g, '-')}.jpg`;
    const count = state.collection[player.name] || 0;

    // SVG Path (from Panini card)
    const svgPath = `M1 29.0484C1 21.7037 6.27366 15.5079 13.5238 14.4178C41.6096 10.1951 107.863 1.03396 154.143 1.0001C201.691 0.965304 269.826 10.2227 298.43 14.4477C305.7 15.5215 311 21.7258 311 29.0863V29.2971V29.5094V29.7231V29.9382V30.1548V30.3728V30.5922V30.813V31.0353V31.2589V31.484V31.7105V31.9383V32.1676V32.3983V32.6303V32.8637V33.0985V33.3347V33.5722V33.8111V34.0514V34.293V34.536V34.7803V35.026V35.273V35.5214V35.771V36.022V36.2744V36.528V36.783V37.0392V37.2968V37.5557V37.8159V38.0773V38.3401V38.6041V38.8694V39.136V39.4039V39.673V39.9435V40.2151V40.488V40.7622V41.0376V41.3143V41.5922V41.8713V42.1517V42.4333V42.7161V43.0001V43.2853V43.5718V43.8594V44.1483V44.4383V44.7296V45.022V45.3156V45.6104V45.9064V46.2035V46.5019V46.8013V47.102V47.4037V47.7067V48.0108V48.316V48.6223V48.9298V49.2385V49.5482V49.8591V50.1711V50.4842V50.7984V51.1137V51.4301V51.7476V52.0662V52.3859V52.7067V53.0285V53.3514V53.6754V54.0005V54.3266V54.6538V54.982V55.3113V55.6416V55.973V56.3054V56.6388V56.9733V57.3088V57.6453V57.9828V58.3213V58.6609V59.0014V59.343V59.6855V60.029V60.3735V60.719V61.0655V61.413V61.7614V62.1108V62.4611V62.8124V63.1647V63.5179V63.872V64.2271V64.5831V64.9401V65.298V65.6568V66.0165V66.3771V66.7387V67.1011V67.4645V67.8287V68.1939V68.5599V68.9268V69.2946V69.6633V70.0329V70.4033V70.7746V71.1467V71.5197V71.8936V72.2683V72.6438V73.0202V73.3974V73.7754V74.1543V74.534V74.9145V75.2959V75.678V76.0609V76.4447V76.8292V77.2145V77.6007V77.9876V78.3753V78.7637V79.1529V79.5429V79.9337V80.3252V80.7175V81.1105V81.5043V81.8988V82.2941V82.6901V83.0868V83.4842V83.8824V84.2813V84.6809V85.0812V85.4822V85.8839V86.2863V86.6894V87.0931V87.4976V87.9027V88.3086V88.7151V89.1222V89.53V89.9385V90.3476V90.7574V91.1678V91.5789V91.9906V92.4029V92.8159V93.2295V93.6437V94.0585V94.474V94.89V95.3066V95.7239V96.1417V96.5602V96.9792V97.3988V97.819V98.2397V98.661V99.0829V99.5054V99.9284V100.352V100.776V101.201V101.626V102.052V102.478V102.905V103.332V103.76V104.188V104.617V105.046V105.476V105.907V106.337V106.769V107.201V107.633V108.066V108.499V108.933V109.367V109.802V110.237V110.672V111.108V111.545V111.982V112.419V112.857V113.295V113.733V114.173V114.612V115.052V115.492V115.933V116.374V116.815V117.257V117.699V118.142V118.585V119.028V119.472V119.916V120.36V120.805V121.25V121.696V122.142V122.588V123.034V123.481V123.928V124.376V124.824V125.272V125.72V126.169V126.618V127.067V127.517V127.967V128.417V128.868V129.318V129.769V130.221V130.672V131.124V131.576V132.028V132.481V132.934V133.387V133.84V134.293V134.747V135.201V135.655V136.11V136.564V137.019V137.474V137.929V138.384V138.84V139.296V139.752V140.208V140.664V141.12V141.577V142.034V142.491V142.948V143.405V143.862V144.32V144.777V145.235V145.693V146.151V146.609V147.067V147.525V147.984V148.442V148.901V149.359V149.818V150.277V150.736V151.195V151.654V152.113V152.572V153.032V153.491V153.95V154.41V154.869V155.329V155.788V156.248V156.707V157.167V157.626V158.086V158.546V159.005V159.465V159.924V160.384V160.844V161.303V161.763V162.222V162.682V163.141V163.6V164.06V164.519V164.978V165.437V165.897V166.356V166.815V167.274V167.732V168.191V168.65V169.108V169.567V170.025V170.484V170.942V171.4V171.858V172.316V172.773V173.231V173.688V174.146V174.603V175.06V175.517V175.973V176.43V176.886V177.342V177.798V178.254V178.71V179.166V179.621V180.076V180.531V180.986V181.44V181.895V182.349V182.803V183.256V183.71V184.163V184.616V185.069V185.521V185.973V186.425V186.877V187.329V187.78V188.231V188.681V189.132V189.582V190.032V190.481V190.931V191.38V191.828V192.277V192.725V193.172V193.62V194.067V194.514V194.96V195.406V195.852V196.298V196.743V197.187V197.632V198.076V198.519V198.963V199.406V199.848V200.29V200.732V201.173V201.614V202.055V202.495V202.935V203.374V203.813V204.252V204.69V205.127V205.565V206.001V206.438V206.874V207.309V207.744V208.179V208.613V209.047V209.48V209.912V210.345V210.776V211.208V211.638V212.069V212.498V212.928V213.356V213.785V214.212V214.64V215.066V215.492V215.918V216.343V216.768V217.192V217.615V218.038V218.46V218.882V219.303V219.724V220.144V220.563V220.982V221.401V221.818V222.236V222.652V223.068V223.483V223.898V224.312V224.726V225.138V225.551V225.962V226.373V226.783V227.193V227.602V228.01V228.418V228.825V229.231V229.637V230.042V230.446V230.85V231.253V231.655V232.057V232.458V232.861V233.265V233.67V234.076V234.482V234.889V235.297V235.705V236.114V236.524V236.934V237.345V237.757V238.169V238.582V238.996V239.41V239.825V240.241V240.657V241.074V241.491V241.91V242.328V242.748V243.168V243.588V244.009V244.431V244.853V245.276V245.7V246.124V246.548V246.974V247.399V247.826V248.253V248.68V249.108V249.536V249.966V250.395V250.825V251.256V251.687V252.119V252.551V252.984V253.417V253.851V254.285V254.72V255.155V255.59V256.027V256.463V256.9V257.338V257.776V258.214V258.653V259.093V259.533V259.973V260.413V260.855V261.296V261.738V262.181V262.623V263.067V263.51V263.954V264.399V264.843V265.289V265.734V266.18V266.627V267.073V267.52V267.968V268.416V268.864V269.312V269.761V270.21V270.66V271.11V271.56V272.01V272.461V272.912V273.364V273.816V274.268V274.72V275.173V275.626V276.079V276.532V276.986V277.44V277.895V278.349V278.804V279.259V279.715V280.17V280.626V281.082V281.539V281.995V282.452V282.909V283.366V283.824V284.281V284.739V285.197V285.655V286.114V286.572V287.031V287.49V287.949V288.409V288.868V289.328V289.788V290.247V290.708V291.168V291.628V292.089V292.549V293.01V293.471V293.932V294.393V294.854V295.316V295.777V296.239V296.7V297.162V297.624V298.086V298.548V299.01V299.472V299.934V300.396V300.859V301.321V301.783V302.246V302.708V303.171V303.633V304.096V304.558V305.021V305.483V305.946V306.409V306.871V307.334V307.796V308.259V308.721V309.184V309.646V310.109V310.571V311.034V311.496V311.958V312.421V312.883V313.345V313.807V314.269V314.731V315.193V315.654V316.116V316.577V317.039V317.5V317.962V318.423V318.884V319.345V319.805V320.266V320.727V321.187V321.647V322.107V322.567V323.027V323.487V323.946V324.406V324.865V325.324V325.783V326.241V326.7V327.158V327.616V328.074V328.531V328.989V329.446V329.903V330.36V330.816V331.273V331.729V332.185V332.64V333.096V333.551V334.006V334.46V334.915V335.369V335.823V336.276V336.729V337.182V337.635V338.087V338.539V338.991V339.443V339.894V340.345V340.795V341.245V341.695V342.145V342.594V343.043V343.491V343.94V344.387V344.835V345.282V345.729V346.175V346.621V347.067V347.512V347.957V348.401V348.845V349.289V349.732V350.175V350.617V351.059V351.501V351.942V352.383V352.823V353.263V353.702V354.141V354.58V355.018V355.455V355.893V356.329V356.765V357.201V357.636V358.071V358.505V358.939V359.372V359.805V360.237V360.669V361.1V361.531V361.961V362.39V362.82V363.248V363.676V364.104V364.53V364.957V365.383V365.808V366.232V366.657V367.08V367.503V367.925V368.347V368.768V369.189V369.609V370.028V370.447V370.865V371.282V371.699V372.116V372.531V372.946V373.361V373.774V374.187V374.6V375.011V375.422V375.833V376.243V376.652V377.06V377.468V377.875V378.281V378.687V379.092V379.496V379.899V380.302V380.704V381.105V381.506V381.906V382.305V382.704V383.101V383.498V383.894V384.29V384.684V385.078V385.471V385.864V386.255V386.646V387.036V387.425V387.814V388.201V388.588V388.974V389.359V389.743V390.127V390.51V390.892V391.273V391.653V392.032V392.411V392.788V393.165V393.541V393.916V394.29V394.664V395.036V395.408V395.779V396.148V396.517V396.885V397.252V397.619V397.984V398.348V398.712V399.074V399.436V399.797V400.156V400.515V400.873V401.23V401.586V401.941V402.295V402.648V403V403.351V403.701V404.05V404.398V404.746V405.092V405.437V405.781V406.124V406.466V406.807V407.148V407.487V407.825V408.162V408.498V408.832V409.166V409.499V409.831V410.162V410.491V410.82V411.147V411.474V411.799V412.123V412.446V412.768V413.089V413.409V413.728V414.045V414.362V414.677V414.992V415.305V415.617V415.928V416.237V416.546V416.853V417.159V417.465V417.768V418.071V418.373V418.673V418.972V419.27V419.567V419.863V420.157V420.451V420.743V421.034V421.323V421.612V421.899V422.185V422.469V422.753V423.035V423.316V423.596V423.874V424.151V424.427V424.702V424.975V425.248V425.518V425.788V426.056V426.323V426.589V426.853V427.116V427.378V427.639V427.898V428.156V428.412V428.667V428.921V429.174V429.425V429.675V429.923V430.17V430.416V430.66V430.903V431.145V431.385V431.624V431.861V432.097V432.332V432.565V432.797V433.028V433.257V433.484V433.71V433.935V434.159V434.38V434.601V434.82V435.037V435.254V435.468V435.681V435.893V436.103V436.312V436.52C311 443.574 306.084 449.668 299.189 451.168L157.574 481.977L12.8723 451.126C5.94809 449.65 1 443.546 1 436.468L1 232.458L1 29.0484Z`;

    div.innerHTML = `
        <div class="card-svg-wrapper">
            <svg viewBox="0 0 312 483" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                <defs>
                    <clipPath id="clip-${player.name.replace(/\s/g, '-')}">
                        <path d="${svgPath}"/>
                    </clipPath>
                </defs>
            </svg>
        </div>
        <div class="card-background" style="clip-path: path('${svgPath}');"></div>
        <div class="card-content">
            <div class="card-flags">
                <img src="${flagPath}" alt="${teamKey}" class="card-flag" onerror="this.src='../assets/flags/default.png'">
                <img src="../assets/wc-logo.avif" alt="WC26" class="card-logo">
            </div>
            <div class="card-player-image">
                <img src="${photoUrl}" alt="${player.name}" onerror="this.src='../assets/player_photos/default.jpg'">
            </div>
            <div class="card-info">
                <div class="card-player-name">${player.name}</div>
                <div class="card-player-position">${player.position || 'Player'}</div>
            </div>
        </div>
        ${count > 1 && !isLocked ? `<div class="duplicate-badge">x${count}</div>` : ''}
    `;

    if (!isLocked) {
        div.addEventListener('click', () => showPlayerModal(player));
    }

    return div;
}

// ============================================
// ALBUM
// ============================================

function renderAlbum() {
    const grid = document.getElementById('album-grid');
    grid.innerHTML = '';
    
    const totalPlayers = state.players.length;
    const collected = Object.keys(state.collection).length;
    
    document.getElementById('album-progress').textContent = `${collected} / ${totalPlayers} cards collected`;

    state.players.forEach(player => {
        const isCollected = state.collection[player.name] > 0;
        const card = createPlayerCard(player, !isCollected);
        grid.appendChild(card);
    });
}

// ============================================
// TEAMS
// ============================================

function renderTeams() {
    const list = document.getElementById('teams-list');
    list.innerHTML = '';

    // Group teams by group letter
    const groups = {};
    state.teams.forEach(team => {
        if (!groups[team.group]) groups[team.group] = [];
        groups[team.group].push(team);
    });

    Object.keys(groups).sort().forEach(groupLetter => {
        const groupHeader = document.createElement('div');
        groupHeader.style.cssText = 'font-weight: 900; color: var(--primary); padding: 0.5rem; margin-top: 0.5rem; font-size: 0.85rem; letter-spacing: 1px;';
        groupHeader.textContent = `GROUP ${groupLetter}`;
        list.appendChild(groupHeader);

        groups[groupLetter].forEach(team => {
            const teamPlayers = state.players.filter(p => 
                (p.team || '').toLowerCase().trim() === team.name.toLowerCase()
            );
            const collectedCount = teamPlayers.filter(p => state.collection[p.name] > 0).length;
            const totalCount = teamPlayers.length;

            const item = document.createElement('div');
            item.className = 'team-item';
            item.dataset.team = team.name;
            
            const flagCode = TEAM_FLAG_MAP[team.name] || '';
            
            item.innerHTML = `
                <img src="../assets/flags/${flagCode}.png" alt="${team.name}" class="team-flag-small" onerror="this.src='../assets/flags/default.png'">
                <span class="team-name">${team.name.replace(/-/g, ' ')}</span>
                <span class="team-progress">${collectedCount} / ${totalCount}</span>
            `;

            item.addEventListener('click', () => {
                document.querySelectorAll('.team-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                renderTeamDetail(team);
            });

            list.appendChild(item);
        });
    });
}

function renderTeamDetail(team) {
    const detail = document.getElementById('team-detail');
    detail.innerHTML = '';

    const teamPlayers = state.players.filter(p => 
        (p.team || '').toLowerCase().trim() === team.name.toLowerCase()
    );

    if (teamPlayers.length === 0) {
        detail.innerHTML = '<p>No players found for this team</p>';
        return;
    }

    teamPlayers.forEach(player => {
        const isCollected = state.collection[player.name] > 0;
        const card = createPlayerCard(player, !isCollected);
        detail.appendChild(card);
    });
}

// ============================================
// MODAL
// ============================================

function showPlayerModal(player) {
    const modal = document.getElementById('player-modal');
    const body = document.getElementById('modal-body');
    const count = state.collection[player.name] || 0;
    
    const card = createPlayerCard(player, false);
    body.innerHTML = '';
    body.appendChild(card);

    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('player-modal').classList.add('hidden');
}

// ============================================
// STATS
// ============================================

function updateStats() {
    const collected = Object.keys(state.collection).length;
    const duplicates = Object.values(state.collection).reduce((sum, count) => sum + Math.max(0, count - 1), 0);
    
    document.getElementById('collected-count').textContent = collected;
    document.getElementById('duplicate-count').textContent = duplicates;
}