import * as tf from '@tensorflow/tfjs';

export class MLIDS {
    constructor() {
        this.model = null;
        this.isTrained = false;
        this.attackHistory = [];
        this.threatLevel = 'Low';
        this.lastAttackTime = 0;
    }
    
    async createModel() {
        const model = tf.sequential();
        
        model.add(tf.layers.dense({
            inputShape: [7],
            units: 64,
            activation: 'relu'
        }));
        
        model.add(tf.layers.dropout({ rate: 0.3 }));
        
        model.add(tf.layers.dense({
            units: 32,
            activation: 'relu'
        }));
        
        model.add(tf.layers.dense({
            units: 16,
            activation: 'relu'
        }));
        
        model.add(tf.layers.dense({
            units: 3,
            activation: 'softmax'
        }));
        
        model.compile({
            optimizer: tf.train.adam(0.0005),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });
        
        return model;
    }
    
    generateTrainingData() {
        const data = [];
        
        // НОРМАЛЬНИЙ трафік (клас 0)
        for (let i = 0; i < 800; i++) {
            data.push({
                features: [
                    Math.random() * 30 + 5,       // packetRate (5-35)
                    Math.random() * 20000 + 5000, // bytesPerSecond (5-25KB)
                    Math.random() * 15 + 3,       // uniquePorts (3-18)
                    Math.random() * 300 + 100,    // packetSize (100-400)
                    Math.random() > 0.7 ? 1 : 0,  // protocol (0=TCP,1=UDP)
                    Math.random() * 60 + 10,      // connectionDuration (10-70ms)
                    Math.random() * 20 + 5        // packetVariance (низька)
                ],
                label: 0
            });
        }
        
        // ПІДОЗРІЛИЙ трафік (клас 1)
        for (let i = 0; i < 600; i++) {
            data.push({
                features: [
                    Math.random() * 80 + 40,      // packetRate (40-120)
                    Math.random() * 50000 + 20000, // bytesPerSecond (20-70KB)
                    Math.random() * 25 + 15,      // uniquePorts (15-40)
                    Math.random() * 400 + 200,    // packetSize (200-600)
                    Math.random() > 0.5 ? 1 : 0,
                    Math.random() * 120 + 50,     // connectionDuration (50-170ms)
                    Math.random() * 40 + 20       // packetVariance (середня)
                ],
                label: 1
            });
        }
        
        // АТАКА (клас 2) - DDoS та сканування
        for (let i = 0; i < 600; i++) {
            data.push({
                features: [
                    Math.random() * 250 + 120,    // packetRate (120-370) - високий!
                    Math.random() * 150000 + 80000, // bytesPerSecond (80-230KB) - дуже високий!
                    Math.random() * 40 + 30,      // uniquePorts (30-70)
                    Math.random() * 500 + 400,    // packetSize (400-900)
                    Math.random() > 0.3 ? 1 : 0,
                    Math.random() * 150 + 100,    // connectionDuration (100-250ms)
                    Math.random() * 50 + 40       // packetVariance (висока)
                ],
                label: 2
            });
        }
        
        // Перемішування
        for (let i = data.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [data[i], data[j]] = [data[j], data[i]];
        }
        
        const features = data.map(d => d.features);
        const labels = data.map(d => d.label);
        
        return { features, labels };
    }
    
