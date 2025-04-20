const fs = require('fs');
const CONFIG_PATH = "config/config.json";

const getConfig = (guildId, key) => {
    try {
        const data = fs.readFileSync(CONFIG_PATH, { encoding: 'utf8' });
        const config = JSON.parse(data);

        return config[guildId]?.[key] ?? null;
    } catch (err) {
        console.error('Error reading or parsing config file:', err);
        return null;
    }
};

const setConfig = (guildId, key, value) => {
    // Read the existing config file
    fs.readFile(CONFIG_PATH, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading config file:', err);
            return;
        }
    
        // Parse the JSON data
        let config;
        try {
            config = JSON.parse(data);
        } catch (parseErr) {
            console.error('Error parsing config file:', parseErr);
            return;
        }
    
        // Update the config with the new key-value pair
        config[guildId][key] = value;
    
        // Write the updated config back to the file
        fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8', (writeErr) => {
            if (writeErr) {
                console.error('Error writing to config file:', writeErr);
                return;
            }
        });
    });
}

module.exports = { getConfig, setConfig };