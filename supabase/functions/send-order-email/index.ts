import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.json();
    const { test, to, subject, message } = body;

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

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
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
      }),
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