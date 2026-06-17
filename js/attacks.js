// ============================================
// МОДУЛЬ АТАК
// ============================================

export class AttackSimulator {
    constructor(networkManager, firewall, trafficAnalyzer, mlIDS) {
        this.networkManager = networkManager;
        this.firewall = firewall;
        this.trafficAnalyzer = trafficAnalyzer;
        this.mlIDS = mlIDS;
        this.isRunning = false;
    }

    // ============================================
    // DDoS АТАКА
    // ============================================
    ddosAttack(showStatus, updateThreatDisplay, updateStats) {
        if (this.isRunning) return;
        this.isRunning = true;

        showStatus('⚠️ DDoS АТАКА ВИЯВЛЕНА!', '#ff0000');
        this.networkManager.highlightAllNodes(0xff0000);

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

                const result = this.firewall.inspectPacket(packet);
                this.trafficAnalyzer.addPacket(packet, result);
                if (result === 'blocked') blocked++;

                this.networkManager.animateAttackPacket(packet, 'ddos');

                const stats = this.trafficAnalyzer.getStats();
                const threat = this.mlIDS.detectThreat({
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
            this.isRunning = false;
        }, count * 45 + 1500);
    }

    // ============================================
    // СКАНУВАННЯ ПОРТІВ
    // ============================================
    portScan(showStatus, updateThreatDisplay, updateStats) {
        if (this.isRunning) return;
        this.isRunning = true;

        showStatus('🔍 Виявлено сканування портів!', '#ff8800');
        this.networkManager.highlightNode('firewall', 0xff8800);

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

                const result = this.firewall.inspectPacket(packet);
                this.trafficAnalyzer.addPacket(packet, result);
                this.networkManager.animateAttackPacket(packet, 'scan');

                if (result === 'suspicious') {
                    this.networkManager.highlightNode('firewall', 0xff8800);
                }

                const threat = this.mlIDS.detectThreat({
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
            this.isRunning = false;
        }, count * 35 + 1500);
    }

    // ============================================
    // ЗУПИНКА ВСІХ АТАК
    // ============================================
    stopAll() {
        this.isRunning = false;
    }
}
