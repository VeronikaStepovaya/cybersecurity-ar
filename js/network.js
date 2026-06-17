import * as THREE from 'three';

export class NetworkManager {
    constructor(scene) {
        this.scene = scene;
        this.nodes = {};
        this.particles = [];
        this.connections = [];
        this.nodePositions = {};
    }

    // ============================================
    // СТВОРЕННЯ ВУЗЛІВ МЕРЕЖІ
    // ============================================
    createNetworkNodes() {
        // Сервер
        const server = this.createServer();
        this.nodes['server'] = server;

        // Комп'ютери
        const computers = this.createComputers();
        computers.forEach((pc, i) => {
            this.nodes[`computer${i}`] = pc;
        });

        // Роутер
        const router = this.createRouter();
        this.nodes['router'] = router;

        // Firewall
        const firewall = this.createFirewall();
        this.nodes['firewall'] = firewall;

        // З'єднання
        this.createConnections();

        // Додаємо анімацію для роутера
        this.animateRouter(router);
    }

    // ============================================
    // СЕРВЕР
    // ============================================
    createServer() {
        const group = new THREE.Group();

        // Корпус
        const geo = new THREE.BoxGeometry(0.5, 0.35, 0.5);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x00ff88,
            emissive: 0x004433,
            metalness: 0.6,
            roughness: 0.3
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        group.add(mesh);

        // Індикатори
        const ledMat = new THREE.MeshStandardMaterial({
            color: 0x00ff44,
            emissive: 0x00ff44
        });
        for (let i = -0.15; i <= 0.15; i += 0.15) {
            const led = new THREE.Mesh(
                new THREE.SphereGeometry(0.04, 8, 8),
                ledMat
            );
            led.position.set(i, 0.2, 0.25);
            group.add(led);
        }

        // Антена
        const antGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 6);
        const antMat = new THREE.MeshStandardMaterial({ color: 0x88ddff });
        const ant = new THREE.Mesh(antGeo, antMat);
        ant.position.set(0, 0.25, 0);
        group.add(ant);

        group.position.set(-1.2, 0, -0.6);
        group.userData = { type: 'server', name: 'Сервер' };
        this.scene.add(group);
        this.nodePositions['server'] = group.position.clone();

