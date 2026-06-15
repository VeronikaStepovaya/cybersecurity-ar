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
            ipStats: new Map()
        };
        
        this.lastTimestamp = Date.now();
        this.packetCountLastSec = 0;
        
        setInterval(() => this.calculatePacketRate(), 1000);
    }
    
    addPacket(packet, status) {
        this.packets.push({
            ...packet,
            status: status,
            timestamp: Date.now()
        });
        
        // Оновлення статистики
        this.stats.totalPackets++;
        this.stats.totalBytes += packet.size || 0;
        this.stats.uniquePorts.add(packet.port);
        
        if (status === 'blocked') this.stats.blockedPackets++;
        else if (status === 'suspicious') this.stats.suspiciousPackets++;
        else if (status === 'allowed') this.stats.allowedPackets++;
        
        // Статистика за протоколами
        if (this.stats.protocolStats[packet.protocol] !== undefined) {
            this.stats.protocolStats[packet.protocol]++;
        }
        
        // Статистика за IP
        const ipCount = this.stats.ipStats.get(packet.sourceIP) || 0;
        this.stats.ipStats.set(packet.sourceIP, ipCount + 1);
        
        this.packetCountLastSec++;
        
        // Обмеження історії
        if (this.packets.length > 1000) {
            this.packets.shift();
        }
    }
    
    calculatePacketRate() {
        const now = Date.now();
        const timeDiff = (now - this.lastTimestamp) / 1000;
        this.stats.packetRate = this.packetCountLastSec / timeDiff;
        
        this.packetCountLastSec = 0;
        this.lastTimestamp = now;
    }
    
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
            topIPs: Array.from(this.stats.ipStats.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
        };
    }
    
    getRecentPackets(count = 50) {
        return this.packets.slice(-count);
    }
    
    getAveragePacketSize() {
        if (this.stats.totalPackets === 0) return 0;
        return this.stats.totalBytes / this.stats.totalPackets;
    }
    
    getAnomalyScore() {
        const suspiciousRatio = this.stats.suspiciousPackets / Math.max(1, this.stats.totalPackets);
        const blockedRatio = this.stats.blockedPackets / Math.max(1, this.stats.totalPackets);
        const packetRateAnomaly = this.stats.packetRate > 100 ? 0.5 : 0;
        
        return suspiciousRatio * 0.4 + blockedRatio * 0.4 + packetRateAnomaly;
    }
    
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
            ipStats: new Map()
        };
        this.packetCountLastSec = 0;
        this.lastTimestamp = Date.now();
    }
}