require('dotenv').config()
const Imap = require('imap');
// var debug = require('debug')('main:imap')
const debug = (msg) => console.debug(`[main:imap] -> ${msg}`)
//  const simpleParser = require('simpleParser')
const { simpleParser } = require('mailparser');
const getEmails = (imap, email) => {

    return new Promise((res, rej) => {
        try {
            const raw_emails = []

            imap.once('ready', () => {
                imap.openBox('INBOX', false, () => {
                    imap.search([['TO', 'neon+sortingtest@saahild.com']], (err, results) => {
                        // imap.search(['UNSEEN', ['SINCE', 0]], (err, results) => {
                        // unread ^
                        if (err) {
                            console.error("#err5")
                            return rej(err.message)
                        }
                        let f;
                        try {
                            f = imap.fetch(results, { bodies: '' });
                            // f = imap.fetch(`${results[0]}:${results[results.length - 1]}`, { bodies: '' });

                        } catch (e) {
                            console.error("#err6")
                            // return rej(e)
                            if (e.message === 'Nothing to fetch') {
                                return res([])
                            }
                            console.error(e.message, "YES")
                            return;
                        }
                        f.on('message', msg => {
                            let streamm = null;
                            msg.on('body', stream => {
                                raw_emails.push({ uid: null, stream })
                                streamm = stream
                            });
                            msg.once('attributes', attrs => {
                                const { uid } = attrs;
                                // imap.addFlags(uid, ['\\Seen'], () => {
                                //   // Mark the email as read after reading it
                                //   // debug('Marked as read!');
                                // });
                                raw_emails.find(e => e.stream === streamm).uid = uid

                            });
                        });
                        f.once('error', ex => {
                            debug('err4')
                            return rej(ex.message);
                        });
                        f.once('end', async () => {
                            // debug('Done fetching all messages!');
                            // imap.end();
                            let emails = []

                            for (const { stream, uid } of raw_emails) {
                                let parsed = await simpleParser(stream)
                                // debug(parsed.to.value[0].address, email)
                                // if (parsed.to.value[0].address === email) {
                                parsed.seq = uid
                                emails.push(parsed)
                                // }
                            }
                            res(emails)
                            // imap.end()
                            debug('Connection ended');
                        });
                    })
                })
            });

            imap.once('error', err => {
                debug("ERR2")
                rej(err.message)
            });

            imap.once('end', async () => {

            });

            imap.connect();
        } catch (ex) {
            // debug('an error occurred', ex);
            console.error("ERR")
            //  if(ex.message === '')
            rej(ex.message)
        }
    })
};


module.exports = getEmails;
const imap = new Imap({
    host: process.env.IMAP_HOST,
    port: process.env.IMAP_PORT,
    tls: true,
    user: process.env.IMAP_USER,
    password: process.env.IMAP_PASS,



    // debug: debug
});

getEmails(imap, process.env.IMAP_USER).then(d => {
    // require('fs').writeFileSync('emails.json', JSON.stringify(d), 'utf8')
    // console.log(d)
    // oke we have emails wat now! wellllllll
    console.log(d)
    // log all current inbox's
    imap.getBoxes((err, boxes) => {
        if (err) {
            console.error('Error listing boxes:', err);
            return;
        }
        console.log('Current inbox boxes:', boxes);
    });
    // move email to the folder INBOX.Testing
    // console.log(d[0].seq)

    // imap.move(d.map(e => e.seq), 'INBOX.Testing', (err) => {
    //     if (err) {
    //         console.error('Error moving emails:', err);
    //     } else {
    //         console.log('Emails moved successfully!');
    //     }
    //     // imap.end(); // Close the connection after moving
    // })

})

/**
 * current road plan in jsdoc cuz to lazy to spin up md
 * so we get all unread emails
 * if older then 6 months , mark as read please
 * if older then one year archive the email UNLESS its marked important
 * if email sent to jobs@saahild.com -> Sort to jobs folder
 * if email sent to edu@saahild.com -> Sort to edu folder
 * ...etc 
 * please also take a copy of todays emails and make an ai summary for zeon!
 */