import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { NetworkManager } from './network.js';
import { Firewall } from './firewall.js';
import { TrafficAnalyzer } from './trafficAnalyzer.js';
import { MLIDS } from './ml_ids.js';

let scene, camera, renderer, controls;
let networkManager, firewall, trafficAnalyzer, mlIDS;
let arModeActive = false;

// Ініціалізація сцени
function init() {
    // Створення сцени
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a2a);
    scene.fog = new THREE.FogExp2(0x0a0a2a, 0.008);
    
    // Камера
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(2, 1.5, 3);
    camera.lookAt(0, 0, 0);
    
    // Рендерер
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);
    
    // Орбіт контрол для 3D навігації (замість AR на десктопі)
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = false;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.target.set(0, 0, 0);
    
    // Освітлення
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404060);
    scene.add(ambientLight);
    
    // Головне світло
    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(2, 3, 2);
    mainLight.castShadow = true;
    mainLight.receiveShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);
    
    // Заповнююче світло знизу
    const fillLight = new THREE.PointLight(0x4466ff, 0.3);
    fillLight.position.set(0, -1, 0);
    scene.add(fillLight);
    
    // Заповнююче світло ззаду
    const backLight = new THREE.PointLight(0xff6644, 0.2);
    backLight.position.set(0, 1, -2);
    scene.add(backLight);
    
    // Підлога-сітка для орієнтації в просторі
    const gridHelper = new THREE.GridHelper(8, 20, 0x00ff88, 0x3366aa);
    gridHelper.position.y = -0.5;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.5;
    scene.add(gridHelper);
    
    // Декоративні частинки в повітрі
    const particleCount = 500;
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesPositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
        particlesPositions[i * 3] = (Math.random() - 0.5) * 20;
        particlesPositions[i * 3 + 1] = (Math.random() - 0.5) * 5;
        particlesPositions[i * 3 + 2] = (Math.random() - 0.5) * 15 - 5;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlesPositions, 3));
    const particlesMaterial = new THREE.PointsMaterial({ color: 0x44aaff, size: 0.03, transparent: true, opacity: 0.5 });
    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);
    
    // Анімація частинок
    function animateParticles() {
        particles.rotation.y += 0.001;
        particles.rotation.x += 0.0005;
        requestAnimationFrame(animateParticles);
    }
    animateParticles();
    
    // Ініціалізація систем
    networkManager = new NetworkManager(scene);
    firewall = new Firewall();
    trafficAnalyzer = new TrafficAnalyzer();
    mlIDS = new MLIDS();
    
    // Навчання ML моделі
    showStatus('🔄 Навчання ML моделі детекції загроз...', '#ffaa00');
    mlIDS.trainModel().then(() => {
        console.log('✅ ML модель навчена');
        showStatus('✅ ML система детекції вторгнень активована', '#00ff00');
    });
    
    // Створення мережевих вузлів
    networkManager.createNetworkNodes();
    
    // Налаштування UI
    setupUI();
    
    // Періодична генерація нормального трафіку
    setInterval(() => {
        if (networkManager && trafficAnalyzer) {
            generateNormalTraffic();
        }
    }, 2000);
    
    // Анімація
    animate();
}

