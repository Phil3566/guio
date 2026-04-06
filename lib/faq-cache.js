const Database = require("better-sqlite3");
const { normalize } = require("./normalize");

class FaqCache {
  constructor(dbPath) {
    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.threshold = parseFloat(process.env.FAQ_SIMILARITY_THRESHOLD) || 0.45;
    this.cache = new Map();
    this.resourceCache = new Map();
    this._initSchema();
    this._seedFAQs();
    this._seedResources();
    this._loadCache();
    this._loadResources();
  }

  _initSchema() {
    this.db.exec(`
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
      CREATE TABLE IF NOT EXISTS daily_stats (
        date       TEXT NOT NULL,
        device_id  TEXT NOT NULL,
        cache_hits INTEGER NOT NULL DEFAULT 0,
        api_calls  INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (date, device_id)
      );
      CREATE TABLE IF NOT EXISTS request_log (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id  TEXT NOT NULL,
        question   TEXT NOT NULL,
        source     TEXT NOT NULL,
        off_topic  INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS sessions (
        token       TEXT    PRIMARY KEY,
        fingerprint TEXT    NOT NULL,
        ip          TEXT,
        created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
        request_count INTEGER NOT NULL DEFAULT 0,
        blocked     INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_sessions_fingerprint ON sessions(fingerprint);
      CREATE TABLE IF NOT EXISTS settings (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS resources (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id     TEXT    NOT NULL,
        topic         TEXT    NOT NULL,
        category      TEXT    NOT NULL,
        title         TEXT    NOT NULL,
        url           TEXT    NOT NULL,
        display_order INTEGER NOT NULL DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_resources_device_topic ON resources(device_id, topic);
    `);
    // Migration: add topic column to faq table (SQLite has no IF NOT EXISTS for ALTER)
    try {
      this.db.exec("ALTER TABLE faq ADD COLUMN topic TEXT DEFAULT NULL");
    } catch (e) { /* column already exists */ }
  }

