import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.51.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !RESEND_API_KEY) {
      console.error('Missing required environment variables');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const resend = new Resend(RESEND_API_KEY);
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { userId, email, firstName, lastName }: NotificationRequest = await req.json();

    console.log('Processing admin notification for new user:', { userId, email });

    // Get all admin users
    const { data: admins, error: adminError } = await supabase
      .from('profiles')
      .select('email, first_name')
      .eq('role', 'admin')
      .eq('is_active', true);

    if (adminError) {
      console.error('Error fetching admin users:', adminError);
      return new Response(JSON.stringify({ error: 'Failed to fetch admin users' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (!admins || admins.length === 0) {
      console.log('No active admin users found');
      return new Response(JSON.stringify({ message: 'No admins to notify' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const userName = firstName && lastName 
      ? `${firstName} ${lastName}` 
      : firstName || email;

    // Send notification emails to all admins
    const emailPromises = admins.map(async (admin) => {
      return resend.emails.send({
        from: 'Taxagent <notifications@taxagent.app>',
        to: [admin.email],
        subject: '🔔 New User Registration - Approval Required',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">New User Registration</h1>
            </div>
            
            <div style="padding: 30px 20px;">
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Hello ${admin.first_name || 'Admin'},
              </p>
              
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                A new user has registered and is pending approval:
              </p>
              
              <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #333;"><strong>Name:</strong> ${userName}</p>
                <p style="margin: 8px 0 0 0; color: #333;"><strong>Email:</strong> ${email}</p>
                <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;"><strong>User ID:</strong> ${userId}</p>
              </div>
              
              <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
                Please review and approve or reject this user registration in the admin panel.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${SUPABASE_URL.replace('supabase.co', 'vercel.app')}/admin/users" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                  Review User Registration
                </a>
              </div>
              
              <div style="border-top: 1px solid #e9ecef; padding-top: 20px; margin-top: 30px;">
                <p style="color: #666; font-size: 14px; margin: 0;">
                  This is an automated notification from Taxagent. 
                  Please do not reply to this email.
                </p>
              </div>
            </div>
          </div>
        `,
      });
    });

    const results = await Promise.allSettled(emailPromises);
    
    // Log results
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Admin notifications sent: ${successful} successful, ${failed} failed`);

    if (failed > 0) {
      const errors = results
        .filter(r => r.status === 'rejected')
        .map(r => (r as PromiseRejectedResult).reason);
      console.error('Some email notifications failed:', errors);
    }

    return new Response(JSON.stringify({ 
      message: 'Admin notifications processed',
      successful,
      failed
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error in notify-admin-new-user function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);