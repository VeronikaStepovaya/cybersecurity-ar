import * as tf from '@tensorflow/tfjs';

export class MLIDS {
    constructor() {
        this.model = null;
        this.isTrained = false;
        this.thresholds = {
            low: 0.3,
            medium: 0.6
        };
    }

    // ============================================
    // СТВОРЕННЯ МОДЕЛІ
    // ============================================
    createModel() {
        const model = tf.sequential();

        model.add(tf.layers.dense({
            inputShape: [5],
            units: 16,
            activation: 'relu'
        }));

        model.add(tf.layers.dropout({ rate: 0.2 }));

        model.add(tf.layers.dense({
            units: 8,
            activation: 'relu'
        }));

        model.add(tf.layers.dense({
            units: 3,
            activation: 'softmax'
        }));

        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });

        return model;
    }

    // ============================================
    // ГЕНЕРАЦІЯ НАВЧАЛЬНИХ ДАНИХ
    // ============================================
    generateTrainingData() {
        const features = [];
        const labels = [];

        // Нормальний трафік (клас 0) - 60%
        for (let i = 0; i < 600; i++) {
            features.push([
                Math.random() * 25 + 5,      // packetRate (5-30)
                Math.random() * 15000 + 5000, // bytesPerSecond
                Math.random() * 10 + 2,       // uniquePorts
                Math.random() * 250 + 80,     // packetSize
                Math.random() * 40 + 10       // connectionDuration
            ]);
            labels.push(0);
        }

        // Підозрілий трафік (клас 1) - 20%
        for (let i = 0; i < 200; i++) {
            features.push([
                Math.random() * 60 + 35,      // packetRate (35-95)
                Math.random() * 40000 + 20000, // bytesPerSecond
                Math.random() * 20 + 12,       // uniquePorts
                Math.random() * 300 + 250,     // packetSize
                Math.random() * 80 + 40        // connectionDuration
            ]);
            labels.push(1);
        }

        // Атака (клас 2) - 20%
        for (let i = 0; i < 200; i++) {
            features.push([
                Math.random() * 250 + 100,    // packetRate (100-350)
                Math.random() * 150000 + 50000, // bytesPerSecond
                Math.random() * 40 + 25,       // uniquePorts
                Math.random() * 500 + 400,     // packetSize
                Math.random() * 150 + 80       // connectionDuration
            ]);
            labels.push(2);
        }

        // Перемішування
        for (let i = features.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [features[i], features[j]] = [features[j], features[i]];
            [labels[i], labels[j]] = [labels[j], labels[i]];
        }

        return { features, labels };
    }

    // ============================================
    // НАВЧАННЯ
    // ============================================
    async trainModel() {
        console.log('🧠 Навчання ML моделі...');

        this.model = this.createModel();

        const { features, labels } = this.generateTrainingData();

        const xs = tf.tensor2d(features);
        const ys = tf.oneHot(tf.tensor1d(labels, 'int32'), 3);

        const history = await this.model.fit(xs, ys, {
            epochs: 30,
            batchSize: 32,
            validationSplit: 0.2,
            verbose: 0,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    if (epoch % 10 === 0) {
                        console.log(`  Epoch ${epoch}: loss=${logs.loss.toFixed(4)}, acc=${logs.acc.toFixed(4)}`);
                    }
                }
            }
        });

        this.isTrained = true;

        const accuracy = history.history.acc[history.history.acc.length - 1];
        console.log(`✅ ML модель навчена! Точність: ${(accuracy * 100).toFixed(1)}%`);

        xs.dispose();
        ys.dispose();

        return history;
    }

    // ============================================
    // ВИЯВЛЕННЯ ЗАГРОЗИ
    // ============================================
    detectThreat(params) {
        let score = 0;

        // Аналіз параметрів
        if (params.packetRate > 80) score += 0.4;
        else if (params.packetRate > 40) score += 0.2;

        if (params.bytesPerSecond > 80000) score += 0.3;
        else if (params.bytesPerSecond > 30000) score += 0.15;

        if (params.uniquePorts > 30) score += 0.3;
        else if (params.uniquePorts > 15) score += 0.15;

        if (params.packetSize > 500) score += 0.2;
        else if (params.packetSize > 300) score += 0.1;

        // Обмежуємо
        score = Math.min(1, score);

        // Визначення рівня
        let level = 'Low';
        let confidence = 0.6;

        if (score > this.thresholds.medium) {
            level = 'High';
            confidence = 0.85 + Math.random() * 0.1;
        } else if (score > this.thresholds.low) {
            level = 'Medium';
            confidence = 0.65 + Math.random() * 0.15;
        } else {
            level = 'Low';
            confidence = 0.5 + Math.random() * 0.2;
        }

        // Використання ML для підтвердження
        if (this.isTrained && this.model && params.packetRate > 10) {
            try {
                const features = [
                    Math.min(params.packetRate / 350, 1),
                    Math.min(params.bytesPerSecond / 200000, 1),
                    Math.min(params.uniquePorts / 80, 1),
                    Math.min(params.packetSize / 1000, 1),
                    Math.min((params.connectionDuration || 50) / 300, 1)
                ];

                const input = tf.tensor2d([features]);
                const pred = this.model.predict(input);
                const probs = pred.dataSync();

                // Якщо ML каже, що це атака - підсилюємо
                if (probs[2] > 0.5) {
                    level = 'High';
                    confidence = Math.max(confidence, probs[2]);
                } else if (probs[1] > 0.4 && level === 'Low') {
                    level = 'Medium';
                    confidence = probs[1];
                }

                input.dispose();
                pred.dispose();

            } catch (e) {
                // Ігноруємо помилки ML
            }
        }

        return {
            level: level,
            confidence: confidence,
            score: score
        };
    }

    // ============================================
    // ЗБЕРЕЖЕННЯ/ЗАВАНТАЖЕННЯ
    // ============================================
    async saveModel() {
        if (this.model) {
            await this.model.save('localstorage://cybersecurity-ml');
            console.log('💾 ML модель збережена');
        }
    }

    async loadModel() {
        try {
            const model = await tf.loadLayersModel('localstorage://cybersecurity-ml');
            this.model = model;
            this.isTrained = true;
            console.log('📂 ML модель завантажена');
            return true;
        } catch (e) {
            console.log('⚠️ Збережену модель не знайдено');
            return false;
        }
    }
}