  _seedFAQs() {
    const seeds = [
      {
        device: "pastigio-frameo-frame",
        topic: "sd_card",
        question: "I inserted an SD card but the frame doesn't recognize it. What's wrong?",
        answer: "**The most common cause is the card format.** The frame requires a **micro SD card, FAT32 format, 32GB or smaller**.\n\nCheck these in order:\n\n1. **Is it the right type of card?** This frame uses a **micro SD** slot (the small one). A full-size SD card won't fit. If you have a full-size card, you'll need a micro SD card instead.\n2. **Is it 32GB or smaller?** Cards 64GB or larger usually won't work — they come formatted as exFAT, which the frame doesn't support.\n3. **Is it formatted as FAT32?** Even a 32GB card can be formatted wrong. To reformat:\n   - **Windows:** Right-click the card in File Explorer → Format → choose FAT32.\n   - **Mac:** Open Disk Utility → select the card → Erase → choose \"MS-DOS (FAT)\".\n   - Back up any photos on the card first — formatting erases everything.\n4. **Is the card fully inserted?** Power off the frame first, then push the card in gently until it clicks. The gold contacts should face down.\n5. **Are the card's contacts clean?** Gently wipe the gold contacts with a soft dry cloth — fingerprints and dust can block the connection.\n6. **Restart the frame after inserting.** If it doesn't detect the card on its own, a restart can help.\n7. **Try a different card** if you have one — this rules out a bad card.\n\n**After the card is recognized:** The photos won't appear in the slideshow automatically. Go to tap the screen → **My Photos** → **Import** → select the photos you want → tap **Import**.\n\n**Photo format tip:** The frame supports **JPG and PNG** photos. If your photos are in HEIC format (common on newer iPhones), convert them to JPG first. Place photos directly on the card — not inside subfolders.\n\n[TECHNICAL]SD cards 32GB and under are typically sold as SDHC with FAT32. Cards 64GB+ are SDXC and use exFAT by default, which this frame's hardware does not support. Windows can format cards up to 32GB as FAT32 natively. For larger cards, third-party tools like guiformat can force FAT32, but the frame may still reject cards over 32GB due to hardware limitations. Class 10 or UHS-1 cards are recommended for faster transfers.[/TECHNICAL]"
      },
      {
        device: "pastigio-frameo-frame",
        topic: "wifi_connect",
        question: "My picture frame won't connect to WiFi. What do I do?",
        answer: "This is the most common issue and usually fixable.\n\n1. **Check the signal type:** Your frame only works with **2.4GHz WiFi**. When you see the list of WiFi networks on the frame, if your WiFi name appears twice, tap the one **without** \"5G\" at the end. If you only see one WiFi name, your router may be combining both signals — you or someone familiar with routers can log into the router and create a separate 2.4GHz network (see the support videos or articles shown below).\n2. **Double-check the password:** Tap the **eye icon** next to the password field on the frame to see what you're typing. Passwords are case-sensitive — watch for capital letters and spaces.\n3. **Restart both devices:** Unplug your frame for a minute, then plug it back in. For your router, unplug it for 30 seconds, then plug it back in and wait 2 minutes for it to fully restart.\n4. **Move the frame closer to the router** during setup — a weak signal can cause the connection to fail. You can move it to its permanent spot after it connects.\n5. **Check for updates:** Tap the screen → Settings → About → Check for updates. Newer software can fix WiFi problems.\n\nIf your WiFi name doesn't appear in the list at all, your network may be hidden or using a security type the frame doesn't support — see Technical details below.\n\n[TECHNICAL]**Supported:** 2.4GHz 802.11 b/g/n only. WPA2-PSK (AES) or WPA/WPA2 mixed mode. Channels 1–11.\n\n**Not supported:** 5GHz networks, WPA3-only encryption, hidden SSIDs (the frame cannot connect to networks with hidden names), channels 12–14.\n\n**Band steering / mesh networks:** If your router uses a single SSID for both 2.4GHz and 5GHz (band steering, Smart Connect, or SON), the frame may fail to connect or drop connection. Create a dedicated 2.4GHz SSID with a different name. For mesh networks (Eero, Google Wifi, etc.), disable band steering in the mesh app settings.\n\n**Router settings to check:** Channel width should be 20MHz (not 40MHz). Disable client/AP isolation (blocks device communication). Disable MAC filtering or add the frame's MAC address. Use DHCP (not static IP) on the frame.\n\n**Diagnostic test:** If nothing works, try connecting the frame to a phone hotspot (Settings → Hotspot on your phone, set to 2.4GHz). If the frame connects to the hotspot but not your router, the issue is a router setting — not the frame.[/TECHNICAL]"
      },
      {
        device: "pastigio-frameo-frame",
        topic: "subscription",
        question: "Do I need to pay for a subscription to use my picture frame?",
        answer: "**No.** Your frame works fully without paying anything.\n\n**What's free:**\n- Receiving photos from family\n- Slideshow, sleep schedule, brightness controls\n- Backing up photos to an SD card\n- Sending up to 10 photos at a time (just send more batches — no limit on total)\n- Videos up to 15 seconds\n\n**What Frameo+ adds** ($1.99/month or $16.99/year — pricing may vary, check the Frameo app):\n- Send up to 100 photos at once\n- Longer videos (over 15 seconds)\n- Cloud backup\n- Remote frame management from the app\n\n**Tip:** To load lots of photos without a subscription, use an SD card (FAT32, 32GB max) — you can load hundreds at once.\n\nFor a full comparison, see [CROSSREF:commonq]Common Questions → Cost & Subscription[/CROSSREF]."
      },
      {
        device: "pastigio-frameo-frame",
        topic: "subscription",
        question: "Do I need a subscription to use my frame?",
        answer: "**No.** Your frame works fully without paying anything.\n\n**What's free:**\n- Receiving photos from family\n- Slideshow, sleep schedule, brightness controls\n- Backing up photos to an SD card\n- Sending up to 10 photos at a time (just send more batches — no limit on total)\n- Videos up to 15 seconds\n\n**What Frameo+ adds** ($1.99/month or $16.99/year — pricing may vary, check the Frameo app):\n- Send up to 100 photos at once\n- Longer videos (over 15 seconds)\n- Cloud backup\n- Remote frame management from the app\n\n**Tip:** To load lots of photos without a subscription, use an SD card (FAT32, 32GB max) — you can load hundreds at once.\n\nFor a full comparison, see [CROSSREF:commonq]Common Questions → Cost & Subscription[/CROSSREF]."
      },
      {
        device: "pastigio-frameo-frame",
        topic: null,
        question: "If the glass of the picture frame breaks, how to fix it?",
        answer: "The glass on this frame is part of the touchscreen — it can't be replaced or repaired at home.\n\n1. **If the screen is cracked or shattered:** Stop using the frame. Contact the seller through your Amazon order and request a replacement under warranty.\n2. **If the screen has a small chip but still works:** You can keep using it, but be careful of sharp edges. It may stop responding to touch over time.\n3. **If touch stopped working after a drop:** The digitizer (the touch layer under the glass) is likely damaged. This is not fixable — contact the seller for a replacement.\n\nFrameo only makes the software, not the hardware. For physical damage, always go through the seller (Amazon order → Contact Seller)."
      },
      {
        device: "pastigio-frameo-frame",
        topic: null,
        question: "Can I send videos to the frame?",
        answer: "Yes — the person sending uses the Frameo app on their phone.\n\n1. Open the Frameo app and tap the **+** button.\n2. Choose a video from your phone.\n3. Trim it if needed, then tap **Send**.\n\n**Free version:** Videos can be up to **15 seconds** long. **Frameo+ subscription:** Longer videos allowed.\n\nVideos play **with sound** during the slideshow. If that's a problem (especially at night), mute them: tap the screen → Settings → Slideshow → Video volume → Mute."
      },
      {
        device: "pastigio-frameo-frame",
        topic: null,
        question: "My photo is sideways on the frame",
        answer: "The frame displays photos exactly as they were taken. It doesn't have a rotate button.\n\n1. **Ask the sender to rotate the photo on their phone** before sending it again through the Frameo app. On iPhone: open Photos → Edit → tap the crop/rotate icon. On Android: open the photo → Edit → Rotate.\n2. **If you loaded it from an SD card:** Rotate the photo on a computer first, save it, then reload the SD card.\n\nLandscape photos (wider than tall) usually look best on this frame. Portrait photos will have black bars on the sides, or you can use **Fill** mode (tap the screen → Adjust → Fill frame) to crop it to fit — but the top and bottom will be trimmed."
      },
      {
        device: "pastigio-frameo-frame",
        topic: null,
        question: "The frame says storage is full",
        answer: "The frame has limited internal storage (16–32GB depending on model). When it's full, it can't receive new photos.\n\n1. **Delete photos you no longer want:** Swipe to a photo, tap the screen → tap the **trash icon**. To delete many at once: tap and hold one photo, then tap more to select them, then delete.\n2. **Hidden photos still take up space.** If you've hidden a lot, consider deleting them instead: tap the screen → My Photos → find hidden photos and delete.\n3. **Back up first:** Insert a microSD card (FAT32, 32GB max) → tap the screen → Settings → Backup → Backup to external storage. Then delete photos from the frame.\n4. **Videos use much more space than photos.** Deleting a few videos can free up a lot of room."
      },
      {
        device: "pastigio-frameo-frame",
        topic: null,
        question: "Can I control the frame from my phone?",
        answer: "**Without a subscription:** You can send photos and videos to the frame from the Frameo app, but you cannot manage or control the frame remotely.\n\n**With Frameo+ ($1.99/month or $16.99/year):** You get remote management — you can see all photos on the frame, delete photos, change settings, and manage the frame from the app without being near it.\n\nThe frame itself is always controlled by tapping its touchscreen. Only the remote viewing and management features require the subscription."
      },
      {
        device: "pastigio-frameo-frame",
        topic: null,
        question: "Can I add a caption to a photo?",
        answer: "Yes — the **sender** adds the caption before sending.\n\n1. Open the Frameo app on your phone.\n2. Tap **+** to select a photo.\n3. Before sending, there's a text field at the bottom — type your caption there (e.g., \"Grandma's birthday party!\").\n4. Tap **Send**.\n\nThe caption appears on the photo when it displays on the frame. The person with the frame cannot add or edit captions — only the sender can."
      },
      {
        device: "pastigio-frameo-frame",
        topic: null,
        question: "Can I use the Frameo app on a tablet or iPad?",
        answer: "Yes. The Frameo app works on:\n\n- **iPhones and iPads** — download from the App Store\n- **Android phones and tablets** — download from the Google Play Store\n\nThe app works the same way on a tablet as on a phone. You enter the frame's friend code, and then you can send photos and videos."
      },
      {
        device: "pastigio-frameo-frame",
        topic: null,
        question: "How do I check if the frame is connected to WiFi?",
        answer: "Tap the screen once to bring up the menu.\n\nLook at the **top-left corner** — you'll see a WiFi icon:\n- **WiFi icon visible:** The frame is connected.\n- **WiFi icon with a line through it or missing:** The frame is not connected.\n\nTo see which network it's on: tap the screen → **Settings** → **WiFi**. It will show the name of the network it's connected to, or a list of available networks if it's disconnected."
      },
      {
        device: "pastigio-frameo-frame",
        topic: null,
        question: "What do the icons on the screen mean?",
        answer: "Tap the screen once to show all the icons. Here's what each one does:\n\n**Top row (left to right):**\n- **WiFi symbol** — shows connection status\n- **Album icon** — switch between photo albums\n- **Power icon** — power off or restart\n\n**Middle row:**\n- **Calendar** — browse photos by date\n- **My Photos** — view and manage all your photos\n- **Person with +** — add a new friend (generates a code)\n- **Gear icon** — settings (WiFi, display, slideshow, etc.)\n\n**Bottom row (appears when viewing a photo):**\n- **Folder +** — add this photo to an album\n- **Sliders** — adjust how the photo fits (Fill vs. Fit)\n- **Heart** — react to the photo (sender gets notified)\n- **Eye with line** — hide from slideshow (keeps in storage)\n- **Trash** — delete permanently"
      },
      {
        device: "pastigio-frameo-frame",
        topic: null,
        question: "Can I set up two frames with the same app?",
        answer: "Yes — one person can connect to **multiple frames** using the same Frameo app.\n\n1. Open the Frameo app on your phone.\n2. Tap **Add frame** (or the **+** icon).\n3. Enter the friend code shown on the second frame.\n4. You're now connected to both frames.\n\nWhen sending photos, the app lets you choose which frame(s) to send to. Each frame is completely independent — they don't share photos, settings, or storage. You don't need a separate account or a subscription to connect to multiple frames."
      },
      {
        device: "pastigio-frameo-frame",
        topic: null,
        question: "Can I load photos from my computer to the frame? I have a Mac.",
        answer: "Yes, but **there is no Frameo app for computers** — so you can't send photos directly from a Mac or PC the way you would from a phone.\n\n**Mac users — three options:**\n\n1. **SD card (easiest for lots of photos):**\n   - Insert an SD card into your Mac (you may need an adapter).\n   - Copy your photos onto the card.\n   - Eject the card, insert it into the frame's SD slot.\n   - On the frame: tap the screen → **My Photos** → **Import** → select the photos → tap **Import**.\n   - Card must be FAT32 format, 32GB or smaller.\n\n2. **USB drive:** Same process — copy photos to a USB drive, plug it into the frame's USB port, then import.\n\n3. **AirDrop to iPhone, then Frameo app:**\n   - On your Mac, select photos → Share → AirDrop → send to your iPhone.\n   - Open the Frameo app on your iPhone and send them to the frame.\n   - Good for a few photos. For large batches, use the SD card method.\n\n**Windows or Linux:** You can also connect a USB cable directly from the frame to the computer and drag photos over. This does **not** work with Mac.\n\nFor more on managing photos, see [CROSSREF:ref]Quick Reference → Photos & Display[/CROSSREF]."
      },
      {
        device: "pastigio-frameo-frame",
        topic: null,
        question: "I sent photos but they aren't showing up on the frame. What's wrong?",
        answer: "Check these in order:\n\n1. **Is the frame connected to WiFi?** Tap the screen once. Look at the top left — you should see a WiFi icon. If it says \"No connection,\" reconnect to WiFi (tap the screen → Settings → WiFi).\n\n2. **Did the photos actually send?** Open the Frameo app on the sender's phone. Tap the frame's name. Scroll down — do you see the photos listed under \"Recent photos\"? If they're stuck under \"Ongoing deliveries,\" the transfer didn't complete — try resending.\n\n3. **Are the photos hidden?** Someone may have accidentally tapped the hide button. Check: tap the screen → **My Photos** → look for a filter/sort option → toggle **Hidden** on to see hidden photos. Tap any hidden photo and choose to unhide it.\n\n4. **Is the slideshow showing a specific album?** If an album filter is active, new photos won't appear until added to that album. Tap the screen → look at the top bar for an album name. Switch it to **All photos**.\n\n5. **Is the frame's storage full?** If storage is full, new photos can't be received. Delete some old photos or move them to an SD card first (see [CROSSREF:care]Care & Info → Backup & Storage[/CROSSREF]).\n\n6. **Are the sender's app and frame up to date?** The sender should check for app updates (App Store or Google Play). On the frame: tap the screen → Settings → About → Check for updates.\n\n7. **Try a restart:** Tap the screen → power icon → Power off. Wait 10 seconds. Press and hold the power button on the back for 3 seconds until it turns on.\n\n**Sender tip:** Make sure the Frameo app has permission to access photos on the phone. After phone updates, this can get turned off (check phone Settings → Frameo → Photos)."
      },
      {
        device: "pastigio-frameo-frame",
        topic: "photo_crop",
        question: "Why are my photos cut off?",
        answer: "This is because of the **Fill** setting. Your frame's screen is a different shape than most phone photos, so it has to adjust.\n\n**Fill** (default) = the photo fills the whole screen, but the edges get trimmed.\n**Fit** = you see the whole photo, but there may be bars on the sides.\n\n**To change it for one photo:**\n1. Tap the screen once.\n2. Tap **Adjust**.\n3. Switch between **Fill** and **Fit**.\n\n**To change the default for all photos:**\nTap the screen \u2192 Settings \u2192 Slideshow \u2192 turn **Fill frame** on or off.\n\n**Tip for the person sending:** In the Frameo app, before tapping Send, you can drag to position the \"important part\" of the photo. The frame crops around that point \u2014 so make sure faces aren't at the edge.\n\n**Tip:** Landscape (sideways) photos usually look best on this frame. For more display options, see [CROSSREF:ref]Quick Reference \u2192 Photos & Display[/CROSSREF]."
      },
      {
        device: "pastigio-frameo-frame",
        topic: "photo_crop",
        question: "What is Fill vs Fit?",
        answer: "These are two ways your frame can display photos:\n\n**Fill** (default) = The photo fills every inch of the screen. Looks great, but the edges of the photo may get trimmed off \u2014 heads or important details can get cut.\n\n**Fit** = You see the entire photo with nothing cut off. But you may see black or blurred bars on the sides.\n\n**To switch per photo:** Tap the screen \u2192 tap **Adjust** \u2192 choose Fill or Fit.\n\n**To change the default for all photos:** Tap the screen \u2192 Settings \u2192 Slideshow \u2192 turn **Fill frame** on or off.\n\n**Sender tip:** When sending a photo in the Frameo app, you can drag to position the \"important part.\" The frame crops around that point, so make sure faces and key details are centered.\n\n**General tip:** Landscape photos (wider than tall) usually look best with Fill. Portrait photos (taller than wide) often look better with Fit. For more, see [CROSSREF:ref]Quick Reference \u2192 Photos & Display[/CROSSREF]."
      },
      {
        device: "pastigio-frameo-frame",
        topic: null,
        question: "The frame shows a warning about not unplugging. Is it safe? Will I lose my photos?",
        answer: "**Your photos are safe.** They're stored in permanent memory and won't be lost if you unplug the frame. You can unplug it anytime during normal use — slideshow, idle, or sleep mode.\n\nThat said, **wait for the warning to disappear** before unplugging. It means the frame is in the middle of something. Here's when it matters most:\n\n1. **During a software update** — this is the big one. Unplugging mid-update can corrupt the frame's software, sometimes causing **Error 1002** (a blank or stuck screen). The only fix is a factory reset, which **does** erase all photos.\n2. **During photo transfers** — if someone just sent photos and you see activity or \"ongoing deliveries\" in the app, wait for it to finish. Unplugging can corrupt the incoming photos.\n\n**To shut down properly:** Tap the screen → tap the power icon (top right) → Power off.\n\n**If you accidentally unplugged during an update:**\n- Plug it back in right away.\n- If it boots normally, go to tap the screen → Settings → About → Check for updates and run the update again.\n- If you see Error 1002 or a stuck screen: hold the reset button (small hole on the back) with a paperclip for 10 seconds. This erases all photos but usually fixes the frame.\n\n**Getting your photos back after a factory reset:** The reset wipes the frame, but the original photos still exist on the senders' phones. After the reset, set up the frame again, have everyone reconnect with a new friend code, and ask them to re-send their photos from the Frameo app. To avoid this situation, back up your photos to an SD card periodically — see [CROSSREF:care]Care & Info → Backup & Storage[/CROSSREF]."
      },
      {
        device: "pastigio-frameo-frame",
        topic: null,
        question: "My frame's touch screen stopped responding. What should I do?",
        answer: "This is usually fixable. Work through these steps in order:\n\n**1. Peel off any screen protector.** Some frames ship with a clear protective film — it blocks capacitive touch. Peel it off.\n\n**2. Clean the screen.** Use a soft, dry cloth. Dirt, moisture, or grease can interfere with touch.\n\n**3. Restart the frame:**\n- Hold the power button on the back until the frame turns off.\n- Unplug the AC adapter from both ends (frame and wall).\n- Wait **10 minutes** (this fully drains residual charge).\n- Plug back in and power on.\n\n**4. Test for dead zones.** If only part of the screen doesn't respond, try rotating the frame 90° (landscape to portrait or vice versa). If touch works in the new orientation, the issue is a hardware defect in one zone — contact the seller.\n\n**5. Check for a software update.** If the screen responds enough to navigate: tap the screen → Settings → About → Check for updates. Touch bugs are sometimes fixed in firmware updates.\n\n**6. Factory reset (last resort).** If nothing else works, use the reset pinhole on the back of the frame — press with a paperclip and hold for 5 seconds. This erases all photos, friends, and settings, but can fix software-caused touch issues.\n\n**Getting your photos back after a factory reset:** The original photos still exist on the senders' phones. After the reset, set up the frame again, have everyone reconnect with a new friend code, and ask them to re-send their photos.\n\n**7. If still unresponsive after all of the above:** This is a hardware issue with the touch panel. Frameo only makes the software — contact the seller through your Amazon order for a warranty replacement."
      },
      {
        device: "pastigio-frameo-frame",
        topic: null,
        question: "Videos on my frame play sound at night and wake me up. How do I mute it?",
        answer: "**Mute video sound:** Tap the screen → **Settings** → **Slideshow** → **Video volume** → **Mute**. Videos will now play silently during the slideshow.\n\nBut the better fix for nighttime is the **sleep schedule** — it turns the frame completely off at night (no video, no sound, no light):\n\n1. Tap the screen → **Settings** → **Display** → **Sleep mode**.\n2. Set the \"off\" time (e.g., 11:00 PM) and \"on\" time (e.g., 7:00 AM).\n3. Tap the days of the week to choose which days the schedule applies.\n4. You can add a second schedule (e.g., different times on weekends) by tapping the **+** in the top-right corner.\n\nThe frame still receives photos while asleep — they'll appear the next morning.\n\n**Two more things that can make sound at night:**\n- **Notification sounds** (the chime when a new photo arrives): Tap the screen → Settings → **Notifications** → turn down or mute the **Notification volume**.\n- **Auto mute** (optional): Under Settings → Slideshow, look for **Auto mute**. When enabled, the frame automatically mutes video sound after a period of inactivity — so if you forget to mute manually, it mutes itself.\n\n**To hear sound again during the day,** follow the same mute steps and select a volume level instead of Mute."
      },
      {
        device: "pastigio-frameo-frame",
        topic: null,
        question: "My frame won't turn on at all. What should I do?",
        answer: "**First, check for signs of life.** When you plug the frame in, look for a small LED light near the power button or listen for any click or hum. If you see or hear something, the frame is getting power — the screen may just be off.\n\n**If there are no signs of power at all:**\n\n1. **Check the power cable at both ends.** Unplug and firmly replug the cable where it connects to the frame and where it connects to the power adapter. These can work loose easily.\n2. **Inspect the cable and adapter.** Look for frayed or bent wires, or a bulging/discolored power adapter. If you see damage, the adapter needs replacing.\n3. **Try a different outlet.** Test the outlet with something else (a phone charger or lamp) to make sure it has power. Some outlets are controlled by a wall switch.\n4. **Unplug everything for 10 minutes.** Disconnect the cable from both the frame and the wall. Wait a full 10 minutes, then plug back in. This fully drains residual charge and can clear a stuck state.\n5. **Hold the power button for 15 seconds.** Even if the screen is black, hold the power button on the back for a full 15 seconds, release, wait 10 seconds, then press it again briefly.\n6. **Remove any SD card or USB drive.** A corrupted SD card can sometimes prevent the frame from starting. Remove it, then try powering on again.\n7. **Try a different power cable** if you have a compatible one (same connector type and voltage).\n\n**If the screen is black but the frame seems to have power** (LED on, or you hear a sound):\n- Try the **flashlight test** — shine a bright light at an angle on the screen. If you can faintly see an image, the backlight has failed. This is a hardware issue — contact the seller.\n\n**Last resort — factory reset:** Use the reset pinhole on the back of the frame. Press with a paperclip and hold for 10 seconds. This erases all photos, friends, and settings. The original photos still exist on the senders' phones — after the reset, set up the frame again and have everyone reconnect and re-send.\n\n**If nothing works:** This is a hardware problem. Contact the seller through your Amazon order for a warranty replacement."
      },
      {
        device: "pastigio-frameo-frame",
        topic: null,
        question: "My frame is frozen and not responding to anything. How do I fix it?",
        answer: "**Unplug it, wait, and plug it back in.** This fixes most freezes.\n\n1. **Hold the power button on the back for 15 seconds** until the screen goes black. If it doesn't respond, that's OK — go to step 2.\n2. **Unplug the power cable from both ends** — from the frame and from the wall outlet.\n3. **Wait 10 minutes.** This fully drains residual charge and clears temporary data.\n4. **Plug it back in** and press the power button. The frame should restart normally.\n\n**If it freezes again after restarting:**\n\n- **Check for a software update:** Tap the screen → Settings → About → Check for updates. Freezing is often caused by a software bug that's been fixed in a newer version.\n- **Free up storage:** If the frame's storage is nearly full, it can cause lag and freezing. Delete photos you no longer want, or move them to an SD card first (tap the screen → Settings → Backup).\n- **Remove any SD card or USB drive.** A corrupted card can cause repeated freezing. Remove it and see if the problem stops.\n\n**If you see \"Unfortunately, Frameo has stopped\":** Same fix — unplug both ends for 10 minutes and restart.\n\n**Last resort — factory reset:** If it keeps freezing, use the reset pinhole on the back of the frame. Press with a paperclip and hold for 10 seconds. This erases all photos, friends, and settings — but it can fix persistent software problems.\n\n**Getting your photos back after a factory reset:** The original photos still exist on the senders' phones. After the reset, set up the frame again, have everyone reconnect with a new friend code, and ask them to re-send their photos.\n\n**To prevent future freezes:** Install software updates when prompted, don't let storage fill up completely, and always use the power icon to shut down (tap the screen → power icon → Power off) instead of pulling the plug."
      },
    ];

    const insert = this.db.prepare(
      "INSERT INTO faq (device_id, question, question_norm, answer, is_generated, topic) VALUES (?, ?, ?, ?, 0, ?)"
    );
    const update = this.db.prepare(
      "UPDATE faq SET answer = ?, is_generated = 0 WHERE device_id = ? AND question_norm = ?"
    );
    const setTopic = this.db.prepare(
      "UPDATE faq SET topic = ? WHERE device_id = ? AND question_norm = ?"
    );
    for (const s of seeds) {
      const norm = normalize(s.question);
      const exists = this.db.prepare(
        "SELECT id, is_generated, answer FROM faq WHERE device_id = ? AND question_norm = ?"
      ).get(s.device, norm);
      if (!exists) {
        insert.run(s.device, s.question, norm, s.answer, s.topic || null);
      } else if (exists.answer !== s.answer) {
        update.run(s.answer, s.device, norm);
      }
      // Always update topic on seed rows
      if (s.topic) {
        setTopic.run(s.topic, s.device, norm);
      }
    }
  }