function setupUI() {
    // Показуємо панель статистики
    document.getElementById('stats-panel').classList.remove('hidden');
    document.getElementById('info').style.display = 'none';
    
    // Кнопки симуляції атак
    document.getElementById('simulate-ddos').addEventListener('click', () => simulateDDoSAttack());
    document.getElementById('simulate-scan').addEventListener('click', () => simulatePortScan());
    document.getElementById('reset-attacks').addEventListener('click', () => resetNetwork());

        // ============================================
    // 🆕 КНОПКА "AR Режим (WebXR)"
    // ============================================
    const arButton = document.createElement('button');
    arButton.textContent = '📱 AR Режим (WebXR)';
    arButton.style.position = 'absolute';
    arButton.style.bottom = '80px';
    arButton.style.right = '20px';
    arButton.style.background = 'rgba(0,0,0,0.85)';
    arButton.style.color = '#00ff88';
    arButton.style.border = '2px solid #00ff88';
    arButton.style.padding = '10px 18px';
    arButton.style.borderRadius = '8px';
    arButton.style.cursor = 'pointer';
    arButton.style.zIndex = '20';
    arButton.style.fontFamily = 'monospace';
    arButton.style.fontWeight = 'bold';
    arButton.style.transition = 'all 0.3s';
    
    arButton.onmouseover = () => {
        arButton.style.background = '#00ff88';
        arButton.style.color = 'black';
    };
    arButton.onmouseout = () => {
        arButton.style.background = 'rgba(0,0,0,0.85)';
        arButton.style.color = '#00ff88';
    };
    
    arButton.onclick = () => {
        showStatus('📱 WebXR AR доступний на сумісних пристроях з камерою (Android + Chrome)', '#ffaa00');
        if (navigator.xr) {
            navigator.xr.isSessionSupported('immersive-ar').then((supported) => {
                if (supported) {
                    showStatus('✅ Ваш пристрій підтримує AR! Наведіть камеру на підлогу.', '#00ff00');
                } else {
                    showStatus('⚠️ Ваш пристрій не підтримує AR. Використовуйте 3D-режим.', '#ffaa00');
                }
            });
        } else {
            showStatus('⚠️ WebXR не підтримується. Використовуйте 3D-режим з мишею.', '#ffaa00');
        }
    };
    
    document.body.appendChild(arButton);
    
}

