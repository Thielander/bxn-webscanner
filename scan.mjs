/*
#  code by Alexander Thiele
#  https://www.linkedin.com/in/thielander
#
#  This program is free software; you can redistribute it and/or modify
#  it under the terms of the GNU General Public License as published by
#  the Free Software Foundation; either version 2 of the License, or
#  (at your option) any later version.
#
#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with this program; if not, write to the Free Software
#  Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA#
#
#
#
#
# yes -> node .\scan.mjs 89.166.35.0-89.166.35.255
# no  -> node  .\scan.mjs 089.166.035.0-089.166.035.255
#


        \|||/
        (o o)
,~~~ooO~~(_)~~~~~~~~~,
|                    |
|    Web Scanner     |
|     A.Thiele       |
'~~~~~~~~~~~~~~ooO~~~'
       |__|__|
        || ||
       ooO Ooo
*/
import axios from 'axios';
import { AbortController } from 'abort-controller';
import wordsToFind from './keywords.js';
import fs from 'fs';

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
  console.log("The base IP addresses of the specified ranges do not match. Please make sure that the third octet is the same in both IP addresses.");
  process.exit(1);
}

const isValidIP = ip => {
  const parts = ip.split('.');
  return parts.length === 4 && parts.every(part => Number(part) >= 0 && Number(part) <= 255);
};

const fetchAndScan = async ip => {
  if (!isValidIP(ip)) {
    console.log(`Invalid IP address: ${ip}`);
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 2000); // set a 2-second timeout

  try {
    const response = await axios.get(`http://${ip}`, { timeout: 2000 });
    const data = response.data;

    let foundMessage = '';
    for (let word in wordsToFind) {
      if (data.includes(word)) {
        foundMessage = wordsToFind[word];
        break;
      }
    }

    const titleMatch = data.match(/<title>([^<]*)<\/title>/i);
    const title = titleMatch && titleMatch[1];

    if (title || foundMessage) {
      console.log(`\nIP: ${ip} - Title: ${title || 'No title found'}`);
      console.log(`IP: ${ip} - Found: ${foundMessage || 'No message found'}`);
      return { ip, title, foundMessage };
    } else {
      process.stdout.write('.');
      return null;
    }
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.log(`\nIP: ${ip} - Request took too long and was cancelled.`);
    } else if (error.code === 'ERR_INVALID_URL') {
      console.log(`\nIP: ${ip} - Invalid URL.`);
    } else if (error.code === 'ECONNRESET') {
      console.log(`\nIP: ${ip} - Connection was reset.`);
    } else if (error.code === 'ETIMEDOUT') {
      console.log(`\nIP: ${ip} - Connection timeout.`);
    } else {
      console.log(`\nIP: ${ip} - Error:`, error.message);
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const maxConnections = 10;
  const queue = [];
  const results = [];

  for (let fourthOctet = startRange; fourthOctet <= endRange; fourthOctet++) {
    const ip = `${startBaseIP}.${fourthOctet}`;
    queue.push(fetchAndScan(ip));
    if (queue.length === maxConnections) {
      const batchResults = await Promise.all(queue);
      results.push(...batchResults.filter(result => result !== null));
      queue.length = 0;
      await sleep(2000); // pause for 2 seconds between batches
    }
  }

  if (queue.length > 0) {
    const remainingResults = await Promise.all(queue);
    results.push(...remainingResults.filter(result => result !== null));
  }

  // Generate HTML content
  let htmlContent = `
  <html>
    <head>
      <title>Web Scanner Results</title>
    </head>
    <body>
      <h1>Web Scanner Results</h1>
      <ul>
  `;

  results.forEach(({ ip, title, foundMessage }) => {
    htmlContent += `
        <li>
          <a href="http://${ip}" target="_blank">${ip}</a> - Title: ${title || 'No title found'} - Found: ${foundMessage || 'No message found'}
        </li>
    `;
  });

  htmlContent += `
      </ul>
    </body>
  </html>
  `;

  // Save HTML content to a file
  fs.writeFileSync('scan_results.html', htmlContent);

  console.log('Results were saved to the "scan_results.html" file.');
})();