  _seedResources() {
    const seeds = [
      // === wifi_connect: Videos ===
      { device: "pastigio-frameo-frame", topic: "wifi_connect", category: "video",
        title: "How To Fix Frameo Digital Frame Not Connecting To WiFi",
        url: "https://www.youtube.com/watch?v=b0i_m5Nq7sM", order: 1 },
      { device: "pastigio-frameo-frame", topic: "wifi_connect", category: "video",
        title: "How To Separate 2.4GHz and 5GHz On WiFi",
        url: "https://www.youtube.com/watch?v=JONmJhS_rIk", order: 2 },
      { device: "pastigio-frameo-frame", topic: "wifi_connect", category: "video",
        title: "Smart Home Device Won't CONNECT To WiFi",
        url: "https://www.youtube.com/watch?v=G3LHOb6ThPI", order: 3 },
      { device: "pastigio-frameo-frame", topic: "wifi_connect", category: "search_youtube",
        title: "Find more videos on YouTube",
        url: "https://www.youtube.com/results?search_query=frameo+wifi+setup+2.4GHz", order: 99 },
      // === wifi_connect: Articles ===
      { device: "pastigio-frameo-frame", topic: "wifi_connect", category: "article",
        title: "Why Your Router Has Two WiFi Channels (Gizmodo)",
        url: "https://gizmodo.com/why-your-router-has-two-wifi-channels-and-how-they-work-1828650288", order: 1 },
      { device: "pastigio-frameo-frame", topic: "wifi_connect", category: "article",
        title: "How to Connect to 5GHz WiFi (letsbemates)",
        url: "https://www.letsbemates.com.au/mate/connect-5ghz-wifi/", order: 2 },
      { device: "pastigio-frameo-frame", topic: "wifi_connect", category: "search_google",
        title: "Find more articles on Google",
        url: "https://www.google.com/search?q=digital+picture+frame+won%27t+connect+to+wifi+2.4GHz", order: 99 },
      // === wifi_connect: Official Support ===
      { device: "pastigio-frameo-frame", topic: "wifi_connect", category: "support",
        title: "WiFi Requirements",
        url: "https://support.frameo.com/hc/en-us/articles/360020756500--Wi-Fi-Requirements", order: 1 },
      { device: "pastigio-frameo-frame", topic: "wifi_connect", category: "support",
        title: "WiFi and Connection Problems",
        url: "https://support.frameo.com/hc/en-us/articles/10140527026834--WiFi-and-Connection-Problems", order: 2 },
      { device: "pastigio-frameo-frame", topic: "wifi_connect", category: "support",
        title: "Frame Can't Find My Wi-Fi",
        url: "https://support.frameo.com/hc/en-us/articles/24804330613266--Frame-Can-t-Find-My-Wi-Fi", order: 3 },
    ];

    const check = this.db.prepare(
      "SELECT id FROM resources WHERE device_id = ? AND topic = ? AND url = ?"
    );
    const insert = this.db.prepare(
      "INSERT INTO resources (device_id, topic, category, title, url, display_order) VALUES (?, ?, ?, ?, ?, ?)"
    );
    for (const s of seeds) {
      if (!check.get(s.device, s.topic, s.url)) {
        insert.run(s.device, s.topic, s.category, s.title, s.url, s.order);
      }
    }
  }

