// ============================================
// ДАНІ ДЛЯ НАВЧАННЯ ML МОДЕЛІ
// ============================================

export const trainingData = {
    // Нормальний трафік (клас 0)
    normal: Array.from({ length: 600 }, () => ({
        features: [
            5 + Math.random() * 25,      // packetRate
            5000 + Math.random() * 15000, // bytesPerSecond
            2 + Math.random() * 10,       // uniquePorts
            80 + Math.random() * 250,     // packetSize
            10 + Math.random() * 40       // connectionDuration
        ],
        label: 0
    })),

    // Підозрілий трафік (клас 1)
    suspicious: Array.from({ length: 200 }, () => ({
        features: [
            35 + Math.random() * 60,      // packetRate
            20000 + Math.random() * 40000, // bytesPerSecond
            12 + Math.random() * 20,       // uniquePorts
            250 + Math.random() * 300,     // packetSize
            40 + Math.random() * 80        // connectionDuration
        ],
        label: 1
    })),

    // Атака (клас 2)
    attack: Array.from({ length: 200 }, () => ({
        features: [
            100 + Math.random() * 250,    // packetRate
            50000 + Math.random() * 150000, // bytesPerSecond
            25 + Math.random() * 40,       // uniquePorts
            400 + Math.random() * 500,     // packetSize
            80 + Math.random() * 150       // connectionDuration
        ],
        label: 2
    }))
};

// Функція для отримання перемішаних даних
export function getShuffledData() {
    const allData = [
        ...trainingData.normal,
        ...trainingData.suspicious,
        ...trainingData.attack
    ];

    // Перемішування
    for (let i = allData.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allData[i], allData[j]] = [allData[j], allData[i]];
    }

    return {
        features: allData.map(d => d.features),
        labels: allData.map(d => d.label)
    };
}

// Статистика даних
export const dataStats = {
    totalSamples: 1000,
    normalCount: 600,
    suspiciousCount: 200,
    attackCount: 200,
    featuresCount: 5,
    classes: 3
};
