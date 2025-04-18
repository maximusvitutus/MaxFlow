import { ChatMessage } from "../providers/abstractProvider";

export function saveChat(history: ChatMessage[]): boolean {
    try {
        const fs = require('fs');
        const path = require('path');
        const os = require('os');

        // Log the execution environment
        console.log(`Current working directory: ${process.cwd()}`);
        console.log(`Home directory: ${os.homedir()}`);
        
        // Use the user's home directory as a reliable location
        const historyDir = path.join(os.homedir(), 'chatHistories', new Date().toISOString().split('T')[0]);
        console.log(`Full directory path: ${historyDir}`);
        fs.mkdirSync(historyDir, { recursive: true });

        // Format the time as HHh_MMmin
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const timeString = `${hours}h_${minutes}min`;

        // Save the history to a file with the new time format
        const historyFilePath = path.join(historyDir, `${timeString}.txt`);
        console.log(`Complete file path: ${historyFilePath}`);
        const separator = '\n\n' + "-".repeat(100) + '\n\n';
        fs.writeFileSync(historyFilePath, history.map(message => `${message.role}: ${message.content}`).join(separator))
        return true;
    } catch (error) {
        console.error('Error saving chat history:', error);
        return false;
    }
}


// Test the function
main();

async function main() {
    const history: ChatMessage[] = [
        { role: 'user', content: 'Hello, how are you?' },
        { role: 'assistant', content: 'I\'m good, thank you!' }
    ];
    saveChat(history);
}