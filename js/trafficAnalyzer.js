export class TrafficAnalyzer {
    constructor() {
        this.packets = [];
        this.stats = {
            totalPackets: 0,
            blockedPackets: 0,
            suspiciousPackets: 0,
            allowedPackets: 0,
            totalBytes: 0,
            packetRate: 0,
            uniquePorts: new Set(),
            protocolStats: { TCP: 0, UDP: 0, ICMP: 0 },
            ipStats: new Map(),
            topIPs: []
        };

        this.lastTimestamp = Date.now();
        this.packetCountLastSec = 0;
        this.rateInterval = setInterval(() => this.calculateRate(), 1000);
    }

    // ============================================
    // ДОДАВАННЯ ПАКЕТА
    // ============================================
    addPacket(packet, status) {
        const entry = {
            ...packet,
            status: status,
            timestamp: Date.now()
        };
        this.packets.push(entry);

        // Оновлення статистики
        this.stats.totalPackets++;
        this.stats.totalBytes += packet.size || 0;
        this.stats.uniquePorts.add(packet.port);

        if (status === 'blocked') this.stats.blockedPackets++;
        else if (status === 'suspicious') this.stats.suspiciousPackets++;
        else if (status === 'allowed') this.stats.allowedPackets++;

        // Протоколи
        if (this.stats.protocolStats[packet.protocol] !== undefined) {
            this.stats.protocolStats[packet.protocol]++;
        }

        // IP статистика
        const ipCount = this.stats.ipStats.get(packet.sourceIP) || 0;
        this.stats.ipStats.set(packet.sourceIP, ipCount + 1);

        // Оновлення топ IP
        this.updateTopIPs();

        this.packetCountLastSec++;

        // Обмеження історії
        if (this.packets.length > 500) {
            this.packets.shift();
        }
    }

    // ============================================
    // РОЗРАХУНОК ШВИДКОСТІ
    // ============================================
    calculateRate() {
        const now = Date.now();
        const diff = (now - this.lastTimestamp) / 1000;
        this.stats.packetRate = this.packetCountLastSec / diff;
        this.packetCountLastSec = 0;
        this.lastTimestamp = now;
    }

    // ============================================
    // ОНОВЛЕННЯ ТОП IP
    // ============================================
    updateTopIPs() {
        this.stats.topIPs = Array.from(this.stats.ipStats.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([ip, count]) => ({ ip, count }));
    }

    // ============================================
    // ОТРИМАННЯ СТАТИСТИКИ
    // ============================================
    getStats() {
        return {
            totalPackets: this.stats.totalPackets,
            blockedPackets: this.stats.blockedPackets,
            suspiciousPackets: this.stats.suspiciousPackets,
            allowedPackets: this.stats.allowedPackets,
            totalBytes: this.stats.totalBytes,
            packetRate: this.stats.packetRate,
            uniquePorts: this.stats.uniquePorts.size,
            protocolStats: { ...this.stats.protocolStats },
            topIPs: this.stats.topIPs,
            avgPacketSize: this.stats.totalPackets > 0 ? 
                this.stats.totalBytes / this.stats.totalPackets : 0
        };
    }

    // ============================================
    // ОТРИМАННЯ ОСТАННІХ ПАКЕТІВ
    // ============================================
    getRecentPackets(count = 20) {
        return this.packets.slice(-count);
    }

    // ============================================
    // РОЗРАХУНОК АНОМАЛІЇ
    // ============================================
    getAnomalyScore() {
        const total = this.stats.totalPackets || 1;
        const blockedRatio = this.stats.blockedPackets / total;
        const suspiciousRatio = this.stats.suspiciousPackets / total;
        const rateAnomaly = Math.max(0, (this.stats.packetRate - 30) / 100);

        return Math.min(1, blockedRatio * 0.4 + suspiciousRatio * 0.3 + rateAnomaly * 0.3);
    }

    // ============================================
    // СКИДАННЯ
    // ============================================
    reset() {
        this.packets = [];
        this.stats = {
            totalPackets: 0,
            blockedPackets: 0,
            suspiciousPackets: 0,
            allowedPackets: 0,
            totalBytes: 0,
            packetRate: 0,
            uniquePorts: new Set(),
            protocolStats: { TCP: 0, UDP: 0, ICMP: 0 },
            ipStats: new Map(),
            topIPs: []
        };
        this.packetCountLastSec = 0;
        this.lastTimestamp = Date.now();
    }
}
