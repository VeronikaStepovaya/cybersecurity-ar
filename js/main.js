import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { NetworkManager } from './network.js';
import { Firewall } from './firewall.js';
import { TrafficAnalyzer } from './trafficAnalyzer.js';
import { MLIDS } from './ml_ids.js';

// Глобальні змінні
let scene, camera, renderer, controls;
let networkManager, firewall, trafficAnalyzer, mlIDS;
let isARMode = false;
let arSession = null;
let isInitialized = false;

// ============================================
// ІНІЦІАЛІЗАЦІЯ
// ============================================
async function init() {
    console.log('🚀 Запуск CyberSecurity AR...');

    // Створення сцени
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a2a);

    // Камера
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(3, 2, 4);
    camera.lookAt(0, 0, 0);

    // Рендерер
    renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: false 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.xr.enabled = true;
    document.body.prepend(renderer.domElement);

    // Орбіт контрол (для 3D режиму)
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 0, 0);
    controls.minDistance = 1.5;
    controls.maxDistance = 10;

    // Світло
    setupLighting();

    // Підлога
    createFloor();

    // Ініціалізація систем
    networkManager = new NetworkManager(scene);
    firewall = new Firewall();
    trafficAnalyzer = new TrafficAnalyzer();
    mlIDS = new MLIDS();

    // Навчання ML
    showStatus('🔄 Навчання ML моделі...', '#ff8800');
    await mlIDS.trainModel();
    showStatus('✅ ML система готова!', '#00ff88');

    // Створення мережі
    networkManager.createNetworkNodes();

    // Налаштування UI
    setupUI();

    // Автоматичний трафік
    setInterval(() => generateNormalTraffic(), 2500);

    isInitialized = true;
    animate();
    console.log('✅ Додаток готовий!');
}

// ============================================
// ОСВІТЛЕННЯ
// ============================================
function setupLighting() {
    const ambient = new THREE.AmbientLight(0x334466, 0.5);
    scene.add(ambient);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(5, 8, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    mainLight.shadow.radius = 4;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.4);
    fillLight.position.set(-3, 1, -2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xff6644, 0.3);
    rimLight.position.set(0, -1, -4);
    scene.add(rimLight);

    const hemi = new THREE.HemisphereLight(0x4488ff, 0x002244, 0.4);
    scene.add(hemi);
}

