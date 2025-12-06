const functions = require("firebase-functions");
const admin = require("firebase-admin");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();

exports.Webhook = functions.https.onRequest(async (req, res) => {
  const data = req.body;

  try {
    // Verify checksum
    const check = crypto
      .createHash("md5")
      .update(data.token + (data.payment_status ? 1 : 0) + process.env._API)
      .digest("hex");

    if (check !== data.check_sum) {
      return res.status(400).json({ error: "Checksum invalid" });
    }

    // Save transaction to Firestore
    await db.collection("payments").doc(data.order_id).set({
      ...data,
      timestamp: new Date()
    });

    return res.json({ status: "ok" });

  } catch (e) {
    return res.status(500).send("Error");
  }
});
