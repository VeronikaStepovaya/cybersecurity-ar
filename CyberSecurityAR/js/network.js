import * as THREE from 'three';

export class NetworkManager {
    constructor(scene) {
        this.scene = scene;
        this.nodes = {};
        this.particles = [];
        this.animations = [];
        this.lines = [];
    }
    
    createNetworkNodes() {
        // Створення сервера
        const serverGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const serverMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x006644, metalness: 0.7, roughness: 0.3 });
        const server = new THREE.Mesh(serverGeometry, serverMaterial);
        server.position.set(-1.2, 0, -0.8);
        server.castShadow = true;
        server.receiveShadow = true;
        server.userData = { type: 'server', name: 'Головний сервер', health: 100 };
        this.scene.add(server);
        this.nodes['server'] = server;
        
        // Додаємо антену до сервера
        const antennaGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 6);
        const antennaMat = new THREE.MeshStandardMaterial({ color: 0xffaa44 });
        const antenna = new THREE.Mesh(antennaGeo, antennaMat);
        antenna.position.y = 0.3;
        server.add(antenna);
        
        // Створення комп'ютерів
        const pcMaterial = new THREE.MeshStandardMaterial({ color: 0x44aaff, metalness: 0.5, roughness: 0.4 });
        
        const computerPositions = [
            { x: -0.5, y: -0.2, z: -0.5, name: 'Клієнт 1' },
            { x: 0.3, y: -0.2, z: -0.7, name: 'Клієнт 2' },
            { x: -0.8, y: -0.2, z: 0.2, name: 'Клієнт 3' },
            { x: 0.6, y: -0.2, z: -0.2, name: 'Клієнт 4' }
        ];
        
        computerPositions.forEach((pos, i) => {
            const pcGeometry = new THREE.BoxGeometry(0.35, 0.35, 0.25);
            const pc = new THREE.Mesh(pcGeometry, pcMaterial);
            pc.position.set(pos.x, pos.y, pos.z);
            pc.castShadow = true;
            pc.userData = { type: 'computer', name: pos.name };
            this.scene.add(pc);
            this.nodes[`computer${i}`] = pc;
            
            // Екран комп'ютера
            const screenGeo = new THREE.BoxGeometry(0.25, 0.2, 0.05);
            const screenMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, emissive: 0x004466 });
            const screen = new THREE.Mesh(screenGeo, screenMat);
            screen.position.z = 0.13;
            pc.add(screen);
        });
        
        // Створення маршрутизатора
        const routerGeometry = new THREE.SphereGeometry(0.22, 32, 32);
        const routerMaterial = new THREE.MeshStandardMaterial({ color: 0xff8844, emissive: 0x442200, metalness: 0.8 });
        const router = new THREE.Mesh(routerGeometry, routerMaterial);
        router.position.set(0.7, 0.1, -1.0);
        router.castShadow = true;
        router.userData = { type: 'router', name: 'Маршрутизатор' };
        this.scene.add(router);
        this.nodes['router'] = router;
        
        // Додаємо світлові індикатори до роутера
        const leds = [-0.15, 0, 0.15];
        leds.forEach(x => {
            const ledGeo = new THREE.SphereGeometry(0.04, 8, 8);
            const ledMat = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00 });
            const led = new THREE.Mesh(ledGeo, ledMat);
            led.position.set(x, 0.15, 0.22);
            router.add(led);
        });
        
        // Створення Firewall
        const firewallGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const firewallMaterial = new THREE.MeshStandardMaterial({ color: 0xff4444, emissive: 0x441111, metalness: 0.6 });
        const firewallNode = new THREE.Mesh(firewallGeometry, firewallMaterial);
        firewallNode.position.set(0.2, -0.1, 0.5);
        firewallNode.castShadow = true;
        firewallNode.userData = { type: 'firewall', name: 'Firewall' };
        this.scene.add(firewallNode);
        this.nodes['firewall'] = firewallNode;
        
        // Додаємо щит до firewall
        const shieldGeo = new THREE.TorusGeometry(0.25, 0.05, 16, 32);
        const shieldMat = new THREE.MeshStandardMaterial({ color: 0xff6666, emissive: 0x441111 });
        const shield = new THREE.Mesh(shieldGeo, shieldMat);
        shield.rotation.x = Math.PI / 2;
        firewallNode.add(shield);
        
        // Створення з'єднань
        this.createConnectionLines();
        
        // Додавання текстових міток
        this.addLabels();
    }
    
    createConnectionLines() {
        const connections = [
            [this.nodes['server'], this.nodes['router']],
            [this.nodes['router'], this.nodes['firewall']],
            [this.nodes['computer0'], this.nodes['router']],
            [this.nodes['computer1'], this.nodes['router']],
            [this.nodes['computer2'], this.nodes['router']],
            [this.nodes['computer3'], this.nodes['router']]
        ];
        
        connections.forEach(([node1, node2]) => {
            if (node1 && node2) {
                const points = [node1.position.clone(), node2.position.clone()];
                const lineGeometry = new THREE.BufferGeometry();
                const vertices = new Float32Array([
                    points[0].x, points[0].y, points[0].z,
                    points[1].x, points[1].y, points[1].z
                ]);
                lineGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
                const lineMaterial = new THREE.LineBasicMaterial({ color: 0x44ff88 });
                const line = new THREE.Line(lineGeometry, lineMaterial);
                this.scene.add(line);
                this.lines.push(line);
            }
        });
    }
    
    addLabels() {
        const labelDiv = document.createElement('div');
        labelDiv.style.position = 'absolute';
        labelDiv.style.pointerEvents = 'none';
        labelDiv.style.fontFamily = 'monospace';
        labelDiv.style.fontSize = '12px';
        labelDiv.style.fontWeight = 'bold';
        labelDiv.style.textShadow = '1px 1px 0px black';
        document.body.appendChild(labelDiv);
        
        // Просте рішення - створюємо CSS2D мітки через DOM
        Object.entries(this.nodes).forEach(([key, node]) => {
            const label = document.createElement('div');
            label.textContent = node.userData.name || key;
            label.style.color = '#00ff88';
            label.style.background = 'rgba(0,0,0,0.7)';
            label.style.padding = '2px 6px';
            label.style.borderRadius = '4px';
            label.style.border = '1px solid #00ff88';
            label.style.fontSize = '10px';
            label.style.fontFamily = 'monospace';
            label.style.whiteSpace = 'nowrap';
            label.style.position = 'absolute';
            label.style.pointerEvents = 'none';
            document.body.appendChild(label);
            
            // Зберігаємо для оновлення позиції
            node.userData.label = label;
        });
    }
    
    updateLabels(camera, renderer) {
        // Оновлення позицій CSS2D міток
        Object.values(this.nodes).forEach(node => {
            if (node.userData.label) {
                const vector = node.position.clone();
                vector.project(camera);
                const x = (vector.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
                const y = (-vector.y * 0.5 + 0.5) * renderer.domElement.clientHeight;
                node.userData.label.style.transform = `translate(-50%, -100%)`;
                node.userData.label.style.left = `${x}px`;
                node.userData.label.style.top = `${y - 20}px`;
            }
        });
    }
    
    animateAttackPacket(packet, type) {
        const startNode = this.nodes['router'];
        let endNode = this.nodes['server'];
        
        if (type === 'scan') {
            const computers = Object.values(this.nodes).filter(n => n.userData.type === 'computer');
            endNode = computers[Math.floor(Math.random() * computers.length)];
        }
        
        if (!startNode || !endNode) return;
        
        const particleGeometry = new THREE.SphereGeometry(0.06, 16, 16);
        let color = 0xff3333;
        let emissive = 0x441111;
        
        if (type === 'ddos') {
            color = 0xff0000;
            emissive = 0x660000;
        } else if (type === 'scan') {
            color = 0xff8800;
            emissive = 0x442200;
        }
        
        const material = new THREE.MeshStandardMaterial({ color: color, emissive: emissive });
        const particle = new THREE.Mesh(particleGeometry, material);
        
        particle.userData = {
            start: startNode.position.clone(),
            end: endNode.position.clone(),
            progress: 0,
            speed: 0.03 + Math.random() * 0.02,
            type: type
        };
        
        particle.position.copy(particle.userData.start);
        this.scene.add(particle);
        this.animations.push(particle);
        
        setTimeout(() => {
            if (particle.parent) this.scene.remove(particle);
            this.animations = this.animations.filter(p => p !== particle);
        }, 3500);
    }
    
    animateNormalPacket(packet) {
        const computers = Object.values(this.nodes).filter(n => n.userData.type === 'computer');
        const randomComputer = computers[Math.floor(Math.random() * computers.length)];
        const router = this.nodes['router'];
        
        if (!randomComputer || !router) return;
        
        const particleGeometry = new THREE.SphereGeometry(0.04, 8, 8);
        const material = new THREE.MeshStandardMaterial({ color: 0x44ff88, emissive: 0x226644 });
        const particle = new THREE.Mesh(particleGeometry, material);
        
        particle.userData = {
            start: router.position.clone(),
            end: randomComputer.position.clone(),
            progress: 0,
            speed: 0.025
        };
        
        particle.position.copy(particle.userData.start);
        this.scene.add(particle);
        this.animations.push(particle);
        
        setTimeout(() => {
            if (particle.parent) this.scene.remove(particle);
            this.animations = this.animations.filter(p => p !== particle);
        }, 2000);
    }
    
    highlightNode(nodeName, color) {
        if (this.nodes[nodeName]) {
            const originalColor = this.nodes[nodeName].material.color.getHex();
            const originalEmissive = this.nodes[nodeName].material.emissiveIntensity || 0;
            
            this.nodes[nodeName].material.color.setHex(color);
            this.nodes[nodeName].material.emissiveIntensity = 0.5;
            
            setTimeout(() => {
                if (this.nodes[nodeName]) {
                    this.nodes[nodeName].material.color.setHex(originalColor);
                    this.nodes[nodeName].material.emissiveIntensity = originalEmissive;
                }
            }, 1000);
        }
    }
    
    highlightAllNodes(color) {
        Object.values(this.nodes).forEach(node => {
            const originalColor = node.material.color.getHex();
            node.material.color.setHex(color);
            node.material.emissiveIntensity = 0.3;
            setTimeout(() => {
                node.material.color.setHex(originalColor);
                node.material.emissiveIntensity = 0;
            }, 2000);
        });
    }
    
    resetNodes() {
        Object.values(this.nodes).forEach(node => {
            if (node.userData.type === 'server') {
                node.material.color.setHex(0x00ff88);
                node.material.emissiveIntensity = 0.1;
            } else if (node.userData.type === 'firewall') {
                node.material.color.setHex(0xff4444);
                node.material.emissiveIntensity = 0.1;
            } else if (node.userData.type === 'router') {
                node.material.color.setHex(0xff8844);
                node.material.emissiveIntensity = 0.1;
            } else {
                node.material.color.setHex(0x44aaff);
                node.material.emissiveIntensity = 0;
            }
        });
        
        this.animations.forEach(particle => {
            if (particle.parent) this.scene.remove(particle);
        });
        this.animations = [];
    }
    
    updateAnimations() {
        this.animations.forEach(particle => {
            if (particle.userData.progress < 1) {
                particle.userData.progress += particle.userData.speed;
                const t = particle.userData.progress;
                particle.position.lerpVectors(particle.userData.start, particle.userData.end, t);
                
                // Ефект пульсації
                const scale = 1 + Math.sin(Date.now() * 0.015) * 0.3;
                particle.scale.set(scale, scale, scale);
            }
        });
    }
}