const fs = require('fs');
const path = require('path');

// Lambda function for handling GET requests (root and /api/data)
exports.handler = async (event) => {
    try {
        // Handle different HTTP methods and paths
        if (event.httpMethod === 'GET') {
            if (event.path === '/') {
                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: "✅ Qlik Writeback API is running. Use /api/save or /api/data." })
                };
            } else if (event.path === '/api/data') {
                return await handleGetData();
            }
        } else if (event.httpMethod === 'POST' && event.path === '/api/save') {
            return await handleSaveData(event.body);
        }

        return {
            statusCode: 404,
            body: JSON.stringify({ error: 'Not Found' })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' })
        };
    }
};

// Function to handle GET /api/data
async function handleGetData() {
    try {
        const fileData = fs.readFileSync(
            path.join(__dirname, "writeback.json"),
            "utf8"
        );
        const json = JSON.parse(fileData);
        return {
            statusCode: 200,
            body: JSON.stringify(json)
        };
    } catch (error) {
        console.error("Error reading file:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Failed to load data." })
        };
    }
}

// Function to handle POST /api/save
async function handleSaveData(body) {
    const writebackFile = path.join(__dirname, "writeback.json");
    const newRows = JSON.parse(body);

    if (!Array.isArray(newRows)) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Invalid data format" })
        };
    }

    try {
        // Read existing data
        let existing = [];
        try {
            const data = fs.readFileSync(writebackFile, "utf8");
            existing = JSON.parse(data);
        } catch (readErr) {
            console.error("Failed to read existing data:", readErr);
        }

        // Merge: replace if Account matches, otherwise keep
        const updated = [
            ...existing.filter(
                (oldRow) => !newRows.some((newRow) => newRow.Account === oldRow.Account)
            ),
            ...newRows,
        ];

        // Write back merged array
        fs.writeFileSync(
            writebackFile,
            JSON.stringify(updated, null, 2)
        );

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Data merged and saved successfully" })
        };
    } catch (error) {
        console.error("Failed to save data:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to save data" })
        };
    }
} 