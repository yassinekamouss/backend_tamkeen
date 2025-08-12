const cron = require("node-cron");
const Program = require("../models/Program");

cron.schedule("0 0 * * *", async () => {
  try {
    const today = new Date();
        const result = await Program.updateMany(
        { DateFin: { $ne: null, $lt: today }, isActive: true },
        { $set: { isActive: false } }
        );

    console.log(`⏳ Vérification quotidienne : ${result.modifiedCount} programmes désactivés.`);
  } catch (err) {
    console.error("❌ Erreur lors de la désactivation automatique :", err);
  }
}, {
  timezone: "Africa/Casablanca"
});