  _loadResources() {
    const rows = this.db.prepare(
      "SELECT device_id, topic, category, title, url FROM resources ORDER BY display_order"
    ).all();
    this.resourceCache.clear();
    for (const row of rows) {
      const key = `${row.device_id}::${row.topic}`;
      if (!this.resourceCache.has(key)) {
        this.resourceCache.set(key, []);
      }
      this.resourceCache.get(key).push({
        category: row.category,
        title: row.title,
        url: row.url,
      });
    }
  }

  getResources(deviceId, topic) {
    if (!topic) return null;
    const key = `${deviceId}::${topic}`;
    const resources = this.resourceCache.get(key);
    if (!resources || resources.length === 0) return null;
    const grouped = {};
    for (const r of resources) {
      if (!grouped[r.category]) grouped[r.category] = [];
      grouped[r.category].push({ title: r.title, url: r.url });
    }
    return grouped;
  }

  _loadCache() {
    const rows = this.db.prepare("SELECT id, device_id, question_norm, answer, topic FROM faq").all();
    this.cache.clear();
    for (const row of rows) {
      if (!this.cache.has(row.device_id)) {
        this.cache.set(row.device_id, []);
      }
      this.cache.get(row.device_id).push({
        id: row.id,
        question_norm: row.question_norm,
        answer: row.answer,
        topic: row.topic || null,
      });
    }
  }

