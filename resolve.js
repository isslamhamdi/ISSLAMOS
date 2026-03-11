const https = require('https');
const http = require('http');

const urls = [
  "https://maps.app.goo.gl/s9oHvfyR9dGVkMy1A?g_st=ipc",
  "https://maps.app.goo.gl/N9BpMWLkd7y3eKxR8?g_st=aw",
  "https://maps.app.goo.gl/19V3bhmSDpDnTDkV8?g_st=ipc",
  "https://maps.app.goo.gl/QL85jBWEkHEt6rno6?g_st=awb",
  "https://maps.app.goo.gl/CP6jiVdiKJPRUnBa8?g_st=awb",
  "https://maps.app.goo.gl/BBqNRKJesvnh5pAY8?g_st=aw",
  "https://maps.app.goo.gl/wvLEaWmdGHYmLdsG8",
  "https://maps.app.goo.gl/vM4LU8JomCFuYdL16?g_st=aw",
  "https://maps.app.goo.gl/GksETL2YfJxgNQqj8",
  "https://maps.app.goo.gl/FZrSnKKCMZmyAjMS9?g_st=aw",
  "https://maps.app.goo.gl/ASEAdsfG1sLxZLfx8?g_st=aw",
  "https://maps.app.goo.gl/HsoSZATZptbtkcPt5?g_st=aw",
  "https://goo.gl/maps/3ZpXQk6fqQYA5nEm6",
  "https://maps.app.goo.gl/33kAAeaHGQUeJ1fb6?g_st=awb",
  "https://maps.app.goo.gl/nT4QNA6ebqC5BkKJ7?g_st=ipc",
  "https://maps.app.goo.gl/CwqsaoWRn5oqWchj9?g_st=awb",
  "https://maps.app.goo.gl/KRodi5EY2hpcNpwu7?g_st=iw",
  "https://goo.gl/maps/a5CFpwhGN8BggsZs8?g_st=aw",
  "https://maps.app.goo.gl/Lr5PCZW9jTogkC5u6?g_st=aw",
  "https://maps.app.goo.gl/wLYkBUeGSpwCGBuH7?g_st=iw",
  "https://maps.app.goo.gl/WvaRU62dMno2vvou8?g_st=iw",
  "https://maps.app.goo.gl/jqvLZergUHLrg8zJ6?g_st=iw",
  "https://goo.gl/maps/hPtoGVQC2Vk4SXki6?g_st=aw",
  "https://maps.app.goo.gl/9VzAcm2JAQ3aSvre8?g_st=ic",
  "https://maps.app.goo.gl/dmuPgXdABi8xnpdb6?g_st=aw",
  "https://goo.gl/maps/mtUmA2djtem8sf4X9?g_st=aw",
  "https://maps.app.goo.gl/meAwmp3GV3Qxvs8n6?g_st=aw",
  "https://maps.app.goo.gl/nYCQ7dRtpB9pexN18?g_st=aw",
  "https://maps.app.goo.gl/MhN7q57Wt9ZkqsNW9?g_st=iw",
  "https://maps.app.goo.gl/NMM9en8mt5cCwCRw9?g_st=aw",
  "https://maps.app.goo.gl/gPErX1U6Kiuaa5zX8",
  "https://maps.app.goo.gl/fVmYf7JH6stsdUhVA?g_st=awb",
  "https://maps.app.goo.gl/Doj2XvqhLHm9pGKd8?g_st=aw"
];

function resolveUrl(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        resolve(res.headers.location);
      } else {
        resolve(url);
      }
    });
    req.on('error', reject);
  });
}

async function main() {
  for (const url of urls) {
    try {
      let finalUrl = await resolveUrl(url);
      if (finalUrl.includes('maps.app.goo.gl') || finalUrl.includes('goo.gl')) {
         finalUrl = await resolveUrl(finalUrl);
      }
      console.log(url + " => " + finalUrl);
    } catch (e) {
      console.log(url + " => ERROR");
    }
  }
}

main();
