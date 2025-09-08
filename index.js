import 'dotenv/config'; // loads .env automatically
import { ImapFlow } from 'imapflow';

// Initialize IMAP client using environment variables
const client = new ImapFlow({
    host: process.env.IMAP_HOST,
    port: parseInt(process.env.IMAP_PORT) || 993,
    // secure: process.env.IMAP_SECURE === 'true', // true for 993
    secure: true,
    auth: {
        user: process.env.IMAP_USER,
        pass: process.env.IMAP_PASS
    },
    // logger: false

});

client.on('error', err => {
    console.error('IMAP error:', err);
});

client.on('close', async hadError => {
    console.log('Connection closed', hadError ? 'due to error' : '');
});
const main = async () => {
    await client.connect();
    console.log('[✅] Connected to mailbox.');

    // Lock INBOX
    let lock = await client.getMailboxLock('INBOX');
    try {
        if (client.mailbox.exists > 0) {
            // Get the latest message
            let latest = await client.fetchOne(client.mailbox.exists, { source: true });
            console.log('[Latest message source]');
            // console.log(latest.source.toString());
        } else {
            console.log('[No messages in mailbox]');
        }

        // Get date 1 year ago
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        // Search for emails since last year
        const uids = await client.search({ since: oneYearAgo });

        if (uids.length === 0) {
            console.log('[No emails from the last year]');
        } else {
            console.log(`[Fetching ${uids.length} emails from the last year]`);

            const batchSize = 100;
            for (let i = 0; i < uids.length; i += batchSize) {
                const batch = uids.slice(i, i + batchSize);

                for await (let msg of client.fetch(batch, { envelope: true })) {
                    console.log(`${msg.uid}: ${msg.envelope.subject}`);
                    await new Promise((r) => setTimeout(r, 1000)); // small delay between batches

                }
                await new Promise((r) => setTimeout(r, 5000)); // small delay between batches

            }
        }
    } finally {
        lock.release();
    }


    // await client.logout();
    console.log('[✅] Logged out and connection closed.');
};

main().catch(err => console.error('[❌] Fatal error:', err));