  match(deviceId, userQuestion) {
    const norm = normalize(userQuestion);
    const entries = this.cache.get(deviceId);
    if (!entries || entries.length === 0) return null;

    let bestScore = 0;
    let bestEntry = null;

    for (const entry of entries) {
      const score = this._similarity(norm, entry.question_norm);
      if (score > bestScore) {
        bestScore = score;
        bestEntry = entry;
      }
    }

    if (bestScore >= this.threshold && bestEntry) {
      this.db.prepare("UPDATE faq SET hit_count = hit_count + 1 WHERE id = ?").run(bestEntry.id);
      return { answer: bestEntry.answer, score: bestScore, faqId: bestEntry.id, topic: bestEntry.topic };
    }

    return null;
  }

  insert(deviceId, question, answer, isGenerated = 1) {
    const norm = normalize(question);
    const existing = this.match(deviceId, question);
    if (existing && existing.score > 0.85) return;

    this.db.prepare(
      "INSERT INTO faq (device_id, question, question_norm, answer, is_generated) VALUES (?, ?, ?, ?, ?)"
    ).run(deviceId, question, norm, answer, isGenerated);
    this._loadCache();
  }

  _today() {
    return new Date().toISOString().slice(0, 10);
  }

  getTodayApiCalls() {
    const row = this.db.prepare(
      "SELECT COALESCE(SUM(api_calls), 0) as total FROM daily_stats WHERE date = ?"
    ).get(this._today());
    return row.total;
  }

