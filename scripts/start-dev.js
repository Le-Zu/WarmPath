const net = require('net');
const { spawn } = require('child_process');

/**
 * Checks if a port is available.
 */
const getFreePort = (startPort) => {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.listen(startPort, () => {
            const { port } = server.address();
            server.close(() => resolve(port));
        });
        server.on('error', () => {
            resolve(getFreePort(startPort + 1));
        });
    });
};

async function start() {
    const preferredPort = parseInt(process.env.PORT || '5000', 10);
    const serverPort = await getFreePort(preferredPort);
    
    console.log(`\n\x1b[32m[WarmPath] 🚀 Starting Dev Environment\x1b[0m`);
    console.log(`\x1b[32m[WarmPath] 📡 API Port: ${serverPort}\x1b[0m`);
    
    if (serverPort !== preferredPort) {
        console.log(`\x1b[33m[WarmPath] ⚠️ Port ${preferredPort} was occupied. Using ${serverPort}.\x1b[0m`);
    }

    const env = { 
        ...process.env, 
        PORT: serverPort.toString(),
        VITE_API_URL: `http://localhost:${serverPort}` 
    };

    // Use detached: true and a custom kill logic to ensure the whole process tree dies
    const child = spawn('npx', ['concurrently', '--kill-others', '"npm run start:server"', '"npm run start:client"'], { 
        shell: true, 
        stdio: 'inherit', 
        env,
        detached: true 
    });

    const cleanup = () => {
        console.log('\n\x1b[31m[WarmPath] 🛑 Killing all processes...\x1b[0m');
        try {
            // Kill the entire process group (minus sign before pid)
            process.kill(-child.pid, 'SIGINT');
        } catch (e) {
            // If group kill fails, try direct kill
            child.kill('SIGINT');
        }
        setTimeout(() => process.exit(), 500);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    child.on('exit', (code) => {
        process.exit(code || 0);
    });
}

start().catch(err => {
    console.error('Failed to start dev environment:', err);
    process.exit(1);
});
