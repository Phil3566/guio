const Database = require("better-sqlite3");
const path = require("path");
const { normalize } = require("../lib/normalize");

const DB_PATH = path.join(__dirname, "faq.db");
const DEVICE_ID = "panasonic-nn-sc73ls";

const faqs = [
  // ===== COOKING & REHEATING =====
  {
    question: "How do I reheat food?",
    answer: "Here's how to reheat food:\n\n1. Place your food in a microwave-safe dish\n2. Press **Sensor Reheat** (top row, second button)\n3. Press the green **START** button\n4. Wait for 2 beeps — don't open the door before then!\n\nThe microwave uses a built-in sensor to detect steam and automatically sets the time.\n\n**Tip:** Sensor Reheat works best with soups, casseroles, and plated meals. It's not ideal for bread, beverages, or frozen items — for those, use manual cook instead."
  },
  {
    question: "How do I cook something manually?",
    answer: "Here's how to cook manually:\n\n1. Enter the cooking time using the **number pad** (e.g., press 2, 0, 0 for 2 minutes)\n2. Press the green **START** button\n\nThat's it! It runs at full power (PL10) by default. If you want lower power, press **Power Level** before entering the time — each press cycles through 10 levels.\n\n**Common power levels:** PL7 for reheating, PL6 for dense food, PL3 for defrosting."
  },
  {
    question: "How do I add 30 seconds?",
    answer: "Just press the **Quick 30** button! Each press adds 30 seconds at full power and starts immediately.\n\nYou can also press it while food is already cooking to add more time. It's the quickest way to heat something up!"
  },
  {
    question: "How do I change the power level?",
    answer: "Here's how to change the power level:\n\n1. Press **Power Level** (top row, far right button)\n2. Keep pressing to cycle through the 10 levels\n3. Enter your cooking time on the number pad\n4. Press the green **START** button\n\n**Common levels:**\n- **PL10** = full power (default)\n- **PL7** = reheating\n- **PL6** = dense food like roasts\n- **PL3** = defrosting\n- **PL1** = gentle warming"
  },
  {
    question: "How do I keep food warm?",
    answer: "Here's how to keep food warm:\n\n1. Press **Keep Warm** (second row, middle button)\n2. Enter the number of minutes (up to 30 max)\n3. Press the green **START** button\n\n**Note:** Keep Warm cannot be combined with Sensor Cook or Sensor Reheat. It's meant for holding food at a warm temperature after it's already cooked."
  },
  {
    question: "How do I use stage cooking?",
    answer: "Stage cooking lets you program up to 3 cooking stages in a row:\n\n1. Enter the time and power for the first stage\n2. **Don't press Start yet** — instead, enter the next stage's settings\n3. Repeat for up to 3 stages total\n4. Press the green **START** button\n\nThe microwave will beep twice between each stage and 5 times when everything is done. This is great for recipes that need different power levels at different steps!"
  },

  // ===== SENSOR COOK =====
  {
    question: "How do I use Sensor Cook?",
    answer: "Here's how to use Sensor Cook:\n\n1. Press **Sensor Cook** (top row, third button)\n2. Keep pressing until your food code number appears on the display\n3. Press the green **START** button\n4. Don't open the door until it beeps twice!\n\nYou can press **More** or **Less** before pressing Start to adjust the cooking time. The sensor detects steam to figure out when your food is done."
  },
  {
    question: "What are the Sensor Cook codes?",
    answer: "Here are all 12 Sensor Cook food codes:\n\n1. **Potato**\n2. **Fresh vegetables**\n3. **Frozen vegetables**\n4. **Frozen pizza**\n5. **Frozen entree**\n6. **Casserole**\n7. **Ground meat**\n8. **Lasagna**\n9. **Soup**\n10. **Rice**\n11. **Pasta**\n12. **Fish**\n\nPress **Sensor Cook** repeatedly until your code number shows, then press **START**."
  },
  {
    question: "How do I use Sensor Reheat?",
    answer: "Sensor Reheat is super simple:\n\n1. Place your food in a microwave-safe dish\n2. Press **Sensor Reheat** (top row, second button) once\n3. Press the green **START** button\n4. Wait for 2 beeps — don't open the door before then!\n\nThe sensor detects steam and figures out the right time automatically.\n\n**Important:** Don't use Sensor Reheat for bread, beverages, or frozen food. For those, cook manually instead."
  },
  {
    question: "What does the More and Less button do?",
    answer: "The **More** and **Less** buttons adjust the cooking time when using Sensor Cook:\n\n- Press **More** to increase the cooking time\n- Press **Less** to decrease the cooking time\n\n**Important:** You must press them *before* pressing Start. Once cooking has started, they won't work. They only apply to Sensor Cook programs — they don't work with manual cooking."
  },

  // ===== DEFROST & POPCORN =====
  {
    question: "How do I defrost food?",
    answer: "Here's how to defrost:\n\n1. Press **Turbo Defrost** (second row, first button)\n2. Enter the weight in pounds using the number pad (up to 6 lbs max)\n3. Press the green **START** button\n4. When it beeps twice, open the door and **flip the food over**\n5. Close the door — it continues automatically\n\n**Tip:** For best results, remove any wrapping and place food on a microwave-safe plate to catch drips."
  },
  {
    question: "How do I make popcorn?",
    answer: "Here's how to make popcorn:\n\n1. Place the popcorn bag in the microwave (follow the bag's instructions for which side is up)\n2. Press **Popcorn** — the number of presses sets the bag size:\n   - **1 press** = 3.5 oz bag\n   - **2 presses** = 3 oz bag\n   - **3 presses** = 1.75 oz bag\n3. Press the green **START** button\n\n**Tip:** Stay nearby and listen! When pops slow to 2-3 seconds apart, you can stop it early to avoid burning."
  },

  // ===== TIMER & CLOCK =====
  {
    question: "How do I set the clock?",
    answer: "Here's how to set the clock:\n\n1. Press **Clock Set** (right column, bottom button)\n2. Enter the current time on the number pad (e.g., 1, 2, 3, 0 for 12:30)\n3. Press **Clock Set** again to confirm\n\nThe clock uses 12-hour format. **Note:** If the colon on the display is blinking, the clock hasn't been set yet and the oven won't start until you set it."
  },
  {
    question: "How do I use the kitchen timer?",
    answer: "Here's how to use the kitchen timer:\n\n1. Press **Timer** (right column)\n2. Enter the countdown time on the number pad\n3. Press the green **START** button\n\nThe timer counts down and beeps when done — but it does **not** heat anything. It's just a countdown timer, like on your phone. Great for tracking standing time after cooking!"
  },
  {
    question: "How do I use delayed start?",
    answer: "Delayed start lets you set the microwave to start cooking later:\n\n1. Press **Timer** and enter the delay time (how long to wait)\n2. Then set your cooking time and power level as usual\n3. Press the green **START** button\n\nThe microwave will wait for the delay period, then automatically start cooking. Handy if you want dinner ready at a specific time!"
  },

  // ===== CONTROLS =====
  {
    question: "How do I pause cooking?",
    answer: "To pause cooking, press **Stop/Reset** once (the wide button at the bottom left).\n\nThe microwave pauses and keeps your remaining time. To resume, just press the green **START** button.\n\nYou can also pause by opening the door — it stops automatically. Close the door and press **START** to continue."
  },
  {
    question: "How do I cancel cooking?",
    answer: "To cancel cooking completely, press **Stop/Reset** twice (the wide button at the bottom left).\n\n- **1 press** = pause (you can resume with Start)\n- **2 presses** = cancel everything and clear the display\n\nThis works at any time, whether the microwave is cooking or you're in the middle of programming it."
  },
  {
    question: "How do I use the child lock?",
    answer: "Here's how to use the child lock:\n\n**To lock:** Press **START** 3 times quickly (within 10 seconds). A lock icon appears on the display and all buttons are disabled.\n\n**To unlock:** Press **Stop/Reset** 3 times quickly (within 10 seconds).\n\nWhen locked, the microwave won't respond to any button presses. This is great for preventing accidental use!"
  },
  {
    question: "What do the beeps mean?",
    answer: "Here's what the beeps mean:\n\n- **1 beep** = your input was accepted\n- **2 beeps** = time to take action (open the door, flip your food, or a cooking stage is done)\n- **5 beeps** = cooking is completely finished!\n- **No beep** = something went wrong — try your input again\n\nIf you hear 2 beeps during defrosting, open the door and flip your food over, then close the door to continue."
  },

  // ===== SAFETY =====
  {
    question: "What containers are safe to use in the microwave?",
    answer: "**Safe to use:**\n- Dishes labeled \"microwave-safe\"\n- Heat-resistant glass (like Pyrex)\n- Ceramic dishes\n- Paper plates (for short warming)\n- Paper towels and parchment paper\n\n**Never use:**\n- Metal of any kind\n- Aluminum foil\n- Metal twist-ties\n- Brown paper bags\n\n**Not sure?** Try this test: place the empty dish plus a cup of water in the microwave. Run for 1 minute at full power. If the dish stays cool, it's safe. If it gets hot, don't use it."
  },
  {
    question: "Can I use metal or aluminum foil in the microwave?",
    answer: "**No — never put metal or aluminum foil in the microwave!** This includes:\n\n- Metal pans, trays, or utensils\n- Aluminum foil\n- Metal twist-ties\n- Fast-food containers with metal handles\n\nMetal causes sparking (called \"arcing\") that can damage the microwave and is a fire hazard. Always transfer food to a microwave-safe glass or ceramic dish first."
  },
  {
    question: "Can I cook eggs in the microwave?",
    answer: "**Never microwave whole eggs in the shell — they will explode!** Steam builds up inside the shell with no way to escape.\n\n**Safe ways to cook eggs:**\n- **Scrambled eggs** are fine — stir them in a microwave-safe bowl\n- **Egg yolks** must be pierced with a fork before cooking (the membrane traps steam)\n\n**Tip:** When cooking scrambled eggs, stir every 30 seconds and use medium power (PL6) for the best results."
  },
  {
    question: "What foods need to be pierced before cooking?",
    answer: "Always pierce these foods before microwaving — otherwise steam builds up inside and they can burst:\n\n- **Potatoes** — poke several times with a fork\n- **Sausages and hot dogs** — poke with a fork\n- **Whole squash and apples** — pierce the skin\n- **Egg yolks** — poke with a fork or toothpick\n- **Sealed plastic pouches or bags** — cut a small slit to vent steam\n\nThis lets steam escape safely during cooking."
  },

  // ===== CLEANING =====
  {
    question: "How do I clean the microwave?",
    answer: "Here's how to clean your microwave:\n\n1. **Unplug the oven** and leave the door open\n2. **Inside:** Wipe with a damp cloth after each use. Mild detergent is OK — no harsh cleaners or abrasives\n3. **Outside:** Wipe with a damp cloth. Don't let water seep into the vents\n4. **Door:** Soft dry cloth. The steam on the door is normal\n5. **Control panel:** Soft dry cloth only — no detergent\n\n**Important:** After every use, wipe all surfaces dry — including seams, vents, and under the glass tray. Food residue can cause sparking and damage."
  },
  {
    question: "How do I clean the glass tray?",
    answer: "The glass tray is easy to clean:\n\n- Wash with **warm soapy water**, or\n- Put it in the **dishwasher** — it's dishwasher safe!\n\nThe **roller ring** underneath should also be cleaned regularly with mild soapy water (also dishwasher safe). A dirty roller ring can cause noise during cooking.\n\n**Tip:** Wipe the oven floor under the glass tray too — food can drip down there."
  },

  // ===== TROUBLESHOOTING =====
  {
    question: "My microwave won't turn on",
    answer: "Try these steps:\n\n1. **Unplug** the microwave, wait 10 seconds, then **plug it back in**\n2. Check your **fuse box or circuit breaker** — the circuit may have tripped\n3. Try a **different power outlet** to rule out a bad socket\n4. Make sure the **door is fully closed** — the microwave won't run with the door open\n\nIf it still won't turn on after trying all of these, it may need professional service. Contact Panasonic support at panasonic.ca/english/support."
  },
  {
    question: "My microwave won't start cooking",
    answer: "Here are the most common reasons:\n\n1. **Close the door firmly** — it won't start if the door isn't fully latched\n2. **Press START** after programming — entering time alone doesn't start it\n3. **Press Stop/Reset first** to clear any old program that might be stuck\n4. **Check for child lock** — if you see a lock icon, press Stop/Reset 3 times to unlock\n5. **Set the clock** — if the colon is blinking, set the clock first (Clock Set → enter time → Clock Set)\n\nIf none of these work, try unplugging for 10 seconds and plugging back in."
  },
  {
    question: "The glass tray is wobbling or making noise",
    answer: "A wobbly or noisy glass tray usually means:\n\n1. **The tray isn't seated properly** — lift it out and place it back on the roller ring, making sure it's centered\n2. **Food is stuck underneath** — check under the tray and on the oven floor for food debris\n3. **The roller ring is dirty** — remove it and wash with warm soapy water\n\nThe roller ring has small wheels that can get gummed up with grease and food bits. A quick clean usually fixes the noise!"
  },
  {
    question: "What does the lock icon on the display mean?",
    answer: "The lock icon means the **child lock is on**. When locked, the microwave won't respond to any button presses.\n\n**To unlock:** Press **Stop/Reset** 3 times quickly (within 10 seconds). The lock icon will disappear and the microwave will work normally again.\n\n**To lock it again later:** Press **START** 3 times quickly."
  },
  {
    question: "There is steam on the door",
    answer: "**Steam on the door is completely normal!** When you cook food that contains moisture (which is most food), steam is released. Some of it condenses on the door, especially in cooler rooms.\n\nThis is not a malfunction. Just **wipe the door dry with a soft cloth** after cooking. The warm air coming from the vents is also normal — it's how the microwave keeps its electronics cool."
  },

  // ===== SPECS =====
  {
    question: "What are the dimensions of this microwave?",
    answer: "Here are the dimensions of your Panasonic NN-SC73LS:\n\n- **Outside:** 21.8\" wide x 12.8\" high x 17.7\" deep\n- **Inside cavity:** 15.5\" wide x 10.2\" high x 17.1\" deep\n- **Weight:** 28.7 lbs (13 kg)\n- **Power:** 1,200 watts, 120V/60Hz, 12 amps\n\n**Clearance needed:** Leave at least 3 inches on each side, 12 inches above, and keep the back open for ventilation."
  },
  {
    question: "Where can I get replacement parts?",
    answer: "You can order replacement parts from Panasonic:\n\n**Common parts:**\n- Glass tray: part #12570000001005\n- Roller ring: part #12170000004310\n- Owner's manual: part #16170000A86727\n\n**How to order:** Visit panasonic.ca/english/support or call Panasonic customer service.\n\n**Tip:** The glass tray and roller ring are the parts most commonly needed. Both are dishwasher safe, so regular cleaning helps them last longer!"
  },
  {
    question: "Where can I find the user manual?",
    answer: "You can view the full owner's manual online at **help.na.panasonic.com**.\n\nJust search for your model number: **NN-SC73LS**.\n\nYou can also order a printed copy — the part number is #16170000A86727. Order at panasonic.ca/english/support."
  },

  // ===== COMMON VARIANTS (same answers, different phrasings) =====
  {
    question: "How do I defrost chicken?",
    answer: "Here's how to defrost:\n\n1. Press **Turbo Defrost** (second row, first button)\n2. Enter the weight in pounds using the number pad (up to 6 lbs max)\n3. Press the green **START** button\n4. When it beeps twice, open the door and **flip the food over**\n5. Close the door — it continues automatically\n\n**Tip:** For best results, remove any wrapping and place food on a microwave-safe plate to catch drips."
  },
  {
    question: "Can I put foil in the microwave?",
    answer: "**No — never put metal or aluminum foil in the microwave!** This includes:\n\n- Metal pans, trays, or utensils\n- Aluminum foil\n- Metal twist-ties\n- Fast-food containers with metal handles\n\nMetal causes sparking (called \"arcing\") that can damage the microwave and is a fire hazard. Always transfer food to a microwave-safe glass or ceramic dish first."
  },
  {
    question: "What size is this microwave?",
    answer: "Here are the dimensions of your Panasonic NN-SC73LS:\n\n- **Outside:** 21.8\" wide x 12.8\" high x 17.7\" deep\n- **Inside cavity:** 15.5\" wide x 10.2\" high x 17.1\" deep\n- **Weight:** 28.7 lbs (13 kg)\n- **Power:** 1,200 watts, 120V/60Hz, 12 amps\n\n**Clearance needed:** Leave at least 3 inches on each side, 12 inches above, and keep the back open for ventilation."
  },
  {
    question: "How many watts is this microwave?",
    answer: "Your Panasonic NN-SC73LS is **1,200 watts**. It runs on 120V/60Hz and draws 12 amps.\n\nAt full power (PL10), it uses all 1,200 watts. Lower power levels cycle the magnetron on and off — for example, PL5 means the microwave runs at full power for half the time."
  },
  {
    question: "Can I microwave eggs?",
    answer: "**Never microwave whole eggs in the shell — they will explode!** Steam builds up inside the shell with no way to escape.\n\n**Safe ways to cook eggs:**\n- **Scrambled eggs** are fine — stir them in a microwave-safe bowl\n- **Egg yolks** must be pierced with a fork before cooking (the membrane traps steam)\n\n**Tip:** When cooking scrambled eggs, stir every 30 seconds and use medium power (PL6) for the best results."
  },
  {
    question: "Is this dish microwave safe?",
    answer: "**Safe to use:**\n- Dishes labeled \"microwave-safe\"\n- Heat-resistant glass (like Pyrex)\n- Ceramic dishes\n- Paper plates (for short warming)\n- Paper towels and parchment paper\n\n**Never use:**\n- Metal of any kind\n- Aluminum foil\n- Metal twist-ties\n- Brown paper bags\n\n**Not sure?** Try this test: place the empty dish plus a cup of water in the microwave. Run for 1 minute at full power. If the dish stays cool, it's safe. If it gets hot, don't use it."
  },
  {
    question: "How do I set the time on the microwave?",
    answer: "Here's how to set the clock:\n\n1. Press **Clock Set** (right column, bottom button)\n2. Enter the current time on the number pad (e.g., press 1, 2, 3, 0 for 12:30)\n3. Press **Clock Set** again to confirm\n\nThe clock uses 12-hour format. **Note:** If the colon on the display is blinking, the clock hasn't been set yet and the oven won't start until you set it."
  },
  {
    question: "How do I cook rice in the microwave?",
    answer: "Great news — your microwave has a Sensor Cook code just for rice!\n\n1. Place rice and water in a microwave-safe dish (follow your usual rice-to-water ratio)\n2. Cover with a lid or vented plastic wrap\n3. Press **Sensor Cook** until code **10** (Rice) appears\n4. Press the green **START** button\n\nThe sensor detects steam and automatically sets the time. You can press **More** or **Less** before Start to adjust."
  },
  {
    question: "What is the wattage of this microwave?",
    answer: "Your Panasonic NN-SC73LS is **1,200 watts**. It runs on 120V/60Hz and draws 12 amps.\n\nAt full power (PL10), it uses all 1,200 watts. Lower power levels cycle the magnetron on and off — for example, PL5 means the microwave runs at full power for half the time."
  },
  {
    question: "How do I lock the microwave?",
    answer: "Here's how to use the child lock:\n\n**To lock:** Press **START** 3 times quickly (within 10 seconds). A lock icon appears on the display and all buttons are disabled.\n\n**To unlock:** Press **Stop/Reset** 3 times quickly (within 10 seconds).\n\nWhen locked, the microwave won't respond to any button presses. This is great for preventing accidental use!"
  },
  {
    question: "Is this bowl microwave safe?",
    answer: "**Safe to use:**\n- Dishes labeled \"microwave-safe\"\n- Heat-resistant glass (like Pyrex)\n- Ceramic dishes\n- Paper plates (for short warming)\n- Paper towels and parchment paper\n\n**Never use:**\n- Metal of any kind\n- Aluminum foil\n- Metal twist-ties\n- Brown paper bags\n\n**Not sure?** Try this test: place the empty dish plus a cup of water in the microwave. Run for 1 minute at full power. If the dish stays cool, it's safe. If it gets hot, don't use it."
  },
  {
    question: "How do I heat up leftovers?",
    answer: "Here's how to reheat leftovers:\n\n1. Place your food in a microwave-safe dish\n2. Press **Sensor Reheat** (top row, second button)\n3. Press the green **START** button\n4. Wait for 2 beeps — don't open the door before then!\n\nThe microwave uses a built-in sensor to detect steam and automatically sets the time.\n\n**Tip:** Sensor Reheat works best with soups, casseroles, and plated meals. It's not ideal for bread, beverages, or frozen items — for those, use manual cook instead."
  },
  {
    question: "How big is this microwave?",
    answer: "Here are the dimensions of your Panasonic NN-SC73LS:\n\n- **Outside:** 21.8\" wide x 12.8\" high x 17.7\" deep\n- **Inside cavity:** 15.5\" wide x 10.2\" high x 17.1\" deep\n- **Weight:** 28.7 lbs (13 kg)\n- **Power:** 1,200 watts, 120V/60Hz, 12 amps\n\n**Clearance needed:** Leave at least 3 inches on each side, 12 inches above, and keep the back open for ventilation."
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
