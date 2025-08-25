import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  type: 'welcome' | 'approved' | 'rejected';
  rejectionReason?: string;
}

const getEmailContent = (type: string, firstName?: string, rejectionReason?: string) => {
  const name = firstName || 'User';
  
  switch (type) {
    case 'welcome':
      return {
        subject: "Welcome to TaxAgent - Account Created",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb; margin-bottom: 20px;">Welcome to TaxAgent!</h1>
            <p>Hello ${name},</p>
            <p>Thank you for creating an account with TaxAgent. Your account has been successfully created and is now pending approval.</p>
            <p>You will receive another email once your account has been reviewed and approved by our administrators.</p>
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
            <p>Best regards,<br>The TaxAgent Team</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
          </div>
        `
      };
    
    case 'approved':
      return {
        subject: "TaxAgent Account Approved - Welcome!",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #059669; margin-bottom: 20px;">Account Approved!</h1>
            <p>Hello ${name},</p>
            <p>Great news! Your TaxAgent account has been approved and is now active.</p>
            <p>You can now sign in and start using all the features of TaxAgent:</p>
            <ul style="margin: 20px 0;">
              <li>Upload and process tax documents</li>
              <li>Review AI-generated bookings</li>
              <li>Export approved invoices</li>
              <li>And much more!</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'app.supabase.co') || window.location.origin}/auth" 
                 style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Sign In Now
              </a>
            </div>
            <p>Welcome to TaxAgent!</p>
            <p>Best regards,<br>The TaxAgent Team</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
          </div>
        `
      };
    
    case 'rejected':
      return {
        subject: "TaxAgent Account Application Update",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #dc2626; margin-bottom: 20px;">Account Application Status</h1>
            <p>Hello ${name},</p>
            <p>We have reviewed your TaxAgent account application. Unfortunately, we are unable to approve your account at this time.</p>
            ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
            <p>If you believe this is an error or would like to discuss your application, please contact our support team.</p>
            <p>Thank you for your interest in TaxAgent.</p>
            <p>Best regards,<br>The TaxAgent Team</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
          </div>
        `
      };
    
    default:
      throw new Error('Invalid email type');
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email, firstName, lastName, type, rejectionReason }: EmailRequest = await req.json();

    console.log(`Sending ${type} email to:`, email);

    const { subject, html } = getEmailContent(type, firstName, rejectionReason);

    const emailResponse = await resend.emails.send({
      from: "TaxAgent <onboarding@resend.dev>",
      to: [email],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log the email sending in audit logs
    try {
      await supabase.from('audit_logs').insert({
        entity_type: 'email_notification',
        entity_id: userId,
        action: `EMAIL_SENT_${type.toUpperCase()}`,
        user_id: userId,
        user_name: email,
        timestamp: new Date().toISOString(),
        gobd_relevant: false
      });
    } catch (auditError) {
      console.error('Failed to log email in audit:', auditError);
      // Don't fail the email sending if audit logging fails
    }

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-confirmation-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);