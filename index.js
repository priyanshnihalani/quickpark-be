const express = require("express");
const cors = require("cors");
const cybersourceRestApi = require("cybersource-rest-client");
const path = require("path");
const ejs = require("ejs");
const { generatePDF } = require("./utils/generatePDF");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

app.use(cors());
app.use(express.json());

const TEMPLATES_DIR = path.join(__dirname, "templates");

app.set("view engine", "ejs");
app.set("views", TEMPLATES_DIR);

/* ================= CYBERSOURCE CONFIG ================= */

const cyberSourceConfig = {
  authenticationType: "http_signature",
  merchantID: process.env.CYBS_MERCHANT_ID,
  merchantKeyId: process.env.CYBS_KEY_ID,
  merchantsecretKey: process.env.CYBS_SECRET_KEY,
  runEnvironment: process.env.CYBS_HOST,
  logConfiguration: {
    enableLog: true,
    logFileName: "cybs",
    logDirectory: "./logs",
    logFileMaxSize: "5242880"
  }
};

/* ================= PAY API ================= */

app.post("/api/pay", async (req, res) => {
  try {
    const {
      paymentMethod,
      billing,
      card,
      walletToken
    } = req.body;

    /* ================= BASIC VALIDATION ================= */

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "paymentMethod is required"
      });
    }

    if (!["CARD", "APPLE_PAY", "GOOGLE_PAY"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported payment method"
      });
    }

    if (!billing) {
      return res.status(400).json({
        success: false,
        message: "Billing information is required"
      });
    }

    /* ================= BILLING ================= */

    const billTo = {
      firstName: billing.firstName || "",
      lastName: billing.lastName || "",
      address1: billing.address1 || "",
      locality: billing.locality || "",
      administrativeArea: billing.administrativeArea || "",
      postalCode: billing.postalCode || "",
      country: billing.country || "US",
      email: billing.email || "",
      phoneNumber: billing.phone || "4158880000"
    };

    /* ================= PAYMENT INFORMATION ================= */

    let paymentInformation = {};

    // ---- CARD ----
    if (paymentMethod === "CARD") {
      if (!card) {
        return res.status(400).json({
          success: false,
          message: "Card details are required"
        });
      }

      paymentInformation = {
        card: {
          number: card.number,
          expirationMonth: card.expirationMonth,
          expirationYear: card.expirationYear
        }
      };
    }

    // ---- APPLE PAY / GOOGLE PAY ----
    if (paymentMethod === "APPLE_PAY" || paymentMethod === "GOOGLE_PAY") {
      if (!walletToken) {
        return res.status(400).json({
          success: false,
          message: "Wallet token is required"
        });
      }

      let parsedToken = walletToken;

      // token may arrive as string
      if (typeof walletToken === "string") {
        parsedToken = JSON.parse(walletToken);
      }

      const encodedToken = Buffer.from(
        JSON.stringify(parsedToken),
        "utf8"
      ).toString("base64");

      paymentInformation = {
        fluidData: {
          value: encodedToken
        }
      };
    }

    /* ================= PROCESSING INFORMATION ================= */

    const processingInformation = {
      commerceIndicator: "internet"
    };

    if (paymentMethod === "APPLE_PAY") {
      processingInformation.paymentSolution = "001";
    }

    if (paymentMethod === "GOOGLE_PAY") {
      processingInformation.paymentSolution = "012";
    }

    /* ================= FINAL REQUEST OBJECT ================= */

    const requestObj = {
      clientReferenceInformation: {
        code: `PAY_${Date.now()}`
      },
      processingInformation,
      paymentInformation,
      orderInformation: {
        amountDetails: {
          totalAmount: "35.00",
          currency: "USD"
        },
        billTo
      }
    };

    /* ================= CYBERSOURCE CALL ================= */

    const paymentsApi =
      new cybersourceRestApi.PaymentsApi(cyberSourceConfig);

    paymentsApi.createPayment(requestObj, (error, data) => {
      if (error) {
        console.error("Cybersource error:", JSON.stringify(error, null, 2));

        return res.status(400).json({
          success: false,
          message: "Payment failed",
          cybersource: error.response?.body || error.response?.text || error
        });
      }

      return res.status(200).json({
        success: true,
        paymentId: data.id,
        status: data.status
      });
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

app.get("/ticket/download/:paymentId", async (req, res) => {
  try {
    const { paymentId } = req.params;

    const data = {
      paymentId,
      amount: "35.00",
      status: "AUTHORIZED",
      time: new Date().toLocaleString("en-US")
    };

    const templatePath = path.join(TEMPLATES_DIR, "ticket.ejs");
    const html = await ejs.renderFile(templatePath, data);
    const pdfBuffer = await generatePDF(html);

    res.writeHead(200, {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="parking-ticket-${paymentId}.pdf"`,
      "Content-Length": pdfBuffer.length
    });

    res.end(pdfBuffer);

  } catch (err) {
    console.error("PDF Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to generate ticket PDF"
    });
  }
});




/* ================= START SERVER ================= */

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
