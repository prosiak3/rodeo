import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface OrderItem {
  id: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  products: {
    name: string;
    code: string;
    description?: string;
  };
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  notes?: string;
  created_at: string;
  sent_at?: string;
  source_type: string;
  store: {
    name: string;
    code: string;
    address: string;
    phone?: string;
  };
  creator: {
    full_name: string;
    email: string;
    role: string;
  };
}

function generateOrderEmailHTML(order: Order, items: OrderItem[]): string {
  const orderDate = new Date(order.sent_at || order.created_at).toLocaleString('pl-PL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  const itemsHTML = items.map((item, index) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #6b7280;">${index + 1}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #1f2937;">
        <strong>${item.products.name}</strong>
        ${item.products.description ? `<br/><span style="font-size: 12px; color: #6b7280;">${item.products.description}</span>` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #1f2937;">
        <strong>${item.quantity}</strong> ${item.unit}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #1f2937;">
        ${item.unit_price.toFixed(2)} PLN
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #1f2937;">
        <strong>${item.total_price.toFixed(2)} PLN</strong>
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="pl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Zamówienie ${order.order_number}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 800px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(to right, #f59e0b, #ea580c); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                🥩 RODEO - Nowe Zamówienie
              </h1>
              <p style="margin: 10px 0 0 0; color: #fef3c7; font-size: 16px;">
                System Zamówień Mięsno-Wędliniarskich
              </p>
            </td>
          </tr>

          <!-- Order Info -->
          <tr>
            <td style="padding: 30px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 15px; background-color: #fef3c7; border-radius: 8px;">
                    <table role="presentation" style="width: 100%;">
                      <tr>
                        <td style="padding: 5px 0;">
                          <span style="color: #92400e; font-weight: bold;">Numer zamówienia:</span>
                          <span style="color: #1f2937; font-weight: bold; font-size: 18px; margin-left: 10px;">${order.order_number}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0;">
                          <span style="color: #92400e; font-weight: bold;">Data złożenia:</span>
                          <span style="color: #1f2937; margin-left: 10px;">${orderDate}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 5px 0;">
                          <span style="color: #92400e; font-weight: bold;">Typ zamówienia:</span>
                          <span style="color: #1f2937; margin-left: 10px;">${
                            order.source_type === 'voice' ? 'Głosowe' :
                            order.source_type === 'manual' ? 'Ręczne' :
                            order.source_type === 'price_list' ? 'Z cennika' :
                            order.source_type === 'copy' ? 'Kopiowane' :
                            order.source_type === 'auto' ? 'Automatyczne' :
                            'Standardowe'
                          }</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Store Info -->
              <h2 style="color: #1f2937; font-size: 20px; margin: 0 0 15px 0; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">
                📍 Dane sklepu
              </h2>
              <table role="presentation" style="width: 100%; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 10px 0;">
                    <span style="color: #6b7280; display: inline-block; width: 120px;">Nazwa:</span>
                    <strong style="color: #1f2937;">${order.store.name}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <span style="color: #6b7280; display: inline-block; width: 120px;">Kod sklepu:</span>
                    <strong style="color: #1f2937;">${order.store.code}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;">
                    <span style="color: #6b7280; display: inline-block; width: 120px;">Adres:</span>
                    <span style="color: #1f2937;">${order.store.address}</span>
                  </td>
                </tr>
                ${order.store.phone ? `
                <tr>
                  <td style="padding: 10px 0;">
                    <span style="color: #6b7280; display: inline-block; width: 120px;">Telefon:</span>
                    <span style="color: #1f2937;">${order.store.phone}</span>
                  </td>
                </tr>
                ` : ''}
                <tr>
                  <td style="padding: 10px 0;">
                    <span style="color: #6b7280; display: inline-block; width: 120px;">Złożył:</span>
                    <strong style="color: #1f2937;">${order.creator.full_name}</strong>
                    <span style="color: #6b7280; margin-left: 10px;">(${order.creator.email})</span>
                  </td>
                </tr>
              </table>

              <!-- Order Items -->
              <h2 style="color: #1f2937; font-size: 20px; margin: 0 0 15px 0; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">
                📦 Pozycje zamówienia (${items.length})
              </h2>
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 12px; text-align: center; color: #6b7280; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Lp</th>
                    <th style="padding: 12px; text-align: left; color: #6b7280; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Produkt</th>
                    <th style="padding: 12px; text-align: center; color: #6b7280; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Ilość</th>
                    <th style="padding: 12px; text-align: right; color: #6b7280; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Cena jedn.</th>
                    <th style="padding: 12px; text-align: right; color: #6b7280; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Wartość</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHTML}
                </tbody>
                <tfoot>
                  <tr style="background-color: #fef3c7;">
                    <td colspan="4" style="padding: 15px; text-align: right; font-weight: bold; color: #92400e; border-top: 2px solid #f59e0b;">
                      SUMA ZAMÓWIENIA:
                    </td>
                    <td style="padding: 15px; text-align: right; font-weight: bold; color: #92400e; font-size: 18px; border-top: 2px solid #f59e0b;">
                      ${order.total_amount.toFixed(2)} PLN
                    </td>
                  </tr>
                </tfoot>
              </table>

              ${order.notes ? `
              <!-- Notes -->
              <h2 style="color: #1f2937; font-size: 20px; margin: 30px 0 15px 0; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">
                📝 Uwagi do zamówienia
              </h2>
              <div style="padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px; color: #1f2937; margin-bottom: 30px;">
                ${order.notes}
              </div>
              ` : ''}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                To jest automatyczna wiadomość z systemu RODEO
              </p>
              <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">
                System Zamówień Mięsno-Wędliniarskich | © ${new Date().getFullYear()} RODEO
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
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
    const { orderId, test, to, subject, message } = body;

    // Tryb testowy - wysyła prosty email testowy
    if (test) {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) {
        throw new Error("RESEND_API_KEY not configured");
      }

      if (!to) {
        throw new Error("Recipient email is required for test mode");
      }

      // Wysyłamy prosty email testowy
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "RODEO Zamówienia <zamowienia@rodeo-system.pl>",
          to: [to],
          subject: subject || "🧪 Test konfiguracji email - System Rodeo",
          html: `
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="margin: 0; font-size: 28px;">🧪 Email Testowy</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px;">System Rodeo</p>
              </div>
              <div style="padding: 30px; background-color: #f9fafb; border-radius: 0 0 10px 10px;">
                <p style="font-size: 18px; color: #1f2937; margin-top: 0;">
                  ${message || "To jest testowa wiadomość z systemu Rodeo. Jeśli widzisz tę wiadomość, konfiguracja email działa prawidłowo!"}
                </p>
                <div style="margin: 30px 0; padding: 20px; background-color: #dcfce7; border-left: 4px solid #10b981; border-radius: 4px;">
                  <p style="margin: 0; color: #065f46; font-weight: bold;">✅ Konfiguracja email działa poprawnie!</p>
                  <p style="margin: 10px 0 0 0; color: #047857; font-size: 14px;">
                    Możesz teraz używać systemu do automatycznego wysyłania zamówień.
                  </p>
                </div>
                <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
                  Wiadomość wygenerowana automatycznie przez system RODEO<br>
                  Data wysyłki: ${new Date().toLocaleString('pl-PL')}
                </p>
              </div>
            </body>
            </html>
          `,
        }),
      });

      const emailResult = await emailResponse.json();

      if (!emailResponse.ok) {
        throw new Error(`Failed to send test email: ${JSON.stringify(emailResult)}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Test email sent successfully",
          emailId: emailResult.id,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Tryb normalny - wysyła zamówienie
    if (!orderId) {
      throw new Error("Order ID is required");
    }

    // Pobierz klucz API Resend z zmiennych środowiskowych
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    // Pobierz dane zamówienia z Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Pobierz szczegóły zamówienia
    const orderResponse = await fetch(
      `${supabaseUrl}/rest/v1/orders?id=eq.${orderId}&select=*,store:store_id(name,code,address,phone),creator:created_by(full_name,email,role)`,
      {
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
      }
    );

    if (!orderResponse.ok) {
      throw new Error(`Failed to fetch order: ${orderResponse.statusText}`);
    }

    const orders = await orderResponse.json();
    if (!orders || orders.length === 0) {
      throw new Error("Order not found");
    }

    const order: Order = orders[0];

    // Pobierz pozycje zamówienia
    const itemsResponse = await fetch(
      `${supabaseUrl}/rest/v1/order_items?order_id=eq.${orderId}&select=*,products:product_id(name,code,description)`,
      {
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
      }
    );

    if (!itemsResponse.ok) {
      throw new Error(`Failed to fetch order items: ${itemsResponse.statusText}`);
    }

    const items: OrderItem[] = await itemsResponse.json();

    if (!items || items.length === 0) {
      throw new Error("No items found in order");
    }

    // Pobierz email hurtowni z ustawień systemowych
    const settingsResponse = await fetch(
      `${supabaseUrl}/rest/v1/system_settings?id=eq.1&select=wholesale_email`,
      {
        headers: {
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
      }
    );

    if (!settingsResponse.ok) {
      throw new Error(`Failed to fetch system settings: ${settingsResponse.statusText}`);
    }

    const settings = await settingsResponse.json();
    const wholesaleEmail = settings[0]?.wholesale_email;

    if (!wholesaleEmail) {
      throw new Error("Wholesale email not configured in system settings");
    }

    // Generuj HTML emaila
    const emailHTML = generateOrderEmailHTML(order, items);
    const subject = `Nowe zamówienie ${order.order_number} - ${order.store.name}`;

    // Wyślij email przez Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "RODEO Zamówienia <zamowienia@rodeo-system.pl>",
        to: [wholesaleEmail],
        subject: subject,
        html: emailHTML,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      throw new Error(`Failed to send email: ${JSON.stringify(emailResult)}`);
    }

    // Zapisz log wysyłki w bazie danych
    const logResponse = await fetch(`${supabaseUrl}/rest/v1/email_notifications`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseServiceKey,
        Authorization: `Bearer ${supabaseServiceKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        order_id: orderId,
        recipient_email: wholesaleEmail,
        subject: subject,
        status: "sent",
        sent_at: new Date().toISOString(),
        retry_count: 0,
      }),
    });

    if (!logResponse.ok) {
      console.error("Failed to log email notification:", await logResponse.text());
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
        recipient: wholesaleEmail,
        emailId: emailResult.id,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error sending order email:", error);

    // Spróbuj zapisać błąd w logu
    try {
      const { orderId } = await req.clone().json();
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

      await fetch(`${supabaseUrl}/rest/v1/email_notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseServiceKey,
          Authorization: `Bearer ${supabaseServiceKey}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          order_id: orderId,
          recipient_email: "unknown",
          subject: "Failed to send",
          status: "failed",
          error_message: error.message,
          retry_count: 0,
        }),
      });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});