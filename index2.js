require('dotenv').config();
const imaps = require('imap-simple');

const config = {
    imap: {
        user: process.env.IMAP_USER,
        password: process.env.IMAP_PASS,
        host: process.env.IMAP_HOST,
        port: parseInt(process.env.IMAP_PORT),
        tls: true,
        authTimeout: 3000,
    }
};

// Helper: create ranges for batching
function chunkArray(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}

async function logEmails() {
    try {
        const connection = await imaps.connect(config);
        await connection.openBox('INBOX');

        // Fetch all UIDs first
        const uids = await connection.search(['ALL'], { bodies: [], struct: true });
        const allUIDs = uids.map(msg => msg.attributes.uid);
        console.log(`Total emails: ${allUIDs.length}`);

        const batches = chunkArray(allUIDs, 50); // 500 emails per batch

        for (const batch of batches) {
            const searchCriteria = [['UID', `${batch[0]}:${batch[batch.length - 1]}`]];
            const fetchOptions = { bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'], struct: true };

            const messages = await connection.search(searchCriteria, fetchOptions);

            messages.forEach(item => {
                const header = item.parts.find(part => part.which === 'HEADER.FIELDS (FROM TO SUBJECT DATE)');
                console.log(header.body);
            });

            console.log(`Processed batch of ${batch.length} emails`);
        }

        await connection.end();
        console.log('Done logging all emails!');
    } catch (err) {
        console.error('Error fetching emails:', err);
    }
}

logEmails();