  recordHit(deviceId) {
    this.db.prepare(`
      INSERT INTO daily_stats (date, device_id, cache_hits, api_calls)
      VALUES (?, ?, 1, 0)
      ON CONFLICT(date, device_id) DO UPDATE SET cache_hits = cache_hits + 1
    `).run(this._today(), deviceId);
  }

  recordMiss(deviceId) {
    this.db.prepare(`
      INSERT INTO daily_stats (date, device_id, cache_hits, api_calls)
      VALUES (?, ?, 0, 1)
      ON CONFLICT(date, device_id) DO UPDATE SET api_calls = api_calls + 1
    `).run(this._today(), deviceId);
  }

  logRequest(deviceId, question, source, offTopic = 0) {
    this.db.prepare(`
      INSERT INTO request_log (device_id, question, source, off_topic)
      VALUES (?, ?, ?, ?)
    `).run(deviceId, question, source, offTopic ? 1 : 0);
  }

  getRecentRequests(limit = 50, deviceId = null) {
    if (deviceId) {
      return this.db.prepare(`
        SELECT device_id, question, source, off_topic, created_at
        FROM request_log WHERE device_id = ?
        ORDER BY created_at DESC LIMIT ?
      `).all(deviceId, limit);
    }
    return this.db.prepare(`
      SELECT device_id, question, source, off_topic, created_at
      FROM request_log
      ORDER BY created_at DESC LIMIT ?
    `).all(limit);
  }

