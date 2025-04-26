import dotenv from 'dotenv';
dotenv.config();

import fetch from 'node-fetch';
import cron from 'node-cron';

const URL =
  'https://shop.amul.com/api/1/entity/ms.products?fields[name]=1&fields[brand]=1&fields[categories]=1&fields[collections]=1&fields[alias]=1&fields[sku]=1&fields[price]=1&fields[compare_price]=1&fields[original_price]=1&fields[images]=1&fields[metafields]=1&fields[discounts]=1&fields[catalog_only]=1&fields[is_catalog]=1&fields[seller]=1&fields[available]=1&fields[inventory_quantity]=1&fields[net_quantity]=1&fields[num_reviews]=1&fields[avg_rating]=1&fields[inventory_low_stock_quantity]=1&fields[inventory_allow_out_of_stock]=1&fields[lp_seller_ids]=1&filters[0][field]=categories&filters[0][value][0]=protein&filters[0][operator]=in&facets=true&facetgroup=default_category_facet&limit=32&total=1&start=0&cf_cache=3m&substore=6650600024e61363e088c526';
const headers = {
  accept: 'application/json, text/plain, */*',
  'accept-language': 'en-US,en;q=0.9',
  frontend: '1',
  priority: 'u=1, i',
  'sec-ch-ua':
    '"Microsoft Edge";v="135", "Not-A.Brand";v="8", "Chromium";v="135"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  cookie:
    'jsessionid=s%3A3jQ%2BphuVDmJbAlpQU4taQ%2Bu0.lf3Nc1tOncDkDasY500iLoatGTp%2FXYoepqmvwykHcFw; _fbp=fb.1.1745399205835.790493296677799315; _ga=GA1.1.486575907.1745399206; ext_name=ojplmecpdpgccookcobabopnaifgidhf; _cfuvid=MIctuwNzv5WmMet_QdX_AEwP9pW9QMBBOntfqWDV3Ew-1745652207750-0.0.1.1-604800000; __cf_bm=nV1aoXvWKGUJDR8EzsJIOJzwcJgMT3f1ZWfa6H_m2pY-1745658646-1.0.1.1-EFSD719SguFkMl0Ml7LG.TpksinrfyhItL4FZW25sTw9dCIvJ7nuY2e6N6QZC1L5cpoP4fwAjuiAzZgCayQOitVJLmuvp2F35tistf5Txxs; _ga_XXXXXXXXXX=GS1.1.1745657633.4.1.1745659476.0.0.0; _ga_E69VZ8HPCN=GS1.1.1745657633.6.1.1745659476.60.0.1338373036',
  Referer: 'https://shop.amul.com/',
  'Referrer-Policy': 'origin',
};

const TARGET_PRODUCT = 'LASCP61_30';

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

let messageSent = false;

async function sendTelegramMessage(message) {
  const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
  await fetch(telegramUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown',
    }),
  });
}

async function checkProductAvailability() {
  try {
    const res = await fetch(URL, { headers });
    const json = await res.json();

    console.log(json);

    //await sendTelegramMessage('Checking Started');

    const product = json?.data?.find((p) => p.sku === TARGET_PRODUCT);

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
      console.log(`⚠️ Product "${TARGET_PRODUCT}" not found.`);
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
