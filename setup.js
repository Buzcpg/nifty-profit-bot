#!/usr/bin/env node

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const ROOT_DIR = __dirname;
const ENV_PATH = path.join(ROOT_DIR, '.env');

function printWelcome() {
  console.log('🎉 Nifty Workshop Profit Bot — Setup');
  console.log('=====================================');
  console.log('This will get your bot up and running in a few minutes.');
  console.log('Press Ctrl+C at any time to cancel.');
  console.log('');
}

function checkNodeVersion() {
  const major = Number(process.versions.node.split('.')[0]);
  if (Number.isNaN(major) || major < 18) {
    console.error('Node.js 18 or higher is required. Download it from https://nodejs.org');
    process.exit(1);
  }
}

function createPrompt() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

async function askYesNo(rl, question) {
  while (true) {
    const answer = (await ask(rl, `${question} `)).toLowerCase();
    if (answer === 'yes' || answer === 'y') return true;
    if (answer === 'no' || answer === 'n') return false;
    console.log('Please answer yes or no.');
  }
}

async function askField(rl, prompt, options = {}) {
  const { required = false, defaultValue = '' } = options;

  while (true) {
    const answer = await ask(rl, `${prompt} `);

    if (answer !== '') {
      return answer;
    }

    if (defaultValue !== '') {
      return defaultValue;
    }

    if (!required) {
      return '';
    }

    console.log('This value is required. Please enter a value.');
  }
}

function sanitizeEnvValue(value) {
  return String(value).replace(/\r?\n/g, '\\n');
}

function writeEnvFile(config) {
  const lines = [
    `DISCORD_TOKEN=${sanitizeEnvValue(config.DISCORD_TOKEN)}`,
    `DISCORD_CLIENT_ID=${sanitizeEnvValue(config.DISCORD_CLIENT_ID)}`,
    `ANNOUNCE_CHANNEL_ID=${sanitizeEnvValue(config.ANNOUNCE_CHANNEL_ID)}`,
    `DASHBOARD_ADMIN_PASSWORD=${sanitizeEnvValue(config.DASHBOARD_ADMIN_PASSWORD)}`,
    `DASHBOARD_PORT=${sanitizeEnvValue(config.DASHBOARD_PORT)}`,
    '',
  ];

  fs.writeFileSync(ENV_PATH, lines.join(os.EOL), 'utf8');
  console.log('✅ Config saved to .env');
}

function runFatal(command, beforeMessage, successMessage) {
  try {
    if (beforeMessage) {
      console.log(beforeMessage);
    }
    execSync(command, { cwd: ROOT_DIR, stdio: 'inherit' });
    if (successMessage) {
      console.log(successMessage);
    }
  } catch (error) {
    console.error(`❌ Failed to run: ${command}`);
    process.exit(1);
  }
}

function ensurePm2() {
  try {
    execSync('pm2 --version', { stdio: 'pipe' });
    console.log('✅ PM2 already installed');
  } catch (error) {
    try {
      console.log('📦 Installing PM2 (process manager)...');
      execSync('npm install -g pm2', { stdio: 'inherit' });
      console.log('✅ PM2 installed');
    } catch (installError) {
      console.error('❌ Failed to install PM2 globally. Try running with a user that can install global npm packages.');
      process.exit(1);
    }
  }
}

function registerCommands() {
  console.log('📡 Registering /logprofit command with Discord...');
  try {
    execSync('node src/commands/register.js', { cwd: ROOT_DIR, stdio: 'inherit' });
    console.log('✅ Commands registered (may take up to 1 hour to appear in Discord)');
  } catch (error) {
    console.warn("⚠️  Command registration failed — you can run 'node src/commands/register.js' manually later");
  }
}

function startServicesWithPm2() {
  runFatal('pm2 start src/bot.js --name nifty-bot --update-env');
  runFatal('pm2 start src/dashboard/server.js --name nifty-dashboard --update-env');
  runFatal('pm2 save');
  console.log('✅ Bot started and dashboard started');
}

function setupPm2Startup() {
  console.log('🔄 Setting up auto-restart on reboot...');

  try {
    const output = execSync('pm2 startup', {
      cwd: ROOT_DIR,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const startupCommandLine = String(output)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => /^(sudo|env)\s+/.test(line));

    if (startupCommandLine) {
      console.log('⚡ To make the bot survive reboots, run this command:');
      console.log(startupCommandLine);
      console.log('(Copy and paste the line above, then press Enter)');
    } else {
      runFatal('pm2 save');
      console.log('✅ Auto-restart configured');
    }
  } catch (error) {
    const output = `${error.stdout || ''}\n${error.stderr || ''}`;
    const startupCommandLine = String(output)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => /^(sudo|env)\s+/.test(line));

    if (startupCommandLine) {
      console.log('⚡ To make the bot survive reboots, run this command:');
      console.log(startupCommandLine);
      console.log('(Copy and paste the line above, then press Enter)');
      return;
    }

    console.warn('⚠️  Could not complete pm2 startup automatically. You can run `pm2 startup` manually later.');
  }
}

function printDoneBanner() {
  console.log('');
  console.log('✅ All done! Your bot is running.');
  console.log('');
  console.log('Bot status:   pm2 status');
  console.log('Bot logs:     pm2 logs nifty-bot');
  console.log('Dashboard:    http://YOUR_SERVER_IP:3000 (login: admin / your-password)');
  console.log('Restart bot:  pm2 restart nifty-bot');
  console.log('');
  console.log('The /logprofit command may take up to 1 hour to appear in Discord.');
}

async function main() {
  printWelcome();
  checkNodeVersion();

  const rl = createPrompt();

  try {
    if (fs.existsSync(ENV_PATH)) {
      const overwrite = await askYesNo(rl, 'A .env config file already exists. Overwrite it? (yes/no)');
      if (!overwrite) {
        console.log('Setup cancelled. Existing .env kept.');
        rl.close();
        process.exit(0);
      }
    }

    const config = {};
    config.DISCORD_TOKEN = await askField(
      rl,
      'Discord Bot Token (from discord.com/developers → Bot → Reset Token):',
      { required: true }
    );
    config.DISCORD_CLIENT_ID = await askField(
      rl,
      'Discord Application ID (from discord.com/developers → General Information → Application ID):',
      { required: true }
    );
    config.ANNOUNCE_CHANNEL_ID = await askField(
      rl,
      'Announcement Channel ID — right-click a channel in Discord → Copy Channel ID (leave blank to set later):',
      { defaultValue: '' }
    );
    config.DASHBOARD_ADMIN_PASSWORD = await askField(
      rl,
      "Dashboard password — you'll use this to log into the admin panel:",
      { required: true }
    );
    config.DASHBOARD_PORT = await askField(rl, 'Dashboard port [3000]:', { defaultValue: '3000' });

    rl.close();

    writeEnvFile(config);
    runFatal('npm install', '📦 Installing dependencies...', '✅ Dependencies installed');
    ensurePm2();
    registerCommands();
    startServicesWithPm2();
    setupPm2Startup();
    printDoneBanner();
  } catch (error) {
    rl.close();
    console.error('❌ Setup failed unexpectedly.');
    process.exit(1);
  }
}

main();
