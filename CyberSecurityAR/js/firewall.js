export class Firewall {
    constructor() {
        this.rules = [
            { type: 'allow', protocol: 'TCP', port: 80, description: 'HTTP' },
            { type: 'allow', protocol: 'TCP', port: 443, description: 'HTTPS' },
            { type: 'allow', protocol: 'UDP', port: 53, description: 'DNS' },
            { type: 'allow', protocol: 'TCP', port: 22, description: 'SSH' },
            { type: 'block', protocol: 'TCP', port: 23, description: 'Telnet' },
            { type: 'block', protocol: 'TCP', port: 445, description: 'SMB' },
            { type: 'block', protocol: 'TCP', port: 3389, description: 'RDP' }
        ];
        
        this.blockedIPs = new Set();
        this.suspiciousIPs = new Map();
        this.requestCount = new Map();
    }
    
    inspectPacket(packet) {
        // Перевірка на DDoS (велика кількість запитів з одного IP)
        const count = this.requestCount.get(packet.sourceIP) || 0;
        this.requestCount.set(packet.sourceIP, count + 1);
        
        if (count > 50) {
            this.blockedIPs.add(packet.sourceIP);
            this.logEvent(`Заблоковано IP ${packet.sourceIP} - підозра на DDoS`, 'blocked');
            return 'blocked';
        }
        
        // Перевірка на сканування портів
        const suspiciousActivity = this.suspiciousIPs.get(packet.sourceIP) || { ports: [], count: 0 };
        if (!suspiciousActivity.ports.includes(packet.port)) {
            suspiciousActivity.ports.push(packet.port);
            suspiciousActivity.count++;
            this.suspiciousIPs.set(packet.sourceIP, suspiciousActivity);
            
            if (suspiciousActivity.count > 20) {
                this.logEvent(`Виявлено сканування портів з IP ${packet.sourceIP}`, 'suspicious');
                return 'suspicious';
            }
        }
        
        // Перевірка правил firewall
        for (const rule of this.rules) {
            if (rule.port === packet.port && rule.protocol === packet.protocol) {
                if (rule.type === 'block') {
                    this.logEvent(`Заблоковано пакет на порт ${packet.port} (${rule.description})`, 'blocked');
                    return 'blocked';
                } else {
                    this.logEvent(`Дозволено пакет на порт ${packet.port} (${rule.description})`, 'allowed');
                    return 'allowed';
                }
            }
        }
        
        // Перевірка заблокованих IP
        if (this.blockedIPs.has(packet.sourceIP)) {
            this.logEvent(`Заблоковано пакет від забаненого IP ${packet.sourceIP}`, 'blocked');
            return 'blocked';
        }
        
        // Аналіз типу трафіку
        if (packet.type === 'ddos') {
            this.logEvent(`Виявлено DDoS атаку від ${packet.sourceIP}`, 'blocked');
            return 'blocked';
        }
        
        if (packet.type === 'port_scan') {
            this.logEvent(`Виявлено сканування портів від ${packet.sourceIP}`, 'suspicious');
            return 'suspicious';
        }
        
        // Нормальний трафік
        this.logEvent(`Дозволено нормальний трафік від ${packet.sourceIP}`, 'allowed');
        return 'allowed';
    }
    
    logEvent(message, type) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] [FIREWALL/${type.toUpperCase()}] ${message}`);
        
        // Відображення в UI
        const alertDiv = document.getElementById('alert');
        if (type !== 'allowed' && alertDiv && alertDiv.classList.contains('hidden')) {
            const tempAlert = document.createElement('div');
            tempAlert.textContent = `🛡️ Firewall: ${message}`;
            tempAlert.style.position = 'fixed';
            tempAlert.style.bottom = '80px';
            tempAlert.style.left = '50%';
            tempAlert.style.transform = 'translateX(-50%)';
            tempAlert.style.background = type === 'blocked' ? '#ff0000' : '#ffaa00';
            tempAlert.style.color = 'white';
            tempAlert.style.padding = '10px';
            tempAlert.style.borderRadius = '5px';
            tempAlert.style.zIndex = '100';
            tempAlert.style.fontSize = '12px';
            document.body.appendChild(tempAlert);
            
            setTimeout(() => tempAlert.remove(), 2000);
        }
    }
    
    resetRules() {
        this.blockedIPs.clear();
        this.suspiciousIPs.clear();
        this.requestCount.clear();
        this.logEvent('Firewall скинуто до початкового стану', 'allowed');
    }
    
    getRules() {
        return this.rules;
    }
    
    addRule(type, protocol, port, description) {
        this.rules.push({ type, protocol, port, description });
        this.logEvent(`Додано правило: ${type} ${protocol}:${port} (${description})`, 'allowed');
    }
}