function generateNormalTraffic() {
    const protocols = ['TCP', 'UDP'];
    const ports = [80, 443, 22, 53, 8080];
    
    const packet = {
        id: Math.random(),
        sourceIP: `192.168.1.${Math.floor(Math.random() * 50) + 10}`,
        destIP: '192.168.1.100',
        type: 'normal',
        size: Math.random() * 400 + 100,
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

function simulateDDoSAttack() {
    showStatus('⚠️ DDoS АТАКА ВИЯВЛЕНА! Блокування IP...', '#ff0000');
    
    const attackPackets = 120;
    let blockedCount = 0;
    
    for (let i = 0; i < attackPackets; i++) {
        setTimeout(() => {
            const packet = {
                id: Math.random(),
                sourceIP: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
                destIP: '192.168.1.100',
                type: 'ddos',
                size: Math.random() * 800 + 600,
                timestamp: Date.now(),
                protocol: 'TCP',
                port: Math.floor(Math.random() * 65535)
            };
            
            const result = firewall.inspectPacket(packet);
            trafficAnalyzer.addPacket(packet, result);
            if (result === 'blocked') blockedCount++;
            networkManager.animateAttackPacket(packet, 'ddos');
            
            const stats = trafficAnalyzer.getStats();
            const threat = mlIDS.detectThreat({
                packetRate: stats.packetRate + 150,
                bytesPerSecond: stats.totalBytes / Math.max(1, stats.totalPackets) * (stats.packetRate + 150),
                uniquePorts: stats.uniquePorts + 50,
                packetSize: packet.size,
                protocol: packet.protocol,
                connectionDuration: 30
            });
            updateThreatDisplay(threat);
        }, i * 40);
    }
    
    // ОДИН РАЗ - ПІСЛЯ ЗАВЕРШЕННЯ АТАКИ
    setTimeout(() => {
        const stats = trafficAnalyzer.getStats();
        console.log(`DDoS атака завершена: заблоковано ${blockedCount}/${attackPackets} пакетів`);
        updateStats();
        
        const finalThreat = mlIDS.detectThreat({
            packetRate: 200,
            bytesPerSecond: 150000,
            uniquePorts: 80,
            packetSize: 700,
            protocol: 'TCP',
            connectionDuration: 30
        });
        updateThreatDisplay(finalThreat);
        
        if (finalThreat.level === 'High') {
            showStatus('🔴 КРИТИЧНО! ML IDS підтверджує DDoS атаку - ВИСОКИЙ рівень загрози', '#ff0000');
        }
    }, 5000);
}

function simulatePortScan() {
    showStatus('🔍 ВИЯВЛЕНО СКАНУВАННЯ ПОРТІВ! Аналіз...', '#ffaa00');
    
    for (let port = 1; port <= 50; port++) {
        setTimeout(() => {
            const packet = {
                id: Math.random(),
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
                networkManager.highlightNode('firewall', 0xffaa00);
            }
        }, port * 30);
    }
    
    setTimeout(() => {
        const stats = trafficAnalyzer.getStats();
        const threat = mlIDS.detectThreat({
            packetRate: 80,
            bytesPerSecond: 5000,
            uniquePorts: 50,
            packetSize: 64,
            protocol: 'TCP',
            connectionDuration: 30
        });
        updateThreatDisplay(threat);
        updateStats();
    }, 2000);
}

function resetNetwork() {
    networkManager.resetNodes();
    trafficAnalyzer.reset();
    firewall.resetRules();
    showStatus('🔄 Мережа та firewall скинуті до початкового стану', '#00ff00');
    updateStats();
    
    const threatDiv = document.getElementById('threat-level');
    threatDiv.innerHTML = '';
    threatDiv.className = '';
}


function updateStats() {
    const stats = trafficAnalyzer.getStats();
    const statsDiv = document.getElementById('traffic-stats');
    
    statsDiv.innerHTML = `
        <div>📦 Всього пакетів: ${stats.totalPackets}</div>
        <div>🚫 Заблоковано: ${stats.blockedPackets}</div>
        <div>⚠️ Підозрілих: ${stats.suspiciousPackets}</div>
        <div>✅ Дозволено: ${stats.allowedPackets}</div>
        <div>📊 Швидкість: ${stats.packetRate.toFixed(2)} пакетів/с</div>
        <div>💾 Трафік: ${(stats.totalBytes / 1024).toFixed(2)} KB</div>
        <div>🔌 Унікальних портів: ${stats.uniquePorts}</div>
        <div style="font-size: 10px; margin-top: 8px;">🛡️ Firewall активний</div>
    `;
}

function updateThreatDisplay(threat) {
    const threatDiv = document.getElementById('threat-level');
    let threatClass = '';
    let threatText = '';
    let icon = '';
    
    switch(threat.level) {
        case 'High':
            threatClass = 'threat-high';
            threatText = 'ВИСОКИЙ РІВЕНЬ ЗАГРОЗИ';
            icon = '🔴';
            networkManager.highlightAllNodes(0xff0000);
            break;
        case 'Medium':
            threatClass = 'threat-medium';
            threatText = 'СЕРЕДНІЙ РІВЕНЬ ЗАГРОЗИ';
            icon = '🟡';
            networkManager.highlightNode('firewall', 0xffaa00);
            break;
        case 'Low':
            threatClass = 'threat-low';
            threatText = 'НИЗЬКИЙ РІВЕНЬ ЗАГРОЗИ';
            icon = '🟢';
            break;
    }
    
    threatDiv.className = threatClass;
    threatDiv.innerHTML = `${icon} ${threatText}<br>🤖 ML довіра: ${(threat.confidence * 100).toFixed(1)}%`;
}

function showStatus(message, color) {
    const alertDiv = document.getElementById('alert');
    alertDiv.textContent = message;
    alertDiv.style.background = color;
    alertDiv.classList.remove('hidden');
    
    setTimeout(() => {
        alertDiv.classList.add('hidden');
    }, 3500);
}

function animate() {
    requestAnimationFrame(animate);
    
    // Оновлення контролів
    controls.update();
    
    // Оновлення анімацій мережі
    if (networkManager) {
        networkManager.updateAnimations();
    }
    
    // Періодичне оновлення статистики (кожні 30 кадрів)
    if (Math.random() < 0.03) {
        updateStats();
        
        // Автоматична ML перевірка
        const stats = trafficAnalyzer.getStats();
        if (stats.totalPackets > 10) {
            const threat = mlIDS.detectThreat({
                packetRate: stats.packetRate,
                bytesPerSecond: (stats.totalBytes / Math.max(1, stats.totalPackets)) * stats.packetRate,
                uniquePorts: stats.uniquePorts,
                packetSize: 300,
                protocol: 'TCP',
                connectionDuration: 50
            });
            if (threat.level !== 'Low') {
                updateThreatDisplay(threat);
            }
        }
    }
    
    // Рендер
    renderer.render(scene, camera);
}

// Запуск додатку
init();