        return group;
    }

    // ============================================
    // КОМП'ЮТЕРИ
    // ============================================
    createComputers() {
        const positions = [
            { x: -0.5, y: -0.1, z: 0.3 },
            { x: 0.3, y: -0.1, z: 0.5 },
            { x: -0.7, y: -0.1, z: -0.1 },
            { x: 0.5, y: -0.1, z: -0.3 }
        ];

        return positions.map((pos, i) => {
            const group = new THREE.Group();

            // Корпус
            const geo = new THREE.BoxGeometry(0.3, 0.3, 0.2);
            const mat = new THREE.MeshStandardMaterial({
                color: 0x4488ff,
                metalness: 0.4,
                roughness: 0.5
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.castShadow = true;
            group.add(mesh);

            // Екран
            const screenMat = new THREE.MeshStandardMaterial({
                color: 0x88ddff,
                emissive: 0x224466,
                emissiveIntensity: 0.3
            });
            const screen = new THREE.Mesh(
                new THREE.PlaneGeometry(0.22, 0.18),
                screenMat
            );
            screen.position.set(0, 0, 0.11);
            group.add(screen);

            group.position.set(pos.x, pos.y, pos.z);
            group.userData = { type: 'computer', name: `ПК ${i + 1}` };
            this.scene.add(group);
            this.nodePositions[`computer${i}`] = group.position.clone();

            return group;
        });
    }

    // ============================================
    // РОУТЕР
    // ============================================
    createRouter() {
        const group = new THREE.Group();

        // Корпус
        const geo = new THREE.SphereGeometry(0.2, 32, 32);
        const mat = new THREE.MeshStandardMaterial({
            color: 0xff8844,
            emissive: 0x442200,
            metalness: 0.7,
            roughness: 0.3
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        group.add(mesh);

        // Антени
        for (let i = -0.15; i <= 0.15; i += 0.15) {
            const ant = new THREE.Mesh(
                new THREE.CylinderGeometry(0.015, 0.015, 0.12, 6),
                new THREE.MeshStandardMaterial({ color: 0xdddddd })
            );
            ant.position.set(i, 0.2, 0);
            ant.rotation.z = i * 0.3;
            group.add(ant);
        }

        // Світлодіоди
        for (let i = -0.1; i <= 0.1; i += 0.1) {
            const led = new THREE.Mesh(
                new THREE.SphereGeometry(0.025, 8, 8),
                new THREE.MeshStandardMaterial({
                    color: 0x00ff44,
                    emissive: 0x00ff44,
                    emissiveIntensity: 0.5
                })
            );
            led.position.set(i, -0.12, 0.18);
            group.add(led);
        }

        group.position.set(0.7, 0.1, -0.8);
        group.userData = { type: 'router', name: 'Роутер' };
        this.scene.add(group);
        this.nodePositions['router'] = group.position.clone();

        return group;
    }

    // ============================================
    // FIREWALL
    // ============================================
    createFirewall() {
        const group = new THREE.Group();

        // Корпус
        const geo = new THREE.BoxGeometry(0.32, 0.32, 0.32);
        const mat = new THREE.MeshStandardMaterial({
            color: 0xff4444,
            emissive: 0x441111,
            metalness: 0.5,
            roughness: 0.4
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        group.add(mesh);

        // Щит
        const shieldMat = new THREE.MeshStandardMaterial({
            color: 0xff6666,
            emissive: 0x441111,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        const shield = new THREE.Mesh(
            new THREE.RingGeometry(0.12, 0.22, 32),
            shieldMat
        );
        shield.rotation.x = Math.PI / 2;
        shield.position.z = 0.17;
        group.add(shield);

        // Текст F
        const textMat = new THREE.MeshStandardMaterial({
            color: 0xff8888,
            emissive: 0x441111
        });
        // Використовуємо простий куб як імітацію тексту
        const textBlock = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.12, 0.02),
            textMat
        );
        textBlock.position.set(0, 0, 0.18);
        group.add(textBlock);

        group.position.set(0.2, -0.1, 0.6);
        group.userData = { type: 'firewall', name: 'Firewall' };
        this.scene.add(group);
        this.nodePositions['firewall'] = group.position.clone();

        return group;
    }

    // ============================================
    // АНІМАЦІЯ РОУТЕРА
    // ============================================
    animateRouter(router) {
        let angle = 0;
        setInterval(() => {
            angle += 0.05;
            const leds = router.children.filter(c => c.geometry?.type === 'SphereGeometry');
            leds.forEach((led, i) => {
                const brightness = (Math.sin(angle + i * 1.5) + 1) / 2;
                led.material.emissiveIntensity = 0.2 + brightness * 0.8;
            });
        }, 100);
    }

    // ============================================
    // З'ЄДНАННЯ
    // ============================================
    createConnections() {
        const pairs = [
            ['server', 'router'],
            ['router', 'firewall'],
            ['computer0', 'router'],
            ['computer1', 'router'],
            ['computer2', 'router'],
            ['computer3', 'router']
        ];

        pairs.forEach(([from, to]) => {
            const fromNode = this.nodes[from];
            const toNode = this.nodes[to];
            if (!fromNode || !toNode) return;

            const points = [
                fromNode.position.clone(),
                toNode.position.clone()
            ];

            const geo = new THREE.BufferGeometry();
            const positions = new Float32Array([
                points[0].x, points[0].y, points[0].z,
                points[1].x, points[1].y, points[1].z
            ]);
            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

            const mat = new THREE.LineBasicMaterial({
                color: 0x44ff88,
                transparent: true,
                opacity: 0.3
            });
            const line = new THREE.Line(geo, mat);
            this.scene.add(line);
            this.connections.push(line);
        });
    }

    // ============================================
    // АНІМАЦІЯ ПАКЕТА (АТАКА)
    // ============================================
    animateAttackPacket(packet, type) {
        const from = this.nodes['router'];
        let to = this.nodes['server'];

        if (type === 'scan') {
            const comps = ['computer0', 'computer1', 'computer2', 'computer3'];
            to = this.nodes[comps[Math.floor(Math.random() * comps.length)]];
        }

        if (!from || !to) return;

        const color = type === 'ddos' ? 0xff0000 : 0xff8800;
        const emissive = type === 'ddos' ? 0x660000 : 0x442200;

        const particle = new THREE.Mesh(
            new THREE.SphereGeometry(0.045, 16, 16),
            new THREE.MeshStandardMaterial({
                color: color,
                emissive: emissive,
                emissiveIntensity: 0.5
            })
        );

        particle.userData = {
            start: from.position.clone(),
            end: to.position.clone(),
            progress: 0,
            speed: 0.02 + Math.random() * 0.02,
            type: type
        };

        particle.position.copy(particle.userData.start);
        this.scene.add(particle);
        this.particles.push(particle);

        setTimeout(() => {
            if (particle.parent) {
                this.scene.remove(particle);
            }
            this.particles = this.particles.filter(p => p !== particle);
        }, 3500);
    }

    // ============================================
    // АНІМАЦІЯ ПАКЕТА (НОРМАЛЬНИЙ)
    // ============================================
    animateNormalPacket(packet) {
        const comps = ['computer0', 'computer1', 'computer2', 'computer3'];
        const from = this.nodes['router'];
        const to = this.nodes[comps[Math.floor(Math.random() * comps.length)]];

        if (!from || !to) return;

        const particle = new THREE.Mesh(
            new THREE.SphereGeometry(0.03, 8, 8),
            new THREE.MeshStandardMaterial({
                color: 0x44ff88,
                emissive: 0x226644,
                emissiveIntensity: 0.3
            })
        );

        particle.userData = {
            start: from.position.clone(),
            end: to.position.clone(),
            progress: 0,
            speed: 0.025,
            type: 'normal'
        };

        particle.position.copy(particle.userData.start);
        this.scene.add(particle);
        this.particles.push(particle);

        setTimeout(() => {
            if (particle.parent) {
                this.scene.remove(particle);
            }
            this.particles = this.particles.filter(p => p !== particle);
        }, 2500);
    }

    // ============================================
    // ПІДСВІЧУВАННЯ ВУЗЛІВ
    // ============================================
    highlightNode(name, color) {
        const node = this.nodes[name];
        if (!node) return;

        const original = node.children[0]?.material?.color?.getHex?.() || 0xffffff;
        node.children.forEach(child => {
            if (child.material && child.material.color) {
                const orig = child.material.color.getHex();
                child.material.color.setHex(color);
                child.material.emissiveIntensity = 0.5;
                setTimeout(() => {
                    child.material.color.setHex(orig);
                    child.material.emissiveIntensity = 0;
                }, 1500);
            }
        });
    }

    highlightAllNodes(color) {
        Object.keys(this.nodes).forEach(key => {
            this.highlightNode(key, color);
        });
    }

    // ============================================
    // СКИДАННЯ МЕРЕЖІ
    // ============================================
    resetNodes() {
        this.particles.forEach(p => {
            if (p.parent) this.scene.remove(p);
        });
        this.particles = [];

        Object.keys(this.nodes).forEach(key => {
            const node = this.nodes[key];
            node.children.forEach(child => {
                if (child.material && child.material.color) {
                    if (key === 'server') child.material.color.setHex(0x00ff88);
                    else if (key === 'firewall') child.material.color.setHex(0xff4444);
                    else if (key === 'router') child.material.color.setHex(0xff8844);
                    else child.material.color.setHex(0x4488ff);
                    child.material.emissiveIntensity = 0;
                }
            });
        });
    }

    // ============================================
    // ОНОВЛЕННЯ АНІМАЦІЙ
    // ============================================
    updateAnimations() {
        this.particles.forEach(p => {
            if (p.userData.progress < 1) {
                p.userData.progress += p.userData.speed;
                const t = p.userData.progress;
                p.position.lerpVectors(p.userData.start, p.userData.end, t);

                // Ефект пульсації
                const s = 1 + Math.sin(t * 30) * 0.2;
                p.scale.set(s, s, s);
            }
        });
    }
}
