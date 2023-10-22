const TelegramBot = require('node-telegram-bot-api');
const xml2js = require("xml2js");
const schedule = require('node-schedule');


require('dotenv').config();
const YLEtoken = process.env.YLE_DEV_APITOKEN || '';
const BOTtoken = process.env.BOT_TOKEN || '';

// Source for the RSS news
// https://yle.fi/uutiset/rss
// Set up your bot
const bot = new TelegramBot(BOTtoken, { polling: true });
const chatId = '@Selkouutiset_maguitariabot'; // Replace with your channel or group chat ID
const SelkouutisetUrl = "https://feeds.yle.fi/uutiset/v1/recent.rss?publisherIds=YLE_SELKOUUTISET"
const MainNewsURL = "https://feeds.yle.fi/uutiset/v1/majorHeadlines/YLE_UUTISET.rss"




// Function to fetch and send news
function sendNews(chatId, newsURL) {
    
  // Fetch Selkouutiset data from your source
  fetch(`${newsURL}`)
    .then((response) => response.text()) // Get the response as text
    .then((xmlData) => {
         // Trim the XML data to remove non-XML content
      xmlData = xmlData.trim();
      // Parse the XML data
      xml2js.parseString(xmlData, (err, result) => {
        if (err) {
          console.error('Error parsing XML:', err);
          bot.sendMessage(chatId, 'Sorry, I couldn\'t fetch News at the moment. Please try again later.');
        } else {
          // Extract and format the news data
          const items = result.rss.channel[0].item;
          let formattedNews = "Today's News:\n\n";
          items.forEach((item) => {
            formattedNews += `${item.title[0]}\n${item.link[0]}\n\n`;
          });
           // Split the formatted message into chunks
      const maxMessageLength = 4096; // Telegram's message length limit
      const messageChunks = formattedNews.match(new RegExp(`.{1,${maxMessageLength}}`, 'g'));

      if (messageChunks) {
        messageChunks.forEach((chunk) => {
          bot.sendMessage(chatId, chunk);
        });
          // Send the news to the specified chat or channel
          bot.sendMessage(chatId, formattedNews);
        }
      }
    })
})
}
// Schedule the bot to run daily at a specific time (e.g., 12:00 PM)
const rule = new schedule.RecurrenceRule();
rule.hour = 12;
rule.minute = 0;
schedule.scheduleJob(rule, sendNews);

// Log that the bot is running
console.log('Selkouutiset bot is running...');


// Define a function to send a list of available commands
function sendCommandsList(chatId) {
  const commandsList = 'Available commands:\n'
    + '/start - Start the bot\n'
    + '/help - Display available commands\n'
    + '/sendMainNews - Get main news from YLE channel\n'
    + '/sendSelkoUutiset - Get selkouutiset from YLE channel\n'; 
  bot.sendMessage(chatId, commandsList);
}
  //NOTE - /** Main commands for bot */
// Handle the /help command to send the list of available commands
bot.onText(/\/help/, (msg) => {
      const chatId = msg.chat.id;
     bot.sendMessage(
       chatId,
       "This bot sends you daily Selkouutiset at 12:00 PM. Enjoy!\n"
     );
  sendCommandsList(chatId);
});
// Handle the /start command to send a welcome message with the "Start" button
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  sendCommandsList(chatId);
  bot.sendMessage(chatId, 'Welcome to your bot!Here are the available commands:', {
    reply_markup: {
      keyboard: [['Start']],
      resize_keyboard: true,
    },
  });
});


// Set up a Telegram bot command
bot.onText(/\/sendSelkoUutiset/, (msg) => {
  sendNews(msg.chat.id, SelkouutisetUrl);
});
// Set up a Telegram bot command
bot.onText(/\/sendMainNews/, (msg) => {
  sendNews(msg.chat.id, MainNewsURL);
});

