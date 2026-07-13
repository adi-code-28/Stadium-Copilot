// Mock data for Stadium Copilot Hackathon Prototype

// 1. Wayfinding coordinates for interactive SVG map (MetLife Stadium Mock layout)
export const STADIUM_MAP = {
  width: 500,
  height: 400,
  nodes: {
    // Gates
    'gate-a': { id: 'gate-a', label: 'Gate A (North)', x: 250, y: 40, type: 'gate', color: '#3b82f6' },
    'gate-b': { id: 'gate-b', label: 'Gate B (East)', x: 440, y: 200, type: 'gate', color: '#3b82f6' },
    'gate-c': { id: 'gate-c', label: 'Gate C (South)', x: 250, y: 360, type: 'gate', color: '#3b82f6' },
    'gate-d': { id: 'gate-d', label: 'Gate D (West)', x: 60, y: 200, type: 'gate', color: '#3b82f6' },
    
    // Seats
    'sec-101': { id: 'sec-101', label: 'Section 101', x: 200, y: 120, type: 'seat', color: '#10b981' },
    'sec-112': { id: 'sec-112', label: 'Section 112', x: 380, y: 150, type: 'seat', color: '#f59e0b' }, // flagged high concourse density
    'sec-120': { id: 'sec-120', label: 'Section 120', x: 340, y: 270, type: 'seat', color: '#10b981' },
    'sec-130': { id: 'sec-130', label: 'Section 130', x: 160, y: 250, type: 'seat', color: '#f59e0b' },
    
    // Amenities
    'cooling-a': { id: 'cooling-a', label: 'Cooling Zone A', x: 170, y: 70, type: 'cooling', color: '#06b6d4' },
    'cooling-b': { id: 'cooling-b', label: 'Cooling Zone B', x: 380, y: 240, type: 'cooling', color: '#06b6d4' },
    'restroom-a': { id: 'restroom-a', label: 'Restroom A', x: 300, y: 100, type: 'restroom', color: '#8b5cf6' },
    'restroom-b': { id: 'restroom-b', label: 'Restroom B', x: 200, y: 300, type: 'restroom', color: '#8b5cf6' },
    'quiet-zone': { id: 'quiet-zone', label: 'Quiet Area', x: 100, y: 280, type: 'quiet', color: '#ec4899' },
    
    // Transit
    'shuttle-hub': { id: 'shuttle-hub', label: 'MetLife Shuttle Hub', x: 30, y: 370, type: 'transit', color: '#ef4444' },
    'rail-station': { id: 'rail-station', label: 'NJ Transit Train Stn', x: 470, y: 370, type: 'transit', color: '#ef4444' },
  },
  // Simple connectivity database to help draw paths
  paths: {
    // Connect gates to seats/cooling/amenities
    'gate-a': ['cooling-a', 'sec-101', 'restroom-a'],
    'gate-b': ['sec-112', 'cooling-b', 'restroom-a'],
    'gate-c': ['sec-120', 'restroom-b', 'quiet-zone'],
    'gate-d': ['sec-130', 'quiet-zone', 'shuttle-hub'],
    'cooling-a': ['sec-101', 'restroom-a'],
    'cooling-b': ['sec-112', 'sec-120', 'restroom-b'],
    'sec-101': ['sec-112', 'restroom-a'],
    'sec-112': ['cooling-b'],
    'sec-120': ['sec-130', 'restroom-b'],
    'sec-130': ['quiet-zone', 'gate-d'],
    'shuttle-hub': ['gate-d'],
    'rail-station': ['gate-b', 'gate-c']
  }
};

