require('dotenv').config();

const fetch = require('node-fetch');
const cron = require('node-cron');

const URL =
  'https://shop.amul.com/api/1/entity/ms.products?fields[name]=1&fields[available]=1&fields[inventory_quantity]=1&limit=24&filters[0][field]=categories&filters[0][value][0]=protein&filters[0][operator]=in';
const headers = {
  accept: 'application/json, text/plain, */*',
  frontend: '1',
  Referer: 'https://shop.amul.com/',
};

const TARGET_PRODUCT_NAME =
  'Amul High Protein Plain Lassi, 200 mL | Pack of 30';

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

let messageSent = false;

async function sendTelegramMessage(message) {
  const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  await fetch(telegramUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown',
    }),
  });
}

async function checkProductAvailability() {
  try {
    const res = await fetch(URL, { headers });
    const json = await res.json();

    const product = json?.data?.find((p) => p.name === TARGET_PRODUCT_NAME);

    if (product) {
      if (product.available > 0) {
        console.log(
          `✅ Product Available! "${product.name}" - ${product.inventory_quantity} units`
        );

        if (!messageSent) {
          const message = `🚀 *Product Available!*\n\n"${product.name}"\nAvailable Quantity: *${product.inventory_quantity}*\n\n[🔗 Shop Now](https://shop.amul.com)`;
          await sendTelegramMessage(message);
          messageSent = true; // ✅ Don't send again until out of stock
        }
      } else {
        console.log(`❌ "${product.name}" is out of stock.`);
        messageSent = false; // Reset so next availability triggers a new message
      }
    } else {
      console.log(`⚠️ Product "${TARGET_PRODUCT_NAME}" not found.`);
    }
  } catch (err) {
    console.error('⚠️ Error fetching API:', err.message);
  }
}

// Run every 30 minutes
cron.schedule('*/30 * * * *', () => {
  console.log(`\n⏰ Checking at ${new Date().toLocaleTimeString()}...`);
  checkProductAvailability();
});

// Run immediately on start
checkProductAvailability();
