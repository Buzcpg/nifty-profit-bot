# Nifty Workshop Profit Bot 💰

## What This Bot Does
Nifty Workshop Profit Bot helps you track profits from your trades directly inside Discord. Instead of manually writing everything down, you can log profits with a simple command and let the bot announce them automatically in your chosen channel. It also saves everything into a CSV file (a simple spreadsheet file) so you can review your numbers later in Excel or Google Sheets.

## Before You Start — Choosing Where to Run It
This bot needs to run on a computer that stays on all the time, so it can keep working 24/7. Most people use a VPS (Virtual Private Server [a rented online computer that runs all day and night]).

### Option A: Linux VPS (Recommended)
**Pros:**
- Cheapest option
- Very reliable for always-on bots
- Uses fewer resources, so performance is smooth
- Easy to keep running with PM2 (a process manager [a tool that keeps apps alive])

**Cons:**
- Uses command line steps (copy/paste commands)
- Can feel unfamiliar at first if you have only used Windows

**Cost:** ~$4–6/month (recommend: Hetzner CX22, DigitalOcean Droplet, or Vultr)
**Best for:** Anyone comfortable following step-by-step instructions

### Option B: Windows VPS
**Pros:**
- Familiar desktop interface
- Can use Remote Desktop just like a normal Windows PC

**Cons:**
- More expensive
- Overkill for a small bot

**Cost:** ~$12–20/month
**Best for:** People who really want a familiar Windows desktop

**Our recommendation:** Go with Linux. It's cheaper and this guide makes it easy.

---

## Step 1: Get a VPS

### Linux (Recommended)
1. Go to https://hetzner.com (cheapest) or https://digitalocean.com
2. Create an account
3. Create a new server:
   - Choose Ubuntu 22.04 (or Ubuntu 24.04)
   - Choose the smallest plan (1 CPU, 2GB RAM — the bot uses barely any)
   - Choose a server location close to you
   - Add your SSH key (Secure Shell key [a digital key that lets you log in securely]) OR tick "Password" login
4. Note down the server's IP address (looks like: 123.45.67.89)
5. Connect to it:
   - **Mac/Linux:** open Terminal
   - **Windows:** install PuTTY from https://putty.org and open it
   - Run: `ssh root@YOUR_IP_ADDRESS`

### Windows
1. Go to https://vultr.com or https://digitalocean.com
2. Create an account
3. Create a new server:
   - Choose Windows Server 2022
   - Choose the smallest Windows plan
4. Connect via Remote Desktop (built into Windows — search "Remote Desktop Connection")

---

## Step 2: Set Up Your Discord Bot

Follow these carefully — you only need to do this once.

1. Go to https://discord.com/developers/applications and log in
2. Click "New Application" and give it a name (example: "Nifty Workshop Bot")
3. Click "Bot" in the left sidebar
4. Click "Reset Token", then copy the token and save it somewhere safe (this is your `DISCORD_TOKEN`)
5. Scroll down and turn ON:
   - Message Content Intent
   - Server Members Intent
6. Click "OAuth2" in the left sidebar, then "General"
7. Copy the "Client ID" and save it (this is your `DISCORD_CLIENT_ID`)
8. Add the bot to your Discord server:
   - Go to OAuth2 -> URL Generator
   - Tick `bot` and `applications.commands`
   - Tick permissions: `Send Messages`, `Read Messages/View Channels`, `Embed Links`
   - Copy the generated URL
   - Open it in your browser and select your server

---

## Step 3: Install the Bot

### The Easy Way (Recommended)
After cloning the repo, just run:

```bash
node setup.js
```

This handles everything — config, dependencies, PM2, and bot startup — in one go.

### Manual Installation

### Linux
Run these commands one by one. Copy and paste each line:

```bash
# Update your server
sudo apt update && sudo apt upgrade -y

# Install Node.js (the engine the bot runs on)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Check it installed correctly (should show v22.x.x)
node --version

# Install git (a tool for downloading code)
sudo apt install -y git

# Download the bot
git clone https://github.com/Buzcpg/nifty-profit-bot.git
cd nifty-profit-bot

# Install the bot's dependencies
npm install

# Install PM2 (keeps the bot running 24/7, restarts it if it crashes)
sudo npm install -g pm2
```

