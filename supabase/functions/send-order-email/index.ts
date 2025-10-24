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
  items: OrderItem[];
  total_amount: number;
  notes?: string;
}

function generateCSV(orderData: OrderData): string {
  const lines = [
    "\ufeffLp;Kod produktu;Nazwa produktu;Ilość;Jednostka;Cena jedn.;Wartość",
  ];

  orderData.items.forEach((item, index) => {
    lines.push(
      `${index + 1};${item.product_code};${item.product_name};${item.quantity};${item.unit};${item.unit_price.toFixed(2)};${item.total_price.toFixed(2)}`
    );
  });

  lines.push("");
  lines.push(`;;;;;SUMA:;${orderData.total_amount.toFixed(2)}`);

  lines.push("");
  lines.push(`Sklep:;${orderData.store_name} (${orderData.store_code})`);

  if (orderData.notes) {
    lines.push("");
    lines.push(`Uwagi:;${orderData.notes}`);
  }

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

    if (!to || !to.includes("@")) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid email address",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Sending email to: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Test mode: ${test ? "yes" : "no"}`);
    console.log(`Has order data: ${orderData ? "yes" : "no"}`);

    const emailPayload: any = {
      from: "RODEO System <onboarding@resend.dev>",
      to: [to],
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
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">🐎 RODEO</h1>
                        <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px;">System Zarządzania Zamówieniami</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px 30px;">
                        <div style="font-size: 16px; line-height: 1.6; color: #333333;">
                          ${message || "To jest testowa wiadomość z systemu RODEO."}
                        </div>
                        ${orderData ? `
                          <div style="margin-top: 30px; padding: 20px; background-color: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 4px;">
                            <p style="margin: 0; color: #1e40af; font-weight: 600;">📦 Zamówienie: ${orderData.order_number}</p>
                            <p style="margin: 10px 0 0 0; color: #1e3a8a; font-size: 14px;">
                              Sklep: ${orderData.store_name} (${orderData.store_code})<br>
                              Liczba pozycji: ${orderData.items.length}<br>
                              Wartość: ${orderData.total_amount.toFixed(2)} zł
                            </p>
                          </div>
                          <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                            <p style="margin: 0; color: #92400e; font-size: 14px;">
                              📎 <strong>Załącznik:</strong> Plik CSV z listą produktów znajduje się w załączniku: <strong>${orderData.order_number}.csv</strong>
                            </p>
                          </div>
                        ` : ""}
                        ${test ? `
                          <div style="margin-top: 30px; padding: 20px; background-color: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 4px;">
                            <p style="margin: 0; color: #15803d; font-weight: 600;">✅ Konfiguracja email działa poprawnie!</p>
                            <p style="margin: 10px 0 0 0; color: #166534; font-size: 14px;">Jeśli widzisz tę wiadomość, system jest gotowy do wysyłki zamówień.</p>
                          </div>
                        ` : ""}
                      </td>
                    </tr>
                    <tr>
                      <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0; font-size: 12px; color: #6b7280;">Wiadomość wysłana automatycznie z systemu RODEO</p>
                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #9ca3af;">${new Date().toLocaleString("pl-PL")}</p>
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

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(emailPayload),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend API error:", resendData);
      return new Response(
        JSON.stringify({
          success: false,
          error: resendData.message || "Failed to send email",
          details: resendData,
        }),
        {
          status: resendResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Email sent successfully:", resendData);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
        id: resendData.id,
        recipient: to,
        hasAttachment: !!orderData,
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
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});