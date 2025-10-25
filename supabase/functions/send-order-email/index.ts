import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

interface OrderItem {
  product_name: string;
  product_code: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
}

interface OrderData {
  order_number: string;
  store_name: string;
  store_code: string;
  store_address?: string;
  items: OrderItem[];
  total_amount: number;
  notes?: string;
  created_at?: string;
  sent_by?: string;
  sent_by_phone?: string;
  sent_at?: string;
}

function generateCSV(orderData: OrderData): string {
  const lines = [
    "\ufeff=== SZCZEGÓŁY ZAMÓWIENIA ===",
    "",
    `Numer zamówienia:;${orderData.order_number}`,
    `Data utworzenia:;${orderData.created_at ? new Date(orderData.created_at).toLocaleString('pl-PL') : 'N/A'}`,
    `Data wysłania:;${orderData.sent_at ? new Date(orderData.sent_at).toLocaleString('pl-PL') : new Date().toLocaleString('pl-PL')}`,
    "",
    "=== SKLEP ===",
    "",
    `Nazwa:;${orderData.store_name}`,
    `Kod sklepu:;${orderData.store_code}`,
  ];

  if (orderData.store_address) {
    lines.push(`Adres:;${orderData.store_address}`);
  }

  lines.push("");
  lines.push("=== OSOBA WYSYŁAJĄCA ===");
  lines.push("");
  lines.push(`Imię i nazwisko:;${orderData.sent_by || 'N/A'}`);

  if (orderData.sent_by_phone) {
    lines.push(`Telefon:;${orderData.sent_by_phone}`);
  }

  lines.push("");
  lines.push("=== PRODUKTY ===");
  lines.push("");
  lines.push("Lp;Kod produktu;Nazwa produktu;Ilość;Jednostka;Cena jedn.;Wartość");

  orderData.items.forEach((item, index) => {
    lines.push(
      `${index + 1};${item.product_code};${item.product_name};${item.quantity};${item.unit};${item.unit_price.toFixed(2)};${item.total_price.toFixed(2)}`
    );
  });

  lines.push("");
  lines.push(`;;;;;SUMA:;${orderData.total_amount.toFixed(2)} zł`);

  if (orderData.notes) {
    lines.push("");
    lines.push("=== UWAGI ===");
    lines.push("");
    lines.push(`${orderData.notes}`);
  }

  lines.push("");
  lines.push("=== KONIEC ZAMÓWIENIA ===");

  return lines.join("\r\n");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.json();
    const { test, to, subject, message, orderData } = body;

    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Email service is not configured. Please contact administrator.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let emailRecipients: string[] = [];

    if (typeof to === 'string') {
      emailRecipients = [to];
    } else if (Array.isArray(to)) {
      emailRecipients = to;
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid email address format. Provide a string or array of email addresses.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    for (const email of emailRecipients) {
      if (!email || !email.includes("@")) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Invalid email address: ${email}`,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    console.log(`Sending email to: ${emailRecipients.join(', ')}`);
    console.log(`Number of recipients: ${emailRecipients.length}`);
    console.log(`Subject: ${subject}`);
    console.log(`Test mode: ${test ? "yes" : "no"}`);
    console.log(`Has order data: ${orderData ? "yes" : "no"}`);

    const generateOrderItemsTable = (items: OrderItem[]) => {
      return `
        <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-size: 12px; font-weight: 600; color: #374151;">Lp</th>
              <th style="border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-size: 12px; font-weight: 600; color: #374151;">Kod</th>
              <th style="border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-size: 12px; font-weight: 600; color: #374151;">Nazwa produktu</th>
              <th style="border: 1px solid #e5e7eb; padding: 10px; text-align: center; font-size: 12px; font-weight: 600; color: #374151;">Ilość</th>
              <th style="border: 1px solid #e5e7eb; padding: 10px; text-align: center; font-size: 12px; font-weight: 600; color: #374151;">Jedn.</th>
              <th style="border: 1px solid #e5e7eb; padding: 10px; text-align: right; font-size: 12px; font-weight: 600; color: #374151;">Cena jedn.</th>
              <th style="border: 1px solid #e5e7eb; padding: 10px; text-align: right; font-size: 12px; font-weight: 600; color: #374151;">Wartość</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, index) => `
              <tr>
                <td style="border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; color: #374151;">${index + 1}</td>
                <td style="border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; color: #374151;">${item.product_code}</td>
                <td style="border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; color: #374151;">${item.product_name}</td>
                <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center; font-size: 12px; color: #374151;">${item.quantity}</td>
                <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: center; font-size: 12px; color: #374151;">${item.unit}</td>
                <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: right; font-size: 12px; color: #374151;">${item.unit_price.toFixed(2)} zł</td>
                <td style="border: 1px solid #e5e7eb; padding: 8px; text-align: right; font-size: 12px; color: #374151; font-weight: 600;">${item.total_price.toFixed(2)} zł</td>
              </tr>
            `).join('')}
            <tr style="background-color: #fef3c7;">
              <td colspan="6" style="border: 1px solid #e5e7eb; padding: 10px; text-align: right; font-size: 14px; font-weight: 700; color: #92400e;">SUMA:</td>
              <td style="border: 1px solid #e5e7eb; padding: 10px; text-align: right; font-size: 14px; font-weight: 700; color: #92400e;">${items.reduce((sum, item) => sum + item.total_price, 0).toFixed(2)} zł</td>
            </tr>
          </tbody>
        </table>
      `;
    };

    const emailPayload: any = {
      from: "RODEO System <onboarding@resend.dev>",
      to: emailRecipients,
      subject: subject || "Test Email - RODEO System",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject || "Email z RODEO"}</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
              <tr>
                <td align="center">
                  <table width="700" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 20px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="width: 50%; text-align: left; vertical-align: middle;">
                              ${orderData ? `<h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Zamówienie ${orderData.order_number}</h2>` : ''}
                            </td>
                            <td style="width: 50%; text-align: right; vertical-align: middle;">
                              <img src="https://pcdr.pl/wp-content/uploads/2025/10/erasebg-transformed.png" alt="RODEO" style="height: 100px; width: 100px; display: inline-block;" />
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    ${orderData ? `
                      <tr>
                        <td style="padding: 30px;">

                          <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
                            <p style="margin: 0 0 8px 0; color: #1e40af; font-weight: 600; font-size: 16px;">📍 Dane sklepu:</p>
                            <p style="margin: 0; color: #1e3a8a; font-size: 14px; line-height: 1.6;">
                              <strong>${orderData.store_name}</strong> (${orderData.store_code})<br>
                              ${orderData.store_address ? orderData.store_address + '<br>' : ''}
                            </p>
                          </div>

                          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px; border-radius: 4px;">
                            <p style="margin: 0 0 8px 0; color: #92400e; font-weight: 600; font-size: 16px;">👤 Wysłane przez:</p>
                            <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                              <strong>${orderData.sent_by || 'N/A'}</strong><br>
                              ${orderData.sent_by_phone ? 'Tel: ' + orderData.sent_by_phone + '<br>' : ''}
                              Data utworzenia: ${orderData.created_at ? new Date(orderData.created_at).toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}<br>
                              Data wysłania: ${orderData.sent_at ? new Date(orderData.sent_at).toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleDateString('pl-PL', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>

                          <h3 style="margin: 30px 0 10px 0; color: #111827; font-size: 18px; font-weight: 600;">Zamówione produkty:</h3>
                          ${generateOrderItemsTable(orderData.items)}

                          ${orderData.notes ? `
                            <div style="margin-top: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px;">
                              <p style="margin: 0 0 8px 0; color: #92400e; font-weight: 600; font-size: 14px;">Uwagi do zamówienia:</p>
                              <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">${orderData.notes}</p>
                            </div>
                          ` : ''}

                          <div style="margin-top: 30px; text-align: center; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
                            <p style="margin: 0 0 15px 0; color: #374151; font-weight: 600; font-size: 14px;">Kody zamówienia:</p>
                            <div style="display: inline-block; margin: 0 20px;">
                              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px;">Kod kreskowy (Code128)</p>
                              <img src="https://bwipjs-api.metafloor.com/?bcid=code128&text=${encodeURIComponent(orderData.order_number)}&scale=3&height=10&includetext" alt="Barcode" style="max-width: 300px; height: auto;" />
                            </div>
                            <div style="display: inline-block; margin: 0 20px;">
                              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px;">Kod QR</p>
                              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(orderData.order_number)}" alt="QR Code" style="width: 150px; height: 150px;" />
                            </div>
                          </div>

                          <div style="margin-top: 20px; padding: 15px; background-color: #ecfdf5; border-left: 4px solid #10b981; border-radius: 4px;">
                            <p style="margin: 0; color: #065f46; font-size: 13px;">
                              📎 <strong>Załącznik:</strong> Plik CSV z pełnym zestawieniem znajduje się w załączniku tego emaila: <strong>${orderData.order_number}.csv</strong>
                            </p>
                          </div>
                        </td>
                      </tr>
                    ` : `
                      <tr>
                        <td style="padding: 30px;">
                          ${message ? `<p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.6;">${message}</p>` : '<p style="margin: 0; color: #374151; font-size: 16px;">To jest testowy email z systemu RODEO.</p>'}
                        </td>
                      </tr>
                    `}
                    <tr>
                      <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0; color: #6b7280; font-size: 12px;">© 2024 RODEO System. Wszystkie prawa zastrzeżone.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    };

    if (orderData) {
      const csvContent = generateCSV(orderData);
      const csvBase64 = btoa(unescape(encodeURIComponent(csvContent)));

      emailPayload.attachments = [
        {
          filename: `${orderData.order_number}.csv`,
          content: csvBase64,
        },
      ];
    }

    console.log("Sending email via Resend API...");

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    });

    const responseText = await resendResponse.text();
    console.log("Resend API response status:", resendResponse.status);
    console.log("Resend API response:", responseText);

    if (!resendResponse.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Email service error: ${responseText}`,
          status: resendResponse.status,
        }),
        {
          status: resendResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
        recipients: emailRecipients.length,
        response: responseText,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in send-order-email function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});