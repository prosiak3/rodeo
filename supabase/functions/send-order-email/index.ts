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

  const sourceTypeLabels: Record<string, string> = {
    manual: '📝 Zamówienie Manualne',
    voice: '🎤 Zamówienie Głosowe',
    auto: '🤖 Zamówienie Automatyczne',
    copy: '📋 Kopiowane',
  };

  const itemsHTML = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #374151;">
        <strong>${item.products.name}</strong><br>
        <span style="color: #6b7280; font-size: 12px;">Kod: ${item.products.code}</span>
        ${item.products.description ? `<br><span style="color: #6b7280; font-size: 12px;">${item.products.description}</span>` : ''}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #374151;">
        ${item.quantity} ${item.unit}
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #374151;">
        ${item.unit_price.toFixed(2)} zł
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #374151; font-weight: bold;">
        ${item.total_price.toFixed(2)} zł
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
      <td style="padding: 20px 0; text-align: center;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">🥩 RODEO</h1>
              <p style="margin: 10px 0 0 0; color: #fef3c7; font-size: 16px;">System Zamówień Mięsno-Wędliniarskich</p>
            </td>
          </tr>

          <!-- Order Info -->
          <tr>
            <td style="padding: 30px 20px;">
              <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 20px 0; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">
                📦 Nowe Zamówienie
              </h2>
              
              <table style="width: 100%; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Numer zamówienia:</td>
                  <td style="padding: 8px 0; color: #1f2937; font-weight: bold; text-align: right; font-size: 16px;">${order.order_number}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Data złożenia:</td>
                  <td style="padding: 8px 0; color: #1f2937; text-align: right;">${orderDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Typ zamówienia:</td>
                  <td style="padding: 8px 0; color: #1f2937; text-align: right;">${sourceTypeLabels[order.source_type] || order.source_type}</td>
                </tr>
              </table>

              <!-- Store Info -->
              <h2 style="color: #1f2937; font-size: 20px; margin: 30px 0 15px 0; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">
                🏪 Dane sklepu
              </h2>
              <table style="width: 100%; margin-bottom: 25px; background-color: #f9fafb; padding: 15px; border-radius: 6px;">
                <tr>
                  <td style="padding: 5px 0; color: #6b7280; font-size: 14px;">Nazwa:</td>
                  <td style="padding: 5px 0; color: #1f2937; font-weight: bold; text-align: right;">${order.store.name}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #6b7280; font-size: 14px;">Kod:</td>
                  <td style="padding: 5px 0; color: #1f2937; text-align: right;">${order.store.code}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #6b7280; font-size: 14px;">Adres:</td>
                  <td style="padding: 5px 0; color: #1f2937; text-align: right;">${order.store.address}</td>
                </tr>
                ${order.store.phone ? `
                <tr>
                  <td style="padding: 5px 0; color: #6b7280; font-size: 14px;">Telefon:</td>
                  <td style="padding: 5px 0; color: #1f2937; text-align: right;">${order.store.phone}</td>
                </tr>
                ` : ''}
              </table>

              <!-- Creator Info -->
              <h2 style="color: #1f2937; font-size: 20px; margin: 30px 0 15px 0; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">
                👤 Osoba składająca zamówienie
              </h2>
              <table style="width: 100%; margin-bottom: 25px; background-color: #f9fafb; padding: 15px; border-radius: 6px;">
                <tr>
                  <td style="padding: 5px 0; color: #6b7280; font-size: 14px;">Imię i nazwisko:</td>
                  <td style="padding: 5px 0; color: #1f2937; font-weight: bold; text-align: right;">${order.creator.full_name}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #6b7280; font-size: 14px;">Email:</td>
                  <td style="padding: 5px 0; color: #1f2937; text-align: right;">${order.creator.email}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; color: #6b7280; font-size: 14px;">Rola:</td>
                  <td style="padding: 5px 0; color: #1f2937; text-align: right;">${order.creator.role}</td>
                </tr>
              </table>

              <!-- Order Items -->
              <h2 style="color: #1f2937; font-size: 20px; margin: 30px 0 15px 0; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">
                📋 Produkty w zamówieniu
              </h2>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 12px; text-align: left; color: #6b7280; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Produkt</th>
                    <th style="padding: 12px; text-align: right; color: #6b7280; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Ilość</th>
                    <th style="padding: 12px; text-align: right; color: #6b7280; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Cena jedn.</th>
                    <th style="padding: 12px; text-align: right; color: #6b7280; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #e5e7eb;">Wartość</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHTML}
                </tbody>
                <tfoot>
                  <tr style="background-color: #fef3c7;">
                    <td colspan="3" style="padding: 15px; text-align: right; color: #1f2937; font-weight: bold; font-size: 16px; border-top: 2px solid #f59e0b;">Wartość całkowita:</td>
                    <td style="padding: 15px; text-align: right; color: #d97706; font-weight: bold; font-size: 18px; border-top: 2px solid #f59e0b;">${order.total_amount.toFixed(2)} zł</td>
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
      `${supabaseUrl}/rest/v1/system_settings?select=wholesale_email`,
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
        emailId: emailResult.id,
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