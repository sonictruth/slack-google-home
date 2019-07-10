const GoogleHome = require('google-home-push');
const myHome = new GoogleHome('192.168.1.52'); //53
const fs = require('fs');
const { RTMClient, WebClient, LogLevel } = require('@slack/client');
let token;
try {
  token = fs.readFileSync('./token.key').toString().trim();
} catch (e) {
  console.log('Please create a token.key file containing the Slack token.');
}
const logLevel = LogLevel.ERROR;
const timeOut = 20000;

process.on('unhandledRejection', error => {
  console.log(error);
  if (error.message && error.message.indexOf('no response timeout') >= 0) {
    light._close();
    light = undefined;
    sendMessage('Something went wrong, please retry.');
  } else {
    process.exit(1);
  }
});

const rtm = new RTMClient(token,
  {
    logLevel,
    autoReconnect: true,
    clientPingTimeout: timeOut,
    serverPongTimeout: timeOut - 1000
  }
);

const web = new WebClient(token,
  { logLevel }
);

// Start bot
(async () => {
  const connectionInfo = await rtm.start();
  const res = await web.channels.list();
  console.log(res.channels);
  channel = res.channels.find(c => c.is_member);
  console.log('Connection: ', connectionInfo.team.name);
})();

rtm.on('message', async (message) => {
  let lang = 'en';
  const langRegexp = /\[=(.*?)\]/;
  if (message.type === 'message' && (message.text || message.attachments.length > 0)) {
    let messageText = message.text ? message.text : message.attachments[0].pretext;
    messageText = messageText.toString();
    const hasLang = messageText.match(langRegexp);
    if(hasLang) {
      messageText = messageText.replace(langRegexp, '');
      lang = hasLang[1];
    }
    console.log('>>>', messageText, lang);
    myHome.speak(messageText, lang);
  }
});

const sendMessage = async (message) => {
  if (channel) {
    const msg = await rtm.sendMessage(emoji.emojify(message), channel.id);
    console.log(`Sent message to ${channel.name} with ts:${msg.ts}`);
  } else {
    console.log('This bot does not belong to any channel, invite it to at least one and try again');
  }
}
