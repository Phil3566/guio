const Database = require("better-sqlite3");
const path = require("path");
const { normalize } = require("../lib/normalize");

const DB_PATH = path.join(__dirname, "faq.db");
const DEVICE_ID = "pastigio-frameo-frame";

const faqs = [
  // ===== SETUP & GETTING STARTED =====
  {
    question: "I just got this as a gift, what do I do?",
    answer: "Welcome to your new picture frame! Here's how to get started:\n\n1. **Plug it in** using the included power cord\n2. **Choose your language** on the first screen\n3. **Connect to WiFi** — tap your network name and enter the password\n4. **Set your name** and where the frame is (like \"Mom's Kitchen\")\n5. **Tap \"Add friend\"** — a code will appear. Call or text that code to a family member so they can send you photos!\n\nYour family member downloads the free **Frameo** app on their phone, enters the code, and can start sending you photos right away."
  },
  {
    question: "How do I set up the frame for the first time?",
    answer: "Here's the first-time setup:\n\n1. **Plug in** the frame and wait for it to turn on\n2. **Select your language**\n3. **Connect to WiFi** — pick your network and enter the password (must be 2.4GHz, not 5GHz)\n4. If it asks to **update the software**, tap Yes and wait — this can take a few minutes\n5. **Enter your name** and location (like \"Grandma's living room\")\n\nAfter setup, tap the screen and tap **\"Add friend\"** to get a code. Share that code with a family member so they can send you photos!"
  },
  {
    question: "How do I connect to WiFi?",
    answer: "Here's how to connect your frame to WiFi:\n\n1. During setup (or in **Settings → WiFi**), you'll see a list of networks\n2. Tap your WiFi network name\n3. Type in your WiFi password — use the **eye icon** to check your typing\n4. Tap **Connect**\n\n**Important:** Your frame only works with **2.4GHz WiFi**. Think of it like AM/FM radio — your router sends out two signals, and the frame can only pick up the slower one (2.4GHz). If you don't see your network, you may need to ask your internet provider to set up a separate 2.4GHz name."
  },
  {
    question: "My frame won't connect to WiFi",
    answer: "I'm sorry you're having trouble — this is the most common issue and it's almost always fixable.\n\n1. **Check the signal type:** Your frame only works with 2.4GHz WiFi (think of it like AM radio — the frame can't pick up FM). If you see your WiFi name listed twice, tap the one **without** \"5G\" at the end.\n2. **Double-check the password:** Tap the eye icon to see what you're typing. Passwords are case-sensitive.\n3. **Restart both devices:** Unplug your frame for a minute, and restart the box with blinking lights (your router).\n4. **Still stuck?** Call your internet company and say: *\"I need a separate 2.4GHz network for a smart home device.\"* They do this all the time.\n\nYou're not doing anything wrong — this trips up almost everyone!"
  },
  {
    question: "What is 2.4GHz WiFi?",
    answer: "Great question! Think of it like an AM/FM radio — your router sends out two different WiFi signals, and your frame can only pick up one of them.\n\nThe one your frame needs is called **2.4GHz**. Most home routers send out both signals, so you probably have it already. The trick is making sure your frame connects to the right one.\n\n**Quick check:** If you see your WiFi name listed twice — one normal and one with \"5G\" at the end — tap the one **without** 5G. That's the one your frame needs.\n\nIf you only see one network name, you may need to ask your internet provider to set up a separate one for your frame. Just call them and say: *\"I need a separate 2.4GHz network for a smart home device.\"* They do this all the time."
  },
  {
    question: "How do I set the time and date?",
    answer: "The frame sets the time automatically when connected to WiFi.\n\nIf the time is wrong:\n1. Tap the screen once to open the menu\n2. Tap **Settings** (the gear icon)\n3. Look for **Date & Time**\n4. Make sure \"Automatic\" is turned on\n\n**Note:** If you lost power (like during a storm), the clock resets because the frame has no internal battery. Just reconnect to WiFi and the time will fix itself."
  },
  {
    question: "The frame is asking me to update software, what should I do?",
    answer: "**Go ahead and tap Update!** Software updates fix bugs and add new features.\n\n1. Make sure the frame is plugged in (don't unplug during the update)\n2. Tap **Update** or **Install**\n3. Wait patiently — it may take 5-10 minutes\n4. The frame will restart on its own when done\n\n**Important:** Don't unplug the frame during an update. If the power goes out during an update, don't worry — just plug it back in and it should recover."
  },
  {
    question: "How do I change the name and location on my frame?",
    answer: "To change your name or location:\n\n1. Tap the screen once to open the menu\n2. Tap **Settings** (the gear icon)\n3. Look for **My frame** or **Frame name**\n4. Change your name and location to whatever you like\n\nThis name shows up in the Frameo app so your family members know which frame is yours (handy if the family has multiple frames)."
  },

  // ===== FRIEND CODES & FAMILY =====
  {
    question: "How do I add a family member?",
    answer: "Here's how to add a family member so they can send you photos:\n\n1. Tap the screen once to open the menu\n2. Tap **\"Add friend\"** (the little person icon with a + sign)\n3. A **code** will appear on your screen\n4. **Call or text** that code to your family member\n5. They download the free **Frameo** app on their phone and enter the code\n\nThat's it! Once they're connected, they can send you photos anytime from anywhere in the world."
  },
  {
    question: "How does my daughter send me photos?",
    answer: "Your daughter (or any family member) needs to do two things:\n\n1. **Download the free Frameo app** on her phone (available on iPhone and Android)\n2. **Enter the code** from your frame\n\nTo get the code: tap your frame's screen, then tap **\"Add friend\"** — a code appears. Call or text it to her.\n\nOnce connected, she opens the Frameo app, picks a photo, and taps **Send**. The photo appears on your frame within seconds!"
  },
  {
    question: "What is a friend code?",
    answer: "A friend code is a temporary password that connects a family member's phone to your frame.\n\n**How it works:**\n1. Your frame shows a code (like \"ABC-123\")\n2. You share that code with a family member\n3. They enter it in the Frameo app on their phone\n4. They're permanently connected and can send photos anytime!\n\nThe code is valid for **12 hours**. If it expires before someone uses it, just tap \"Add friend\" again to get a new one. There's no limit to how many codes you can create."
  },
  {
    question: "The friend code expired, what do I do?",
    answer: "No problem! Just create a new code:\n\n1. Tap the screen once to open the menu\n2. Tap **\"Add friend\"** (person icon with + sign)\n3. A fresh code appears — it's good for **12 hours**\n4. Share it with your family member right away\n\nCodes expire after 12 hours for security, but you can make as many new ones as you need. There's no limit!"
  },
  {
    question: "How do I download the Frameo app?",
    answer: "The Frameo app is for your **family members' phones** (not for the frame itself). Here's how they get it:\n\n**On iPhone:** Open the App Store, search for **\"Frameo\"**, and tap Download (it's free)\n\n**On Android:** Open the Google Play Store, search for **\"Frameo\"**, and tap Install (it's free)\n\nAfter downloading, they open the app, tap the **+** button, and enter the code from your frame. Then they can send you photos!"
  },
  {
    question: "Can multiple family members send me photos?",
    answer: "Yes! You can add as many family members as you want.\n\nFor each person:\n1. Tap the screen → tap **\"Add friend\"** → a new code appears\n2. Share that code with the next family member\n3. They download the Frameo app and enter the code\n\nEach person gets their **own code** — you create a new one for each family member. There's no limit to how many people you can add!"
  },
  {
    question: "How do I remove someone from my frame?",
    answer: "To remove a friend from your frame:\n\n1. Tap the screen once to open the menu\n2. Tap **Settings** (gear icon)\n3. Look for **My friends** or **Friends**\n4. Find the person you want to remove\n5. Tap the **delete** or **remove** option next to their name\n\nOnce removed, they won't be able to send you photos anymore. If you change your mind later, you can always add them back with a new friend code."
  },

  // ===== PHOTO MANAGEMENT =====
  {
    question: "Why are my photos cut off?",
    answer: "This is because of the **Fill** setting. Your frame's screen is a different shape than most phone photos, so it has to adjust.\n\n**Fill** = the photo fills the whole screen, but the edges get trimmed\n**Fit** = you see the whole photo, but there may be bars on the sides\n\nTo change it for a photo:\n1. Tap the screen once\n2. Tap **Adjust**\n3. Switch between **Fill** and **Fit**\n\n**Tip:** Landscape (sideways) photos usually look best on this frame!"
  },
  {
    question: "What is Fill vs Fit?",
    answer: "These are two ways your frame can display photos:\n\n**Fill** (default) = The photo fills every inch of the screen. Looks great, but the edges of the photo may get trimmed off — heads or important details can get cut.\n\n**Fit** = You see the entire photo with nothing cut off. But you may see black or blurred bars on the sides.\n\nTo switch: tap the screen → tap **Adjust** → choose Fill or Fit.\n\n**Tip:** Landscape photos (wider than tall) usually look best with Fill. Portrait photos (taller than wide) often look better with Fit."
  },
  {
    question: "How do I delete a photo?",
    answer: "To delete a photo from your frame:\n\n1. Swipe left or right to find the photo you want to delete\n2. Tap the screen once to open the menu\n3. Tap the **trash can icon**\n4. Confirm that you want to delete it\n\n**Warning:** Deleting is permanent — the photo is gone from the frame. If you just want to remove it from the slideshow but keep it stored, use **Hide** instead (the eye icon)."
  },
  {
    question: "How do I hide a photo?",
    answer: "Hiding a photo removes it from your slideshow without deleting it:\n\n1. Navigate to the photo you want to hide\n2. Tap the screen once to open the menu\n3. Tap the **hide icon** (looks like an eye)\n\nThe photo is now hidden from the slideshow but still stored on your frame. You can unhide it later from **My Photos**.\n\n**This is different from deleting!** Delete removes the photo permanently. Hide just takes it out of the rotation."
  },
  {
    question: "How do I adjust how a photo looks on the frame?",
    answer: "To reposition or adjust a photo:\n\n1. Navigate to the photo\n2. Tap the screen once to open the menu\n3. Tap **Adjust**\n4. You can:\n   - **Drag** the photo to reposition it\n   - Switch between **Fill** (full screen, edges trimmed) and **Fit** (whole photo, bars on sides)\n5. Tap **Save** when you're happy\n\n**Tip:** If someone's head is getting cut off, drag the photo up to show more of the top."
  },
  {
    question: "How do I change the slideshow order?",
    answer: "To change what order photos appear:\n\n1. Tap the screen once to open the menu\n2. Tap **Settings** (gear icon)\n3. Tap **Slideshow**\n4. Look for **Photo display order** — you can choose:\n   - **Date received** (newest first)\n   - **Date taken** (by the date the photo was originally taken)\n   - **Shuffle** (random order)\n\nYou can also choose **Newest first** or **Oldest first**."
  },
  {
    question: "How do I create an album?",
    answer: "To create an album:\n\n1. Tap the screen once to open the menu\n2. Tap **My Photos**\n3. Tap **My Albums**\n4. Tap the **+** button to create a new album\n5. Give it a name (like \"Grandkids\" or \"Vacation\")\n\nTo add photos to an album: navigate to a photo, tap the screen, and tap the **\"Add to album\"** icon.\n\n**Good to know:** Deleting an album does NOT delete the photos in it — they're still on your frame."
  },
  {
    question: "How do I select multiple photos?",
    answer: "To select multiple photos at once:\n\n1. Tap the screen to open the menu\n2. Go to **My Photos**\n3. **Tap and hold** on the first photo\n4. Then tap additional photos to select them\n5. Now you can delete, hide, or add them all to an album at once\n\nThis is much faster than doing one photo at a time!"
  },

  // ===== DISPLAY & SLEEP =====
  {
    question: "How do I turn off the frame at night?",
    answer: "You have two options:\n\n**Option 1: Sleep schedule (recommended)**\n1. Tap the screen → Settings → Display\n2. Turn on **Sleep schedule**\n3. Set when to turn off (e.g., 11:00 PM) and turn on (e.g., 7:00 AM)\n4. The frame will follow this schedule every day automatically!\n\n**Option 2: Manual**\nTap the screen → tap the **Power icon** → tap the **Moon icon** for sleep mode.\n\n**Tip:** Even in sleep mode, the frame still receives photos — they'll be waiting when it wakes up!"
  },
  {
    question: "How do I change the brightness?",
    answer: "To adjust the brightness:\n\n1. Tap the screen once to open the menu\n2. Tap **Settings** (gear icon)\n3. Tap **Display**\n4. Drag the **Brightness** slider left (dimmer) or right (brighter)\n\n**Note:** The frame screen won't be as vivid as your phone or tablet — that's normal for digital picture frames. For the best look, keep it out of direct sunlight and set brightness to maximum."
  },
  {
    question: "How do I set a sleep schedule?",
    answer: "A sleep schedule turns your frame off and on automatically each day:\n\n1. Tap the screen → tap **Settings** (gear icon)\n2. Tap **Display**\n3. Find **Sleep schedule** and turn it on\n4. Set the **off time** (e.g., 11:00 PM)\n5. Set the **on time** (e.g., 7:00 AM)\n\nThe default is off at 11 PM, on at 7 AM. Your frame still receives photos while sleeping — they'll show up when it wakes!"
  },
  {
    question: "How do I change the slideshow speed?",
    answer: "To change how long each photo stays on screen:\n\n1. Tap the screen once to open the menu\n2. Tap **Settings** (gear icon)\n3. Tap **Slideshow**\n4. Look for **Timer** or **Display interval**\n5. Choose how many seconds or minutes each photo shows\n\nShorter times mean photos change more often. Longer times let you enjoy each photo more."
  },
  {
    question: "How do I power off the frame completely?",
    answer: "To fully power off:\n\n1. Tap the screen once to open the menu\n2. Tap the **Power icon** (top right area)\n3. Tap **Power off**\n\nTo turn it back on, press the **power button on the back** of the frame.\n\n**Tip:** You usually don't need to fully power off — a **sleep schedule** is easier (Settings → Display → Sleep schedule). The frame uses very little power in sleep mode."
  },

  // ===== SUBSCRIPTION / FRAMEO+ =====
  {
    question: "Do I need a subscription to use my frame?",
    answer: "**No! Your frame works perfectly without any subscription.**\n\nEverything important is free:\n- Receiving photos from family\n- Viewing your slideshow\n- Sleep schedule\n- Backing up to an SD card\n\nThe optional **Frameo+** subscription ($1.99/month) adds extras like sending 100 photos at once (instead of 10), longer videos, and cloud backup. But these are nice-to-haves, not must-haves.\n\n**Tip:** If you want to load lots of photos at once without a subscription, use an SD card — you can load hundreds at a time!"
  },
  {
    question: "What is Frameo Plus?",
    answer: "**Frameo+** is an optional paid subscription. Here's what you get:\n\n**Free (without subscription):**\n- Receive unlimited photos\n- Slideshow, sleep schedule\n- Send up to 10 photos at a time from the app\n- 15-second videos\n- SD card backup\n\n**Frameo+ ($1.99/month or $16.99/year):**\n- Send up to 100 photos at once\n- Longer videos\n- Cloud backup\n- Manage photos on the frame from your phone\n\n**Bottom line:** Your frame works great without it. The subscription is nice but not necessary."
  },
  {
    question: "What is the 10 photo limit?",
    answer: "Without a Frameo+ subscription, the Frameo app lets you send **up to 10 photos at a time** to a frame.\n\nThis doesn't mean you can only have 10 photos! It just means you send them in batches:\n- Select 10 photos → Send\n- Select 10 more → Send\n- Repeat as many times as you want\n\n**Workaround:** To load lots of photos at once, use an **SD card**. Copy photos to the card from a computer, insert it into the frame, and tap Import. No limit, no subscription needed!"
  },
  {
    question: "How do I send more than 10 photos at once?",
    answer: "There are two ways:\n\n**Option 1: Send in batches (free)**\nIn the Frameo app, select 10 photos and send. Then select 10 more and send again. Repeat until done!\n\n**Option 2: Use an SD card (free, best for lots of photos)**\n1. Copy photos from your computer to an SD card (must be FAT32 format, max 32GB)\n2. Insert the SD card into the frame\n3. Tap **Import**\n4. Choose which photos to add — no limit!\n\n**Option 3: Frameo+ subscription ($1.99/month)**\nLets you send up to 100 photos at once from the app."
  },
  {
    question: "What is the difference between free and paid features?",
    answer: "**Free (no subscription needed):**\n- Receive unlimited photos from family\n- Full slideshow with all settings\n- Sleep schedule\n- Brightness and display controls\n- SD card backup\n- Send up to 10 photos at a time from the app\n- Videos up to 15 seconds\n\n**Paid — Frameo+ ($1.99/month or $16.99/year):**\n- Send up to 100 photos at once\n- Longer videos\n- Cloud backup\n- Manage frame photos remotely from app\n\n**Your frame works fully without paying anything.** The 10-photo limit just means sending in batches."
  },
  {
    question: "Is the Frameo subscription worth it?",
    answer: "For most people, **no — the free version is all you need.**\n\nThe main reason to subscribe is if you want to:\n- Send more than 10 photos at once (though you can send in batches for free)\n- Send longer videos\n- Back up to the cloud\n- Manage the frame remotely from your phone\n\n**Free workaround for bulk photos:** Use an SD card to load hundreds of photos at once — no subscription needed.\n\nIf you're sending a few photos here and there from the app, the free version works great."
  },

  // ===== TROUBLESHOOTING =====
  {
    question: "My frame won't turn on",
    answer: "Try these steps in order:\n\n1. **Check the power cord** — make sure both ends are plugged in firmly\n2. **Try a different outlet** — the outlet might be the problem\n3. **Unplug the frame** for 5 minutes, then plug it back in\n4. **Hold the power button** on the back of the frame for 10 seconds\n\nIf none of these work, try a different power cord if you have one.\n\n**Still nothing?** This may be a hardware problem. Contact the seller through your Amazon order for a warranty replacement."
  },
  {
    question: "My frame is frozen and not responding",
    answer: "Here's how to fix a frozen frame:\n\n1. **Hold the power button** on the back for 10 seconds until it shuts off\n2. **Unplug** the frame for 5 minutes\n3. **Plug it back in** and wait for it to restart\n\nIf it keeps freezing:\n- Check if there's a software update available (Settings → About → Check for updates)\n- As a last resort, you can do a **factory reset** — but this deletes everything (see \"How do I factory reset\" for details)"
  },
  {
    question: "My WiFi keeps disconnecting",
    answer: "That's frustrating — but this is a common issue and usually fixable.\n\n1. **Restart the frame:** Unplug it for a minute, then plug it back in\n2. **Restart your router** (the box with blinking lights from your internet company) — unplug it for 30 seconds, plug it back in\n3. **Check the signal:** Make sure the frame is connected to **2.4GHz WiFi**, not 5GHz\n4. **Move the frame closer** to the router if possible — walls and distance weaken the signal\n\nIf it drops every few days even after restarting, the WiFi chip inside the frame may be faulty. Contact the seller through your Amazon order for a warranty replacement."
  },
  {
    question: "Photos are not showing up on my frame",
    answer: "If photos from family aren't appearing:\n\n1. **Check WiFi** — tap the screen and look for the WiFi icon. If there's no connection, reconnect to WiFi\n2. **Check if the frame is online** — in the Frameo app, the frame should show as \"Online\"\n3. **Restart the frame** — hold power button, turn off, unplug for a minute, plug back in\n4. **Ask the sender to resend** — sometimes photos get stuck\n\nIf the frame is connected to WiFi but still not receiving photos, restart your router too."
  },
  {
    question: "The touch screen is not working",
    answer: "Try these fixes:\n\n1. **Peel off the screen protector** if there is one — it can block touch\n2. **Clean the screen** with a soft, dry cloth\n3. **Restart the frame** — hold the power button for 10 seconds\n\n**If only part of the screen doesn't respond** (especially the top), this is a known manufacturing issue. Try **rotating the frame upside-down** to access the menus from the working area, then contact the seller for a replacement.\n\nIf the entire screen doesn't respond to touch, try a factory reset using the reset hole on the back (use a toothpick — but this deletes everything)."
  },
  {
    question: "What does the power warning mean?",
    answer: "If you see a warning about not unplugging the frame — **don't worry!**\n\nThis warning sounds scary but it just means: **use the power button to shut down instead of yanking the cord.** It's like how you should shut down a computer properly.\n\n**What if the power goes out in a storm?** Your photos are completely safe! The worst that happens is the clock resets. Just reconnect to WiFi and the time will fix itself.\n\nThe only time unplugging is risky is during a **software update** — so try not to unplug during those."
  },
  {
    question: "How do I factory reset my frame?",
    answer: "**Warning: A factory reset deletes EVERYTHING — all photos, settings, and friend connections!**\n\nOnly do this as a last resort:\n\n1. Find the **small reset hole** on the back of the frame\n2. Use a **toothpick or paperclip** to press the button inside\n3. Hold it for **5 seconds**\n4. The frame will restart and go back to the first-time setup\n\nAfter a reset, you'll need to set up WiFi again, and all family members will need to reconnect with new friend codes.\n\n**Back up first** if possible: Settings → Backup → Backup to external storage (you'll need an SD card)."
  },
  {
    question: "The clock or time is wrong on my frame",
    answer: "The frame doesn't have an internal battery, so the clock resets after any power loss.\n\n**To fix it:**\n1. Make sure the frame is **connected to WiFi** — it sets the time automatically from the internet\n2. If it's still wrong: tap the screen → **Settings** → **Date & Time** → make sure \"Automatic\" is on\n3. If automatic doesn't work, you can set the time manually in the same menu\n\n**Note:** After a power outage, just reconnect to WiFi and the time should correct itself."
  },
  {
    question: "My screen is flickering",
    answer: "Screen flickering can have a few causes:\n\n1. **Lower the brightness** — Settings → Display → drag brightness down a bit\n2. **Restart the frame** — hold power button for 10 seconds, then turn back on\n3. **Check for updates** — Settings → About → Check for updates\n\nIf flickering continues after trying these steps, this may be a hardware issue (the backlight may be failing). Contact the seller through your Amazon order for a warranty replacement."
  },
  {
    question: "What is error 1002?",
    answer: "Error 1002 usually means a connection or startup problem.\n\n**Try this:**\n1. **Unplug** the frame for 5 minutes\n2. **Plug it back in** and see if it starts normally\n3. If the error returns, try a **factory reset** (use a toothpick in the reset hole on the back, hold 5 seconds)\n\n**\"Waiting for License Key\" error?** This is a different issue that can't be fixed by resetting. Contact the seller for a replacement."
  },

  // ===== VIDEOS & SOUND =====
  {
    question: "How do I stop videos from playing sound?",
    answer: "To mute video sound:\n\n1. Tap the screen once to open the menu\n2. Tap **Settings** (gear icon)\n3. Tap **Slideshow**\n4. Look for **Video volume** or **Mute videos**\n5. Turn the volume to **Mute** or **Off**\n\nThis stops videos from playing sound during the slideshow. You can also set a **sleep schedule** (Settings → Display) so the frame is quiet at night."
  },
  {
    question: "How do I mute the frame?",
    answer: "To mute all sounds:\n\n1. Tap the screen once to open the menu\n2. Tap **Settings** (gear icon)\n3. Tap **Slideshow**\n4. Set **Video volume** to **Mute**\n\nThis prevents videos from playing sound during the slideshow. The frame itself doesn't make other sounds besides video audio.\n\n**Tip:** If videos with voices are startling you at night, also set up a **sleep schedule** (Settings → Display) so the frame turns off automatically at bedtime."
  },
  {
    question: "Videos are scaring me at night",
    answer: "This happens because videos in your slideshow play with sound automatically. Here are two fixes:\n\n**Fix 1: Mute videos**\nSettings → Slideshow → Video volume → Mute\n\n**Fix 2: Set a sleep schedule (recommended)**\nSettings → Display → Sleep schedule → turn it on. Set it to turn off at 10 or 11 PM and back on at 7 AM.\n\nWith a sleep schedule, the frame goes dark and silent at bedtime and wakes up in the morning. No more surprise voices at night!"
  },
  {
    question: "How long can videos be?",
    answer: "It depends on whether you have the Frameo+ subscription:\n\n- **Free:** Videos up to **15 seconds**\n- **Frameo+ ($1.99/month):** Longer videos\n\nVideos are sent through the Frameo app, just like photos. The sender selects a video from their phone, and it appears on your frame.\n\n**Tip:** Short video clips (under 15 seconds) of grandkids waving or saying hello work perfectly with the free version!"
  },

  // ===== LOADING PHOTOS WITHOUT APP =====
  {
    question: "Can I use an SD card to load photos?",
    answer: "Yes! An SD card is the easiest way to load lots of photos at once:\n\n1. **Copy photos** from your computer to an SD card\n2. **Insert the card** into the SD card slot on your frame\n3. Tap **Import** when prompted\n4. Choose which photos to add\n\n**Important:**\n- The SD card must be **FAT32 format** (most new cards already are)\n- Maximum **32GB** card size\n- This is the best way to load hundreds of photos without a subscription!"
  },
  {
    question: "Can I load photos from my computer?",
    answer: "Yes, but it depends on your computer:\n\n**Windows or Linux:** You can connect a USB cable from the frame to your computer and transfer photos directly.\n\n**Mac:** USB transfer does **NOT** work with Mac. Instead:\n- Use the **Frameo phone app** to send photos from your iPhone\n- Or copy photos to an **SD card**, insert it into the frame, and tap Import\n\n**Easiest method for any computer:** Copy photos to an SD card (FAT32 format, max 32GB), put it in the frame, and tap Import."
  },
  {
    question: "Does USB transfer work with Mac?",
    answer: "**No, unfortunately USB transfer from a Mac is not supported.** The frame only recognizes USB connections from Windows and Linux computers.\n\n**Alternatives for Mac users:**\n1. **Frameo app** — download the free app on your iPhone, send photos from there\n2. **SD card** — copy photos to an SD card (FAT32 format, max 32GB), insert into the frame, tap Import\n\nThe SD card method is actually the fastest way to load lots of photos regardless of what computer you have."
  },
  {
    question: "How do I load lots of photos at once?",
    answer: "The fastest way is with an **SD card**:\n\n1. Insert the SD card into your computer\n2. Copy all the photos you want onto the card\n3. Eject the card safely from your computer\n4. Insert it into the frame's SD card slot\n5. Tap **Import** and select the photos to add\n\nYou can load **hundreds or thousands** of photos this way — no subscription needed!\n\n**SD card requirements:** FAT32 format, maximum 32GB. Most new SD cards from the store are already FAT32.\n\nAlternatively, family members can send photos in batches of 10 through the free Frameo app."
  },
  {
    question: "What format does the SD card need to be?",
    answer: "The SD card must be **FAT32 format** and no larger than **32GB**.\n\n**What is FAT32?** It's a way of organizing files on the card. Most new SD cards you buy from the store are already FAT32, so you probably don't need to do anything.\n\n**If the frame doesn't recognize your card:**\n- It might be formatted differently (like exFAT or NTFS)\n- Ask a tech-savvy family member to reformat it as FAT32\n- Or buy a new 32GB SD card — they're inexpensive\n\n**Note:** Your frame uses a **microSD** card slot. If your card is full-size, you'll need an adapter."
  },

  // ===== GENERAL =====
  {
    question: "Where do I get help or customer support?",
    answer: "Here's where to get help:\n\n**For software questions (Frameo app, settings, features):**\n- Visit **support.frameo.com**\n- Frameo YouTube tutorials are also helpful\n\n**For hardware problems (screen broken, won't turn on, frame is dead):**\n- Contact the **seller through your Amazon order** — they handle warranty replacements\n- Frameo only makes the software, not the physical frame\n\n**Note:** Pastigio (the frame manufacturer) can be hard to reach. Your best bet for hardware issues is contacting the seller directly through Amazon."
  },
  {
    question: "Does the frame work without WiFi?",
    answer: "**Yes — once photos are loaded, your frame works perfectly without WiFi!**\n\nWiFi is only needed to:\n- Receive new photos from the Frameo app\n- Download software updates\n- Set the clock automatically\n\nPhotos already on the frame will continue to play in the slideshow even if WiFi disconnects. You can also load photos via **SD card** without any WiFi at all.\n\n**Tip:** If you're placing the frame somewhere without WiFi (like a cabin), load all the photos via SD card first."
  },

  // ===== COMMON VARIANT PHRASINGS =====
  {
    question: "How do I get photos on my frame?",
    answer: "There are three ways to get photos on your frame:\n\n**1. Frameo app (most common)**\nA family member downloads the free Frameo app, connects with a friend code from your frame, and sends photos from their phone.\n\n**2. SD card**\nCopy photos from a computer to an SD card (FAT32, max 32GB), insert into the frame, tap Import.\n\n**3. USB cable (Windows/Linux only)**\nConnect the frame to a computer with a USB cable and transfer photos directly. Note: does NOT work with Mac.\n\nMost families use the app — it lets people send photos from anywhere in the world!"
  },
  {
    question: "How do I turn off the frame?",
    answer: "You have a few options:\n\n**Sleep mode (quick):** Tap the screen → tap the **Power icon** → tap the **Moon icon**\n\n**Power off (full shutdown):** Tap the screen → tap the **Power icon** → tap **Power off**\n\n**Sleep schedule (set it and forget it):** Settings → Display → Sleep schedule. Set it to turn off at 11 PM and on at 7 AM (or whatever times you prefer).\n\n**Tip:** A sleep schedule is the easiest option — the frame turns off and on automatically every day. It still receives photos while sleeping!"
  },
  {
    question: "Is it safe to unplug the frame?",
    answer: "**Yes, unplugging is safe!** Your photos won't be lost.\n\nThe only time you should avoid unplugging is during a **software update** (you'll see a progress bar on screen).\n\nIf you lose power during a storm, don't worry — your photos are safe. The only thing that resets is the clock, and that fixes itself when you reconnect to WiFi.\n\n**Best practice:** Use the on-screen power button or a sleep schedule instead of unplugging. But if the power goes out, everything will be fine."
  },
  {
    question: "How do I back up my photos?",
    answer: "The easiest way to back up is with an **SD card**:\n\n1. Insert an SD card into the frame (FAT32 format, max 32GB)\n2. Tap the screen → **Settings**\n3. Look for **Backup**\n4. Tap **Backup to external storage**\n\nThe frame can also do **automatic backups** — it will back up within 30 hours of any changes if an SD card is inserted.\n\n**Cloud backup** is available with a Frameo+ subscription ($1.99/month), but the SD card method is free and works great."
  },
  {
    question: "Can my family see what photos are on my frame?",
    answer: "**Without Frameo+ subscription:** No. Family members can **send** photos to your frame, but they can't see what's on it or manage the photos remotely.\n\n**With Frameo+ ($1.99/month):** Yes. The subscription adds remote photo management, so family members can see and manage photos on your frame from the app.\n\nFor most families, this isn't needed — they send photos and trust that they'll show up on the frame!"
  },

  // ===== ADDITIONAL VARIANT PHRASINGS (improve cache hit rate) =====
  {
    question: "Is a subscription required?",
    answer: "**No! Your frame works perfectly without any subscription.**\n\nEverything important is free:\n- Receiving photos from family\n- Viewing your slideshow\n- Sleep schedule\n- Backing up to an SD card\n\nThe optional **Frameo+** subscription ($1.99/month) adds extras like sending 100 photos at once (instead of 10), longer videos, and cloud backup. But these are nice-to-haves, not must-haves.\n\n**Tip:** If you want to load lots of photos at once without a subscription, use an SD card — you can load hundreds at a time!"
  },
  {
    question: "How do I set up WiFi?",
    answer: "Here's how to connect your frame to WiFi:\n\n1. During setup (or in **Settings → WiFi**), you'll see a list of networks\n2. Tap your WiFi network name\n3. Type in your WiFi password — use the **eye icon** to check your typing\n4. Tap **Connect**\n\n**Important:** Your frame only works with **2.4GHz WiFi**. Think of it like AM/FM radio — your router sends out two signals, and the frame can only pick up the slower one (2.4GHz). If you don't see your network, you may need to ask your internet provider to set up a separate 2.4GHz name."
  },
  {
    question: "Can I transfer photos from a Mac?",
    answer: "**No, unfortunately USB transfer from a Mac is not supported.** The frame only recognizes USB connections from Windows and Linux computers.\n\n**Alternatives for Mac users:**\n1. **Frameo app** — download the free app on your iPhone, send photos from there\n2. **SD card** — copy photos to an SD card (FAT32 format, max 32GB), insert into the frame, tap Import\n\nThe SD card method is actually the fastest way to load lots of photos regardless of what computer you have."
  },
  {
    question: "How do I connect my phone to the frame?",
    answer: "Your phone connects to the frame through the **Frameo app**:\n\n1. Download the free **Frameo** app on your phone (iPhone or Android)\n2. On the frame, tap the screen → tap **\"Add friend\"** → a code appears\n3. In the app, tap **+** and enter the code\n4. You're connected! Now you can send photos anytime.\n\n**Note:** Your phone doesn't need to be on the same WiFi network as the frame. You can send photos from anywhere in the world!"
  },
  {
    question: "What is Frameo?",
    answer: "**Frameo** is the software that runs on your picture frame. It's also the name of the free phone app that family members use to send you photos.\n\n**The app:** Available for iPhone and Android. Family members download it, enter a code from your frame, and can then send photos from anywhere.\n\n**The software:** It powers the frame's slideshow, settings, and all features. Frameo makes the software for over 55 different brands of digital picture frames.\n\n**Important:** Frameo makes the software, not the physical frame. For hardware problems (broken screen, won't power on), contact the seller, not Frameo."
  },
  {
    question: "How do I change WiFi network?",
    answer: "To switch to a different WiFi network:\n\n1. Tap the screen once to open the menu\n2. Tap **Settings** (gear icon)\n3. Look for **WiFi** or **Network**\n4. Tap your new network and enter the password\n\n**Remember:** The frame only works with **2.4GHz WiFi**. If you've changed your router or password, you'll need to reconnect here.\n\n**Tip:** If your WiFi password changed, this is the same place to reconnect."
  },
  {
    question: "How do I send photos to the frame?",
    answer: "To send photos, you need the free **Frameo** app on your phone:\n\n1. Download **Frameo** from the App Store (iPhone) or Google Play (Android)\n2. Get a **friend code** from the frame (tap the screen → \"Add friend\")\n3. In the app, tap **+** and enter the code\n4. Select photos and tap **Send**\n\nPhotos appear on the frame within seconds! You can send up to 10 photos at a time with the free version.\n\n**No phone?** You can also load photos via **SD card** from a computer."
  },
  {
    question: "My photos look blurry",
    answer: "Blurry photos on the frame can happen for a few reasons:\n\n1. **Low-resolution photo** — photos from older phones or heavily cropped images may look blurry on the 10-inch screen\n2. **Fit mode** — if you're using \"Fit\" mode, the areas around the photo may show a blurred version of the image as background. Switch to **Fill** to see if it looks better\n3. **Screen quality** — digital frames aren't as sharp as phone screens, so some softness is normal\n\nTo adjust: tap the screen → **Adjust** → try switching between **Fill** and **Fit**."
  },
  {
    question: "How to add friend to the frame?",
    answer: "Here's how to add a friend so they can send you photos:\n\n1. Tap the screen once to open the menu\n2. Tap **\"Add friend\"** (the little person icon with a + sign)\n3. A **code** will appear on your screen\n4. **Call or text** that code to your friend or family member\n5. They download the free **Frameo** app on their phone and enter the code\n\nThat's it! Once they're connected, they can send you photos anytime from anywhere in the world."
  },
  {
    question: "How to remove a picture from the frame?",
    answer: "To remove a photo from your frame:\n\n1. Swipe left or right to find the photo\n2. Tap the screen once to open the menu\n3. Tap the **trash can icon** to delete it permanently\n4. Or tap the **hide icon** (eye) to remove it from the slideshow but keep it stored\n\n**Delete** = gone forever. **Hide** = removed from slideshow but still on the frame. You can unhide later from My Photos."
  },
  {
    question: "Frame stopped working",
    answer: "Try these steps in order:\n\n1. **Unplug** the frame for 5 minutes, then plug it back in\n2. **Hold the power button** on the back for 10 seconds to force a restart\n3. If it turns on but freezes, check for **software updates** (Settings → About → Check for updates)\n4. As a **last resort**, use a toothpick in the reset hole on the back (hold 5 seconds) — but this deletes everything\n\nIf the frame is completely dead and won't turn on at all, this is likely a hardware problem. Contact the seller through your Amazon order for a warranty replacement."
  },
  {
    question: "What happened during the power outage?",
    answer: "**Don't worry — your photos are safe!**\n\nAfter a power outage:\n- All your photos are still on the frame\n- The clock may have reset (it fixes itself when WiFi reconnects)\n- You may need to turn the frame back on using the power button on the back\n\nThe only thing a power outage can affect is the clock, since the frame doesn't have an internal battery. Once you're back online, WiFi will automatically set the correct time."
  },
  {
    question: "How do I change my WiFi password on the frame?",
    answer: "If your WiFi password changed, you'll need to reconnect:\n\n1. Tap the screen once to open the menu\n2. Tap **Settings** (gear icon)\n3. Look for **WiFi** or **Network**\n4. Tap your WiFi network name\n5. Enter your new password (use the **eye icon** to see what you're typing)\n6. Tap **Connect**\n\nIf you changed to a new router entirely, you'll see the new network name in the list — just tap it and enter the password."
  },
];

// --- Seed the database ---
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS faq (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id     TEXT    NOT NULL,
    question      TEXT    NOT NULL,
    question_norm TEXT    NOT NULL,
    answer        TEXT    NOT NULL,
    is_generated  INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    hit_count     INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_faq_device ON faq(device_id);
`);

// Clear existing pre-populated entries for this device, keep dynamically cached ones
db.prepare("DELETE FROM faq WHERE device_id = ? AND is_generated = 0").run(DEVICE_ID);

const insert = db.prepare(
  "INSERT INTO faq (device_id, question, question_norm, answer, is_generated) VALUES (?, ?, ?, ?, 0)"
);

const insertMany = db.transaction((entries) => {
  for (const entry of entries) {
    insert.run(DEVICE_ID, entry.question, normalize(entry.question), entry.answer);
  }
});

insertMany(faqs);

console.log(`Seeded ${faqs.length} FAQ entries for device: ${DEVICE_ID}`);
db.close();