  // --- Resource management ---

  getAllResources() {
    return this.db.prepare(
      "SELECT id, device_id, topic, category, title, url, display_order FROM resources ORDER BY topic, display_order"
    ).all();
  }

  addResource(deviceId, topic, category, title, url, displayOrder) {
    this.db.prepare(
      "INSERT INTO resources (device_id, topic, category, title, url, display_order) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(deviceId, topic, category, title, url, displayOrder);
    this._loadResources();
  }

  deleteResource(id) {
    this.db.prepare("DELETE FROM resources WHERE id = ?").run(id);
    this._loadResources();
  }

  // --- Settings management ---

  getSetting(key, defaultValue) {
    const row = this.db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
    return row ? row.value : String(defaultValue);
  }

  setSetting(key, value) {
    this.db.prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?"
    ).run(key, String(value), String(value));
  }

  getAllSettings() {
    const rows = this.db.prepare("SELECT key, value FROM settings").all();
    const obj = {};
    for (const row of rows) obj[row.key] = row.value;
    return obj;
  }

  // --- Session management ---

  createSession(token, fingerprint, ip) {
    this.db.prepare(
      "INSERT INTO sessions (token, fingerprint, ip) VALUES (?, ?, ?)"
    ).run(token, fingerprint, ip);
  }

  getSession(token) {
    return this.db.prepare("SELECT * FROM sessions WHERE token = ?").get(token);
  }

  checkLimits(token, fingerprint) {
    const session = this.db.prepare("SELECT * FROM sessions WHERE token = ?").get(token);
    if (!session) return { allowed: false, reason: "invalid_session" };
    if (session.blocked) return { allowed: false, reason: "blocked" };

    const sessionCap = parseInt(this.getSetting("session_request_cap", 50));
    if (session.request_count >= sessionCap) return { allowed: false, reason: "session_limit" };

    // Fingerprint limit across all sessions from this device
    const fpCap = parseInt(this.getSetting("fingerprint_lifetime_cap", 200));
    const fpTotal = this.db.prepare(
      "SELECT COALESCE(SUM(request_count), 0) as total FROM sessions WHERE fingerprint = ?"
    ).get(fingerprint).total;
    if (fpTotal >= fpCap) return { allowed: false, reason: "fingerprint_limit" };

    return { allowed: true };
  }

  incrementSession(token) {
    this.db.prepare(
      "UPDATE sessions SET request_count = request_count + 1 WHERE token = ?"
    ).run(token);
  }