// ============================================
// ПІДЛОГА
// ============================================
function createFloor() {
    const gridHelper = new THREE.GridHelper(6, 20, 0x00ff88, 0x3366aa);
    gridHelper.position.y = -0.5;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.4;
    scene.add(gridHelper);

    // Прозора підлога для AR
    const floorGeo = new THREE.PlaneGeometry(10, 10);
    const floorMat = new THREE.MeshStandardMaterial({
        color: 0x0a0a2a,
        transparent: true,
        opacity: 0.3,
        roughness: 0.8,
        metalness: 0.2,
        side: THREE.DoubleSide
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.5;
    floor.receiveShadow = true;
    scene.add(floor);
}

// ============================================
// UI НАЛАШТУВАННЯ
// ============================================
function setupUI() {
    document.getElementById('stats-panel').classList.remove('hidden');
    document.getElementById('controls').classList.remove('hidden');
    document.getElementById('info').style.display = 'none';

    document.getElementById('simulate-ddos').addEventListener('click', simulateDDoSAttack);
    document.getElementById('simulate-scan').addEventListener('click', simulatePortScan);
    document.getElementById('reset-attacks').addEventListener('click', resetNetwork);
    document.getElementById('ar-toggle').addEventListener('click', toggleAR);

    // Адаптація до розміру вікна
    window.addEventListener('resize', onResize);
}

// ============================================
// АДАПТАЦІЯ РОЗМІРУ
// ============================================
function onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

// ============================================
// AR РЕЖИМ
// ============================================
async function toggleAR() {
    if (isARMode) {
        await exitAR();
        return;
    }

    if (!navigator.xr) {
        showStatus('❌ WebXR не підтримується цим браузером', '#ff0000');
        return;
    }

    try {
        const supported = await navigator.xr.isSessionSupported('immersive-ar');
        if (!supported) {
            showStatus('❌ AR не підтримується на цьому пристрої', '#ff0000');
            return;
        }

        showStatus('📸 Запуск AR...', '#ff8800');

        // Запит камери
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            stream.getTracks().forEach(t => t.stop());
        } catch (e) {
            showStatus('❌ Немає доступу до камери', '#ff0000');
            return;
        }

        const session = await navigator.xr.requestSession('immersive-ar', {
            requiredFeatures: ['hit-test'],
            optionalFeatures: ['dom-overlay'],
            domOverlay: { root: document.body }
        });

        arSession = session;
        isARMode = true;
        controls.enabled = false;

        renderer.xr.setSession(session);
        const refSpace = await session.requestReferenceSpace('local');

        document.getElementById('ar-toggle').textContent = '📱 Вийти з AR';
        document.getElementById('ar-toggle').style.borderColor = '#ff4444';
        document.getElementById('ar-toggle').style.color = '#ff4444';

        showStatus('✅ AR активовано! Об\'єкти навколо вас.', '#00ff88');

        session.addEventListener('end', () => {
            exitAR();
        });

    } catch (error) {
        console.error('AR помилка:', error);
        showStatus('❌ Помилка AR: ' + error.message, '#ff0000');
        isARMode = false;
        controls.enabled = true;
    }
}

async function exitAR() {
    if (arSession) {
        try {
            await arSession.end();
        } catch (e) {}
        arSession = null;
    }
    isARMode = false;
    controls.enabled = true;
    renderer.xr.setSession(null);

    document.getElementById('ar-toggle').textContent = '📱 AR Режим';
    document.getElementById('ar-toggle').style.borderColor = '#8844ff';
    document.getElementById('ar-toggle').style.color = '#aa88ff';

    showStatus('🔄 Вихід з AR. 3D-режим.', '#ff8800');
}

// ============================================
// ГЕНЕРАЦІЯ НОРМАЛЬНОГО ТРАФІКУ
// ============================================
function generateNormalTraffic() {
    if (!networkManager || !trafficAnalyzer) return;

    const protocols = ['TCP', 'UDP'];
    const ports = [80, 443, 22, 53, 8080, 3306];

    const packet = {
        id: Math.random().toString(36).substr(2, 9),
        sourceIP: `192.168.1.${Math.floor(Math.random() * 50) + 10}`,
        destIP: '192.168.1.100',
        type: 'normal',
        size: Math.random() * 350 + 80,
        timestamp: Date.now(),
        protocol: protocols[Math.floor(Math.random() * protocols.length)],
        port: ports[Math.floor(Math.random() * ports.length)]
    };

    const result = firewall.inspectPacket(packet);
    trafficAnalyzer.addPacket(packet, result);

    if (result === 'allowed') {
        networkManager.animateNormalPacket(packet);
    }

    updateStats();
}

// ============================================
// СИМУЛЯЦІЯ DDoS АТАКИ
// ============================================
function simulateDDoSAttack() {
    if (!networkManager || !trafficAnalyzer) return;

    showStatus('⚠️ DDoS АТАКА ВИЯВЛЕНА!', '#ff0000');
    networkManager.highlightAllNodes(0xff0000);

    const count = 100;
    let blocked = 0;

    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const packet = {
                id: Math.random().toString(36).substr(2, 9),
                sourceIP: `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
                destIP: '192.168.1.100',
                type: 'ddos',
                size: 500 + Math.random() * 500,
                timestamp: Date.now(),
                protocol: 'TCP',
                port: Math.floor(Math.random() * 65535)
            };

            const result = firewall.inspectPacket(packet);
            trafficAnalyzer.addPacket(packet, result);
            if (result === 'blocked') blocked++;

            networkManager.animateAttackPacket(packet, 'ddos');

            const stats = trafficAnalyzer.getStats();
            const threat = mlIDS.detectThreat({
                packetRate: stats.packetRate + 200,
                bytesPerSecond: (stats.totalBytes / Math.max(1, stats.totalPackets)) * (stats.packetRate + 200),
                uniquePorts: stats.uniquePorts + 60,
                packetSize: packet.size,
                protocol: packet.protocol,
                connectionDuration: 30
            });
            updateThreatDisplay(threat);

        }, i * 45);
    }

    setTimeout(() => {
        updateStats();
        showStatus(`✅ DDoS атака відбита! Заблоковано ${blocked}/${count} пакетів.`, '#00ff88');
    }, count * 45 + 1500);
}

// ============================================
// СИМУЛЯЦІЯ СКАНУВАННЯ ПОРТІВ
// ============================================
function simulatePortScan() {
    if (!networkManager || !trafficAnalyzer) return;

    showStatus('🔍 Виявлено сканування портів!', '#ff8800');
    networkManager.highlightNode('firewall', 0xff8800);

    const count = 50;

    for (let port = 1; port <= count; port++) {
        setTimeout(() => {
            const packet = {
                id: Math.random().toString(36).substr(2, 9),
                sourceIP: '10.0.0.50',
                destIP: '192.168.1.100',
                type: 'port_scan',
                size: 64,
                timestamp: Date.now(),
                protocol: 'TCP',
                port: port
            };

            const result = firewall.inspectPacket(packet);
            trafficAnalyzer.addPacket(packet, result);
            networkManager.animateAttackPacket(packet, 'scan');

            if (result === 'suspicious') {
                networkManager.highlightNode('firewall', 0xff8800);
            }

            const threat = mlIDS.detectThreat({
                packetRate: 70,
                bytesPerSecond: 10000,
                uniquePorts: port,
                packetSize: 64,
                protocol: 'TCP',
                connectionDuration: 20
            });
            updateThreatDisplay(threat);

        }, port * 35);
    }

    setTimeout(() => {
        updateStats();
        showStatus('✅ Сканування портів завершено.', '#00ff88');
    }, count * 35 + 1500);
}

// ============================================
// СКИДАННЯ МЕРЕЖІ
// ============================================
function resetNetwork() {
    networkManager.resetNodes();
    trafficAnalyzer.reset();
    firewall.resetRules();
    showStatus('🔄 Мережа та Firewall скинуті', '#00ff88');
    updateStats();

    const threatDiv = document.getElementById('threat-level');
    threatDiv.innerHTML = '🟢 LOW РІВЕНЬ ЗАГРОЗИ<br>🤖 Довіра: 95%';
    threatDiv.className = 'threat-low';
}

// ============================================
# ОНОВЛЕННЯ СТАТИСТИКИ
// ============================================
function updateStats() {
    const stats = trafficAnalyzer.getStats();
    const div = document.getElementById('traffic-stats');

    div.innerHTML = `
        <div>📦 Всього пакетів: ${stats.totalPackets}</div>
        <div>🚫 Заблоковано: ${stats.blockedPackets}</div>
        <div>⚠️ Підозрілих: ${stats.suspiciousPackets}</div>
        <div>✅ Дозволено: ${stats.allowedPackets}</div>
        <div>📊 Швидкість: ${stats.packetRate.toFixed(1)} пакетів/с</div>
        <div>💾 Трафік: ${(stats.totalBytes / 1024).toFixed(1)} KB</div>
        <div>🔌 Портів: ${stats.uniquePorts}</div>
        <div style="font-size:10px;color:#88ffbb;margin-top:6px;">🛡️ Firewall активний</div>
    `;
}

// ============================================
# ОНОВЛЕННЯ РІВНЯ ЗАГРОЗИ
// ============================================
function updateThreatDisplay(threat) {
    const div = document.getElementById('threat-level');
    let cls = '';
    let icon = '';

    switch (threat.level) {
        case 'High':
            cls = 'threat-high';
            icon = '🔴';
            networkManager.highlightAllNodes(0xff0000);
            break;
        case 'Medium':
            cls = 'threat-medium';
            icon = '🟡';
            networkManager.highlightNode('firewall', 0xff8800);
            break;
        default:
            cls = 'threat-low';
            icon = '🟢';
    }

    div.className = cls;
    div.innerHTML = `${icon} ${threat.level} РІВЕНЬ ЗАГРОЗИ<br>🤖 Довіра: ${(threat.confidence * 100).toFixed(0)}%`;
}

// ============================================
# ПОКАЗ СПОВІЩЕННЯ
// ============================================
function showStatus(message, color) {
    const alertDiv = document.getElementById('alert');
    alertDiv.textContent = message;
    alertDiv.style.borderColor = color || '#00ff88';
    alertDiv.style.background = 'rgba(0,0,0,0.92)';
    alertDiv.classList.remove('hidden');

    clearTimeout(alertDiv._timeout);
    alertDiv._timeout = setTimeout(() => {
        alertDiv.classList.add('hidden');
    }, 4000);
}

// ============================================
# АНІМАЦІЙНИЙ ЦИКЛ
// ============================================
function animate() {
    requestAnimationFrame(animate);

    if (!isARMode && controls) {
        controls.update();
    }

    if (networkManager) {
        networkManager.updateAnimations();
    }

    // Періодичне оновлення статистики
    if (isInitialized && Math.random() < 0.02) {
        updateStats();
    }

    renderer.render(scene, camera);
}

// ============================================
# ЗАПУСК
// ============================================
init();