    async trainModel() {
        console.log('Початок навчання ML моделі...');
        
        this.model = await this.createModel();
        
        const { features, labels } = this.generateTrainingData();
        
        const xs = tf.tensor2d(features);
        const ys = tf.oneHot(tf.tensor1d(labels, 'int32'), 3);
        
        const history = await this.model.fit(xs, ys, {
            epochs: 60,
            batchSize: 64,
            validationSplit: 0.2,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    if (epoch % 20 === 0) {
                        console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, accuracy = ${logs.acc.toFixed(4)}`);
                    }
                }
            }
        });
        
        this.isTrained = true;
        console.log(`✅ ML модель навчена! Точність: ${(history.history.acc[history.history.acc.length - 1] * 100).toFixed(1)}%`);
        
        xs.dispose();
        ys.dispose();
        
        return history;
    }
    
    detectThreat(networkParams) {
    // Розширене визначення загроз на основі реальних параметрів
    let threatScore = 0;
    let reasons = [];
    
    // 1. Перевірка на DDoS (велика кількість пакетів)
    if (networkParams.packetRate > 100) {
        threatScore += 0.5;
        reasons.push('Висока частота пакетів (>100/с)');
    } else if (networkParams.packetRate > 50) {
        threatScore += 0.25;
        reasons.push('Підвищена частота пакетів');
    }
    
    // 2. Перевірка на великий об'єм трафіку
    if (networkParams.bytesPerSecond > 100000) {
        threatScore += 0.3;
        reasons.push('Великий об\'єм трафіку (>100KB/s)');
    } else if (networkParams.bytesPerSecond > 50000) {
        threatScore += 0.15;
    }
    
    // 3. Перевірка на сканування портів
    if (networkParams.uniquePorts > 40) {
        threatScore += 0.4;
        reasons.push('Сканування багатьох портів (>40)');
    } else if (networkParams.uniquePorts > 20) {
        threatScore += 0.2;
        reasons.push('Аномальна кількість портів');
    }
    
    // 4. Перевірка на великі пакети
    if (networkParams.packetSize > 600) {
        threatScore += 0.2;
        reasons.push('Великі мережеві пакети');
    }
    
    // 5. Аналіз історії атак
    const now = Date.now();
    if (this.lastAttackTime > 0 && (now - this.lastAttackTime) < 5000) {
        threatScore += 0.3;
        reasons.push('Нещодавня атака');
    }
    
    // Обмежуємо score
    threatScore = Math.min(1.0, threatScore);
    
    // Визначення рівня загрози
    let level = 'Low';
    let confidence = 0.5;
    
    if (threatScore > 0.65) {
        level = 'High';
        confidence = 0.85 + Math.random() * 0.1;
        console.log('🔴 HIGH THREAT DETECTED!', reasons);
    } else if (threatScore > 0.35) {
        level = 'Medium';
        confidence = 0.65 + Math.random() * 0.15;
        console.log('🟡 MEDIUM THREAT:', reasons);
    } else {
        level = 'Low';
        confidence = 0.5 + Math.random() * 0.2;
    }
    
    // Якщо є ML модель, використовуємо її для підтвердження (синхронно)
    if (this.isTrained && this.model && networkParams.packetRate > 10) {
        try {
            const features = [
                Math.min(networkParams.packetRate / 400, 1),
                Math.min(networkParams.bytesPerSecond / 250000, 1),
                Math.min(networkParams.uniquePorts / 100, 1),
                Math.min(networkParams.packetSize / 1000, 1),
                networkParams.protocol === 'UDP' ? 1 : 0,
                Math.min((networkParams.connectionDuration || 50) / 300, 1),
                threatScore
            ];
            
            const inputTensor = tf.tensor2d([features]);
            const prediction = this.model.predict(inputTensor);
            // ВАЖЛИВО: використовуємо dataSync() замість await
            const probabilities = prediction.dataSync();
            
            const mlThreatScore = probabilities[2] * 0.8 + probabilities[1] * 0.4;
            
            if (mlThreatScore > 0.6 && level !== 'High') {
                level = 'High';
                confidence = Math.max(confidence, mlThreatScore);
            } else if (mlThreatScore > 0.35 && level === 'Low') {
                level = 'Medium';
                confidence = mlThreatScore;
            }
            
            inputTensor.dispose();
            prediction.dispose();
        } catch(e) {
            console.warn('ML prediction error:', e);
        }
    }
    
    // Запам'ятовуємо атаку
    if (level === 'High') {
        this.lastAttackTime = Date.now();
        this.attackHistory.push({ time: now, level: 'High' });
        while (this.attackHistory.length > 10) this.attackHistory.shift();
    }
    
    return { level, confidence, threatScore, reasons };
}
    
    getAdvancedThreatAnalysis() {
        const now = Date.now();
        const recentAttacks = this.attackHistory.filter(a => (now - a.time) < 10000);
        
        if (recentAttacks.length > 3) {
            return { level: 'High', message: 'Множинні атаки за короткий час' };
        } else if (recentAttacks.length > 0) {
            return { level: 'High', message: 'Атака виявлена' };
        }
        
        return { level: 'Low', message: 'Нормальна активність' };
    }
    
    async saveModel() {
        if (this.model) {
            await this.model.save('localstorage://cybersecurity-ml-model');
            console.log('ML модель збережено');
        }
    }
    
    async loadModel() {
        try {
            const model = await tf.loadLayersModel('localstorage://cybersecurity-ml-model');
            this.model = model;
            this.isTrained = true;
            console.log('ML модель завантажено');
            return true;
        } catch (error) {
            console.log('Збережену модель не знайдено');
            return false;
        }
    }
}