  cleanOldSessions() {
    this.db.prepare("DELETE FROM sessions WHERE created_at < datetime('now', '-30 days')").run();
  }

  getSessionStats() {
    const active = this.db.prepare(
      "SELECT COUNT(*) as count FROM sessions WHERE created_at >= datetime('now', '-24 hours')"
    ).get().count;
    const total = this.db.prepare("SELECT COUNT(*) as count FROM sessions").get().count;
    const blocked = this.db.prepare("SELECT COUNT(*) as count FROM sessions WHERE blocked = 1").get().count;
    const topFingerprints = this.db.prepare(`
      SELECT fingerprint, SUM(request_count) as total_requests, COUNT(*) as session_count
      FROM sessions GROUP BY fingerprint ORDER BY total_requests DESC LIMIT 10
    `).all();
    return { active, total, blocked, topFingerprints };
  }

  getStats(deviceId = null) {
    const dFilter = deviceId ? " WHERE device_id = ?" : "";
    const dArgs = deviceId ? [deviceId] : [];
    const dsFilter = deviceId ? " WHERE device_id = ?" : "";
    const dsDateFilter = deviceId ? " WHERE date >= date('now', '-30 days') AND device_id = ?" : " WHERE date >= date('now', '-30 days')";

    const devices = this.db.prepare(`
      SELECT device_id,
             COUNT(*) as total_entries,
             SUM(CASE WHEN is_generated = 0 THEN 1 ELSE 0 END) as seeded,
             SUM(CASE WHEN is_generated = 1 THEN 1 ELSE 0 END) as generated,
             SUM(hit_count) as total_hits
      FROM faq${dFilter} GROUP BY device_id
    `).all(...dArgs);

    const topQuestions = this.db.prepare(`
      SELECT device_id, question, hit_count
      FROM faq WHERE hit_count > 0${deviceId ? " AND device_id = ?" : ""}
      ORDER BY hit_count DESC LIMIT 15
    `).all(...dArgs);

    const newQuestions = this.db.prepare(`
      SELECT device_id, question, answer, created_at, hit_count
      FROM faq WHERE is_generated = 1${deviceId ? " AND device_id = ?" : ""}
      ORDER BY created_at DESC LIMIT 25
    `).all(...dArgs);

    const zeroHits = this.db.prepare(`
      SELECT device_id, question
      FROM faq WHERE hit_count = 0 AND is_generated = 0${deviceId ? " AND device_id = ?" : ""}
      ORDER BY device_id, question
    `).all(...dArgs);

    const dailyTotals = this.db.prepare(`
      SELECT date,
             SUM(cache_hits) as cache_hits,
             SUM(api_calls) as api_calls
      FROM daily_stats${dsDateFilter}
      GROUP BY date ORDER BY date DESC
    `).all(...dArgs);

    const allTimeStats = this.db.prepare(`
      SELECT COALESCE(SUM(cache_hits), 0) as total_cache_hits,
             COALESCE(SUM(api_calls), 0) as total_api_calls
      FROM daily_stats${dsFilter}
    `).all(...dArgs);

    const allFaqs = this.db.prepare(`
      SELECT id, device_id, question, answer, hit_count, is_generated, topic, created_at
      FROM faq${dFilter}
      ORDER BY question ASC
    `).all(...dArgs);

    return { devices, topQuestions, newQuestions, zeroHits, dailyTotals, allFaqs, allTimeStats: allTimeStats[0] || { total_cache_hits: 0, total_api_calls: 0 } };
  }

  _stopWords = new Set([
    "how", "do", "i", "the", "a", "an", "is", "it", "my", "can", "to",
    "what", "does", "in", "on", "of", "for", "this", "that", "should",
    "whats", "where", "when", "why", "will", "be", "me", "you", "your",
    "are", "its", "im", "was", "has", "have", "had", "not", "dont",
    "up", "or", "and", "with", "at", "from", "but", "just", "about",
    "get", "so", "if", "no", "yes", "very", "much", "many", "some",
  ]);

  _trigrams(str) {
    const padded = `  ${str} `;
    const set = new Set();
    for (let i = 0; i <= padded.length - 3; i++) {
      set.add(padded.substring(i, i + 3));
    }
    return set;
  }

  _stem(word) {
    if (word.length <= 3) return word;
    return word
      .replace(/ing$/, "")
      .replace(/tion$/, "")
      .replace(/ed$/, "")
      .replace(/ly$/, "")
      .replace(/ness$/, "")
      .replace(/s$/, "");
  }

  _keywords(str) {
    return new Set(
      str.split(" ")
        .filter(w => w.length > 1 && !this._stopWords.has(w))
        .map(w => this._stem(w))
    );
  }

  _similarity(a, b) {
    // Trigram Jaccard similarity
    const triA = this._trigrams(a);
    const triB = this._trigrams(b);
    let triIntersection = 0;
    for (const t of triA) {
      if (triB.has(t)) triIntersection++;
    }
    const triUnion = triA.size + triB.size - triIntersection;
    const triScore = triUnion === 0 ? 0 : triIntersection / triUnion;

    // Keyword overlap (words minus stop words)
    const kwA = this._keywords(a);
    const kwB = this._keywords(b);
    if (kwA.size === 0 || kwB.size === 0) return triScore;
    let kwIntersection = 0;
    for (const w of kwA) {
      if (kwB.has(w)) kwIntersection++;
    }
    const kwUnion = kwA.size + kwB.size - kwIntersection;
    const kwScore = kwUnion === 0 ? 0 : kwIntersection / kwUnion;

    // Return the higher of the two scores
    return Math.max(triScore, kwScore);
  }
}

module.exports = FaqCache;
