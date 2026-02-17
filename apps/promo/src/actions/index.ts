import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';

export const server = {
  joinWaitlist: defineAction({
    accept: 'form',
    input: z.object({
      email: z.string().email('Please enter a valid email address'),
      name: z.string().max(100).optional(),
      company: z.string().max(100).optional(),
      usecase: z.string().max(500).optional(),
      'cf-turnstile-response': z.string().optional(),
    }),
    handler: async (input, context) => {
      const { email, name, company, usecase, 'cf-turnstile-response': turnstileToken } = input;
      const env = context.locals.runtime?.env as Env | undefined;

      if (!env?.DB) {
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Database not configured',
        });
      }

      // Verify Turnstile token (mandatory when secret key is configured)
      if (env.TURNSTILE_SECRET_KEY) {
        if (!turnstileToken?.trim()) {
          throw new ActionError({
            code: 'BAD_REQUEST',
            message: 'Please complete the verification before submitting.',
          });
        }
        try {
          const formData = new FormData();
          formData.append('secret', env.TURNSTILE_SECRET_KEY);
          formData.append('response', turnstileToken);
          formData.append('remoteip', context.request.headers.get('cf-connecting-ip') || '');

          const verifyResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: formData,
          });

          const verifyResult = await verifyResponse.json();
          
          if (!verifyResult.success) {
            throw new ActionError({
              code: 'BAD_REQUEST',
              message: 'Verification failed. Please try again.',
            });
          }
        } catch (err) {
          if (err instanceof ActionError) throw err;
          throw new ActionError({
            code: 'BAD_REQUEST',
            message: 'Verification failed. Please try again.',
          });
        }
      }

      try {
        // Insert into D1
        await env.DB.prepare(
          'INSERT INTO waitlist (email, name, company, usecase, source) VALUES (?, ?, ?, ?, ?)'
        )
          .bind(email, name ?? null, company ?? null, usecase ?? null, 'promo')
          .run();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        if (message.includes('UNIQUE constraint failed')) {
          return {
            success: false,
            message: "You're already on the waitlist! When we're ready and open, you'll be the first to receive an email. Until then, don't worry if you don't hear from us.",
          };
        }
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to join waitlist. Please try again.',
        });
      }

      // Send Discord webhook notification
      if (env.DISCORD_WEBHOOK_URL) {
        try {
          const discordPayload = {
            embeds: [
              {
                title: 'New Waitlist Signup',
                color: 0xff6b35, // Orange color matching your theme
                fields: [
                  ...(name ? [{ name: 'Name', value: name, inline: false }] : []),
                  { name: 'Email', value: email, inline: false },
                  ...(company ? [{ name: 'Company', value: company, inline: false }] : []),
                  ...(usecase
                    ? [
                        {
                          name: 'New Functionality Requested',
                          value: usecase.length > 1024 ? usecase.substring(0, 1021) + '...' : usecase,
                          inline: false,
                        },
                      ]
                    : []),
                ],
                footer: {
                  text: 'Zentro AI Waitlist',
                },
                timestamp: new Date().toISOString(),
              },
            ],
          };

          const discordResponse = await fetch(env.DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(discordPayload),
          });

          if (!discordResponse.ok) {
            console.error('Discord webhook error:', await discordResponse.text());
          }
        } catch (err) {
          console.error('Discord webhook error:', err);
          // Don't fail the request - Discord notification is secondary
        }
      }

      return {
        success: true,
        message: "You're on the list! When we're ready and open, you'll be the first to receive an email. Until then, don't worry if you don't hear from us.",
      };
    },
  }),
};
