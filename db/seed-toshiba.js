const Database = require("better-sqlite3");
const path = require("path");
const { normalize } = require("../lib/normalize");

const DB_PATH = path.join(__dirname, "faq.db");
const DEVICE_ID = "toshiba-em131a5c-bs";

const faqs = [
  // ===== COOKING & REHEATING =====
  {
    question: "How do I reheat food?",
    answer: "Here's how to reheat food:\n\n1. Place your food in a microwave-safe dish and cover with a vented lid or plastic wrap\n2. Press **Sensor Reheat** (top-left button in the presets area)\n3. Press **START/+30Sec.** to begin\n4. Don't open the door until the cooking time appears on the display!\n\nThe sensor detects steam and automatically sets the time. Food must be at least 40\u00b0F.\n\n**Note:** Sensor Reheat is NOT for bread, dry food, beverages, frozen food, or raw food. For those, use manual cook instead."
  },
  {
    question: "How do I cook something manually?",
    answer: "Here's how to cook manually:\n\n1. Press **Cook Time** (bottom-right of the number pad)\n2. Enter the cooking time using the **number pad** (e.g., press 5, 0, 0 for 5 minutes)\n3. Press **START/+30Sec.** to begin\n\nIt runs at full power (PL10) by default. To change the power, press **Power Level** after entering the time, then press a number 0-9 to select your level.\n\n**Important:** You MUST press Cook Time first! If you just press a number 1-6 without pressing Cook Time, it will start cooking immediately (One Touch Start)."
  },
  {
    question: "How do I add 30 seconds?",
    answer: "Press the **START/+30Sec.** button while food is cooking! Each press adds 30 seconds at full power.\n\nYou can also press START/+30Sec. by itself to instantly start cooking for 30 seconds at full power \u2014 great for a quick reheat.\n\n**Note:** You can add time during microwave cooking and time defrost, but NOT during weight defrost or kitchen timer."
  },
  {
    question: "How do I change the power level?",
    answer: "Here's how to change the power level:\n\n1. Press **Cook Time** first\n2. Enter your cooking time on the number pad\n3. Press **Power Level** (below the 7 key)\n4. Press a number **0-9** to select your power level\n5. Press **START/+30Sec.** to begin\n\n**Power levels:** PL10=100%, PL7=70%, PL5=50%, PL3=30%, PL1=10%\n\n**Important:** You must press Cook Time and enter a time BEFORE pressing Power Level. This is the correct sequence!"
  },
  {
    question: "What is One Touch Start?",
    answer: "**One Touch Start** means pressing number buttons **1 through 6** will instantly start cooking!\n\n- Press **1** = 1 minute at full power\n- Press **2** = 2 minutes at full power\n- Press **3** = 3 minutes, and so on up to **6** = 6 minutes\n\n**Be careful!** If you press a number without pressing Cook Time first, cooking starts immediately. This catches many people off guard.\n\n**To cook manually instead:** Always press **Cook Time** first, THEN enter your time on the number pad."
  },

  // ===== SENSOR COOK & PRESETS =====
  {
    question: "How do I use Sensor Cook?",
    answer: "This microwave has dedicated sensor buttons for each food type:\n\n1. Press the button that matches your food (e.g., **Potato**, **Rice**, **Frozen Pizza**)\n2. Press **START/+30Sec.** to begin\n3. Don't open the door until the cooking time appears!\n\n**Sensor buttons:** Sensor Reheat, Frozen Pizza, Frozen Entr\u00e9e, Potato, Rice, Veggie\n\n**Tips for best results:**\n- Room temperature must be under 95\u00b0F\n- Food must weigh more than 4 oz\n- Oven cavity and glass tray must be dry"
  },
  {
    question: "What are the sensor cook codes?",
    answer: "Here are all the sensor cook programs:\n\n- **SC-1** Sensor Reheat (8\u201332 oz)\n- **SC-2** Frozen Pizza (6\u201312 oz)\n- **SC-3** Frozen Entr\u00e9e (8\u201332 oz)\n- **SC-4** Potato (1\u20134 potatoes, 10 oz each)\n- **SC-5** Rice (8\u201316 oz)\n- **SC-6** Fresh Veggie (4\u201316 oz) \u2014 press Veggie once\n- **SC-7** Frozen Veggie (4\u201316 oz) \u2014 press Veggie twice\n\nEach has its own dedicated button on the panel. Just press the button and then START."
  },
  {
    question: "How do I cook a potato?",
    answer: "Here's how to cook potatoes:\n\n1. **Puncture** each potato several times with a fork\n2. Place on the glass tray \u2014 up to 4 potatoes, keep 1 inch between them\n3. Press **Potato** (it shows SC-4)\n4. Press **START/+30Sec.**\n\nDon't open the door until the cooking time appears on the display! The sensor detects steam to set the right time automatically."
  },
  {
    question: "How do I cook rice?",
    answer: "Here's how to cook rice:\n\n1. Place rice and water in a microwave-safe dish with a vented lid\n2. Press **Rice** (it shows SC-5 on the display)\n3. Press **START/+30Sec.**\n\nThe sensor detects steam and sets the time automatically. Works for 8\u201316 oz of rice. Don't open the door until the cooking time appears!"
  },
  {
    question: "How do I cook vegetables?",
    answer: "Here's how to cook veggies:\n\n**Fresh vegetables:**\n1. Press **Veggie** once (shows SC-6)\n2. Press **START/+30Sec.**\n\n**Frozen vegetables:**\n1. Press **Veggie** twice (shows SC-7)\n2. Press **START/+30Sec.**\n\nWorks for 4\u201316 oz. After the cooking time appears on the display, you can open the door to turn the food over. The oven beeps 5 times when finished."
  },

  // ===== CUSTOM COOK & SOFTEN/MELT =====
  {
    question: "How do I use Custom Cook?",
    answer: "Custom Cook has 5 preset food programs:\n\n1. Press **Custom Cook** repeatedly to select your food:\n   - **CC-1** Bacon (2\u20136 slices)\n   - **CC-2** Frozen Roll/Muffin (1\u20136 pieces)\n   - **CC-3** Beverage (1\u20132 cups)\n   - **CC-4** Chicken Pieces (0.5\u20132.0 lbs)\n   - **CC-5** Oatmeal with milk (20/40 oz)\n2. Enter the weight or portion on the number pad\n3. Press **START/+30Sec.**"
  },
  {
    question: "How do I soften or melt butter?",
    answer: "Here's how using the Soften/Melt button:\n\n**To melt butter:**\n1. Press **Soften/Melt** once (shows S-1)\n2. Enter the number of sticks (1\u20133)\n3. Press **START/+30Sec.**\n\n**To soften butter (for spreading):**\n1. Press **Soften/Melt** repeatedly until S-5 shows\n2. Enter the number of sticks (1\u20133)\n3. Press **START/+30Sec.**\n\nS-1 melts butter completely. S-5 just softens it to room temperature."
  },
  {
    question: "How do I melt chocolate?",
    answer: "Here's how to melt chocolate:\n\n1. Press **Soften/Melt** repeatedly until **S-2** shows on the display\n2. Enter the weight: press **1** for 4 oz or **2** for 8 oz\n3. Press **START/+30Sec.**\n\nThe microwave automatically sets the right time and power to melt chocolate without burning it."
  },

  // ===== DEFROST =====
  {
    question: "How do I defrost food?",
    answer: "You have two defrost options:\n\n**Custom Defrost** (for specific food types):\n1. Press **Custom Defrost** to select: dEF1=Meat, dEF2=Poultry, dEF3=Fish\n2. Enter the weight (0.1\u20136.0 lbs) on the number pad\n3. Press **START/+30Sec.**\n4. When it beeps, **turn the food over**, then close the door\n\n**1 Lb Defrost** (quick option for 1 pound):\n1. Press **1lb Defrost**\n2. Press **START/+30Sec.**\n\nThat's it \u2014 it's pre-set for exactly 1 pound!"
  },
  {
    question: "How do I defrost chicken?",
    answer: "Here's how to defrost chicken:\n\n1. Press **Custom Defrost** \u2014 it shows dEF1 (Meat)\n2. Press again for **dEF2** (Poultry)\n3. Enter the weight in pounds (e.g., press 2, 0 for 2.0 lbs)\n4. Press **START/+30Sec.**\n5. When it beeps halfway through, **turn the chicken over**\n6. Close the door \u2014 it continues automatically\n\n**Tip:** Remove packaging and place on a microwave-safe plate to catch drips. Weight range: 0.1\u20136.0 lbs."
  },

  // ===== POPCORN =====
  {
    question: "How do I make popcorn?",
    answer: "Here's how to make popcorn:\n\n1. Place the popcorn bag in the microwave (follow the bag's instructions for which side is up)\n2. Press **Popcorn** repeatedly to select your bag size:\n   - **1 press** = 1.75 oz\n   - **2 presses** = 3.0 oz\n   - **3 presses** = 3.5 oz\n3. Press **START/+30Sec.**\n\n**Tip:** Stay nearby and listen! When the pops slow to 2\u20133 seconds apart, you can stop early to avoid burning."
  },

  // ===== TIMER & CLOCK =====
  {
    question: "How do I set the clock?",
    answer: "Here's how to set the clock:\n\n1. Press **Clock** once \u2014 \"00:00\" appears\n2. Enter the current time on the number pad (e.g., press 1, 0, 1, 2 for 10:12)\n3. Press **Clock** again to confirm\n\nThe clock uses 12-hour format (1:00\u201312:59). If you make a mistake, press STOP/Cancel to start over.\n\n**Note:** When first plugged in, \"0:00\" shows on the display. Set the clock before using the microwave."
  },
  {
    question: "How do I use the kitchen timer?",
    answer: "Here's how to use the kitchen timer:\n\n1. Press **Kitchen Timer** once \u2014 \"00:00\" appears\n2. Enter the countdown time on the number pad (max 99 minutes 59 seconds)\n3. Press **START/+30Sec.** to start the countdown\n\nThe timer counts down and beeps 5 times when done \u2014 but it does **not** cook anything. It's just a countdown timer.\n\n**Note:** You cannot add time with START/+30Sec during the kitchen timer. Press STOP/Cancel to cancel the timer."
  },

  // ===== CONTROLS =====
  {
    question: "How do I pause cooking?",
    answer: "To pause cooking, press **STOP/Cancel** once (the red button at the bottom right).\n\nThe microwave pauses and keeps your remaining time. To resume, just press **START/+30Sec.**\n\nYou can also pause by opening the door \u2014 it stops automatically. Close the door and press START to continue."
  },
  {
    question: "How do I cancel cooking?",
    answer: "To cancel cooking completely, press **STOP/Cancel** twice (the red button at the bottom right).\n\n- **1 press** = pause (you can resume with START/+30Sec)\n- **2 presses** = cancel everything and clear the display\n\nThis works at any time, whether the microwave is cooking or you're in the middle of programming."
  },
  {
    question: "How do I use the child lock?",
    answer: "Here's how to use the child lock:\n\n**To lock:** Hold **STOP/Cancel** for 3 seconds. A long beep sounds and \"Lock\" appears on the display.\n\n**To unlock:** Hold **STOP/Cancel** for 3 seconds again. A long beep sounds and \"Lock\" disappears.\n\nWhen locked, no buttons will work. The lock stays active even when the microwave is unplugged and plugged back in."
  },
  {
    question: "What do the beeps mean?",
    answer: "Here's what the beeps mean:\n\n- **1 beep** = your input was accepted\n- **1 beep halfway through defrost** = time to turn your food over\n- **5 beeps** = cooking is completely finished! \"End\" shows on the display\n- **Long beep** = child lock activated/deactivated, or mute turned on/off\n\nTo clear the \"End\" display after cooking, open the door or press STOP/Cancel."
  },

  // ===== HIDDEN FEATURES (from customer complaints) =====
  {
    question: "How do I mute the microwave?",
    answer: "Here's the hidden mute feature:\n\n1. Make sure the microwave is in standby (not cooking)\n2. **Long press the number 8 button for 3 seconds**\n3. You'll hear a long beep confirming the sound is off\n\n**To turn the sound back on:** Long press 8 for 3 seconds again. You'll hear a long beep.\n\nWhen muted, ALL sounds are off \u2014 including button beeps and the cooking-finished beeps. The mute even works when the child lock is on!"
  },
  {
    question: "How do I turn off the beeping?",
    answer: "You can mute all beeping sounds:\n\n1. Make sure the microwave is in standby (not cooking)\n2. **Long press the number 8 button for 3 seconds**\n3. A long beep confirms the sound is now off\n\nTo turn sounds back on, long press 8 for 3 seconds again.\n\n**Note:** Look for the small speaker icon next to the 8 button on the panel \u2014 that's the clue that button 8 controls the sound!"
  },
  {
    question: "How do I use energy saver mode?",
    answer: "Here's how to activate Energy Saver mode:\n\n1. Make sure the microwave is in standby (not cooking) and the door is closed\n2. **Quick press STOP/Cancel once** (press and release quickly \u2014 less than 3 seconds)\n3. The display turns off to save power\n\nThe microwave wakes up when you press any button or open the door.\n\n**Important:** If you hold STOP/Cancel for more than 3 seconds, it activates the child lock instead! Just a quick press for Energy Saver."
  },

  // ===== FAVORITE =====
  {
    question: "How do I save a favorite recipe?",
    answer: "You can save up to 3 cooking procedures:\n\n1. Press **Favorite** to select memory slot 1, 2, or 3\n2. Set up your cooking program (press Cook Time, enter time, set Power Level)\n3. Press **Favorite** to save it\n\n**To use a saved favorite:**\n1. Press **Favorite** until your saved number (1, 2, or 3) shows\n2. Press **START/+30Sec.** to run it\n\nFavorites stay saved until the microwave is unplugged."
  },

  // ===== SAFETY =====
  {
    question: "What containers are safe to use in the microwave?",
    answer: "**Safe to use:**\n- Dishes labeled \"microwave-safe\"\n- Heat-resistant glass (like Pyrex)\n- Ceramic dinnerware (no metallic trim)\n- Paper plates and cups (short warming only)\n- Paper towels and parchment paper\n- Oven cooking bags (no metal ties)\n\n**Never use:**\n- Metal or aluminum trays\n- Metal twist-ties\n- Paper bags\n- Plastic foam (Styrofoam)\n- Wood\n\n**Not sure?** Place the dish + 1 cup water in the microwave. Run 1 minute at full power. If the dish stays cool, it's safe."
  },
  {
    question: "Can I use metal or aluminum foil in the microwave?",
    answer: "**No \u2014 never put metal or aluminum foil in this microwave!** This includes:\n\n- Aluminum trays\n- Metal pans or utensils\n- Metal twist-ties\n- Food cartons with metal handles\n- Dishes with metallic trim\n\nMetal causes sparking (\"arcing\") that can damage the microwave and start a fire. Always transfer food to a microwave-safe glass or ceramic dish first."
  },
  {
    question: "Can I cook eggs in the microwave?",
    answer: "**Never microwave whole eggs or sealed containers \u2014 they will explode!** Steam builds up inside with no way to escape.\n\n**Safe ways to cook eggs:**\n- **Scrambled eggs** in a microwave-safe bowl \u2014 stir every 30 seconds\n- **Egg yolks** must be pierced with a fork first\n\nAlso avoid sealed glass jars and tightly closed containers. Always vent lids and pierce plastic pouches before cooking."
  },
  {
    question: "What foods need to be pierced before cooking?",
    answer: "Always pierce these foods before microwaving:\n\n- **Potatoes** \u2014 poke several times with a fork\n- **Sausages and hot dogs** \u2014 poke with a fork\n- **Egg yolks** \u2014 poke with a fork or toothpick\n- **Whole squash and fruits** \u2014 pierce the skin\n- **Plastic pouches and bags** \u2014 cut a small slit\n\nThis lets steam escape safely. Without piercing, pressure builds up and the food can burst!"
  },

  // ===== CLEANING =====
  {
    question: "How do I clean the microwave?",
    answer: "Here's how to clean your Toshiba microwave:\n\n1. **Front:** Hot soapy water on a dish cloth, then dry with a soft cloth\n2. **Inside cavity:** Soapy water or vinegar solution, then dry completely. No oven spray or abrasives!\n3. **Turntable & roller ring:** Wash with hot soapy water\n4. **Door panel:** Glass cleaner with a dish cloth. No scrapers!\n5. **Control panel:** Soft dry cloth only\n\n**Important:** Clean food spills immediately \u2014 they can cause sparking. Never use metal scrapers or abrasive cleaners on any surface."
  },

  // ===== TROUBLESHOOTING =====
  {
    question: "My microwave won't turn on",
    answer: "Try these steps:\n\n1. **Check the plug** \u2014 make sure it's firmly in the outlet\n2. **Check your circuit breaker** \u2014 the circuit may have tripped\n3. **Try a different outlet** to rule out a bad socket\n4. **Close the door firmly** \u2014 the microwave won't run with the door ajar\n5. **Check for child lock** \u2014 if \"Lock\" shows on the display, hold STOP/Cancel for 3 seconds to unlock\n\nIf it still won't work, contact Toshiba customer support."
  },
  {
    question: "My microwave won't start cooking",
    answer: "Here are the most common reasons:\n\n1. **Close the door firmly** \u2014 it won't start if not fully latched\n2. **Press START/+30Sec.** after programming \u2014 setting the time alone doesn't start it\n3. **Press STOP/Cancel** to clear any old program\n4. **Check for \"Lock\"** on the display \u2014 hold STOP/Cancel 3 sec to unlock\n5. **Check energy saver** \u2014 the display might be blank; press any button to wake it up\n\nIf the display shows \"0:00\" blinking, set the clock first: Clock \u2192 enter time \u2192 Clock."
  },
  {
    question: "The turntable is noisy or wobbling",
    answer: "A wobbly or noisy turntable usually means:\n\n1. **The glass tray isn't seated properly** \u2014 lift it out and place it back, making sure it engages with the turntable shaft\n2. **Food is stuck underneath** \u2014 check under the tray for food debris\n3. **The roller ring is dirty** \u2014 remove it and wash with hot soapy water\n4. **The turntable ring is damaged** \u2014 check if any rollers are cracked\n\nThe turntable can turn clockwise or anti-clockwise \u2014 both directions are normal!"
  },
  {
    question: "What does Lock mean on the display?",
    answer: "\"Lock\" on the display means the **child lock is active**. When locked, no buttons will work.\n\n**To unlock:** Hold **STOP/Cancel** for 3 seconds. You'll hear a long beep and \"Lock\" disappears.\n\n**To lock it again:** Hold STOP/Cancel for 3 seconds.\n\n**Tip:** Be careful not to accidentally activate child lock! A quick press of STOP/Cancel enters Energy Saver mode. Holding it for 3+ seconds activates child lock."
  },

  // ===== SPECS =====
  {
    question: "What are the dimensions of this microwave?",
    answer: "Here are the dimensions of your Toshiba EM131A5C-BS:\n\n- **Outside:** 20.5\" wide x 12.8\" high x 17.1\" deep\n- **Capacity:** 1.2 cubic feet\n- **Turntable:** 12.4\" diameter\n- **Weight:** 34.6 lbs\n- **Power:** 1,100 watts output, 120V/60Hz\n\n**Clearance needed:** 3\" on each side, 3\" on top, 1\" in rear. Minimum installation height: 3 feet."
  },
  {
    question: "Where can I find the user manual?",
    answer: "You can find the Toshiba EM131A5C-BS user manual on the Toshiba website or by searching for your model number online.\n\nIf your microwave didn't come with a printed manual, check inside the packaging carefully \u2014 some customers report the manual being tucked between packing materials.\n\nYou're already here with Artie though \u2014 I know everything in the manual, so feel free to ask me anything!"
  },

  // ===== COMMON VARIANT PHRASINGS =====
  {
    question: "How do I heat up leftovers?",
    answer: "Here's how to reheat leftovers:\n\n1. Place your food in a microwave-safe dish and cover with a vented lid or plastic wrap\n2. Press **Sensor Reheat** (top-left button in the presets area)\n3. Press **START/+30Sec.** to begin\n4. Don't open the door until the cooking time appears!\n\nThe sensor detects steam and sets the time automatically. For best results, add 2\u20133 tablespoons of liquid to casseroles, and cover with a vented lid."
  },
  {
    question: "Can I put foil in the microwave?",
    answer: "**No \u2014 never put metal or aluminum foil in this microwave!** This includes:\n\n- Aluminum trays\n- Metal pans or utensils\n- Metal twist-ties\n- Food cartons with metal handles\n- Dishes with metallic trim\n\nMetal causes sparking (\"arcing\") that can damage the microwave and start a fire. Always transfer food to a microwave-safe glass or ceramic dish first."
  },
  {
    question: "How do I silence the microwave?",
    answer: "To mute all sounds:\n\n1. Make sure the microwave is in standby (not cooking)\n2. **Long press the number 8 button for 3 seconds**\n3. A long beep confirms the sound is now off\n\nTo turn sounds back on, long press 8 for 3 seconds again.\n\n**Look for the small speaker icon next to the 8 button** \u2014 that's the clue that it controls sound!"
  },
  {
    question: "How many watts is this microwave?",
    answer: "Your Toshiba EM131A5C-BS has **1,100 watts** of output power. It runs on 120V/60Hz with 1,550 watts input power.\n\nAt full power (PL10), it uses all 1,100 watts. Lower power levels cycle the magnetron on and off. For example, PL5 (50%) runs at full power half the time."
  },
  {
    question: "How do I set the time on the microwave?",
    answer: "Here's how to set the clock:\n\n1. Press **Clock** once \u2014 \"00:00\" appears\n2. Enter the current time on the number pad (e.g., press 1, 0, 1, 2 for 10:12)\n3. Press **Clock** again to confirm\n\nThe clock uses 12-hour format (1:00\u201312:59). If you make a mistake, press STOP/Cancel to start over."
  },
  {
    question: "How do I lock the microwave?",
    answer: "**To lock:** Hold **STOP/Cancel** for 3 seconds. A long beep sounds and \"Lock\" appears.\n\n**To unlock:** Hold **STOP/Cancel** for 3 seconds again. \"Lock\" disappears.\n\nWhen locked, no buttons will work \u2014 great for preventing kids from using the microwave unsupervised."
  },
  {
    question: "How big is this microwave?",
    answer: "Your Toshiba EM131A5C-BS measures:\n\n- **Outside:** 20.5\" wide x 12.8\" high x 17.1\" deep\n- **Capacity:** 1.2 cubic feet\n- **Turntable:** 12.4\" diameter\n- **Weight:** about 34.6 lbs\n\n**Clearance needed:** 3\" on each side, 3\" on top, 1\" in rear."
  },
  {
    question: "How do I cook frozen pizza?",
    answer: "Here's how to cook frozen pizza:\n\n1. Place the frozen pizza on the glass tray\n2. Press **Frozen Pizza** (top row, middle button) \u2014 it shows SC-2\n3. Press **START/+30Sec.**\n\nThe sensor automatically detects when it's done. Works for pizzas 6\u201312 oz. Don't open the door until the cooking time appears on the display!"
  },
  {
    question: "How do I use the veggie button?",
    answer: "Here's how to use the Veggie button:\n\n**Fresh vegetables:**\n1. Press **Veggie** once (shows SC-6 on the display)\n2. Press **START/+30Sec.**\n\n**Frozen vegetables:**\n1. Press **Veggie** twice (shows SC-7 on the display)\n2. Press **START/+30Sec.**\n\nWorks for 4\u201316 oz. The sensor detects steam and sets the time automatically. Don't open the door until the cooking time appears!"
  },
  {
    question: "Is this bowl microwave safe?",
    answer: "**Safe to use:**\n- Dishes labeled \"microwave-safe\"\n- Heat-resistant glass (like Pyrex)\n- Ceramic dinnerware (no metallic trim)\n- Paper plates and cups (short warming only)\n\n**Never use:**\n- Metal, aluminum trays, or metallic trim\n- Paper bags or plastic foam\n- Wood\n\n**Not sure?** Place the dish + 1 cup water in the microwave. Run 1 minute at full power. If the dish stays cool, it's safe. If it gets hot, don't use it."
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