// Breadth First Search to find shortest visual path between nodes
export function findPath(startId, endId) {
  const nodes = STADIUM_MAP.nodes;
  const graph = STADIUM_MAP.paths;
  
  if (!nodes[startId] || !nodes[endId]) return [];
  if (startId === endId) return [nodes[startId]];

  let queue = [[startId]];
  let visited = new Set([startId]);

  while (queue.length > 0) {
    let path = queue.shift();
    let current = path[path.length - 1];

    if (current === endId) {
      return path.map(id => nodes[id]);
    }

    const neighbors = graph[current] || [];
    // Bidirectional lookup since paths are defined one-way in database
    const allNeighbors = [...neighbors];
    for (const [key, value] of Object.entries(graph)) {
      if (value.includes(current)) allNeighbors.push(key);
    }

    for (let neighbor of allNeighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }

  // Fallback: direct line if no graph path found
  return [nodes[startId], nodes[endId]];
}

// 2. Incident Simulator Scenarios
export const INCIDENT_SCENARIOS = [
  {
    id: 'heat-emergency',
    title: 'Heat Emergency: Gate C Hydration Failure',
    riskLevel: 'CRITICAL',
    location: 'Gate C Concourse / South Entrance',
    narrative: 'Ambient temperature is 33°C (WBGT 31.2°C). High crowd dwell time at Gate C due to scanner failure is concentrating 4,000+ fans. Bulk hydration pallete delivery is delayed in transit.',
    stages: [
      {
        stageIndex: 0,
        prompt: 'Gate C scanner backlog builds up. Fans are standing in direct sun for 25+ minutes. Radio reports 3 fans fainted from heat exhaustion in section 120 concourse.',
        feed: [
          '[14:15] [CCTV Gate C] Dwell densities exceeding 4.2 people/m².',
          '[14:17] [Ops Radio] Medic Unit 3: "We have two heat syncope cases at Gate C turnstiles. Requesting support."',
          '[14:18] [System Alert] Heat index at South Concourse hits critical threshold (WBGT 31°C). Area lacks active AC.'
        ],
        aiAnalysis: 'Risk: High threat of localized stampede and heat stroke. Dwell times are rising due to slow entry scan speeds.',
        choices: [
          {
            id: 'heat-a',
            text: 'Bypass ticket scans: Open emergency manual gates to flush fans into shaded concourse immediately.',
            reasoning: 'AI Decision Trace: Bypassing tickets prioritizes life safety over security validation. Reduces density by 80% in 3 mins. Prevents heat casualties.',
            safetyChange: 35,
            efficiencyChange: -10,
            securityChange: -25,
            resultLog: 'Emergency gates opened. 4,000 fans moved into shade within 4 minutes. 0 further fainting cases. Security flags 42 unverified tickets, but mass casualty avoided.'
          },
          {
            id: 'heat-b',
            text: 'Deploy Volunteer Water Brigade: Dispatch 20 volunteers with ice-packs and mobile misting fans to Gate C line.',
            reasoning: 'AI Decision Trace: Mitigates heat risk locally but does not solve the underlying density bottleneck. Volunteer safety is also at risk.',
            safetyChange: 15,
            efficiencyChange: 5,
            securityChange: 0,
            resultLog: 'Volunteers deployed with water bags. Fan tempers cooled slightly, but density remains critical. Scanner backlog unresolved.'
          },
          {
            id: 'heat-c',
            text: 'Redirect arriving fans: Change digital signage at Transit Hubs to divert new arrivals to Gate D.',
            reasoning: 'AI Decision Trace: Reduces future inflow but leaves the current 4,000 fans stranded in the heat.',
            safetyChange: 5,
            efficiencyChange: -15,
            securityChange: 0,
            resultLog: 'Signage redirected incoming fans to Gate D. However, Gate C backlog is unchanged. Two more medical transports requested.'
          }
        ]
      },
      {
        stageIndex: 1,
        prompt: 'The flow is somewhat stabilized, but emergency water reserves at Gate C cooling zone are fully depleted. A delivery truck is stuck in transit gridlock outside.',
        feed: [
          '[14:26] [Logistics Dispatch] Truck 14 (Water Supply) reported stuck at Route 3 exit - traffic static.',
          '[14:28] [CCTV Cooling Zone B] Fans arguing with staff over empty hydration tanks.'
        ],
        aiAnalysis: 'Risk: Dehydration riot risk. Deployed volunteers report exhaustion.',
        choices: [
          {
            id: 'heat-d',
            text: 'Reallocate Water from Club Lounges: Authorize volunteers to raid air-conditioned VIP areas for bottled water and bring them to Gate C.',
            reasoning: 'AI Decision Trace: Taps redundant supply lines. Safe, quick, but degrades premium experience slightly.',
            safetyChange: 25,
            efficiencyChange: -5,
            securityChange: 0,
            resultLog: 'Water boxes moved from VIP lounges. Fan panic subverted. Hydration restored. Premium guest complaints logged, but safety maintained.'
          },
          {
            id: 'heat-e',
            text: 'Re-route water truck via police escort: Coordinate with local state police to escort Truck 14 through Route 3 shoulder.',
            reasoning: 'AI Decision Trace: Effective but depends on external coordination time (estimated 15-20 min delay).',
            safetyChange: 10,
            efficiencyChange: 15,
            securityChange: -5,
            resultLog: 'Police escort requested. Truck arrived in 18 minutes. During wait, 5 fans treated for moderate heat stroke.'
          }
        ]
      }
    ]
  },
  {
    id: 'transit-crisis',
    title: 'Transit Corridor Crash: MetLife Shuttle Bus Disruption',
    riskLevel: 'HIGH',
    location: 'MetLife Shuttle Corridor / Route 3',
    narrative: 'A traffic collision blocks the dedicated express lane for shuttle buses returning to Manhattan. 15,000 fans are exiting and accumulating at the Shuttle Hub with no buses arriving. Crowd temperature is rising.',
    stages: [
      {
        stageIndex: 0,
        prompt: 'Shuttle bus operations are suspended. Over 6,000 fans are packed in the staging corral. NJ Transit rail operations are running but under heavy strain.',
        feed: [
          '[22:10] [Ops Dispatch] Shuttle Lead: "Collision in lane 2. Tow truck dispatch estimate is 45 minutes. No buses can reach the hub."',
          '[22:12] [CCTV Shuttle Hub] Crowd pressing against gates. Incident of gate-climbing reported.',
          '[22:13] [NJ Transit] Transit density at train platforms exceeds yellow line safety margins.'
        ],
        aiAnalysis: 'Risk: Crush hazard at the shuttle corral and train platforms. Low accessibility egress.',
        choices: [
          {
            id: 'trans-a',
            text: 'Trigger Multi-Modal Redirect: Push AI notification to all exiting fans offering free NJ Transit rail codes, and dynamically reroute empty shuttle buses to secondary pick-up point (Lot G).',
            reasoning: 'AI Decision Trace: Distributes the crowd load. Promotes active transport, mitigates MetLife shuttle bus choke point.',
            safetyChange: 25,
            efficiencyChange: 10,
            securityChange: 5,
            resultLog: 'Notifications pushed to 12,000 fans. 4,000 divert to trains, 2,000 walk to Lot G. Corral pressure dropped below hazardous threshold.'
          },
          {
            id: 'trans-b',
            text: 'Divert Rideshare Staging: Force rideshare vehicles (Uber/Lyft) to enter the Bus Lane from the wrong direction under traffic control to pick up families.',
            reasoning: 'AI Decision Trace: Violates standard traffic rules. High risk of gridlocking the entire loop road.',
            safetyChange: -10,
            efficiencyChange: -20,
            securityChange: -10,
            resultLog: 'Rideshares attempted wrong-way entry, causing a major bottleneck in Lot E. Shuttle corridor is now fully blocked by confused drivers.'
          },
          {
            id: 'trans-c',
            text: 'Hold fans inside stadium: Close exit gates A & B, directing fans to sit in stadium bowl for post-match light show.',
            reasoning: 'AI Decision Trace: Keeps crowd in a highly controlled environment with access to restrooms/water, but might cause panic if exit blockage is perceived.',
            safetyChange: 20,
            efficiencyChange: -30,
            securityChange: 15,
            resultLog: 'Gates held. Post-match show kept 8,000 fans in seats. Exit flow slowed to manageable rate, buying time for tow trucks on Route 3.'
          }
        ]
      }
    ]
  },
  {
    id: 'guadalajara-unrest',
    title: 'Guadalajara Fan Zone: Unrest Ripple Effect',
    riskLevel: 'CRITICAL',
    location: 'Estadio Akron Fan Zone',
    narrative: 'Rival fan groups clash in the outer un-ticketed Fan Zone. Local police deploy tear gas, causing a wind-blown drifting cloud heading towards Gate A exit corridor where 8,000 ticketed fans are exiting.',
    stages: [
      {
        stageIndex: 0,
        prompt: 'Tear gas is drifting towards Gate A concourse. Crowd is beginning to panic and stampede backwards towards the narrow concourse stairs.',
        feed: [
          '[18:30] [Sensors] Chemical irritant warning triggered at Sector A external plaza.',
          '[18:31] [Ops Radio] Gate A Lead: "Crowd is rushing back into the stadium! We have people falling on the ramp! Need medical immediately!"',
          '[18:33] [CCTV Concourse A] Visual confirmation of high-speed backward flow and crush hazard.'
        ],
        aiAnalysis: 'Risk: Extreme risk of crowd crush on concourse ramps. Gas inhalation threat.',
        choices: [
          {
            id: 'guad-a',
            text: 'Reverse Air Circulation & Open Lower Pitch Access: Toggle stadium HVAC to blow air outwards at Gate A. Open field-level gates to allow fans onto the grass pitch.',
            reasoning: 'AI Decision Trace: Blows gas away from the concourse. Opening pitch access provides an emergency pressure valve for the crowd, bypassing standard stadium rules.',
            safetyChange: 40,
            efficiencyChange: -15,
            securityChange: -15,
            resultLog: 'Pitch gates opened. 5,000 fans safely evacuated onto the pitch. HVAC reversed, clearing gas in 2 minutes. 12 minor injuries treated, major tragedy averted.'
          },
          {
            id: 'guad-b',
            text: 'Lock Gate A Turnstiles: Fully lock all gates to prevent tear gas and rioters from entering the inner stadium perimeter.',
            reasoning: 'AI Decision Trace: Protects the inner stadium but traps thousands of panicking fans in the tear gas zone against locked gates.',
            safetyChange: -35,
            efficiencyChange: -5,
            securityChange: 30,
            resultLog: 'Gates locked. Crowd crushed against Gate A barriers. 45 fans hospitalized with crush and inhalation injuries. Security perimeter intact, but at extreme human cost.'
          }
        ]
      }
    ]
  }
];

// 3. Database Context for Ops Query Tool
export const OPS_DATABASE_CONTEXT = `
STADIUM: MetLife Stadium
CURRENT TIME: Matchday 26, Live Operations Mode.
MATCH: Brazil vs Morocco (Group Stage). Attendance: 78,320.
SENSORS DATABASE:
- GATE_A (North): Wait Time: 8 min, Density: 2.1 p/m², Scanner Flow: 92%, Local WBGT: 28.1°C, Status: NORMAL
- GATE_B (East): Wait Time: 6 min, Density: 1.8 p/m², Scanner Flow: 96%, Local WBGT: 27.9°C, Status: NORMAL
- GATE_C (South): Wait Time: 28 min, Density: 4.8 p/m², Scanner Flow: 45% (Scanner 4 & 5 offline), Local WBGT: 31.4°C, Status: CRITICAL (Heat + Density Warning)
- GATE_D (West): Wait Time: 4 min, Density: 1.2 p/m², Scanner Flow: 98%, Local WBGT: 28.5°C, Status: NORMAL
- FAN_ZONE_1: Occupancy: 8,500, Incidents: 0, Local WBGT: 30.5°C, Status: ACTIVE
- FAN_ZONE_2: Occupancy: 12,000, Incidents: 1 (Minor slip and fall), Local WBGT: 31.1°C, Status: HIGH_HEAT
- SHUTTLE_HUB: Wait Time: 35 min, Buses in Service: 14, Route 3 Status: Slow, Status: DELAYED
- NJ_TRANSIT_TRAINS: Platform Wait Time: 12 min, Frequency: Every 8 min, Platform Density: 3.2 p/m², Status: HIGH_VOLUME

CONCOURSE TO SEAT OCCUPANCY GAP:
- Section 101: Tickets scanned: 940, Occupancy in seats: 910. Concourse density: LOW
- Section 112 (Concourse Heat Risk): Tickets scanned: 1,200, Occupancy in seats: 540. Concourse density: CRITICAL (660 fans lingering in air-conditioned concourses/bars because stadium bowl is 32.5°C in direct sun)
- Section 120: Tickets scanned: 1,100, Occupancy in seats: 1,020. Concourse density: LOW
- Section 130: Tickets scanned: 950, Occupancy in seats: 720. Concourse density: MEDIUM (230 fans lingering in concourse)

SUSTAINABILITY DIRECTORY:
- Transit Modal Split: Public Transit (42%), Rideshare/Carpool (38%), Charter Bus/Shuttles (15%), Walk/Cycle (5%)
- Carbon Footprint: Cumulative tournament-fan average emissions per seat: 85kg CO2 (primarily due to long-haul travel).
`;

// Canned QA response mapping for Offline Ops Query Mode
export const CANNED_OPS_RESPONSES = [
  {
    query: 'Which gates have >15 min wait times and rising WBGT?',
    response: 'GATE_C (South Entrance) currently has a 28-minute wait time and a local Wet Bulb Globe Temperature (WBGT) of 31.4°C, which exceeds the critical safety threshold of 28°C.',
    tools: [
      { call: 'getGateStatus()', result: 'Gate A: 8m, Gate B: 6m, Gate C: 28m, Gate D: 4m' },
      { call: 'getWeatherSensor(gate="Gate C")', result: 'Local Temperature: 33°C, Humidity: 68%, WBGT: 31.4°C' }
    ],
    reasoning: 'AI Reasoning Trace: Querying GateStatus and Weather Sensors. Gate C wait time (28m) > 15m AND Gate C WBGT (31.4°C) > 28°C. Recommended action: Deploy hydration support, redirect arriving spectators to Gate D.',
    chart: {
      type: 'bar',
      labels: ['Gate A', 'Gate B', 'Gate C', 'Gate D'],
      datasets: [
        { label: 'Wait Time (Min)', data: [8, 6, 28, 4], color: '#3b82f6' },
        { label: 'WBGT (°C)', data: [28.1, 27.9, 31.4, 28.5], color: '#ef4444' }
      ]
    }
  },
  {
    query: 'Summarize crowd risk in Fan Zone 2.',
    response: 'Fan Zone 2 (Capacity: 15,000) currently has 12,000 occupants. Risk is MODERATE due to heat load (WBGT 31.1°C) rather than crowd density. 1 minor medical incident logged (slip/fall). Heat-hydration alert broadcast recommended.',
    tools: [
      { call: 'getFanZoneStatus(id=2)', result: 'Occupants: 12,000, Local Temp: 32°C, WBGT: 31.1°C, IncidentCount: 1' }
    ],
    reasoning: 'AI Reasoning Trace: Fan Zone 2 density is 1.6 p/m² (safe). However, WBGT of 31.1°C exceeds safety parameters. Recommending activation of misting cooling fan array 4 & 5.',
    chart: {
      type: 'radial',
      labels: ['Occupancy Load', 'Heat Risk Index', 'Medical Incidents'],
      datasets: [
        { label: 'Zone Status (%)', data: [80, 89, 5], color: '#f59e0b' }
      ]
    }
  },
  {
    query: 'Explain the concourse seat occupancy gap.',
    response: 'Section 112 exhibits a critical seat-to-concourse gap. While 1,200 tickets have scanned in, only 540 fans are seated (a 55% seat vacancy). Concourse CCTV confirms 660 fans are lingering in air-conditioned stadium bars/concourses to avoid the 32.5°C direct sun exposure in Section 112.',
    tools: [
      { call: 'getSectionOccupancy(sec=112)', result: 'Scanned: 1,200, Seated: 540, Concourse Dwell: 660' }
    ],
    reasoning: 'AI Reasoning Trace: Ticket scans show the section is full, but the visual occupancy is low. This creates empty seat appearances. Cause: Extreme heat in the stadium bowl. Recommendation: Send targeted push notification offering sunshade rental codes or hydration refills.',
    chart: {
      type: 'pie',
      labels: ['Seated Fans', 'Concourse Lingering'],
      datasets: [
        { label: 'Section 112 Fans', data: [540, 660], colors: ['#10b981', '#ef4444'] }
      ]
    }
  }
];

// 4. Cultural context translation and briefs
export const CULTURAL_BRIEFS = {
  'Czech': {
    welcome: 'Vítejte na stadionu MetLife! Chladicí zóny najdete v sekcích 102 a 124.',
    ticket: 'Prosím, připravte si vstupenku ke skenování.',
    water: 'Prosím, pijte hodně vody. Dnes je extrémní horko.',
    help: 'Lékařská pomoc je na cestě.',
    shuttle: 'Kyvadlové autobusy jsou v současné době zpožděny. Doporučujeme využít vlakovou dopravu.',
    etiquette: 'Czech Etiquette: Keep a polite physical distance. When greeting, a firm handshake and direct eye contact is expected. Maintain a professional tone.'
  },
  'Portuguese': {
    welcome: 'Bem-vindos ao Estádio MetLife! Encontre as zonas de resfriamento nos setores 102 e 124.',
    ticket: 'Por favor, tenha seu ingresso pronto para digitalização.',
    water: 'Por favor, beba bastante água. Hoje está extremamente quente.',
    help: 'A ajuda médica está a caminho.',
    shuttle: 'Os ônibus fretados estão atrasados. Recomendamos utilizar a linha de trem.',
    etiquette: 'Brazilian/Moroccan Context: Portuguese speaker. A warm greeting is common. Eye contact is important to establish trust. Keep gestures friendly and expressive.'
  },
  'Spanish': {
    welcome: '¡Bienvenidos al Estadio MetLife! Encuentre zonas de enfriamiento en las secciones 102 y 124.',
    ticket: 'Por favor, tenga su boleto listo para escanear.',
    water: 'Por favor, tome mucha agua. Hace mucho calor hoy.',
    help: 'La ayuda médica está en camino.',
    shuttle: 'Los autobuses de traslado están retrasados. Recomendamos usar el tren de tránsito.',
    etiquette: 'Mexican/Latin American Context: Spanish speaker. A polite, warm tone is standard. Address elders with respect (using "Usted"). Small gestures of assistance are highly appreciated.'
  },
  'Korean': {
    welcome: 'MetLife 스타디움에 오신 것을 환영합니다! 102구역과 124구역에서 쿨링 존을 찾으실 수 있습니다.',
    ticket: '스캔할 수 있도록 티켓을 준비해 주시기 바랍니다.',
    water: '수분을 충분히 섭취하십시오. 오늘은 폭염 경보가 발령되었습니다.',
    help: '의료진이 이동 중입니다.',
    shuttle: '셔틀 버스가 지연되고 있습니다. NJ Transit 열차를 이용하시길 권장합니다.',
    etiquette: 'Korean Etiquette: Hand over and receive items (like tickets, bottles) with BOTH hands to show respect. A slight bow of the head is a polite way to say thank you.'
  }
};
