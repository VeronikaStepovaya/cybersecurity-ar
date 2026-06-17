export class Firewall {
    constructor() {
        // Правила доступу
        this.rules = [
            { type: 'allow', protocol: 'TCP', port: 80, desc: 'HTTP' },
            { type: 'allow', protocol: 'TCP', port: 443, desc: 'HTTPS' },
            { type: 'allow', protocol: 'TCP', port: 22, desc: 'SSH' },
            { type: 'allow', protocol: 'UDP', port: 53, desc: 'DNS' },
            { type: 'allow', protocol: 'TCP', port: 8080, desc: 'HTTP-Alt' },
            { type: 'allow', protocol: 'TCP', port: 3306, desc: 'MySQL' },
            { type: 'block', protocol: 'TCP', port: 23, desc: 'Telnet' },
            { type: 'block', protocol: 'TCP', port: 445, desc: 'SMB' },
            { type: 'block', protocol: 'TCP', port: 3389, desc: 'RDP' },
            { type: 'block', protocol: 'TCP', port: 135, desc: 'RPC' },
            { type: 'block', protocol: 'TCP', port: 139, desc: 'NetBIOS' }
        ];

        this.blockedIPs = new Map(); // IP -> кількість запитів
        this.suspiciousIPs = new Map(); // IP -> список портів
        this.requestCount = new Map();
        this.log = [];
    }

    // ============================================
    // ПЕРЕВІРКА ПАКЕТА
    // ============================================
    inspectPacket(packet) {
        const ip = packet.sourceIP;
        const port = packet.port;
        const protocol = packet.protocol;

        // 1. Анти-DDoS (ліміт 50 запитів з одного IP)
        const count = this.requestCount.get(ip) || 0;
        this.requestCount.set(ip, count + 1);

        if (count > 50) {
            this.blockedIPs.set(ip, (this.blockedIPs.get(ip) || 0) + 1);
            this.logEvent(`🚫 DDoS: заблоковано IP ${ip}`, 'blocked');
            return 'blocked';
        }

        // 2. Анти-сканування (>20 портів з одного IP)
        const ports = this.suspiciousIPs.get(ip) || [];
        if (!ports.includes(port)) {
            ports.push(port);
            this.suspiciousIPs.set(ip, ports);
        }

        if (ports.length > 20) {
            this.logEvent(`⚠️ Сканування портів з IP ${ip} (${ports.length} портів)`, 'suspicious');
            return 'suspicious';
        }

        // 3. Перевірка правил
        for (const rule of this.rules) {
            if (rule.port === port && rule.protocol === protocol) {
                if (rule.type === 'block') {
                    this.logEvent(`🚫 Заблоковано ${rule.desc} (порт ${port}) від ${ip}`, 'blocked');
                    return 'blocked';
                } else {
                    this.logEvent(`✅ Дозволено ${rule.desc} (порт ${port}) від ${ip}`, 'allowed');
                    return 'allowed';
                }
            }
        }

        // 4. Невідомий порт - підозріло
        this.logEvent(`⚠️ Невідомий порт ${port} від ${ip} - підозріло`, 'suspicious');
        return 'suspicious';
    }

    // ============================================
    // ЛОГУВАННЯ
    // ============================================
    logEvent(message, type) {
        const timestamp = new Date().toLocaleTimeString();
        const entry = { time: timestamp, message, type };
        this.log.push(entry);

        // Обмежуємо лог
        if (this.log.length > 200) {
            this.log.shift();
        }

        // Вивід в консоль
        const colors = {
            allowed: '#00ff88',
            blocked: '#ff4444',
            suspicious: '#ff8800'
        };
        console.log(`%c[${timestamp}] ${message}`, `color: ${colors[type] || '#ffffff'}`);
    }

    // ============================================
    // СКИДАННЯ
    // ============================================
    resetRules() {
        this.blockedIPs.clear();
        this.suspiciousIPs.clear();
        this.requestCount.clear();
        this.log = [];
        this.logEvent('🔄 Firewall скинуто', 'allowed');
    }

    // ============================================
    // ОТРИМАННЯ СТАТУСУ
    // ============================================
    getStatus() {
        return {
            rules: this.rules.length,
            blockedIPs: this.blockedIPs.size,
            suspiciousIPs: this.suspiciousIPs.size,
            totalRequests: Array.from(this.requestCount.values()).reduce((a, b) => a + b, 0),
            log: this.log.slice(-20)
        };
    }

    // ============================================
    // ДОДАВАННЯ ПРАВИЛА
    // ============================================
    addRule(type, protocol, port, description) {
        this.rules.push({ type, protocol, port, desc: description });
        this.logEvent(`📝 Додано правило: ${type} ${protocol}:${port} (${description})`, 'allowed');
    }
}