### Windows
1. Download and install Node.js from https://nodejs.org (click the LTS version)
2. Download and install Git from https://git-scm.com/download/win
3. Open Command Prompt (search "cmd" in Start menu)
4. Run:

```bash
git clone https://github.com/Buzcpg/nifty-profit-bot.git
cd nifty-profit-bot
npm install
```

---

## Step 4: Configure the Bot

1. In the bot folder, copy the example config file:
   - Linux: `cp .env.example .env`
   - Windows: `copy .env.example .env`
2. Open the `.env` file in a text editor:
   - Linux: `nano .env`
   - Windows: `notepad .env`
3. Fill in your details:

```env
DISCORD_TOKEN=paste-your-bot-token-here
DISCORD_CLIENT_ID=paste-your-client-id-here
DASHBOARD_ADMIN_PASSWORD=choose-a-password-for-the-dashboard
```

4. Save and close the file

---

## Step 5: Register the /logprofit Command

This tells Discord your bot has a `/logprofit` command. You only need to do this once:

```bash
node src/commands/register.js
```

It may take up to an hour for the command to appear in Discord (this is Discord's limit, not the bot).

---

## Step 6: Start the Bot

### Linux (runs 24/7, survives reboots)

```bash
pm2 start src/bot.js --name "nifty-bot"
pm2 startup   # follow the instructions it prints
pm2 save
```

### Windows

```bash
node src/bot.js
```

Keep that Command Prompt window open. To run 24/7 on Windows, use Task Scheduler or NSSM (Non-Sucking Service Manager [a tool that runs apps in the background]).

---

## Step 7: Set Up the Announcement Channel

1. Start the dashboard:

```bash
node src/dashboard/server.js
```

2. Open `http://YOUR_SERVER_IP:3000` in your browser
3. Log in with username `admin` and the password you set in `.env`
4. Paste the Discord channel ID where profits should be announced
   - To get a channel ID: right-click the channel in Discord -> "Copy Channel ID"
   - If you do not see that option, enable Developer Mode in Discord Settings -> Advanced

---

## Using the Bot

**In Discord:**

```text
/logprofit currency:USD amount:600 collection:Bored Ape share:Yes
```

**The bot will post in your channel:**

```text
Profit Logged! 💰
User          @shabs
Collection    Bored Ape
Profit        600 USD
Converted     $600.00 USD

Brought to you by Nifty Workshop
```

---

## Your Data

All profits are saved in a spreadsheet-friendly CSV file:
- **Linux:** `~/.openclaw/nifty-profit-bot/profits.csv`
- **Windows:** `C:\Users\YOUR_USERNAME\.openclaw\nifty-profit-bot\profits.csv`

Open it in Excel or Google Sheets any time to review all logged profits.

---

## Keeping It Running / Maintenance

- **Restart the bot:** `pm2 restart nifty-bot`
- **View logs:** `pm2 logs nifty-bot`
- **Stop the bot:** `pm2 stop nifty-bot`
- **Update to latest version:** `git pull && npm install && pm2 restart nifty-bot`

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Bot is offline in Discord | Check it is running: `pm2 status` |
| /logprofit command does not appear | Wait up to 1 hour after running `register.js` |
| Cannot connect to dashboard | Make sure port 3000 is open: `sudo ufw allow 3000` |
| Bot crashes on startup | Check logs: `pm2 logs nifty-bot` — usually a missing `.env` value |

---

## Cost Summary

| Option | Monthly Cost | Effort |
|---|---|---|
| Linux VPS (Hetzner) | ~£4/month | Low — runs itself with PM2 |
| Windows VPS | ~£15/month | Medium — more setup |
| Running on your own PC | Free | High — PC must stay on 24/7 |

**Recommended:** Hetzner CX22 Linux (~£4/month). Set it up once, forget about it.
