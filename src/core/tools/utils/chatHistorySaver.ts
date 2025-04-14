import { ChatMessage } from "../providers/abstractProvider";

export function saveChat(history: ChatMessage[]): boolean {
    try {
        const fs = require('fs');
        const path = require('path');

        // Adjust the path to save chat histories at the root level
        const historyDir = path.join(process.cwd(), 'chatHistories', new Date().toISOString().split('T')[0]);
        console.log(`Attempting to create directory: ${historyDir}`);
        fs.mkdirSync(historyDir, { recursive: true });

        // Format the time as HHh_MMmin
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const timeString = `${hours}h_${minutes}min`;

        // Save the history to a file with the new time format
        const historyFilePath = path.join(historyDir, `${timeString}.txt`);
        console.log(`Attempting to create file: ${historyFilePath}`);
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