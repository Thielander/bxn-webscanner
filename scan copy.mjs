import fetch from 'node-fetch';
import { AbortController } from 'abort-controller';


const wordsToFind = {
  "HL-3142CW": "Brother HL-3142CW series",
  "Kerio Connect WebMail": "Kerio Connect WebMailer"
};

// Extract the IP range from the command line argument
const [_, __, ipRange] = process.argv;
const [startIP, endIP] = ipRange.split('-');

const startParts = startIP.split('.');
const startBaseIP = startParts.slice(0, 3).join('.');
const startRange = Number(startParts.pop());

const endParts = endIP.split('.');
const endBaseIP = endParts.slice(0, 3).join('.');
const endRange = Number(endParts.pop());

if (startBaseIP !== endBaseIP) {
  console.log("Die Basis-IP-Adressen der angegebenen Bereiche stimmen nicht überein. Bitte stellen Sie sicher, dass der dritte Oktett in beiden IP-Adressen gleich ist.");
  process.exit(1);
}

const fetchAndScan = async ip => {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 2000); // set a 5-second timeout
  
  try {
    const response = await fetch(`http://${ip}`, { signal: controller.signal, follow: 0 });

   
    const data = await response.text();

    for (let word in wordsToFind) {
      if (data.includes(word)) {
        console.log(`\nIP: ${ip} - Gefunden: ${wordsToFind[word]}`);
        return;
      }
    }

    const titleMatch = data.match(/<title>([^<]*)<\/title>/i);
    const title = titleMatch && titleMatch[1];
    console.log(title ? `\nIP: ${ip} - Title: ${title}` : `\nIP: ${ip} - Kein Title gefunden`);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`\nIP: ${ip} - Request took too long and was cancelled.`);
    } else {
      console.log(`\nIP: ${ip} - Error:`, error);
    }
  } finally {
    clearTimeout(timeout);
  }
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  for (let fourthOctet = startRange; fourthOctet <= endRange; fourthOctet++) {
    const ip = `${startBaseIP}.${fourthOctet}`;
    process.stdout.write('.'); // print a dot for each iteration
    await fetchAndScan(ip);
    await sleep(2000); // pause for 2 seconds between requests
  }
})();
